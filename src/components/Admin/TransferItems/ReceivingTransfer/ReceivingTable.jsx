import { useState, useEffect } from "react";
import axios from "axios";
import { domain } from "../../../../security";

const ReceivingTable = ({ refreshTrigger }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true); // Ensure loading is true when re-fetching
      const apiUrl = `${domain}/api/ReceivedTransfers`;
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setTransfers(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [refreshTrigger]);

  const formatDate = (dateString) => {
    // ... (your existing formatDate function)
    if (!dateString) return "N/A";
    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete transfer ID ${id}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const apiUrl = `${domain}/api/ReceivedTransfers/${id}`;
      await axios.delete(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setTransfers((prevTransfers) => prevTransfers.filter((t) => t.id !== id));
      alert(`Transfer ID ${id} successfully deleted.`);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Failed to delete transfer ID ${id}.`);
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Handler for "Found in FromLocation"
  const handleFoundInFromLocation = async (
    completedTransferId,
    completedTransferItemId,
    completedTransferSerialId,
    serialNumberValue
  ) => {
    if (
      !window.confirm(
        `Mark serial ${serialNumberValue} as 'Found in FromLocation'? This will update its original stock status.`
      )
    )
      return;
    console.log({
      completedTransferId,
      completedTransferItemId,
      completedTransferSerialId,
      serialNumberValue,
    });
    try {
      const apiUrl = `${domain}/api/CompletedTransfers/${completedTransferId}/items/${completedTransferItemId}/serials/${completedTransferSerialId}/receive`;
      await axios.put(
        apiUrl,
        { serialNumberValue }, // This is the DTO for the backend
        { headers: { "Content-Type": "application/json" } }
      );
      alert(
        `Serial ${serialNumberValue} successfully marked as 'Found at Origin'.`
      );
      // Re-fetch data to show updated status
      fetchTransfers(); // Or smarter update: fetch only the modified transfer
    } catch (err) {
      console.error("Error marking serial as Found at Origin:", err);
      alert(
        `Failed to update serial ${serialNumberValue}: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Handler for "Found in ToLocation"
  const handleFoundInToLocation = async (
    completedTransferId,
    completedTransferItemId,
    completedTransferSerialId,
    serialNumberValue /*, receiverPricelistId, receivedDate - backend can get these from IDs */
  ) => {
    if (
      !window.confirm(
        `Mark serial ${serialNumberValue} as 'Found in ToLocation'? This will receive it and add it to batches.`
      )
    )
      return;

    console.log({
      completedTransferId,
      completedTransferItemId,
      completedTransferSerialId,
      serialNumberValue,
    });
    try {
      const apiUrl = `${domain}/api/CompletedTransfers/${completedTransferId}/items/${completedTransferItemId}/serials/markFoundInToLocation`;
      // The DTO requires completedTransferSerialId (PK of CompletedTransferSerial) and SerialNumberValue (the string identifier)
      await axios.post(
        apiUrl,
        { completedTransferSerialId, serialNumberValue },
        { headers: { "Content-Type": "application/json" } }
      );
      alert(
        `Serial ${serialNumberValue} successfully marked as 'Found at ToLocation' and batched.`
      );
      // Re-fetch data to show updated status
      fetchTransfers(); // Or smarter update: fetch only the modified transfer
    } catch (err) {
      console.error("Error marking serial as Found at ToLocation:", err);
      alert(
        `Failed to update serial ${serialNumberValue}: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Function to calculate missing serials for a transfer
  const getMissingSerialsCount = (transfer) => {
    let missingCount = 0;
    transfer.items.forEach((item) => {
      item.serialNumbers.forEach((serial) => {
        if (serial.status !== "Received") {
          // Assuming 'Received' is the status for found items
          missingCount++;
        }
      });
    });
    return missingCount;
  };

  if (loading)
    return <p className="text-center text-gray-600">Loading transfers...</p>;
  if (error)
    return (
      <p className="text-center text-red-500">
        Error loading transfers: {error.message}
      </p>
    );
  if (transfers.length === 0)
    return (
      <p className="text-center text-gray-600">No received transfers found.</p>
    );

  return (
    <div className="container mx-auto mt-8 p-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
        Item Received
      </h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider"></th>
              {[
                "Transfer ID",
                "Release Date",
                "From Location",
                "To Location",
                "Total Items",
                "Status",
                "Release By",
                "Receive By",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfers.map((transfer) => {
              const missingSerialsCount = getMissingSerialsCount(transfer);
              return (
                <>
                  <tr key={transfer.id} className="hover:bg-gray-100">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleRowExpansion(transfer.id)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none flex items-center" // Added flex and items-center
                      >
                        {expandedRowId === transfer.id ? "▼" : "►"}{" "}
                        {/* Simple arrows */}
                        {missingSerialsCount > 0 && (
                          <span
                            className="ml-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                            title={`${missingSerialsCount} missing serial(s)`}
                          >
                            {missingSerialsCount}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">{transfer.transferId}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {formatDate(transfer.transferredDate)}
                    </td>
                    <td className="py-3 px-4">{transfer.fromLocation}</td>
                    <td className="py-3 px-4">{transfer.toLocation}</td>
                    <td className="py-3 px-4">{transfer.items.length}</td>
                    <td className="py-3 px-4">{transfer.status}</td>
                    <td className="py-3 px-4">{transfer.releaseBy}</td>
                    <td className="py-3 px-4">{transfer.receiveBy}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(transfer.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedRowId === transfer.id && (
                    <tr
                      id={`details-row-${transfer.id}`}
                      className="bg-gray-50"
                    >
                      <td colSpan="10" className="py-4 px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">
                              Product Details:
                            </h4>
                            {transfer.items?.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                {transfer.items.map((item, index) => (
                                  <li key={item.id || index}>
                                    <strong>Product:</strong>{" "}
                                    {item.pricelist?.product?.productName ||
                                      "N/A"}
                                    {item.pricelist?.color?.colorName &&
                                      ` (${item.pricelist.color.colorName})`}
                                    {" - "}
                                    <strong>Qty:</strong> {item.quantity}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600 italic">
                                No items associated.
                              </p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">
                              Serial Numbers:
                            </h4>
                            {transfer.items?.some(
                              (item) => item.serialNumbers?.length > 0
                            ) ? (
                              <div className="space-y-3">
                                {transfer.items.map(
                                  (item, itemIndex) =>
                                    item.serialNumbers?.length > 0 && (
                                      <div key={item.id || `item-${itemIndex}`}>
                                        <p className="font-medium text-gray-700 text-sm mb-1">
                                          {item.pricelist?.product
                                            ?.productName || "Product"}
                                          :
                                        </p>
                                        <ul className="list-inside text-sm text-gray-600 space-y-1">
                                          {item.serialNumbers.map(
                                            (serial, serialIndex) => {
                                              const isMissing =
                                                serial.status !== "Received";

                                              return (
                                                <li
                                                  key={
                                                    serial.id ||
                                                    `serial-${itemIndex}-${serialIndex}`
                                                  }
                                                  className="py-1"
                                                >
                                                  <span>
                                                    - ID:{" "}
                                                    {serial.serialNumberId ||
                                                      "N/A"}
                                                  </span>
                                                  {isMissing ? (
                                                    <div
                                                      style={{
                                                        marginLeft: "10px",
                                                        display: "inline-block",
                                                      }}
                                                    >
                                                      <span className="text-red-500 italic ml-1">
                                                        {" "}
                                                        (Status:{" "}
                                                        {serial.status ||
                                                          "Unknown"}
                                                        )
                                                      </span>
                                                      <button
                                                        onClick={() =>
                                                          handleFoundInFromLocation(
                                                            transfer.id, // completedTransferId
                                                            item.id, // completedTransferItemId
                                                            serial.id, // completedTransferSerialId (PK of this record)
                                                            serial.serialNumberId // serial value string
                                                          )
                                                        }
                                                        className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium px-2 py-1 rounded"
                                                      >
                                                        Found in{" "}
                                                        {transfer.fromLocation}
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleFoundInToLocation(
                                                            transfer.id, // completedTransferId
                                                            item.id, // completedTransferItemId
                                                            serial.id, // completedTransferSerialId (PK of this record)
                                                            serial.serialNumberId
                                                          )
                                                        }
                                                        className="ml-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-2 py-1 rounded"
                                                      >
                                                        Found in{" "}
                                                        {transfer.toLocation}
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <span className="text-green-500 ml-2">
                                                      (Status:
                                                      {serial.status || "N/A"})
                                                    </span>
                                                  )}
                                                </li>
                                              );
                                            }
                                          )}
                                        </ul>
                                      </div>
                                    )
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600 italic">
                                No serial numbers for this transfer.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceivingTable;
