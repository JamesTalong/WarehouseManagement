import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTimes, FaPlus, FaMinus, FaSave } from "react-icons/fa";
import { domain } from "../../../../security";

const StockAdjustmentModal = ({ item, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  // State for inputs
  const [adjustUnsold, setAdjustUnsold] = useState(0);
  const [adjustSold, setAdjustSold] = useState(0);

  const handleSave = async () => {
    if (adjustUnsold === 0 && adjustSold === 0) {
      toast.warning("No changes to save.");
      return;
    }

    setIsLoading(true);
    try {
      const payloadBase = {
        productId: item.productId,
        locationId: item.locationId, // Ensure your item has locationId
        uomId: item.uomId,
      };

      const requests = [];

      // 1. Request for UNSOLD adjustment
      if (adjustUnsold !== 0) {
        requests.push(
          axios.post(`${domain}/api/InventoryAdjustment/adjust`, {
            ...payloadBase,
            quantity: adjustUnsold,
            targetType: "Unsold",
          })
        );
      }

      // 2. Request for SOLD adjustment
      if (adjustSold !== 0) {
        requests.push(
          axios.post(`${domain}/api/InventoryAdjustment/adjust`, {
            ...payloadBase,
            quantity: adjustSold,
            targetType: "Sold",
          })
        );
      }

      await Promise.all(requests);
      toast.success("Stock updated successfully!");
      if (onSuccess) onSuccess(); // Refresh parent table
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data || "Failed to update stock.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Adjust Stock</h3>
            <p className="text-xs text-gray-500">{item.product}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Current Unit: <strong>{item.uomName}</strong> at{" "}
            <strong>{item.location}</strong>
          </div>

          {/* Unsold Control */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-teal-700">Unsold (Available)</p>
              <p className="text-xs text-gray-400">
                Current: {item.unsoldCount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdjustUnsold((p) => p - 1)}
                className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
              >
                <FaMinus size={12} />
              </button>

              <input
                type="number"
                value={adjustUnsold}
                onChange={(e) => setAdjustUnsold(Number(e.target.value))}
                className="w-16 text-center border rounded py-1 font-bold text-gray-700"
              />

              <button
                onClick={() => setAdjustUnsold((p) => p + 1)}
                className="p-2 rounded bg-teal-100 text-teal-600 hover:bg-teal-200"
              >
                <FaPlus size={12} />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Sold Control */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-700">Sold</p>
              <p className="text-xs text-gray-400">
                Current: {item.soldCount || 0}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdjustSold((p) => p - 1)}
                className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
              >
                <FaMinus size={12} />
              </button>

              <input
                type="number"
                value={adjustSold}
                onChange={(e) => setAdjustSold(Number(e.target.value))}
                className="w-16 text-center border rounded py-1 font-bold text-gray-700"
              />

              <button
                onClick={() => setAdjustSold((p) => p + 1)}
                className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
              >
                <FaPlus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 text-sm bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <FaSave /> Update Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
