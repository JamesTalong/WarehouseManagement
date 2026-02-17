import React from "react";

const CustomerModal = ({ customer, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
        <p>
          <strong>ID:</strong> {customer.id}
        </p>
        <p>
          <strong>Name:</strong> {customer.customerName}
        </p>
        <p>
          <strong>Address:</strong> {customer.address}
        </p>
        <p>
          <strong>TIN Number:</strong> {customer.tinNumber}
        </p>
        <p>
          <strong>Mobile:</strong> {customer.mobileNumber}
        </p>
        <p>
          <strong>Business Style:</strong> {customer.businessStyle}
        </p>
        <p>
          <strong>RFID:</strong> {customer.rfid}
        </p>
        <p>
          <strong>Type:</strong> {customer.customerType}
        </p>
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CustomerModal;
