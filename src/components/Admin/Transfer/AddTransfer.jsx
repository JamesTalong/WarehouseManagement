import React, { useEffect, useState, useMemo, useRef } from "react";
import Loader from "../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
// CHECK THIS IMPORT PATH: Ensure it points to your actual security.js file
import { domain } from "../../../security";
import {
  FaTimes,
  FaTrash,
  FaCalendarAlt,
  FaArrowRight,
  FaWarehouse,
  FaBarcode,
  FaBoxOpen,
} from "react-icons/fa";
import { Search, X, Package } from "lucide-react";
import SerialSelectionModal from "./SerialSelectionModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSelector } from "react-redux";
import { selectFullName } from "../../../redux/IchthusSlice";

// --- CUSTOM SEARCH FILTER COMPONENT ---
const InventorySearchFilter = ({
  data,
  inventoryMap,
  onSelect,
  disabled,
  placeholder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const wrapperRef = useRef(null);

  // Filter Logic
  const filteredData = useMemo(() => {
    if (disabled || !data) return [];

    // 1. Get available items (stock > 0)
    const availableItems = data.filter((p) => {
      const stockInfo = inventoryMap[p.id];
      return stockInfo && stockInfo.qty > 0;
    });

    // 2. Return ALL if search is empty
    if (!searchTerm.trim()) return availableItems;

    // 3. Filter by name/code
    const lowerTerm = searchTerm.toLowerCase();
    return availableItems.filter(
      (p) =>
        p.productName.toLowerCase().includes(lowerTerm) ||
        (p.itemCode && p.itemCode.toLowerCase().includes(lowerTerm))
    );
  }, [data, inventoryMap, searchTerm, disabled]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelectItem = (item) => {
    onSelect(item);
    setSearchTerm("");
    setIsSearchActive(false);
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Add Products{" "}
        {disabled && (
          <span className="text-gray-400 font-normal">
            - Select warehouse first
          </span>
        )}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search
            className={`h-4 w-4 ${
              disabled ? "text-gray-300" : "text-gray-400"
            }`}
          />
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          disabled={disabled}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchActive(true)}
          className={`w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none transition-all
            ${
              disabled
                ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            }`}
        />

        {searchTerm && !disabled && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isSearchActive && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredData.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {filteredData.map((p) => {
                  const stockInfo = inventoryMap[p.id];
                  return (
                    <li
                      key={p.id}
                      onClick={() => handleSelectItem(p)}
                      className="flex justify-between items-center px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                          <Package size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {p.productName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {p.itemCode}
                          </span>
                        </div>
                      </div>

                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {stockInfo?.qty} {stockInfo?.uom}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : "No items with stock available"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN MODAL ---
const TransferInventoryModal = ({ onClose, refreshData }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [productsMaster, setProductsMaster] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationInventoryMap, setLocationInventoryMap] = useState({});

  // Form State
  const [sendingLocation, setSendingLocation] = useState("");
  const [sendingLocationId, setSendingLocationId] = useState(null);

  const [receivingLocation, setReceivingLocation] = useState("");
  const [receivingLocationId, setReceivingLocationId] = useState(null);

  const [transferredDate, setTransferredDate] = useState(new Date());
  const [globalNotes, setGlobalNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Modal State
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [currentProductForSerial, setCurrentProductForSerial] = useState(null);
  const [availableSerialsForModal, setAvailableSerialsForModal] = useState([]);

  const fullName = useSelector(selectFullName);

  // 1. INITIAL LOAD (Fetch Products & Locations)
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        if (!domain)
          throw new Error("API Domain is undefined. Check security.js import.");

        const [prodRes, locRes] = await Promise.all([
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/Locations`),
        ]);

        setProductsMaster(Array.isArray(prodRes.data) ? prodRes.data : []);
        setLocations(Array.isArray(locRes.data) ? locRes.data : []);
      } catch (error) {
        console.error("Error loading master data:", error);
        toast.error(`Connection Error: ${error.message || "Network Error"}`);
      }
      setIsLoading(false);
    };
    fetchMasterData();
  }, []);

  // 2. FETCH INVENTORY when Location Changes
  useEffect(() => {
    const fetchLocationInventory = async () => {
      if (!sendingLocationId) {
        setLocationInventoryMap({});
        return;
      }

      setIsLoading(true);
      try {
        // Fetch inventory for the specific location ID
        const res = await axios.get(
          `${domain}/api/Products/stock-by-location/${sendingLocationId}`
        );
        const inventoryMap = {};

        if (Array.isArray(res.data)) {
          res.data.forEach((item) => {
            const existing = inventoryMap[item.productId];
            // Logic: Prefer Base Unit (1) or higher stock
            const isBaseUnit = item.conversionRate === 1;
            const hasMoreStock = existing
              ? item.stockCount > existing.qty
              : true;

            if (!existing || isBaseUnit || hasMoreStock) {
              inventoryMap[item.productId] = {
                qty: item.stockCount || 0,
                uom: item.uomName || "Units",
              };
            }
          });
        }
        setLocationInventoryMap(inventoryMap);
        setSelectedItems([]); // Clear cart when source changes
      } catch (error) {
        console.error("Error fetching inventory:", error);
        toast.error("Could not load inventory for this location.");
        setLocationInventoryMap({});
      }
      setIsLoading(false);
    };

    fetchLocationInventory();
  }, [sendingLocationId]);

  // 3. HANDLERS
  const handleLocationChange = (e) => {
    const selectedName = e.target.value;
    const locationObj = locations.find((l) => l.locationName === selectedName);

    setSendingLocation(selectedName);

    // Ensure we capture the ID correctly
    const locId = locationObj
      ? locationObj.id || locationObj.locationId || locationObj.Id
      : null;
    setSendingLocationId(locId);

    // Reset receiving location and cart
    setReceivingLocation("");
    setReceivingLocationId(null);
    setSelectedItems([]);
  };

  const handleReceivingLocationChange = (e) => {
    const selectedName = e.target.value;
    const locationObj = locations.find((l) => l.locationName === selectedName);

    setReceivingLocation(selectedName);

    const locId = locationObj
      ? locationObj.id || locationObj.locationId || locationObj.Id
      : null;
    setReceivingLocationId(locId);
  };

  const handleAddProduct = (product) => {
    if (selectedItems.find((p) => p.productId === product.id)) {
      toast.info("Product already added.");
      return;
    }

    const stockInfo = locationInventoryMap[product.id];
    const availableStock = stockInfo ? stockInfo.qty : 0;
    const currentUom = stockInfo ? stockInfo.uom : "Units";

    const newItem = {
      productId: product.id,
      productName: product.productName,
      itemCode: product.itemCode,
      hasSerial: product.hasSerial,
      quantity: 0,
      availableStock: availableStock,
      uom: currentUom,
      selectedSerialIds: [], // Empty defaults to Backend Auto-Pick
      notes: "",
      isManualSelection: false,
    };

    setSelectedItems((prev) => [newItem, ...prev]);
  };

  const handleRemoveProduct = (productId) => {
    setSelectedItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const handleNoteChange = (productId, val) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, notes: val } : item
      )
    );
  };

  // --- UPDATED: AUTO SERIAL SELECTION LOGIC ---
  const handleQuantityChange = async (productId, val) => {
    const intVal = parseInt(val) || 0;
    const item = selectedItems.find((i) => i.productId === productId);
    if (!item) return;

    // Check Max Stock
    if (intVal > item.availableStock) {
      toast.warning(`Max available is ${item.availableStock}`);
      return;
    }

    // 1. First, update the Quantity immediately (Visual Feedback)
    // We temporarily reset selectedSerialIds while we fetch the new ones
    setSelectedItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          return {
            ...i,
            quantity: intVal,
            selectedSerialIds: [], // Reset pending auto-fetch
            isManualSelection: false,
          };
        }
        return i;
      })
    );

    // 2. If the item has serials and quantity is > 0, AUTO-PICK immediately in background
    if (item.hasSerial && intVal > 0) {
      try {
        // Fetch available serials for this product/location
        const res = await axios.get(
          `${domain}/api/SerialNumbers/available/${productId}?locationName=${sendingLocation}`
        );

        const availableSerials = res.data || [];

        // Logic: Take the first N items (FIFO/Auto-pick)
        const autoPicked = availableSerials.slice(0, intVal);

        // Extract IDs
        const autoPickedIds = autoPicked.map((s) => s.id || s.Id);

        // Update the item state with these specific IDs
        setSelectedItems((prev) =>
          prev.map((i) => {
            if (i.productId === productId) {
              return {
                ...i,
                // Ensure selectedSerialIds matches the fetched IDs
                selectedSerialIds: autoPickedIds,
                // Mark as manual selection so the UI turns blue/shows "Manual Selection"
                isManualSelection: true,
              };
            }
            return i;
          })
        );
      } catch (error) {
        console.error("Auto-pick error:", error);
      }
    }
  };

  // Open Modal to Manually Select Serials (If user wants to override)
  const openSerialModal = async (item) => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${domain}/api/SerialNumbers/available/${item.productId}?locationName=${sendingLocation}`
      );

      setAvailableSerialsForModal(res.data || []);
      setCurrentProductForSerial(item);
      setIsSerialModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch serial numbers.");
    } finally {
      setIsLoading(false);
    }
  };

  // Called when closing the Serial Modal with selection
  const handleSaveManualSerials = (productId, selectedSerialIds) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            selectedSerialIds: selectedSerialIds,
            quantity: selectedSerialIds.length,
            isManualSelection: true,
          };
        }
        return item;
      })
    );
    setIsSerialModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!transferredDate) return toast.error("Date is required.");
    if (!sendingLocationId || !receivingLocationId)
      return toast.error("Both Sending and Receiving locations are required.");

    // Validate Items
    const invalidItems = selectedItems.filter((i) => i.quantity <= 0);
    if (invalidItems.length > 0) {
      return toast.error("All items must have a quantity greater than 0.");
    }

    // Construct Payload for Controller
    const payload = {
      releaseBy: fullName,
      status: "In Transit",
      fromLocationId: parseInt(sendingLocationId),
      fromLocationName: sendingLocation,
      toLocationId: parseInt(receivingLocationId),
      toLocationName: receivingLocation,
      transferredDate: transferredDate.toISOString(),
      notes: globalNotes,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        // If empty, backend does FIFO. If populated, backend validates specific IDs.
        serialNumberIds: item.selectedSerialIds || [],
        notes: item.notes,
      })),
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`${domain}/api/Transfers`, payload);

      toast.success(
        response.data.message || "Transfer initiated successfully."
      );
      if (refreshData) refreshData();
      onClose();
    } catch (error) {
      console.error("Submit Error:", error);
      const msg =
        error.response?.data?.message || "Network Error: Transfer failed.";
      const detail = error.response?.data?.errors
        ? JSON.stringify(error.response.data.errors)
        : "";

      toast.error(`${msg} ${detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
      <div className="bg-white w-11/12 max-w-7xl rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-gray-200">
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <FaBoxOpen className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Transfer Inventory
              </h2>
              <p className="text-xs text-gray-500">
                Move products between warehouses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader />
            </div>
          )}

          {/* Config Area */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
              {/* Left: Date & Source */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Transferred Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={transferredDate}
                      onChange={(date) => setTransferredDate(date)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm"
                      dateFormat="MMMM d, yyyy"
                    />
                    <FaCalendarAlt className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Sending Warehouse <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={sendingLocation}
                      onChange={handleLocationChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm bg-white cursor-pointer"
                    >
                      <option value="" disabled>
                        Select Source Location
                      </option>
                      {locations.map((loc) => (
                        <option
                          key={loc.id || loc.locationName}
                          value={loc.locationName}
                        >
                          {loc.locationName}
                        </option>
                      ))}
                    </select>
                    <FaWarehouse className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex flex-col items-center justify-center h-full pt-8">
                <div className="p-3 bg-gray-50 rounded-full text-gray-400 border border-gray-200">
                  <FaArrowRight />
                </div>
              </div>

              {/* Right: Destination & Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Transfer Notes
                  </label>
                  <textarea
                    value={globalNotes}
                    onChange={(e) => setGlobalNotes(e.target.value)}
                    placeholder="Reason for transfer, etc."
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm resize-none"
                    rows={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Receiving Warehouse <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={receivingLocation}
                      onChange={handleReceivingLocationChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm bg-white disabled:bg-gray-50"
                      disabled={!sendingLocation}
                    >
                      <option value="" disabled>
                        Select Destination Location
                      </option>
                      {locations
                        .filter((l) => l.locationName !== sendingLocation)
                        .map((loc) => (
                          <option
                            key={loc.id || loc.locationName}
                            value={loc.locationName}
                          >
                            {loc.locationName}
                          </option>
                        ))}
                    </select>
                    <FaWarehouse className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-4 animate-fadeIn">
            {/* SEARCH COMPONENT */}
            <InventorySearchFilter
              data={productsMaster}
              inventoryMap={locationInventoryMap}
              onSelect={handleAddProduct}
              disabled={!sendingLocation}
              placeholder={
                sendingLocation
                  ? "Search products..."
                  : "Select source warehouse first"
              }
            />

            {/* TABLE */}
            {selectedItems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                        Available
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-56">
                        Transfer Qty
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-6 py-4 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {selectedItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                              <FaBoxOpen />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {item.productName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {item.itemCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.availableStock} {item.uom}
                          </span>
                        </td>

                        {/* --- UPDATED TABLE CELL FOR QUANTITY --- */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={item.availableStock}
                              value={item.quantity === 0 ? "" : item.quantity}
                              // UPDATED: No readOnly here. Logic moved to handleQuantityChange
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.productId,
                                  e.target.value
                                )
                              }
                              className={`w-20 px-2 py-1.5 border rounded-md text-center text-sm outline-none transition-colors
                                ${
                                  item.isManualSelection
                                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-bold"
                                    : "border-gray-300"
                                }
                              `}
                              placeholder="0"
                            />
                            {/* Barcode button remains if user wants to override auto-selection */}
                            {item.hasSerial && (
                              <button
                                onClick={() => openSerialModal(item)}
                                title="Pick Specific Serial Numbers"
                                className={`p-2 rounded-md transition-colors ${
                                  item.isManualSelection
                                    ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                                    : "text-gray-500 bg-gray-100 hover:bg-orange-100 hover:text-orange-600"
                                }`}
                              >
                                <FaBarcode />
                              </button>
                            )}
                          </div>
                          {item.quantity <= 0 && (
                            <p className="text-[10px] text-red-400 text-center mt-1">
                              Required
                            </p>
                          )}
                          {item.isManualSelection && (
                            <p className="text-[10px] text-indigo-600 text-center mt-1 font-semibold">
                              {item.selectedSerialIds?.length > 0
                                ? "Auto Selected"
                                : "Manual Selection"}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) =>
                              handleNoteChange(item.productId, e.target.value)
                            }
                            className="block w-full border-gray-300 rounded-md text-sm p-2 bg-gray-50 focus:bg-white outline-none"
                            placeholder="Optional note..."
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleRemoveProduct(item.productId)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {selectedItems.length === 0 && sendingLocation && (
              <div className="py-12 text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
                <FaBoxOpen className="text-4xl mb-3 opacity-20 mx-auto" />
                <p className="text-base font-medium text-gray-500">
                  Your transfer list is empty.
                </p>
                <p className="text-sm">Search above to add items.</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 bg-white border-t border-gray-200 flex justify-end items-center gap-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !sendingLocationId ||
              !receivingLocationId ||
              selectedItems.length === 0 ||
              selectedItems.some((i) => i.quantity <= 0)
            }
            className="px-8 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg shadow-lg hover:from-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Submit Transfer"}
          </button>
        </div>
      </div>

      {isSerialModalOpen && currentProductForSerial && (
        <SerialSelectionModal
          product={currentProductForSerial}
          availableSerials={availableSerialsForModal}
          previouslySelectedIds={currentProductForSerial.selectedSerialIds}
          onClose={() => setIsSerialModalOpen(false)}
          onSave={(ids) =>
            handleSaveManualSerials(currentProductForSerial.productId, ids)
          }
        />
      )}
    </div>
  );
};

export default TransferInventoryModal;
