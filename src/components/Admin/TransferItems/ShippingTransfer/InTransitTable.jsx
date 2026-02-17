import React, { useState, useEffect } from "react";
import axios from "axios";
import { domain } from "../../../../security";
import AddRecievingTransfer from "../ReceivingTransfer/AddRecievingTransfer";
import { useSelector } from "react-redux";
import { selectUserName } from "../../../../redux/IchthusSlice";

// Accept the new refreshTrigger prop
const InTransitTable = ({ refreshTrigger, onReceiveSuccess }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const fullName = useSelector(selectUserName);

  // Define fetchTransfers inside or outside, but make sure it's stable if outside
  const fetchTransfers = async () => {
    try {
      setLoading(true); // Set loading to true before fetching
      const apiUrl = `${domain}/api/Transfers`;
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
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
  }, [refreshTrigger]); // Add refreshTrigger to the dependency array

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600">Loading transfers...</p>;
  }

  if (error) {
    return (
      <p className="text-center text-red-500">
        Error loading transfers: {error.message}
      </p>
    );
  }

  if (transfers.length === 0) {
    return (
      <p className="text-center text-gray-600">No Awaiting Delivery found.</p>
    );
  }

  const handleRevert = async (id) => {
    const confirmRevert = window.confirm(
      `Are you sure you want to Cancel transfer ID ${id}?`
    );
    if (!confirmRevert) return;

    try {
      const apiUrl = `${domain}/api/Transfers/revert/${id}`;
      await axios.post(apiUrl, null, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setTransfers((prevTransfers) => prevTransfers.filter((t) => t.id !== id));
      alert(`Transfer ID ${id} successfully reverted.`);
      // Optionally trigger a refresh if the backend handles re-adding to awaiting delivery
      // triggerTransferHistoryRefresh();
    } catch (err) {
      console.error("Revert failed:", err);
      alert(`Failed to revert transfer ID ${id}.`);
    }
  };

  const openReceiveModal = (transfer) => {
    setSelectedTransfer(transfer);
    setIsModalOpen(true);
  };

  const closeReceiveModal = () => {
    setIsModalOpen(false);
    setSelectedTransfer(null);
    fetchTransfers();
  };

  const handleConfirmReceive = async (transfer, processedItems) => {
    try {
      const RecievedDate = new Date();
      const payloadForReceive = {
        transferId: transfer.id,
        fromLocation: transfer.fromLocation,
        toLocation: transfer.toLocation,
        status: "Completed",
        releaseBy: transfer.releaseBy,
        receiveBy: fullName,
        transferredDate: transfer.transferredDate,
        RecievedDate: RecievedDate.toISOString(),
        items: processedItems.map((item) => ({
          receiverPricelistId: item.receiverPricelistId,
          PricelistId: item.PricelistId,
          quantity: item.quantity,
          serialNumbers: item.serialNumbers.map((sn) => ({
            serialNumberId: sn.id,
            status: sn.status,
            serialName: sn.serialName,
          })),
        })),
      };
      console.log(
        "Final bulkData:",
        JSON.stringify(payloadForReceive, null, 2)
      );
      await axios.post(`${domain}/api/CompletedTransfers`, payloadForReceive);

      setTransfers((prevTransfers) =>
        prevTransfers.filter((t) => t.id !== transfer.id)
      );
      alert(`Transfer ID ${transfer.id} successfully Received.`);
      closeReceiveModal(); // This will now also trigger fetchTransfers
      if (onReceiveSuccess) {
        onReceiveSuccess(); // Trigger refresh for ReceivedTransfer table
      }
    } catch (err) {
      console.error(
        "Receive failed:",
        err.response ? err.response.data : err.message
      );
      alert(`Failed to receive transfer ID ${transfer.id}. Please try again.`);
    }
  };

  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
        Awaiting Delivery 2
      </h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-200">
            <tr>
              {[
                "Transfer ID",
                "Release date",
                "From Location",
                "To Location",
                "Total Items",
                "Status",
                "Release By",
                "Product Details",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-gray-100">
                <td className="py-3 px-4">{transfer.id}</td>
                <td className="py-3 px-4">
                  {formatDate(transfer.transferredDate)}
                </td>
                <td className="py-3 px-4">{transfer.fromLocation}</td>
                <td className="py-3 px-4">{transfer.toLocation}</td>
                <td className="py-3 px-4">{transfer.items.length}</td>
                <td className="py-3 px-4">{transfer.status}</td>
                <td className="py-3 px-4">{transfer.releaseBy}</td>

                <td className="py-3 px-4">
                  {transfer.items?.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {transfer.items.map((item, index) => (
                        <li key={item.id || index} className="mb-1">
                          <strong>Product:</strong>{" "}
                          {item.pricelist?.product?.productName || "N/A"}
                          {item.pricelist?.color?.colorName &&
                            ` (${item.pricelist.color.colorName})`}
                          {" - "}
                          <strong>Qty:</strong> {item.quantity}
                          <span>
                            {" - "}
                            <strong>SNs:</strong>{" "}
                            {item.pricelist?.serialNumbers?.length > 0
                              ? item.pricelist.serialNumbers
                                  .filter((sn) => sn.serialName !== "")
                                  .map((sn) => sn.serialName)
                                  .join(", ")
                              : "No Serial"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 italic">
                      No items associated with this transfer.
                    </p>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleRevert(transfer.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1 rounded mr-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => openReceiveModal(transfer)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1 rounded"
                  >
                    Item Received
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddRecievingTransfer
          transfer={selectedTransfer}
          onClose={closeReceiveModal}
          onConfirmReceive={handleConfirmReceive}
        />
      )}
    </div>
  );
};

export default InTransitTable;
