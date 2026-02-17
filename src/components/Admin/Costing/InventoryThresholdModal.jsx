import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../security"; // Adjust path to your security config

const InventoryThresholdModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [minStock, setMinStock] = useState(0);
  const [maxStock, setMaxStock] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      // Default to 0 if null
      setMinStock(product.minStock || 0);
      setMaxStock(product.maxStock || 0);
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use the ProductId (not the unique variant ID)
      await axios.put(
        `${domain}/api/products/${product.productId}/thresholds`,
        {
          minStock: parseFloat(minStock),
          maxStock: parseFloat(maxStock),
        },
      );
      toast.success("Inventory thresholds updated!");
      onSuccess(); // Refresh table data
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update thresholds.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Stock Warnings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &#x2715;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <p className="text-sm text-blue-800 font-medium">
              {product?.productName}
            </p>
            <p className="text-xs text-blue-600">{product?.uomName}</p>
          </div>

          {/* Minimum Stock Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Level (Reorder Point)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Alert when stock falls below this.
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Maximum Stock Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ceiling Level (Max Capacity)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Alert when stock exceeds this.
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maxStock}
              onChange={(e) => setMaxStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Thresholds"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryThresholdModal;
