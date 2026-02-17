import React, { useState } from "react";
import { FaTags, FaTimes } from "react-icons/fa";
import DiscountModal from "./DiscountModal"; // Make sure path is correct

const TotalPos = ({
  payment,
  paymentType,
  totalQuantity,
  discountType,
  discountValue,
  discountAmount,
  change,
  onDiscountTypeChange,
  onDiscountValueChange,
  onPaymentChange,
  onPaymentTypeChange,
  adjustedTotalAmount,
  preparedBy,
  checkedBy,
  terms,
  onDateChange,
  onPreparedByChange,
  onCheckedByChange,
  onTermsChange,
  date,
  otherPaymentReason,
  onOtherPaymentReasonChange,
  hasVat,
  onHasVatChange,
  hasEwt,
  onHasEwtChange,
  vatAmount,
  ewtAmount,
  netOfVat,
}) => {
  // --- Local State ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Handlers ---
  const handlePaymentTypeSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "Others") {
      onPaymentTypeChange(`Others: ${otherPaymentReason || ""}`);
    } else {
      onPaymentTypeChange(selectedValue);
      if (onOtherPaymentReasonChange) {
        onOtherPaymentReasonChange("");
      }
    }
  };

  const handleOtherReasonInputChange = (e) => {
    const reason = e.target.value;
    if (onOtherPaymentReasonChange) {
      onOtherPaymentReasonChange(reason);
    }
    onPaymentTypeChange(`Others: ${reason}`);
  };

  // Discount Handlers
  const handleConfirmDiscount = (type, value) => {
    onDiscountTypeChange(type);
    onDiscountValueChange(value);
    setIsModalOpen(false);
  };

  const removeDiscount = () => {
    onDiscountTypeChange("");
    onDiscountValueChange("");
  };

  // Determine Balance Color
  const getChangeColor = () => {
    if (change < 0) return "text-red-600"; // Negative (Balance Due)
    if (change > 0) return "text-green-600"; // Positive (Change)
    return "text-gray-900"; // Zero
  };

  const showOtherPaymentInput =
    paymentType && paymentType.startsWith("Others:");
  const selectPaymentTypeValue =
    paymentType && paymentType.startsWith("Others:") ? "Others" : paymentType;

  return (
    <div className="w-full space-y-6 border-t pt-6 font-sans">
      {/* --- Discount Modal Component --- */}
      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDiscount}
        currentType={discountType}
        currentValue={discountValue}
      />

      {/* --- Section 1: Transaction Details --- */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">
          Transaction Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="group">
            <label className="block text-xs font-semibold text-gray-500 mb-1 group-focus-within:text-blue-600">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full p-2.5 bg-gray-50 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div className="group">
            <label className="block text-xs font-semibold text-gray-500 mb-1 group-focus-within:text-blue-600">
              Terms
            </label>
            <input
              list="termsOptions"
              value={terms}
              onChange={(e) => onTermsChange(e.target.value)}
              className="w-full p-2.5 bg-gray-50 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Select or type terms"
            />
            <datalist id="termsOptions">
              <option value="7 days" />
              <option value="15 days" />
              <option value="30 days" />
            </datalist>
          </div>
          <div className="group">
            <label className="block text-xs font-semibold text-gray-500 mb-1 group-focus-within:text-blue-600">
              Prepared By
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => onPreparedByChange(e.target.value)}
              className="w-full p-2.5 bg-gray-50 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Employee Name"
            />
          </div>
          <div className="group">
            <label className="block text-xs font-semibold text-gray-500 mb-1 group-focus-within:text-blue-600">
              Checked By
            </label>
            <input
              type="text"
              value={checkedBy}
              onChange={(e) => onCheckedByChange(e.target.value)}
              className="w-full p-2.5 bg-gray-50 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Supervisor Name"
            />
          </div>

          {/* Tax Toggles */}
          <div className="md:col-span-2 flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 cursor-not-allowed opacity-75">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={hasVat}
                  disabled
                  className="sr-only"
                />
                <div
                  className={`block w-10 h-6 rounded-full ${
                    hasVat ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                    hasVat ? "transform translate-x-4" : ""
                  }`}
                ></div>
              </div>
              <span className="text-xs font-bold text-gray-700">VAT (12%)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-not-allowed opacity-75">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={hasEwt}
                  onChange={(e) => onHasEwtChange(e.target.checked)}
                  className="sr-only"
                  disabled
                />
                <div
                  className={`block w-10 h-6 rounded-full transition ${
                    hasEwt ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                    hasEwt ? "transform translate-x-4" : ""
                  }`}
                ></div>
              </div>
              <span className="text-xs font-bold text-gray-700">EWT (1%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* --- Section 2: Payment Input (Combined) --- */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Payment
        </h3>
        <div className="flex shadow-sm rounded-md h-12">
          {/* Dropdown Left */}
          <div className="relative w-1/3 min-w-[120px]">
            <select
              value={selectPaymentTypeValue}
              onChange={handlePaymentTypeSelectChange}
              className="w-full h-full pl-3 pr-6 text-sm bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg focus:ring-0 focus:border-gray-400 outline-none text-gray-700 font-medium appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Method
              </option>
              <option value="Cash">Cash</option>
              <option value="Gcash">Gcash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit/Credit Card">Card</option>
              <option value="Cheque">Cheque</option>
              <option value="Others">Others</option>
            </select>
            {/* Arrow Icon */}
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Input Right */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 font-sans">₱</span>
            </div>
            <input
              type="number"
              value={payment}
              onChange={(e) => onPaymentChange(e.target.value)}
              className="w-full h-full pl-7 pr-3 text-lg font-mono text-gray-800 bg-white border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:z-10 outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Others Input - Shows only if needed */}
        {showOtherPaymentInput && (
          <input
            type="text"
            value={otherPaymentReason}
            onChange={handleOtherReasonInputChange}
            className="mt-2 w-full p-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 outline-none"
            placeholder="Specify payment details..."
          />
        )}
      </div>

      {/* --- Section 3: Compact Order Summary --- */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase">Summary</h3>

          {/* Button to Trigger Discount Modal */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition"
          >
            <FaTags className="text-[10px]" />
            {discountAmount > 0 ? "Edit Discount" : "Add Discount"}
          </button>
        </div>

        <div className="space-y-1 text-sm">
          {/* Quantity */}
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Items ({totalQuantity})</span>
          </div>

          {/* Taxes */}
          {(hasVat || hasEwt) && (
            <div className="flex flex-col space-y-1 pt-1">
              {hasVat && (
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>VAT (12%)</span>
                  <span>
                    {vatAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {hasEwt && (
                <div className="flex justify-between text-blue-500 text-xs">
                  <span>Less EWT (1%)</span>
                  <span>
                    -
                    {ewtAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Discount Display (Only if active) */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-red-500 text-xs font-medium pt-1">
              <div className="flex items-center gap-2">
                <span>
                  Discount{" "}
                  {discountType === "percentage" ? `(${discountValue}%)` : ``}
                </span>
                <button
                  onClick={removeDiscount}
                  className="text-gray-400 hover:text-red-600 transition"
                  title="Remove Discount"
                >
                  <FaTimes />
                </button>
              </div>
              <span>
                -{" "}
                {discountAmount.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Total Sales */}
          <div className="flex justify-between text-gray-800 font-bold">
            <span>Total</span>
            <span>
              {adjustedTotalAmount.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          </div>
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Paid</span>
            <span>
              {parseFloat(payment || 0).toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Change / Balance */}
          <div
            className={`flex justify-between items-center font-bold text-lg ${getChangeColor()}`}
          >
            <span>{change < 0 ? "Balance" : "Change"}</span>
            <span className="font-mono">
              {change.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalPos;
