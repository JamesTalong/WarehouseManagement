import React from "react";

const TransactionDetailsModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 font-mono text-sm">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">Ichthus Technology</h2>
          <p>Address: Malvar Batangas / Malabon</p>
          <p>Tel. (043) 341-9524/ 0968-5729481</p>
          <p>-------------------------</p>
        </div>
        <div className="space-y-1 mx-10">
          <p>Payment: ₱ {transaction.payment.toFixed(2)}</p>
          <p>Payment Type: {transaction.paymentType || "N/A"}</p>
          <p>Discount Type: {transaction.discountType}</p>
          <p>Discount Amount: ₱ {transaction.discountAmount.toFixed(2)}</p>
          <p>Total Items: {transaction.totalItems}</p>
          <p>Total Amount: ₱ {transaction.totalAmount.toFixed(2)}</p>
          <p>Change: ₱ {transaction.change.toFixed(2)}</p>
        </div>
        <div className="mt-4 text-center">
          <p>-------------------------</p>
          <p> purchase!</p>
          <p>
            Date: {new Date().toLocaleDateString()}{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
