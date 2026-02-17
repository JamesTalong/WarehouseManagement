import React, { useState } from "react";
import { faTimes, faRecycle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const RevertTransactionModal = ({
  isOpen,
  onClose,
  onConfirm,
  transactionId,
}) => {
  const [returnCondition, setReturnCondition] = useState("GOOD");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(transactionId, returnCondition);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faRecycle} /> Void Transaction #
            {transactionId}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            You are about to void this transaction. The items will be returned
            to inventory.
            <br />
            <br />
            <strong>What is the condition of the returned items?</strong>
          </p>

          <div className="flex flex-col gap-3">
            <label
              className={`border-2 p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                returnCondition === "GOOD"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="condition"
                value="GOOD"
                checked={returnCondition === "GOOD"}
                onChange={() => setReturnCondition("GOOD")}
                className="h-5 w-5 text-green-600"
              />
              <div>
                <span className="block font-bold text-gray-800">
                  Returned Good
                </span>
                <span className="text-xs text-gray-500">
                  Item is sellable (Available)
                </span>
              </div>
            </label>

            <label
              className={`border-2 p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                returnCondition === "BAD"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="condition"
                value="BAD"
                checked={returnCondition === "BAD"}
                onChange={() => setReturnCondition("BAD")}
                className="h-5 w-5 text-red-600"
              />
              <div>
                <span className="block font-bold text-gray-800">
                  Returned Bad
                </span>
                <span className="text-xs text-gray-500">
                  Item is damaged/broken (Not Available)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md"
          >
            Confirm Void
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevertTransactionModal;
