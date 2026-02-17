import React, { useState } from "react";
import axios from "axios";
import { domain } from "../../../security";
import { toast } from "react-toastify";

const RecoverMissingModal = ({ transfer, item, onClose, onSuccess }) => {
  const [qtyToRecover, setQtyToRecover] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // The maximum we can recover is the amount missing
  const maxQty = item.missingQuantity || 0;

  const handleRecover = async (recoverToOrigin) => {
    // Validation
    if (qtyToRecover <= 0 || qtyToRecover > maxQty) {
      alert(`Please enter a quantity between 1 and ${maxQty}`);
      return;
    }

    // Determine the name based on which button was clicked
    const targetLocationName = recoverToOrigin
      ? transfer.fromLocation
      : transfer.toLocation;

    if (
      !window.confirm(
        `Confirm finding ${qtyToRecover} pcs of "${item.productName}" in ${targetLocationName}?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = `${domain}/api/ReceivedTransfers/${transfer.id}/items/${item.id}/recover`;

      const payload = {
        quantity: parseInt(qtyToRecover),
        recoverToOrigin: recoverToOrigin, // TRUE = From Location, FALSE = To Location
      };

      await axios.post(apiUrl, payload);

      toast.success(`Inventory updated at ${targetLocationName}`);
      onSuccess(); // Refresh the main table
      onClose(); // Close modal
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to recover items");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">
            Resolve Missing Items
          </h3>
          <p className="text-sm text-gray-500">
            Transfer #{transfer.id}: {transfer.fromLocation} ➔{" "}
            {transfer.toLocation}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Product:</strong> {item.productName}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Missing Quantity:</strong>{" "}
              <span className="text-red-600 font-bold text-lg">{maxQty}</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              How many did you find?
            </label>
            <input
              type="number"
              min="1"
              max={maxQty}
              value={qtyToRecover}
              onChange={(e) => setQtyToRecover(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">
            Where were they found?
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* BUTTON 1: Found in TO LOCATION (e.g., Malabon) */}
            <button
              onClick={() => handleRecover(false)}
              disabled={submitting}
              className="group bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:shadow-md"
            >
              <span className="text-green-700 font-bold text-sm">Found in</span>
              <span className="text-green-800 font-black text-base uppercase mt-1">
                {transfer.toLocation}
              </span>
              <span className="text-[10px] text-green-600 mt-1">
                (Arrived Successfully)
              </span>
            </button>

            {/* BUTTON 2: Found in FROM LOCATION (e.g., Batangas) */}
            <button
              onClick={() => handleRecover(true)}
              disabled={submitting}
              className="group bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:shadow-md"
            >
              <span className="text-blue-700 font-bold text-sm">Found in</span>
              <span className="text-blue-800 font-black text-base uppercase mt-1">
                {transfer.fromLocation}
              </span>
              <span className="text-[10px] text-blue-600 mt-1">
                (Left Behind / Returned)
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoverMissingModal;
