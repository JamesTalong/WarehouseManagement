import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  X,
  Search,
  Save,
  Hash,
  Calendar,
  Check,
  Package,
  AlertCircle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Adjust paths as needed
import { domain } from "../../../../security";
import Loader from "../../../loader/Loader";

const NewItemsModal = ({ isOpen, onClose, locationId, refreshData }) => {
  // --- State ---
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [statusName, setStatusName] = useState("Loading...");

  // Form Fields
  const [batchName] = useState("SYSTEM_ADJUSTMENT");
  const [batchDate, setBatchDate] = useState(new Date());
  const [inventoryStatusId, setInventoryStatusId] = useState("");

  // Logic
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [serials, setSerials] = useState({});

  // --- Fetch Data ---
  useEffect(() => {
    if (isOpen && locationId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [statusRes, productRes] = await Promise.all([
            axios.get(`${domain}/api/InventoryStatuses`),
            axios.get(`${domain}/api/Products/zero-stock/${locationId}`),
          ]);

          setProducts(productRes.data);

          const allStatuses = statusRes.data;
          // Logic: Prefer 'Refurbished', then 'Good', then 'Available'
          // (Adjust this logic based on your specific screenshot needs)
          const targetStatus = allStatuses.find(
            (s) =>
              s.name.toLowerCase() === "good" ||
              s.name.toLowerCase() === "available"
          );

          if (targetStatus) {
            setInventoryStatusId(targetStatus.id);
            setStatusName(targetStatus.name);
          } else if (allStatuses.length > 0) {
            setInventoryStatusId(allStatuses[0].id);
            setStatusName(allStatuses[0].name);
          } else {
            setStatusName("Unknown Status");
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to load data.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, locationId]);

  // --- Handlers ---
  const toggleProduct = (productId) => {
    const newSelection = new Set(selectedProductIds);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
      const newSerials = { ...serials };
      delete newSerials[productId];
      setSerials(newSerials);
    } else {
      newSelection.add(productId);
    }
    setSelectedProductIds(newSelection);
  };

  const handleSerialChange = (productId, value) => {
    setSerials((prev) => ({
      ...prev,
      [productId]: value.toUpperCase(),
    }));
  };

  const handleSubmit = async () => {
    if (!inventoryStatusId) return toast.warning("Status not defined.");
    if (selectedProductIds.size === 0)
      return toast.warning("No items selected.");

    const itemsToSubmit = [];
    let validationError = false;

    selectedProductIds.forEach((pid) => {
      const product = products.find((p) => p.id === pid);
      if (!product) return;

      let serialPayload = [];
      if (product.hasSerial) {
        const serialVal = serials[pid];
        if (!serialVal || serialVal.trim() === "") {
          toast.error(`Serial missing: ${product.productName}`);
          validationError = true;
          return;
        }
        serialPayload.push({ serialName: serialVal, isSold: false });
      }

      itemsToSubmit.push({
        name: batchName,
        batchDate: batchDate.toISOString(),
        productId: pid,
        locationId: locationId,
        inventoryStatusId: inventoryStatusId,
        quantity: 1,
        hasSerial: product.hasSerial,
        serialNumbers: serialPayload,
      });
    });

    if (validationError) return;

    try {
      setIsLoading(true);
      console.log("Final bulkData:", JSON.stringify(itemsToSubmit, null, 2));
      await axios.post(`${domain}/api/Batches/batchbulk`, itemsToSubmit);
      toast.success("Adjustment saved successfully.");
      if (refreshData) refreshData();
      onClose();
      setSelectedProductIds(new Set());
      setSerials({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.itemCode &&
        p.itemCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      {isLoading && <Loader />}

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* --- 1. Header --- */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-indigo-600" size={20} />
              Stock Adjustment (Zero-Stock)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Target Location:{" "}
              <span className="font-mono font-bold text-gray-700">
                {locationId}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- 2. Control Bar (Metadata) --- */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Batch Ref */}
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
              Batch Reference
            </label>
            <div className="relative group">
              <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={batchName}
                readOnly
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-600 font-medium focus:outline-none cursor-default shadow-sm"
              />
            </div>
          </div>

          {/* Date Picker (Custom Styled) */}
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
              Adjustment Date
            </label>
            <div className="relative w-full">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
              <DatePicker
                selected={batchDate}
                onChange={(date) => setBatchDate(date)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
                dateFormat="MMMM d, yyyy"
                popperPlacement="bottom-start"
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
              Inventory Status
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-bold text-sm shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              {statusName}
            </div>
          </div>
        </div>

        {/* --- 3. Product Selection Area --- */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          {/* Search Bar */}
          <div className="px-6 py-3 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-600">
              Select items to add:
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-72 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100/80 text-xs text-gray-500 uppercase border-b border-gray-200 sticky top-0 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 w-[60px] text-center">
                      <div className="sr-only">Select</div>
                    </th>
                    <th className="px-4 py-3">Product Details</th>
                    <th className="px-4 py-3 w-[100px] text-center">Unit</th>
                    <th className="px-4 py-3 w-[100px] text-center">Qty</th>
                    <th className="px-4 py-3 w-[300px]">Serial Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProductIds.has(product.id);
                    return (
                      <tr
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`group transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/60 hover:bg-indigo-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Checkbox Column */}
                        <td className="px-4 py-3 text-center relative">
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                          )}
                          <div
                            className={`w-5 h-5 mx-auto rounded border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "bg-white border-gray-300 text-transparent group-hover:border-gray-400"
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </td>

                        {/* Product Info */}
                        <td className="px-4 py-3">
                          <div
                            className={`font-bold transition-colors ${
                              isSelected ? "text-indigo-900" : "text-gray-800"
                            }`}
                          >
                            {product.productName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {product.itemCode && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {product.itemCode}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {product.brandId
                                ? `Brand #${product.brandId}`
                                : ""}
                            </span>
                          </div>
                        </td>

                        {/* UOM */}
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                          {product.uomName || "Unit"}
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-3 text-center">
                          {isSelected ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold shadow-sm">
                              1
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>

                        {/* Serial Input */}
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isSelected && product.hasSerial ? (
                            <div className="relative animate-in slide-in-from-left-2 duration-200">
                              <input
                                type="text"
                                placeholder="SCAN OR TYPE SERIAL"
                                className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase tracking-wider font-mono shadow-sm"
                                value={serials[product.id] || ""}
                                onChange={(e) =>
                                  handleSerialChange(product.id, e.target.value)
                                }
                                autoFocus
                              />
                            </div>
                          ) : isSelected ? (
                            <span className="text-xs text-gray-400 italic flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>{" "}
                              Non-Serialized
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProducts.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-400 bg-white"
                      >
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-500">
                          No zero-stock items found.
                        </p>
                        <p className="text-xs mt-1 text-gray-400">
                          Try adjusting your search query.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- 4. Footer --- */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {selectedProductIds.size}
            </span>
            <span className="text-sm font-medium text-gray-600">
              items selected
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors focus:ring-4 focus:ring-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedProductIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 disabled:shadow-none"
            >
              <Save size={18} />
              {isLoading ? "Saving..." : "Confirm Adjustment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewItemsModal;
