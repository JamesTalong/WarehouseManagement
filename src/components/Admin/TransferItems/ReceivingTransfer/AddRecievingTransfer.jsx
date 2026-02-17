import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { domain, domainMark } from "../../../../security";
import { FcSearch } from "react-icons/fc";
import SearchItemModal from "./SearchItemModal";

const AddRecievingTransfer = ({
  transfer,
  onClose,
  onConfirmReceive,
  currentUserFullName,
}) => {
  const [itemsToReceive, setItemsToReceive] = useState([]);
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);
  const [itemWithMismatch, setItemWithMismatch] = useState(null);
  const [showSerialDeletionWarning, setShowSerialDeletionWarning] =
    useState(false);
  const [serialDeletionWarningItem, setSerialDeletionWarningItem] =
    useState(null);
  const [serialDeletionProposedAction, setSerialDeletionProposedAction] =
    useState(null);
  const [pricelistMap, setPricelistMap] = useState(new Map()); // Maps product name to its initial itemCode (string)
  const [itemCodeToPricelistIdMap, setItemCodeToPricelistIdMap] = useState(
    new Map()
  ); // Maps itemCode to its Pricelist ID
  const [loadingPricelist, setLoadingPricelist] = useState(true);

  // --- New State Variables for Search Modal ---
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [currentSearchItemId, setCurrentSearchItemId] = useState(null); // To know which item's code to update

  // --- New State Variables for Approval Modal ---
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvedByNameInput, setApprovedByNameInput] = useState("");
  const [receivedByNameInput, setReceivedByNameInput] = useState(
    currentUserFullName || ""
  );
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [processedDataForSubmission, setProcessedDataForSubmission] =
    useState(null);

  const fetchPricelistData = useCallback(async () => {
    if (!transfer || !transfer.items || transfer.items.length === 0) {
      setLoadingPricelist(false);
      return;
    }
    const uniqueProductNames = [
      ...new Set(
        transfer.items.map((item) => item.pricelist?.product?.productName)
      ),
    ].filter(Boolean);

    const newPricelistMap = new Map();
    const newItemCodeToPricelistIdMap = new Map();
    let hasError = false;
    for (const productName of uniqueProductNames) {
      try {
        const response = await axios.get(
          `${domain}/api/Pricelists/by-product/${encodeURIComponent(
            productName
          )}`
        );
        if (response.data && response.data.length > 0) {
          const matchedPricelist = response.data[0];
          newPricelistMap.set(productName, matchedPricelist.itemCode);
          newItemCodeToPricelistIdMap.set(
            matchedPricelist.itemCode,
            matchedPricelist.id
          );
        }
      } catch (error) {
        console.error(`Error fetching pricelist for ${productName}:`, error);
        toast.error(`Failed to fetch pricelist for ${productName}.`);
        hasError = true;
      }
    }
    setPricelistMap(newPricelistMap);
    setItemCodeToPricelistIdMap(newItemCodeToPricelistIdMap);
    setLoadingPricelist(false);
    if (hasError) {
      toast.error("Some pricelists failed to load.");
    }
  }, [transfer]);

  // NEW: Fetch all products for the search modal
  const fetchAllProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/Pricelists`);
      if (response.data) {
        // Filter out duplicates based on itemCode if necessary, and format for display
        const uniqueProducts = [];
        const seenItemCodes = new Set();
        response.data.forEach((pricelist) => {
          if (pricelist.itemCode && pricelist.product?.productName) {
            if (!seenItemCodes.has(pricelist.itemCode)) {
              uniqueProducts.push({
                itemCode: pricelist.itemCode,
                product: pricelist.product.productName,
                id: pricelist.id, // Store pricelist ID to use for receiverPricelistId
              });
              seenItemCodes.add(pricelist.itemCode);
            }
          }
        });
        setAllProducts(uniqueProducts);
      }
    } catch (error) {
      console.error("Error fetching all products for search:", error);
      toast.error("Failed to load all products for search.");
    }
  }, []);

  useEffect(() => {
    fetchPricelistData();
    fetchAllProducts();
  }, [fetchPricelistData, fetchAllProducts]);

  useEffect(() => {
    if (transfer && transfer.items && !loadingPricelist) {
      const initialItems = transfer.items.map((item) => {
        const defaultBatangasItemCode =
          pricelistMap.get(item.pricelist?.product?.productName) || "";
        const defaultReceiverPricelistId =
          itemCodeToPricelistIdMap.get(defaultBatangasItemCode) || 0;

        // Determine if item has serials based on serialIndicator
        const hasSerials = item.serialIndicator === "Yes";
        // Map actualSerialNumbers to the desired format with an ID
        const receivedSerialNumbers = hasSerials
          ? item.actualSerialNumbers.map((sn, index) => ({
              id: `${item.id}-${index}`, // Unique ID for each serial
              serialName: sn,
            }))
          : [];

        return {
          ...item,
          receivedQuantity: hasSerials
            ? receivedSerialNumbers.length
            : item.quantity,
          hasSerials: hasSerials, // Set based on serialIndicator
          receivedSerialNumbers: receivedSerialNumbers, // Use actualSerialNumbers
          serialsToMarkAsMissingIds: [],
          editableBatangasItemCode: defaultBatangasItemCode,
          receiverPricelistId: defaultReceiverPricelistId,
        };
      });
      setItemsToReceive(initialItems);
    }
  }, [transfer, pricelistMap, itemCodeToPricelistIdMap, loadingPricelist]);

  if (!transfer || loadingPricelist) {
    return <div>Loading transfer details and pricelist...</div>;
  }

  const handleReceivedQuantityChange = (itemId, newQuantityStr) => {
    const newQuantity = Math.max(0, parseInt(newQuantityStr, 10) || 0);
    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const clampedQuantity = Math.min(newQuantity, item.quantity);
          if (item.hasSerials) {
            const currentReceivedSerialCount =
              item.receivedSerialNumbers.filter(
                (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
              ).length;
            if (clampedQuantity < currentReceivedSerialCount) {
              setSerialDeletionWarningItem(item);
              setSerialDeletionProposedAction({
                itemId,
                newEffectiveReceivedQuantity: clampedQuantity,
              });
              setShowSerialDeletionWarning(true);
              return { ...item, receivedQuantity: clampedQuantity };
            } else if (clampedQuantity > currentReceivedSerialCount) {
              const difference = clampedQuantity - currentReceivedSerialCount;
              let tempSerialsToMarkAsMissingIds = [
                ...item.serialsToMarkAsMissingIds,
              ];
              let unMarkedCount = 0;
              const updatedMissingIds = [];
              for (
                let i = tempSerialsToMarkAsMissingIds.length - 1;
                i >= 0;
                i--
              ) {
                if (unMarkedCount < difference) {
                  unMarkedCount++;
                } else {
                  updatedMissingIds.unshift(tempSerialsToMarkAsMissingIds[i]);
                }
              }
              tempSerialsToMarkAsMissingIds = updatedMissingIds;
              return {
                ...item,
                receivedQuantity: clampedQuantity,
                serialsToMarkAsMissingIds: tempSerialsToMarkAsMissingIds,
              };
            } else {
              return { ...item, receivedQuantity: clampedQuantity };
            }
          } else {
            return { ...item, receivedQuantity: clampedQuantity };
          }
        }
        return item;
      })
    );
  };

  const handleConfirmSerialDeletionWarning = () => {
    const { itemId, newEffectiveReceivedQuantity, markAsMissingSerialId } =
      serialDeletionProposedAction;
    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          let updatedSerialsToMarkAsMissingIds = [
            ...item.serialsToMarkAsMissingIds,
          ];
          if (markAsMissingSerialId) {
            if (
              !updatedSerialsToMarkAsMissingIds.includes(markAsMissingSerialId)
            ) {
              updatedSerialsToMarkAsMissingIds.push(markAsMissingSerialId);
            }
          } else {
            const originalSerials = item.receivedSerialNumbers;
            const currentlyConsideredReceived = originalSerials.filter(
              (sn) => !updatedSerialsToMarkAsMissingIds.includes(sn.id)
            );
            const numToMarkMissing =
              currentlyConsideredReceived.length - newEffectiveReceivedQuantity;
            if (numToMarkMissing > 0) {
              const serialsToNowMarkMissing = currentlyConsideredReceived
                .slice(-numToMarkMissing)
                .map((sn) => sn.id);
              serialsToNowMarkMissing.forEach((idToMark) => {
                if (!updatedSerialsToMarkAsMissingIds.includes(idToMark)) {
                  updatedSerialsToMarkAsMissingIds.push(idToMark);
                }
              });
            }
          }
          const actualReceivedCount = item.receivedSerialNumbers.filter(
            (sn) => !updatedSerialsToMarkAsMissingIds.includes(sn.id)
          ).length;
          return {
            ...item,
            receivedQuantity: actualReceivedCount,
            serialsToMarkAsMissingIds: updatedSerialsToMarkAsMissingIds,
          };
        }
        return item;
      })
    );
    setShowSerialDeletionWarning(false);
    setSerialDeletionWarningItem(null);
    setSerialDeletionProposedAction(null);
  };

  const handleCancelSerialDeletionWarning = () => {
    if (serialDeletionProposedAction && serialDeletionWarningItem) {
      setItemsToReceive((prevItems) =>
        prevItems.map((item) => {
          if (item.id === serialDeletionWarningItem.id) {
            const currentNonMissingSerialsCount =
              item.receivedSerialNumbers.filter(
                (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
              ).length;
            return {
              ...item,
              receivedQuantity: currentNonMissingSerialsCount,
            };
          }
          return item;
        })
      );
    }
    setShowSerialDeletionWarning(false);
    setSerialDeletionWarningItem(null);
    setSerialDeletionProposedAction(null);
  };

  const handleToggleSerialNumberStatus = (
    itemId,
    serialId,
    isCurrentlyMissing
  ) => {
    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          let updatedSerialsToMarkAsMissingIds = [
            ...item.serialsToMarkAsMissingIds,
          ];
          let newReceivedQuantity = item.receivedQuantity;

          if (isCurrentlyMissing) {
            updatedSerialsToMarkAsMissingIds =
              updatedSerialsToMarkAsMissingIds.filter((id) => id !== serialId);
            newReceivedQuantity = Math.min(
              item.quantity,
              newReceivedQuantity + 1
            );
          } else {
            const currentNonMissingCount = item.receivedSerialNumbers.filter(
              (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
            ).length;
            if (newReceivedQuantity - 1 < 0) {
              toast.warn("Cannot mark more items as missing than available.");
              return item;
            }

            setSerialDeletionWarningItem(item);
            setSerialDeletionProposedAction({
              itemId,
              markAsMissingSerialId: serialId,
            });
            setShowSerialDeletionWarning(true);
            return item;
          }
          return {
            ...item,
            receivedQuantity: newReceivedQuantity,
            serialsToMarkAsMissingIds: updatedSerialsToMarkAsMissingIds,
          };
        }
        return item;
      })
    );
  };

  const handleBatangasItemCodeChange = async (itemId, newItemCodeString) => {
    setItemsToReceive((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              editableBatangasItemCode: newItemCodeString,
              receiverPricelistId: 0,
            }
          : item
      )
    );

    if (!newItemCodeString || newItemCodeString.length < 3) {
      return;
    }

    try {
      const response = await axios.get(
        `${domain}/api/Pricelists/by-itemcode/${encodeURIComponent(
          newItemCodeString
        )}`
      );

      if (response.data && response.data.length > 0) {
        const matchedPricelist = response.data[0];
        setItemsToReceive((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  receiverPricelistId: matchedPricelist.id,
                  editableBatangasItemCode: matchedPricelist.itemCode,
                }
              : item
          )
        );
        toast.success(
          `Found pricelist for item code ${matchedPricelist.itemCode}.`
        );
      } else {
        setItemsToReceive((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId ? { ...item, receiverPricelistId: 0 } : item
          )
        );
        toast.warn(`No pricelist found for item code: ${newItemCodeString}`);
      }
    } catch (error) {
      console.error(
        `Error fetching pricelist by item code ${newItemCodeString}:`,
        error
      );
      toast.error(`Error searching for item code: ${newItemCodeString}.`);
      setItemsToReceive((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, receiverPricelistId: 0 } : item
        )
      );
    }
  };

  // NEW: Handler for opening the search modal
  const handleOpenSearchModal = (itemId) => {
    setCurrentSearchItemId(itemId);
    setShowSearchModal(true);
  };

  // NEW: Handler for selecting an item from the search modal
  const handleSelectItemFromSearch = (selectedProduct) => {
    if (currentSearchItemId) {
      setItemsToReceive((prevItems) =>
        prevItems.map((item) =>
          item.id === currentSearchItemId
            ? {
                ...item,
                editableBatangasItemCode: selectedProduct.itemCode,
                receiverPricelistId: selectedProduct.id, // Use the ID from the selected pricelist
              }
            : item
        )
      );
      toast.success(
        `Batangas Code updated for ${selectedProduct.product} to ${selectedProduct.itemCode}`
      );
    }
    setShowSearchModal(false);
    setCurrentSearchItemId(null);
  };

  const prepareConfirmationData = () => {
    return itemsToReceive.map((item) => {
      let finalSerialNumbers = [];
      let quantityForOutput;

      if (item.hasSerials) {
        finalSerialNumbers = item.receivedSerialNumbers.map((sn) => ({
          id: sn.id,
          serialName: sn.serialName,
          status: item.serialsToMarkAsMissingIds.includes(sn.id)
            ? "Missing"
            : "Received",
        }));
        quantityForOutput = finalSerialNumbers.filter(
          (sn) => sn.status === "Received"
        ).length;
      } else {
        quantityForOutput = item.receivedQuantity;
        finalSerialNumbers = Array.from({ length: quantityForOutput }, () => ({
          serialName: "",
          status: "Received",
        }));
      }
      const finalReceiverPricelistId = item.receiverPricelistId;
      const finalPricelistId = parseInt(item.PricelistId, 10) || 0;

      return {
        PricelistId: finalPricelistId,
        quantity: quantityForOutput,
        receiverPricelistId: finalReceiverPricelistId,
        serialNumbers: finalSerialNumbers,
        productName: item.pricelist?.product?.productName,
        originalItemData: {
          amount: item.amount,
          reseller: item.reseller,
          vatInc: item.vatInc,
          itemDescription: item.pricelist?.product?.productName,
        },
      };
    });
  };

  const checkAndDelete = () => {
    let hasMismatch = false;
    let mismatchedItem = null;

    for (const item of itemsToReceive) {
      const expectedQty = item.quantity;
      const effectivelyReceivedQty = item.hasSerials
        ? item.receivedSerialNumbers.filter(
            (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
          ).length
        : item.receivedQuantity;

      if (effectivelyReceivedQty < expectedQty) {
        hasMismatch = true;
        mismatchedItem = { ...item, effectivelyReceivedQty };
        break;
      }
    }

    if (hasMismatch) {
      setItemWithMismatch(mismatchedItem);
      setShowConfirmWarning(true);
    } else {
      const dataToSave = prepareConfirmationData();
      setProcessedDataForSubmission(dataToSave);
      setShowApprovalModal(true);
    }
  };

  const handleConfirmDeletion = () => {
    const dataToSave = prepareConfirmationData();
    setProcessedDataForSubmission(dataToSave);
    setShowConfirmWarning(false);
    setItemWithMismatch(null);
    setShowApprovalModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!approvedByNameInput.trim()) {
      toast.error("Approved By Name is required.");
      return;
    }
    if (!receivedByNameInput.trim()) {
      toast.error("Received By Name is required.");
      return;
    }

    setIsSubmittingApproval(true);
    const receivedDate = new Date();
    const stockNumberToUse =
      transfer.originalHeaderData?.stockNumber || transfer.id;

    try {
      const payloadForReceive = {
        transferId: transfer.id,
        fromLocation: transfer.originalHeaderData.fromTransfer,
        toLocation: transfer.originalHeaderData.toTransfer,
        status: "Completed",
        releaseBy: transfer.releaseBy,
        receiveBy: receivedByNameInput,
        transferredDate: transfer.transferredDate,
        receivedDate: receivedDate.toISOString(),
        items: processedDataForSubmission.map((pItem) => ({
          receiverPricelistId: parseInt(pItem.receiverPricelistId, 10) || 0,
          productName: pItem.productName || "N/A",
          PricelistId: parseInt(pItem.receiverPricelistId, 10),
          ItemCode: parseInt(pItem.PricelistId, 10),
          quantity: pItem.quantity,
          serialNumbers: pItem.serialNumbers.map((sn) => ({
            status: sn.status,
            serialName: sn.serialName,
          })),
        })),
      };
      console.log(
        "Payload for /api/payloadForReceive:",
        JSON.stringify(payloadForReceive, null, 2)
      );

      await axios.post(`${domain}/api/ReceivedTransfers`, payloadForReceive);
      toast.success("ReceivedTransfers API call successful.");

      const updatedHeader = {
        ...transfer.originalHeaderData,
        stockNumber: stockNumberToUse,
        status_Transfer: true,
        receivedBy_Name: receivedByNameInput,
        approvedBy_Name: approvedByNameInput,
        toDate: receivedDate.toISOString(),
        approvalCheckBy: true,
        approvalReceivedBy: true,
        approvedBy: true,
      };
      // delete updatedHeader.id;
      // console.log(
      //   "Payload for /api/StockTransferHeader:",
      //   JSON.stringify(updatedHeader, null, 2)
      // );
      await axios.put(
        `${domainMark}/api/StockTransferHeader/${stockNumberToUse}`,
        updatedHeader,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(
        "Payload for /api/updatedHeader:",
        JSON.stringify(updatedHeader, null, 2)
      );

      toast.success("StockTransferHeader API call successful.");

      const updatedDetails = processedDataForSubmission.map((pItem) => {
        const currentReceivingItem = itemsToReceive.find(
          (i) => i.PricelistId === pItem.PricelistId
        );
        return {
          batangasItemCode:
            currentReceivingItem?.editableBatangasItemCode ||
            pItem.receiverPricelistId?.toString() ||
            "N/A",
          malabonItemCode: pItem.PricelistId,
          stockNumber: stockNumberToUse,
          itemDescription:
            pItem.productName ||
            currentReceivingItem?.pricelist?.product?.productName ||
            "N/A",
          amount:
            currentReceivingItem?.amount ||
            currentReceivingItem?.pricelist?.price ||
            0,
          reseller: currentReceivingItem?.reseller || 0,
          vatInc: currentReceivingItem?.vatInc || 0,
          quantity: pItem.quantity,
          remarks: pItem.serialNumbers.some((s) => s.status === "Missing")
            ? `Received with ${
                pItem.serialNumbers.filter((s) => s.status === "Missing").length
              } missing serial(s).`
            : "Received",
          serial:
            pItem.serialNumbers
              .map((s) => `${s.serialName} (${s.status})`)
              .join(", ") || null,
          // Add serialNumbers array to pItem for easier access
          serialNumbers: pItem.serialNumbers,
          hasSerials: currentReceivingItem?.hasSerials || false,
        };
      });

      const stockTransferDetailsPayload = updatedDetails.map((item) => {
        console.log("Mapping item:", item); // Log the original item

        return {
          batangasItemCode: item.batangasItemCode,
          malabonItemCode: item.malabonItemCode,
          stockNumber: item.stockNumber,
          itemDescription: item.itemDescription,
          amount: item.amount,
          reseller: item.reseller,
          vatInc: item.vatInc,
          quantity: item.quantity,
          remarks: item.remarks,
          serial: item.hasSerials ? "Yes" : "No",
        };
      });

      const serialNumberTransferPayload = updatedDetails.flatMap((item) => {
        return item.serialNumbers.map((s) => ({
          itemNumber: item.batangasItemCode, // Similar to batangasItemCode
          stockNumber: item.stockNumber,
          itemName: item.itemDescription, // Similar to itemDescription
          branch: transfer.originalHeaderData.toTransfer, // Assuming 'transfer' object is available in your scope
          serialNumberValue: s.serialName,
          isSold: false,
          pcs: 1,
          isTransfer: true,
        }));
      });

      console.log(
        "Payload for /api/StockTransferDetails:",
        JSON.stringify(stockTransferDetailsPayload, null, 2)
      );

      console.log(
        "Payload for /api/SerialNumberTransfer:",
        JSON.stringify(serialNumberTransferPayload, null, 2)
      );

      // await axios.put(
      //   `${domainMark}/api/StockTransferDetails/${stockNumberToUse}`,
      //   stockTransferDetailsPayload,
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );
      await axios.put(
        `${domainMark}/api/StockTransferDetails/bulk-update/${stockNumberToUse}`,
        stockTransferDetailsPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      // (Optional) If you also need to send the serial number transfer payload:
      await axios.put(
        `${domainMark}/api/SerialNumberTransfer/stock/${stockNumberToUse}`,
        serialNumberTransferPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Payload for /api/StockTransferDetails/bulk-update:",
        JSON.stringify(updatedDetails, null, 2)
      );

      toast.success("StockTransferDetails API call successful.");

      alert(`Transfer ${stockNumberToUse} successfully processed and updated.`);
      setShowApprovalModal(false);
      onClose();
      if (onConfirmReceive) {
        onConfirmReceive(transfer, processedDataForSubmission, {
          approvedBy: approvedByNameInput,
          receivedBy: receivedByNameInput,
        });
      }
    } catch (err) {
      console.error(
        "Transfer processing failed:",
        err.response ? err.response.data : err.message
      );
      toast.error(
        `Transfer processing failed. ${
          err.response?.data?.message ||
          err.message ||
          err.response?.data?.title
        }`
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const displayItemInfo = (item) => {
    const expectedQty = item.quantity;
    const effectivelyReceivedQty = item.hasSerials
      ? item.receivedSerialNumbers.filter(
          (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
        ).length
      : item.receivedQuantity;
    const receivedQtyDisplay = item.hasSerials
      ? effectivelyReceivedQty
      : item.receivedQuantity;

    const canEditReceivedQtyInput = !item.hasSerials;

    return (
      <div className="flex items-center space-x-2">
        <span>Expected: {expectedQty}</span>
        <span>Received: </span>
        <label htmlFor={`received-qty-${item.id}`} className="sr-only">
          Received Quantity
        </label>
        {canEditReceivedQtyInput ? (
          <input
            id={`received-qty-${item.id}`}
            type="number"
            value={item.receivedQuantity}
            onChange={(e) =>
              handleReceivedQuantityChange(item.id, e.target.value)
            }
            className="w-20 p-1 border border-gray-300 rounded-md text-sm"
            min="0"
            max={expectedQty}
          />
        ) : (
          <span>{receivedQtyDisplay}</span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Receive Transfer ID: {transfer.id} (Stock No:{" "}
          {transfer.originalHeaderData?.stockNumber || "N/A"})
        </h3>
        <p className="mb-2">
          <strong className="font-semibold">From Location:</strong>
          {transfer.fromLocation}
        </p>
        <p className="mb-4">
          <strong className="font-semibold">To Location:</strong>
          {transfer.toLocation}
        </p>

        <h4 className="text-lg font-semibold mb-3 text-gray-700">Items:</h4>
        {itemsToReceive && itemsToReceive.length > 0 ? (
          <ul className="list-disc list-inside mb-6 space-y-2">
            {itemsToReceive.map((item, itemIndex) => {
              const displayableSerials = item.receivedSerialNumbers.filter(
                (sn) => sn.serialName
              );
              return (
                <li
                  key={item.id || itemIndex}
                  className="bg-orange-50 p-3 rounded-md"
                >
                  <p>
                    <strong className="font-medium">Product:</strong>{" "}
                    {item.pricelist?.product?.productName || "N/A"}
                    {item.pricelist?.color?.colorName &&
                      ` (${item.pricelist.color.colorName})`}
                  </p>
                  <p>{displayItemInfo(item)}</p>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <label className="font-medium text-gray-700">
                        Batangas Code:
                      </label>
                      <input
                        type="text"
                        className="w-28 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-150 ease-in-out"
                        value={item.editableBatangasItemCode}
                        onChange={(e) =>
                          handleBatangasItemCodeChange(item.id, e.target.value)
                        }
                      />
                    </div>

                    {/* Search Button to open the modal */}
                    <button
                      type="button"
                      onClick={() => handleOpenSearchModal(item.id)}
                      className="mt-2 sm:mt-0 inline-flex items-center px-1 py-1 border border-gray-300 bg-white text-sm rounded-md shadow-sm hover:bg-gray-100 active:scale-95 transition"
                      title="Search Item Code"
                    >
                      <FcSearch className="text-xl mr-1" />
                    </button>

                    {item.receiverPricelistId === 0 &&
                      item.editableBatangasItemCode !== "" && (
                        <span className="text-red-500 text-xs mt-1 sm:mt-0 sm:ml-3">
                          No matching ID found.
                        </span>
                      )}
                  </div>

                  <div className="text-sm text-gray-600 mt-2">
                    {item.hasSerials && displayableSerials.length > 0 && (
                      <strong className="font-medium">Serial Numbers:</strong>
                    )}
                    {item.hasSerials ? (
                      <ul className="list-none pl-4 mt-1 space-y-1">
                        {item.receivedSerialNumbers.length > 0
                          ? item.receivedSerialNumbers.map((sn) => {
                              if (!sn.serialName) {
                                // Skip if serial name is empty/null
                                return null;
                              }
                              const isMissing =
                                item.serialsToMarkAsMissingIds.includes(sn.id);
                              return (
                                <li
                                  key={sn.id}
                                  className={`flex items-center justify-between bg-white p-2 rounded-md shadow-sm ${
                                    isMissing ? "opacity-60" : ""
                                  }`}
                                >
                                  <span>
                                    {sn.serialName}
                                    {isMissing && (
                                      <span className="ml-2 text-xs font-semibold text-red-500">
                                        (Missing)
                                      </span>
                                    )}
                                  </span>
                                  {isMissing ? (
                                    <button
                                      onClick={() =>
                                        handleToggleSerialNumberStatus(
                                          item.id,
                                          sn.id,
                                          true // isCurrentlyMissing = true
                                        )
                                      }
                                      className="ml-3 px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 text-xs"
                                      title="Unmark Serial Number as Missing"
                                    >
                                      Unmark Missing
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleToggleSerialNumberStatus(
                                          item.id,
                                          sn.id,
                                          false // isCurrentlyMissing = false
                                        )
                                      }
                                      className="ml-3 px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-200 text-xs"
                                      title="Mark Serial Number as Missing"
                                    >
                                      Mark Missing
                                    </button>
                                  )}
                                </li>
                              );
                            })
                          : "No Serials Expected"}
                      </ul>
                    ) : (
                      "No Serial Numbers for this item."
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600 italic mb-6">
            No items associated with this transfer.
          </p>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
            disabled={isSubmittingApproval}
          >
            Cancel
          </button>
          <button
            onClick={checkAndDelete}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
            disabled={isSubmittingApproval}
          >
            Confirm Received
          </button>
        </div>
        {showConfirmWarning && itemWithMismatch && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h4 className="text-lg font-bold mb-4 text-orange-600">
                Quantity Mismatch Warning
              </h4>
              <p className="mb-4">
                The received quantity for{" "}
                <strong>
                  {itemWithMismatch.pricelist?.product?.productName || "N/A"}
                </strong>{" "}
                (Expected: {itemWithMismatch.quantity}, Received:{" "}
                {itemWithMismatch.effectivelyReceivedQty}) is less than the
                expected quantity.
              </p>
              <p className="mb-4">
                This item will be marked as partially received, and any
                unreceived serial numbers will be marked as 'Missing'.
              </p>
              <p className="mb-4">Are you sure you want to proceed?</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmWarning(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeletion}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning for Marking Serial as Missing (or changing quantity that affects serials) */}
        {showSerialDeletionWarning && serialDeletionWarningItem && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
              <h4 className="text-lg font-bold mb-4 text-orange-600">
                Confirm Status Change
              </h4>
              {serialDeletionProposedAction?.markAsMissingSerialId ? (
                <p className="mb-6">
                  You are about to mark the serial number "
                  <strong>
                    {serialDeletionWarningItem.receivedSerialNumbers.find(
                      (sn) =>
                        sn.id ===
                        serialDeletionProposedAction.markAsMissingSerialId
                    )?.serialName ||
                      `Serial ID: ${serialDeletionProposedAction.markAsMissingSerialId}`}
                  </strong>
                  " as 'Missing'. Are you sure?
                </p>
              ) : (
                <p className="mb-6">
                  You are changing the received quantity for "
                  <strong>
                    {serialDeletionWarningItem.pricelist?.product?.productName}
                  </strong>
                  ". This will result in{" "}
                  <strong>
                    {Math.max(
                      0,
                      serialDeletionWarningItem.receivedSerialNumbers.filter(
                        (sn) =>
                          !serialDeletionWarningItem.serialsToMarkAsMissingIds.includes(
                            sn.id
                          )
                      ).length -
                        (serialDeletionProposedAction?.newEffectiveReceivedQuantity ||
                          0)
                    )}
                  </strong>{" "}
                  additional serial number(s) being marked as 'Missing'. Are you
                  sure?
                </p>
              )}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCancelSerialDeletionWarning}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSerialDeletionWarning}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-200"
                >
                  Confirm Status Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Approval Modal --- */}
        {showApprovalModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                Final Approval
              </h3>
              <div className="space-y-4 mb-6">
                <hr className="my-4" />
                <div>
                  <label
                    htmlFor="receivedByNameInput"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Received By Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="receivedByNameInput"
                    value={receivedByNameInput}
                    onChange={(e) => setReceivedByNameInput(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter full name of receiver"
                  />
                </div>
                <div>
                  <label
                    htmlFor="approvedByNameInput"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Approved By Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="approvedByNameInput"
                    value={approvedByNameInput}
                    onChange={(e) => setApprovedByNameInput(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter full name of approver"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                  disabled={isSubmittingApproval}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 flex items-center"
                  disabled={isSubmittingApproval}
                >
                  {isSubmittingApproval ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit & Complete Transfer"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {showSearchModal && (
          <SearchItemModal
            products={allProducts}
            onSelectProduct={handleSelectItemFromSearch}
            onClose={() => setShowSearchModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AddRecievingTransfer;
