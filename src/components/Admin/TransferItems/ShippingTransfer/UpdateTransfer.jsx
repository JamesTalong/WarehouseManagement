import React, { useState, useEffect } from "react";

const UpdateTransfer = ({ transfer, onClose, onUpdate }) => {
  const [headerData, setHeaderData] = useState({
    stockNumber: transfer.originalHeaderData.stockNumber,
    fromTransfer: transfer.originalHeaderData.fromTransfer,
    fromDate: transfer.originalHeaderData.fromDate,
    fromBranch: transfer.originalHeaderData.fromBranch,
    toTransfer: transfer.originalHeaderData.toTransfer,
    toDate: transfer.originalHeaderData.toDate,
    toBranch: transfer.originalHeaderData.toBranch,
    date: transfer.originalHeaderData.date,
    checkBy_Name: transfer.originalHeaderData.checkBy_Name,
    receivedBy_Name: transfer.originalHeaderData.receivedBy_Name,
    approvedBy_Name: transfer.originalHeaderData.approvedBy_Name,
    approvalCheckBy: transfer.originalHeaderData.approvalCheckBy,
    approvalReceivedBy: transfer.originalHeaderData.approvalReceivedBy,
    approvedBy: transfer.originalHeaderData.approvedBy,
    status_Transfer: transfer.originalHeaderData.status_Transfer,
    transferType: transfer.originalHeaderData.transferType,
  });

  const [detailItems, setDetailItems] = useState(
    transfer.items.map((item, i) => ({
      id: i, // Assuming each item has a unique ID
      batangasItemCode: parseInt(item.batangasItemCode, 10) || 0,
      malabonItemCode: parseInt(item.malabonItemCode, 10) || 0,
      stockNumber: transfer.originalHeaderData.stockNumber,
      itemDescription: item.itemDescription,
      amount: parseFloat(item.amount) || 0,
      reseller: parseFloat(item.reseller) || 0,
      vatInc: parseFloat(item.vatInc) || 0,
      quantity: parseInt(item.quantity, 10) || 0,
      remarks: item.remarks,
      serial: item.serial,
    }))
  );

  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeaderData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDetailChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newDetailItems = [...detailItems];
    newDetailItems[index] = {
      ...newDetailItems[index],
      [name]: type === "checkbox" ? checked : value,
    };
    setDetailItems(newDetailItems);
  };

  const handleUpdate = () => {
    if (!headerData.stockNumber) {
      alert("Stock Number is required.");
      return;
    }
    onUpdate(headerData, detailItems);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Update Stock Transfer (ID: {transfer.id})
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
        >
          &times;
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Header Fields */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              Transfer Header
            </h3>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                From Transfer:
              </label>
              <input
                type="text"
                name="fromTransfer"
                value={headerData.fromTransfer}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                From Branch:
              </label>
              <input
                type="text"
                name="fromBranch"
                value={headerData.fromBranch}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                To Transfer:
              </label>
              <input
                type="text"
                name="toTransfer"
                value={headerData.toTransfer}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                To Branch:
              </label>
              <input
                type="text"
                name="toBranch"
                value={headerData.toBranch}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Date:
              </label>
              <input
                type="datetime-local" // Changed to datetime-local
                name="date"
                value={
                  headerData.date
                    ? new Date(headerData.date).toISOString().slice(0, 16)
                    : ""
                } // Format for datetime-local
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Transfer Type:
              </label>
              <input
                type="text"
                name="transferType"
                value={headerData.transferType}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            {/* Add other header fields you want to make editable */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Checked By:
              </label>
              <input
                type="text"
                name="checkBy_Name"
                value={headerData.checkBy_Name}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Approved By:
              </label>
              <input
                type="text"
                name="approvedBy_Name"
                value={headerData.approvedBy_Name}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Received By:
              </label>
              <input
                type="text"
                name="receivedBy_Name"
                value={headerData.receivedBy_Name}
                onChange={handleHeaderChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            {/* Checkboxes for approval status */}
            <div className="mb-3 flex items-center">
              <input
                type="checkbox"
                name="approvalCheckBy"
                checked={headerData.approvalCheckBy}
                onChange={handleHeaderChange}
                className="mr-2 leading-tight"
              />
              <label className="text-gray-700 text-sm font-bold">
                Approval Check By
              </label>
            </div>
            <div className="mb-3 flex items-center">
              <input
                type="checkbox"
                name="approvalReceivedBy"
                checked={headerData.approvalReceivedBy}
                onChange={handleHeaderChange}
                className="mr-2 leading-tight"
              />
              <label className="text-gray-700 text-sm font-bold">
                Approval Received By
              </label>
            </div>
            <div className="mb-3 flex items-center">
              <input
                type="checkbox"
                name="approvedBy"
                checked={headerData.approvedBy}
                onChange={handleHeaderChange}
                className="mr-2 leading-tight"
              />
              <label className="text-gray-700 text-sm font-bold">
                Approved By
              </label>
            </div>
            <div className="mb-3 flex items-center">
              <input
                type="checkbox"
                name="status_Transfer"
                checked={headerData.status_Transfer}
                onChange={handleHeaderChange}
                className="mr-2 leading-tight"
              />
              <label className="text-gray-700 text-sm font-bold">
                Status Transfer (Completed)
              </label>
            </div>
          </div>

          {/* Detail Items */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              Transfer Details
            </h3>
            {detailItems.length === 0 ? (
              <p className="text-gray-600 italic">
                No detail items to display.
              </p>
            ) : (
              detailItems.map((detail, index) => (
                <div
                  key={index} // Consider using a stable ID if available for each detail item
                  className="border p-4 rounded-md mb-4 bg-gray-50"
                >
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Item {index + 1}: {detail.itemDescription || "N/A"}
                  </h4>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Batangas Item Code:
                    </label>
                    <input
                      type="text"
                      name="batangasItemCode"
                      value={detail.batangasItemCode}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Malabon Item Code:
                    </label>
                    <input
                      type="text"
                      name="malabonItemCode"
                      value={detail.malabonItemCode}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Item Description:
                    </label>
                    <input
                      type="text"
                      name="itemDescription"
                      value={detail.itemDescription}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={detail.quantity}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Serial:
                    </label>
                    <input
                      type="text"
                      name="serial"
                      value={detail.serial}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Amount:
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={detail.amount}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Reseller:
                    </label>
                    <input
                      type="number"
                      name="reseller"
                      value={detail.reseller}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      VAT Inclusive:
                    </label>
                    <input
                      type="number"
                      name="vatInc"
                      value={detail.vatInc}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-bold mb-1">
                      Remarks:
                    </label>
                    <input
                      type="text"
                      name="remarks"
                      value={detail.remarks}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateTransfer;
