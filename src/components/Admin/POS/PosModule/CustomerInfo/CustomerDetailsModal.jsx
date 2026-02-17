// CustomerDetailsModal.js
import React from "react";

const CustomerDetailsModal = ({ customerDetails, onClose }) => {
  if (!customerDetails) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {customerDetails.customerName} Details
        </h2>
        <p>
          <strong>Address:</strong> {customerDetails.address}
        </p>
        <p>
          <strong>TIN Number:</strong> {customerDetails.tinNumber}
        </p>
        <p>
          <strong>Mobile Number:</strong> {customerDetails.mobileNumber}
        </p>
        <p>
          <strong>Business Style:</strong> {customerDetails.businessStyle}
        </p>
        <p>
          <strong>RFID:</strong> {customerDetails.rfid}
        </p>
        <p>
          <strong>Customer Type:</strong> {customerDetails.customerType}
        </p>

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
