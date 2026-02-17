import React, { useState, useEffect } from "react";
import { FaTimes, FaUpload, FaTrash, FaBoxOpen } from "react-icons/fa";

// Adjusted reasons for PO Rejections (Vendor issues)
const REASON_OPTIONS = [
  "Damaged in transit",
  "Defective functionality",
  "Wrong item delivered",
  "Expired or near expiry",
  "Wrong packaging",
  "Does not match specifications",
  "Others",
];

const RejectItemModal = ({ isOpen, onClose, onSubmit, lineItem }) => {
  const [quantityToReject, setQuantityToReject] = useState(0);
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");

  // Reset state when modal opens or item changes
  useEffect(() => {
    if (isOpen && lineItem) {
      setQuantityToReject(0);
      setSelectedReason(REASON_OPTIONS[0]);
      setCustomReason("");
      setImageFile(null);
      setImagePreview(null);
      setError("");
    }
  }, [isOpen, lineItem]);

  if (!isOpen || !lineItem) return null;

  // --- FIX: LOGIC CHANGE ---
  // For Purchase Orders, we reject based on 'orderedQuantity'.
  // We use a fallback to 'quantityReceived' just in case.
  const maxReturnable =
    lineItem.orderedQuantity || lineItem.quantityReceived || 0;

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setQuantityToReject("");
      return;
    }
    const numValue = parseInt(value, 10);

    if (numValue > maxReturnable) {
      setError(`Cannot reject ${numValue}. Max qty: ${maxReturnable}`);
    } else if (numValue < 0) {
      setError("Quantity cannot be negative.");
    } else {
      setError("");
    }
    setQuantityToReject(numValue);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size too large (Max 2MB)");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const getFinalReason = () => {
    if (selectedReason === "Others") {
      return `Others: ${customReason}`;
    }
    return selectedReason;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (quantityToReject === "" || quantityToReject <= 0) {
      setError("Please enter a valid quantity to reject.");
      return;
    }
    if (quantityToReject > maxReturnable) {
      setError(`Quantity exceeds max amount (${maxReturnable}).`);
      return;
    }
    if (selectedReason === "Others" && !customReason.trim()) {
      setError("Please specify the reason for 'Others'.");
      return;
    }

    const finalReason = getFinalReason();

    if (imageFile) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = () => {
        // Send Base64 string without prefix
        const base64String = reader.result.split(",")[1];
        onSubmit(quantityToReject, finalReason, base64String);
      };
    } else {
      onSubmit(quantityToReject, finalReason, null);
    }
  };

  const inputStyles =
    "block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <RotateCcwIcon /> Reject Item
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Product Info Card */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
              <FaBoxOpen size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">
                Product Details
              </p>
              <p className="font-bold text-slate-800 text-base">
                {lineItem.productName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  Ordered: {lineItem.orderedQuantity} {lineItem.unitOfMeasure}
                </span>
                <span className="text-slate-400">
                  Price: ₱{lineItem.unitPrice?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Quantity to Reject <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={maxReturnable}
                value={quantityToReject}
                onChange={handleQuantityChange}
                className={`${inputStyles} ${error ? "border-red-500 ring-1 ring-red-500" : ""}`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-between mt-1">
              {error ? (
                <p className="text-red-600 text-xs font-bold">{error}</p>
              ) : (
                <span className="text-xs text-slate-400">
                  Max rejectable: {maxReturnable}
                </span>
              )}
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Reason for Rejection
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className={`${inputStyles} mb-2 bg-white`}
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {selectedReason === "Others" && (
              <textarea
                rows="2"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason..."
                className={inputStyles}
              />
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Proof / Image (Optional)
            </label>

            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaUpload className="text-slate-400 mb-1" />
                  <p className="text-xs text-slate-500">
                    Click to upload image
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-white text-red-600 p-1.5 rounded shadow-sm hover:bg-red-50"
                  title="Remove Image"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t bg-gray-50 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-white font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!!error || quantityToReject <= 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Icon Component
const RotateCcwIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-emerald-600"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export default RejectItemModal;
