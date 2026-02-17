import React, { useState, useEffect } from "react";
import { FaTimes, FaShieldAlt } from "react-icons/fa";

const DiscountModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentType,
  currentValue,
}) => {
  const [step, setStep] = useState(1); // Step 1: Approval, Step 2: Data Entry
  const [tempType, setTempType] = useState("fixed");
  const [tempValue, setTempValue] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1); // Always start with approval question
      setTempType(currentType || "fixed");
      setTempValue(currentValue || "");
    }
  }, [isOpen, currentType, currentValue]);

  if (!isOpen) return null;

  const handleApproval = () => {
    setStep(2); // Move to data entry
  };

  const handleApply = () => {
    onConfirm(tempType, tempValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
        {/* Header with Close Button */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {step === 1 ? "Management Approval" : "Discount Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* --- STEP 1: APPROVAL QUESTION --- */}
        {step === 1 && (
          <div className="space-y-6 text-center">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col items-center gap-2">
              <FaShieldAlt className="text-yellow-600 text-3xl" />
              <p className="text-sm text-yellow-800 font-semibold">
                Authorization Required
              </p>
            </div>

            <p className="text-gray-600 text-sm">
              Is this discount approved by the management?
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                No
              </button>
              <button
                onClick={handleApproval}
                className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition"
              >
                Yes, Approved
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: DATA ENTRY --- */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Discount Type
              </label>
              <select
                value={tempType}
                onChange={(e) => setTempType(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="fixed">Fixed Amount (₱)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Value
              </label>
              <input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleApply}
                disabled={!tempValue || tempValue <= 0}
                className="w-full py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition"
              >
                Apply Discount
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountModal;
