import React, { useEffect, useState, useMemo } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain, domainMark } from "../../../../security";
import {
  FaTimes,
  FaArrowRight,
  FaSearch,
  FaImage,
  FaTrash,
  FaListOl,
  FaCalendarAlt, // Icon for "Select Serials" button
} from "react-icons/fa";

import DatePicker from "react-datepicker"; // <-- IMPORT DATEPICKER
import "react-datepicker/dist/react-datepicker.css";
import { useSelector } from "react-redux";
import { selectUserName } from "../../../../redux/IchthusSlice";
import AddShippingSerialSelection from "./AddShippingSerialSelection";

const getUniqueValues = (array, key) => [
  ...new Set(array.map((item) => item[key]).filter(Boolean)),
];

const AddShippingTransfer = ({ onClose, refreshData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [allPricelistData, setAllPricelistData] = useState([]);

  const [sendingLocation, setSendingLocation] = useState("");
  const [receivingLocation, setReceivingLocation] = useState("");
  const [globalTransferNotes, setGlobalTransferNotes] = useState("");

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProductsForTransfer, setSelectedProductsForTransfer] =
    useState([]);

  // --- NEW STATE FOR SERIAL SELECTION MODAL ---
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [productForSerialSelection, setProductForSerialSelection] =
    useState(null);
  const [transferredDate, setTransferredDate] = useState(new Date());

  const fullName = useSelector(selectUserName);

  useEffect(() => {
    const fetchPricelists = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${domain}/api/Pricelists`);
        setAllPricelistData(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching pricelists:", error);
        toast.error(
          "Failed to load pricelist data. Please check API and data format."
        );
        setAllPricelistData([]);
      }
      setIsLoading(false);
    };
    fetchPricelists();
  }, []);

  const allAvailableLocations = useMemo(() => {
    if (!Array.isArray(allPricelistData)) return [];
    return getUniqueValues(allPricelistData, "location").sort();
  }, [allPricelistData]);

  const productsAtSendingLocation = useMemo(() => {
    if (!sendingLocation || !Array.isArray(allPricelistData)) return [];
    const productsMap = new Map();

    allPricelistData
      .filter((pricelistEntry) => pricelistEntry.location === sendingLocation)
      .forEach((pricelistEntry) => {
        const {
          productId,
          // product, // No longer need to destructure 'product' here if using spread
          // itemCode, // No longer need if spreading
          // productImage, // No longer need if spreading
          // hasSerial, // No longer need if spreading
          batches,
          // id, // No longer need if spreading, will be pricelistEntry.id
        } = pricelistEntry; // Destructure only what's minimally needed for logic before spread

        let currentProduct = productsMap.get(productId);

        if (!currentProduct) {
          // This is the first time we're seeing this productId for this location.
          // Initialize currentProduct with ALL fields from this specific pricelistEntry.
          currentProduct = {
            ...pricelistEntry, // Spread all original fields from pricelistEntry
            productName: pricelistEntry.product || "Unnamed Product", // Standardize 'productName'
            // 'itemCode', 'productImage', 'hasSerial' are now part of ...pricelistEntry
            // 'id' from pricelistEntry is now currentProduct.id.
            // Ensure pricelistId is explicitly set from this entry's own ID for clarity in subsequent logic
            pricelistId: pricelistEntry.id,
            physicalOnHand: 0, // This will be calculated by iterating over ALL batches for this productId
            hasSerialOverall: pricelistEntry.hasSerial, // Use hasSerial from this (first) pricelist entry
            allUnsoldSerialsForThisProductAtLocation: [], // This will be populated from ALL batches for this productId
            selectedSerialIds: [], // Initialize for UI state (specific to transfer selection)
          };
          // If the original object had a 'product' key and you prefer 'productName' consistently:
          if ("product" in currentProduct && currentProduct.productName) {
            delete currentProduct.product;
          }
          productsMap.set(productId, currentProduct);
        } else {
          // ProductId already in map. We've set its base details from the first pricelistEntry.
          // If any subsequent pricelistEntry (for the same productId at the same location) indicates serials, update.
          if (pricelistEntry.hasSerial) {
            currentProduct.hasSerialOverall = true;
          }
          // Note: pricelistId on currentProduct remains the id of the *first* pricelistEntry encountered.
          // Other details (brand, category, etc.) also come from that first entry.
        }

        // Aggregate physicalOnHand and serials from the current pricelistEntry's batches
        // This part of the logic contributes to the existing currentProduct object

        (batches || []).forEach((actualBatch) => {
          if (
            Array.isArray(actualBatch.serialNumbers) &&
            actualBatch.serialNumbers.length > 0
          ) {
            // currentProduct.hasSerialOverall = true; // Set this if any batch has serials
            const unsoldSerials = actualBatch.serialNumbers.filter(
              (sn) => !sn.isSold
            );
            unsoldSerials.forEach((sn) => {
              currentProduct.allUnsoldSerialsForThisProductAtLocation.push({
                id: sn.id,
                serialName: sn.serialName,
                batchId: actualBatch.id,
                pricelistEntryId: pricelistEntry.id, // Good to track source pricelist entry for the serial
              });
            });
          } else if (!pricelistEntry.hasSerial) {
            // Only add numberOfItems if the product itself is not marked as having serials overall
            // This logic might need refinement if a product can have both serialized and non-serialized batches.
            // For now, assuming if hasSerialOverall is true, physicalOnHand is derived from serials.
            // currentProduct.physicalOnHand += actualBatch.numberOfItems || 0; // This will be handled globally below.
          }
        });
      });

    // After iterating all pricelist entries for the sendingLocation and populating serials/batches:
    // Final pass to set physicalOnHand correctly.
    productsMap.forEach((product) => {
      // Calculate physicalOnHand based on whether serials are found or not,
      // even if hasSerialOverall was set true from a pricelist entry.
      if (product.allUnsoldSerialsForThisProductAtLocation.length > 0) {
        // If actual unsold serials exist, use their count
        product.physicalOnHand =
          product.allUnsoldSerialsForThisProductAtLocation.length;
      } else {
        // If no unsold serials found (either no hasSerial entries or no unsold serials in them),
        // then sum non-serialized quantities from all relevant pricelist entries.
        let nonSerializedQty = 0;
        allPricelistData
          .filter(
            (pe) =>
              pe.location === sendingLocation &&
              pe.productId === product.productId &&
              (!pe.hasSerial ||
                (pe.hasSerial &&
                  (!pe.batches ||
                    pe.batches.every(
                      (b) => !b.serialNumbers || b.serialNumbers.length === 0
                    )))) // Include pricelist entries that *might* be serialized but have no actual serial numbers
          )
          .forEach((pe) => {
            (pe.batches || []).forEach((b) => {
              // Only add numberOfItems if this batch truly has no serials or is an empty serials array
              if (!b.serialNumbers || b.serialNumbers.length === 0) {
                nonSerializedQty += b.numberOfItems || 0;
              }
            });
          });
        product.physicalOnHand = nonSerializedQty;
      }
    });

    return Array.from(productsMap.values());
  }, [sendingLocation, allPricelistData]);

  const handleAddProductToTransfer = (productToAdd) => {
    if (
      selectedProductsForTransfer.find(
        (p) => p.productId === productToAdd.productId
      )
    ) {
      toast.info(
        `${productToAdd.productName} is already in the transfer list.`
      );
      return;
    }

    // When adding a product, also include its available serials and pricelistId
    const productWithSerialsData = productsAtSendingLocation.find(
      (p) => p.productId === productToAdd.productId
    );

    setSelectedProductsForTransfer((prev) => [
      ...prev,
      {
        ...productToAdd, // Contains basic product info like name, itemCode, image, hasSerialOverall
        allUnsoldSerialsForThisProductAtLocation:
          productWithSerialsData?.allUnsoldSerialsForThisProductAtLocation ||
          [],
        pricelistId: productWithSerialsData?.pricelistId, // Get the pricelistId
        transferQuantity: productToAdd.hasSerialOverall ? 0 : 1, // Serialized starts at 0, non-serialized at 1
        lineNotes: "",
        selectedSerialIds: [], // Initialize selected serials for this product
      },
    ]);
    setProductSearchTerm("");
  };

  const handleRemoveProductFromTransfer = (productIdToRemove) => {
    setSelectedProductsForTransfer((prev) =>
      prev.filter((p) => p.productId !== productIdToRemove)
    );
  };

  // --- MODIFIED: handleProductTransferChange ---
  const handleProductTransferChange = (productId, field, value) => {
    setSelectedProductsForTransfer((prev) =>
      prev.map((p) => {
        if (p.productId === productId) {
          if (field === "transferQuantity") {
            // For serialized items, quantity is derived from selected serials, so disable direct input
            if (p.hasSerialOverall) {
              // toast.info("Quantity for serialized items is set by selecting serial numbers.");
              return p; // Or, you might allow changing it and then clear selected serials
            }
            const rawValue = String(value).trim();
            if (rawValue === "") {
              return { ...p, transferQuantity: "" };
            }
            const val = parseInt(rawValue, 10);
            if (isNaN(val) || val < 0) {
              return { ...p, transferQuantity: "" }; // Or 0
            } else if (val > p.physicalOnHand) {
              toast.warn(
                `Max quantity for ${p.productName} is ${p.physicalOnHand}.`
              );
              return { ...p, transferQuantity: p.physicalOnHand };
            }
            return { ...p, transferQuantity: val };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // --- NEW: Handler to open serial selection modal ---
  const handleOpenSerialModal = (product) => {
    setProductForSerialSelection(product);
    setIsSerialModalOpen(true);
  };

  // --- NEW: Handler to save selected serials from modal ---
  const handleSaveSerials = (productId, newSelectedSerialIds) => {
    setSelectedProductsForTransfer((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? {
              ...p,
              selectedSerialIds: newSelectedSerialIds,
              transferQuantity: newSelectedSerialIds.length, // Update quantity based on selection
            }
          : p
      )
    );
    setIsSerialModalOpen(false);
    setProductForSerialSelection(null);
  };

  const handleQuantityBlur = (productId) => {
    setSelectedProductsForTransfer((prev) =>
      prev.map((p) => {
        if (p.productId === productId) {
          // For non-serialized, if quantity is empty or 0, maybe default to 1 or handle in validation.
          if (
            !p.hasSerialOverall &&
            (p.transferQuantity === "" || Number(p.transferQuantity) === 0)
          ) {
            // return { ...p, transferQuantity: 1 }; // Optional: default to 1
          }
        }
        return p;
      })
    );
  };

  const filteredProductsForSearch = useMemo(() => {
    if (!productSearchTerm) return [];
    return productsAtSendingLocation.filter(
      (p) =>
        (p.productName || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        (p.itemCode || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase())
    );
  }, [productSearchTerm, productsAtSendingLocation]);

  // --- MODIFIED: handleFormSubmit ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // --- Initial Validations (Your existing code is good) ---
    if (!sendingLocation) {
      toast.error("Please select a sending location.");
      setIsLoading(false);
      return;
    }
    if (!receivingLocation) {
      toast.error("Please select a receiving location.");
      setIsLoading(false);
      return;
    }
    if (sendingLocation === receivingLocation) {
      toast.error("Sending and receiving locations cannot be the same.");
      setIsLoading(false);
      return;
    }
    if (selectedProductsForTransfer.length === 0) {
      toast.error("Please add at least one product to transfer.");
      setIsLoading(false);
      return;
    }
    if (!transferredDate) {
      toast.error("Please select a transferred date.");
      setIsLoading(false);
      return;
    }

    let hasError = false;
    // This object will group items by their item code to aggregate quantities
    const aggregatedItems = {};
    const serialsToTransfer = []; // This will hold all payloads for the SerialNumberTransfer API
    const itemsToSubmit = [];

    // --- Loop to Process Products and Build Payloads ---
    for (const product of selectedProductsForTransfer) {
      let quantityToSubmit;
      let serialNumberIdsToSubmit = [];
      let serialNamesToSubmit = [];

      // --- Validations for each product (Your existing code is good) ---
      if (product.hasSerialOverall) {
        if (
          !product.selectedSerialIds ||
          product.selectedSerialIds.length === 0
        ) {
          toast.error(
            `Please select serial numbers for ${product.productName}.`
          );
          hasError = true;
          break;
        }
        quantityToSubmit = product.selectedSerialIds.length;
        serialNumberIdsToSubmit = product.selectedSerialIds;
        serialNamesToSubmit = product.selectedSerialIds
          .map((selectedId) => {
            const foundSerial =
              product.allUnsoldSerialsForThisProductAtLocation.find(
                (s) => s.id === selectedId
              );
            return foundSerial ? foundSerial.serialName : null;
          })
          .filter((name) => name !== null);

        if (serialNamesToSubmit.length !== product.selectedSerialIds.length) {
          toast.error(
            `Could not find serial names for all selected IDs for ${product.productName}.`
          );
          hasError = true;
          break;
        }
      } else {
        quantityToSubmit = Number(product.transferQuantity);
        if (isNaN(quantityToSubmit) || quantityToSubmit <= 0) {
          toast.error(
            `Enter a valid transfer quantity (>0) for ${product.productName}.`
          );
          hasError = true;
          break;
        }
        if (quantityToSubmit > product.physicalOnHand) {
          toast.error(
            `Transfer quantity for ${product.productName} (${quantityToSubmit}) exceeds available stock (${product.physicalOnHand}).`
          );
          hasError = true;
          break;
        }
      }

      itemsToSubmit.push({
        productId: product.productId,
        PricelistId: product.pricelistId,
        receiverPricelistId: null, // As in original code
        quantity: quantityToSubmit,
        notes: product.lineNotes,
        serialNumberIds: serialNumberIdsToSubmit,
      });

      const parsedItemCode = parseInt(product.itemCode, 10);
      const finalItemCode = isNaN(parsedItemCode) ? 0 : parsedItemCode;

      // --- Aggregate items for the main transfer payload ---
      if (!aggregatedItems[finalItemCode]) {
        aggregatedItems[finalItemCode] = {
          batangasItemCode: finalItemCode,
          malabonItemCode: 0, // Set as required by the new API
          itemDescription: product.productName,
          amount: product.vatEx,
          reseller: product.reseller,
          vatInc: product.vatInc,
          quantity: 0,
          remarks: product.lineNotes || "", // Ensure remarks is at least an empty string
          serial: product.hasSerialOverall ? "Yes" : "No",
        };
      }
      aggregatedItems[finalItemCode].quantity += quantityToSubmit;

      // --- Create payloads for the SerialNumberTransfer API if applicable ---
      if (product.hasSerialOverall) {
        serialNamesToSubmit.forEach((serialName) => {
          serialsToTransfer.push({
            itemNumber: finalItemCode,
            itemName: product.productName,
            branch: `${receivingLocation.toUpperCase()}`, // Set as required
            serialNumberValue: serialName,
            isSold: false,
            pcs: 1,
            isTransfer: false,
          });
        });
      }
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      // --- Step 1: Get the next stock number ---
      const res = await axios.get(
        `${domainMark}/api/StockTransferHeader/NextStockNumber`
      );
      const stockNumber = res.data;

      // --- Step 2: Create and Post the StockTransferHeader ---
      const StockTransferHeaderPayload = {
        stockNumber,
        fromTransfer: sendingLocation,
        fromDate: transferredDate.toISOString(),
        fromBranch: `${sendingLocation.toUpperCase()} BRANCH STORE`,
        toTransfer: receivingLocation,
        toDate: transferredDate.toISOString(),
        toBranch: `${receivingLocation.toUpperCase()} BRANCH STORE`,
        date: transferredDate.toISOString(),
        checkBy_Name: "",
        receivedBy_Name: "",
        approvedBy_Name: "",
        approvalCheckBy: false,
        approvalReceivedBy: false,
        approvedBy: false,
        status_Transfer: false,
        transferType: `${receivingLocation.toUpperCase()} TRANSFER`,
      };

      await axios.post(
        `${domainMark}/api/StockTransferHeader`,
        StockTransferHeaderPayload
      );

      // --- Step 3: Create and Post the StockTransferDetails ---
      const finalStockTransferDetailsPayload = Object.values(
        aggregatedItems
      ).map((item) => ({
        ...item,
        stockNumber, // Add the stockNumber to each item
        id: 0, // Add the id field as required
      }));

      // This will now post a single, aggregated payload for each item
      for (const payload of finalStockTransferDetailsPayload) {
        await axios.post(`${domainMark}/api/StockTransferDetails`, payload);
      }

      // --- Step 4: Post each serial number to SerialNumberTransfer ---
      if (serialsToTransfer.length > 0) {
        const serialPayloadsWithStockNumber = serialsToTransfer.map(
          (serial) => ({
            ...serial,
            stockNumber, // Add the fetched stockNumber
          })
        );

        // Post the array of serial transfer payloads
        console.log(
          "Posting to SerialNumberTransfer:",
          serialPayloadsWithStockNumber
        );
        await axios.post(
          `${domainMark}/api/SerialNumberTransfer`,
          serialPayloadsWithStockNumber
        );
      }

      // --- Step 5 (Optional): Post to your original /api/Transfers endpoint ---
      // This part of your code can remain the same if still needed.
      const transferPayload = {
        releaseBy: fullName, // Assuming 'fullName' is available in your component's scope
        status: " In Transit",
        fromLocation: sendingLocation,
        toLocation: receivingLocation,
        transferredDate: transferredDate.toISOString(),
        notes: globalTransferNotes, // Assuming 'globalTransferNotes' is available
        items: itemsToSubmit,
      };
      await axios.post(`${domain}/api/Transfers`, transferPayload);

      toast.success(
        `Inventory transfer (${stockNumber}) submitted successfully!`
      );
      if (typeof refreshData === "function") refreshData();
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
      toast.error(
        `Transfer failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedProductsForTransfer([]);
    setProductSearchTerm("");
    // Close serial modal if open when sending location changes
    if (isSerialModalOpen) {
      setIsSerialModalOpen(false);
      setProductForSerialSelection(null);
    }
  }, [sendingLocation]);

  if (isLoading && allPricelistData.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-[1001]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-[1000] p-4">
      <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg max-h-[90vh] flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-[1002] rounded-lg">
            <Loader />
          </div>
        )}

        <div className="sticky top-0 bg-white z-20 px-6 py-4 border-b rounded-t-lg">
          {/* ... (header remains the same) ... */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Transfer Inventory
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form
          id="transferInventoryForm"
          onSubmit={handleFormSubmit}
          className="flex-grow overflow-y-auto p-6 space-y-6"
        >
          {/* ... (warehouse selection and global notes remain the same) ... */}
          <div className="p-4 border rounded-md bg-gray-50/50">
            <div className="flex flex-col  gap-4 items-start ">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Select Store and add notes
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="transferredDate"
                  className="block text-sm font-medium text-gray-700 mb-1 "
                >
                  Transferred Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="transferredDate"
                    selected={transferredDate}
                    onChange={(date) => setTransferredDate(date)}
                    dateFormat="MMMM d, yyyy"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    wrapperClassName="w-full" // Ensure the wrapper takes full width
                    popperPlacement="bottom-start"
                    required
                  />
                  <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div>
                <label
                  htmlFor="sendingLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sending Warehouse
                </label>
                <select
                  id="sendingLocation"
                  value={sendingLocation}
                  onChange={(e) => {
                    setSendingLocation(e.target.value);
                    setReceivingLocation(""); // --- ADD THIS LINE ---
                  }}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  required
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {allAvailableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-center pt-5">
                <FaArrowRight className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <label
                  htmlFor="receivingLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Receiving Warehouse
                </label>
                <select
                  id="receivingLocation"
                  value={receivingLocation}
                  onChange={(e) => setReceivingLocation(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  required
                  disabled={!sendingLocation}
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {allAvailableLocations
                    .filter((loc) => loc !== sendingLocation)
                    .map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {/* --- DATE PICKER AND NOTES ROW --- */}
            <div className="mt-4">
              <div>
                <label
                  htmlFor="globalTransferNotes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transfer Notes{" "}
                  <span className="text-xs text-gray-500">(Overall)</span>
                </label>
                <textarea
                  id="globalTransferNotes"
                  rows="2" // Adjusted rows to fit better next to date picker
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  value={globalTransferNotes}
                  onChange={(e) => setGlobalTransferNotes(e.target.value)}
                  placeholder="Add any relevant notes for this transfer..."
                />
              </div>
            </div>
          </div>

          {sendingLocation && (
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Select products to be transferred
              </h3>
              <div className="mb-4 relative">
                <label
                  htmlFor="productSearch"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Add a product:
                </label>
                <div className="flex items-center relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaSearch className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    id="productSearch"
                    placeholder="Search products by name or ItemCode..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="mt-1 block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    disabled={!sendingLocation}
                  />
                </div>
                {productSearchTerm && filteredProductsForSearch.length > 0 && (
                  <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                    {filteredProductsForSearch.map((product) => (
                      <li
                        key={product.productId}
                        onClick={() => handleAddProductToTransfer(product)}
                        className="px-3 py-2 hover:bg-orange-100 cursor-pointer text-sm flex items-center"
                      >
                        {product.productImage ? (
                          <img
                            src={`data:image/jpeg;base64,${product.productImage}`}
                            alt={product.productName}
                            className="w-8 h-8 rounded-sm object-cover mr-2 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-sm bg-gray-200 mr-2 flex-shrink-0 flex items-center justify-center text-gray-400">
                            <FaImage className="h-5 w-5" />
                          </div>
                        )}
                        <span className="flex-grow">
                          {product.productName} (ItemCode: {product.itemCode})
                        </span>
                        <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">
                          Stock: {product.physicalOnHand}{" "}
                          {product.hasSerialOverall &&
                          product.physicalOnHand > 0
                            ? "(Serials)"
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {productSearchTerm &&
                  !isLoading &&
                  productsAtSendingLocation.length > 0 &&
                  filteredProductsForSearch.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No products found matching "{productSearchTerm}" at{" "}
                      {sendingLocation}.
                    </p>
                  )}
                {!isLoading &&
                  productsAtSendingLocation.length === 0 &&
                  sendingLocation && (
                    <p className="text-sm text-red-500 mt-1">
                      No products available at "{sendingLocation}".
                    </p>
                  )}
              </div>

              {selectedProductsForTransfer.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Product/ItemCode
                        </th>
                        <th className="px-3 py-2  text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                          On Hand
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {/* MODIFIED HEADER */}
                          Transfer Qty / Serials
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Line Notes
                        </th>
                        <th className="px-3 py-2">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProductsForTransfer.map((product) => (
                        <tr key={product.productId}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.productImage ? (
                                <img
                                  src={`data:image/jpeg;base64,${product.productImage}`}
                                  alt={product.productName}
                                  className="w-10 h-10 rounded-sm object-cover mr-3 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-sm bg-gray-200 mr-3 flex-shrink-0 flex items-center justify-center text-gray-400">
                                  <FaImage className="h-6 w-6" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.productName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  SKU: {product.itemCode}{" "}
                                  {product.hasSerialOverall ? (
                                    <span className="text-blue-600 font-semibold">
                                      (Serialized)
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                            {product.physicalOnHand}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {/* --- MODIFIED for Serialized --- */}
                            {product.hasSerialOverall ? (
                              <div className="flex flex-col items-start">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSerialModal(product)}
                                  className="mb-1 text-sm text-orange-600 hover:text-orange-800 font-medium py-1 px-2 border border-orange-500 rounded-md hover:bg-orange-50 flex items-center"
                                  disabled={product.physicalOnHand === 0}
                                >
                                  <FaListOl className="mr-2" />
                                  Select Serials (
                                  {product.selectedSerialIds.length})
                                </button>
                                {product.physicalOnHand === 0 && (
                                  <span className="text-xs text-gray-500">
                                    No serials available
                                  </span>
                                )}
                              </div>
                            ) : (
                              <input // For non-serialized
                                type="number"
                                value={product.transferQuantity}
                                onChange={(e) =>
                                  handleProductTransferChange(
                                    product.productId,
                                    "transferQuantity",
                                    e.target.value
                                  )
                                }
                                onBlur={() =>
                                  handleQuantityBlur(product.productId)
                                }
                                min="0" // Allow 0, validation on submit will check for >0
                                max={product.physicalOnHand}
                                className="w-20 py-1 px-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-orange-500 focus:border-orange-500"
                                required
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {/* ... (line notes input remains the same) ... */}
                            <input
                              type="text"
                              placeholder="Item specific notes..."
                              value={product.lineNotes}
                              onChange={(e) =>
                                handleProductTransferChange(
                                  product.productId,
                                  "lineNotes",
                                  e.target.value
                                )
                              }
                              className="w-full py-1 px-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                            {/* ... (remove button remains the same) ... */}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveProductFromTransfer(
                                  product.productId
                                )
                              }
                              className="text-red-500 hover:text-red-700 p-1"
                              aria-label="Remove product"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedProductsForTransfer.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No products added for transfer yet.
                </p>
              )}
            </div>
          )}
        </form>

        <div className="sticky bottom-0 bg-gray-100 px-6 py-3 border-t rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Close
            </button>
            <button
              type="submit"
              form="transferInventoryForm"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60"
              disabled={
                isLoading ||
                !sendingLocation ||
                !receivingLocation ||
                selectedProductsForTransfer.length === 0 ||
                selectedProductsForTransfer.some(
                  (p) =>
                    p.hasSerialOverall
                      ? p.selectedSerialIds.length === 0 // Serialized must have serials selected
                      : p.transferQuantity === "" ||
                        Number(p.transferQuantity) <= 0 // Non-serialized must have qty > 0
                )
              }
            >
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* --- NEW: Serial Selection Modal --- */}
      {isSerialModalOpen && productForSerialSelection && (
        <AddShippingSerialSelection
          product={productForSerialSelection}
          availableSerials={
            productForSerialSelection.allUnsoldSerialsForThisProductAtLocation
          }
          previouslySelectedIds={productForSerialSelection.selectedSerialIds}
          onClose={() => {
            setIsSerialModalOpen(false);
            setProductForSerialSelection(null);
          }}
          onSave={handleSaveSerials}
        />
      )}
    </div>
  );
};

export default AddShippingTransfer;
