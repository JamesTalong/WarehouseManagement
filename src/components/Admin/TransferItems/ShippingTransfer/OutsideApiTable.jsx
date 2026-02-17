import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AddRecievingTransfer from "../ReceivingTransfer/AddRecievingTransfer";
import { useSelector } from "react-redux";
import { selectUserName } from "../../../../redux/IchthusSlice";
import { domain, domainMark } from "../../../../security";
import UpdateTransfer from "./UpdateTransfer"; // Ensure this import is correct

const OutsideApiTable = ({ refreshTrigger, onReceiveSuccess }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false); // Renamed for clarity
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false); // NEW state for update modal
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const fullName = useSelector(selectUserName);

  const [showOnlyBatangas, setShowOnlyBatangas] = useState(true);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headersResponse = await axios.get(
        `${domainMark}/api/StockTransferHeader`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const headersData = headersResponse.data;

      if (!Array.isArray(headersData)) {
        console.error(
          "API Error: StockTransferHeader did not return an array.",
          headersData
        );
        setTransfers([]);
        setError(new Error("Failed to fetch valid transfer header data."));
        setLoading(false);
        return;
      }

      let awaitingDeliveryHeaders = headersData.filter(
        (header) => header.status_Transfer === false
      );

      if (awaitingDeliveryHeaders.length === 0) {
        setTransfers([]);
        setLoading(false);
        return;
      }

      const combinedTransfersPromises = awaitingDeliveryHeaders.map(
        async (header) => {
          try {
            const detailsResponse = await axios.get(
              `${domainMark}/api/StockTransferDetails/ByStockNumber/${header.stockNumber}`,
              { headers: { "Content-Type": "application/json" } }
            );
            let detailsData = detailsResponse.data;

            if (!Array.isArray(detailsData)) {
              console.warn(
                `Details for stockNumber ${header.stockNumber} was not an array. Treating as no items.`,
                detailsData
              );
              detailsData = [];
            }

            // Fetch actual serial numbers
            let actualSerialsData = [];
            try {
              const serialsApiResponse = await axios.get(
                `${domainMark}/api/SerialNumberTransfer/stock/${header.stockNumber}`,
                { headers: { "Content-Type": "application/json" } }
              );
              if (Array.isArray(serialsApiResponse.data)) {
                actualSerialsData = serialsApiResponse.data;
              } else {
                console.warn(
                  `SerialNumberTransfer API for stockNumber ${header.stockNumber} did not return an array.`,
                  serialsApiResponse.data
                );
              }
            } catch (serialError) {
              console.error(
                `Failed to fetch serial numbers for stockNumber ${header.stockNumber}:`,
                serialError
              );
              // Continue without actual serials if this fetch fails
            }

            const uiItems = detailsData.map((detail) => {
              // Filter serial numbers for the current detail item
              // This assumes 'itemNumber' in serials links to 'malabonItemCode' or 'batangasItemCode'
              // Adjust this linking logic if it's different (e.g., if details have a unique item code that serials also reference)
              const itemSpecificSerials = actualSerialsData
                .filter(
                  (s) =>
                    s.itemNumber === detail.malabonItemCode ||
                    s.itemNumber === detail.batangasItemCode
                )
                .map((s) => s.serialNumberValue);

              return {
                id: detail.id, // USE THE UNIQUE ID FROM THE DETAIL OBJECT FOR THE KEY
                pricelist: {
                  // This structure seems for the modal, might not be fully used in table display
                  product: {
                    productName: detail.itemDescription || "N/A",
                  },
                  color: {
                    colorName: "N/A", // If you have color data, map it here
                  },
                  // The 'serialNumbers' in pricelist might need different handling for the modal.
                  // For display, we'll use 'actualSerialNumbers'
                  serialNumbers: detail.serial
                    ? [{ serialName: detail.serial, id: detail.serial }] // This was for the old way
                    : [],
                },
                quantity: detail.quantity,
                batangasItemCode: detail.batangasItemCode,
                malabonItemCode: detail.malabonItemCode,
                itemDescription: detail.itemDescription,
                amount: detail.amount,
                reseller: detail.reseller,
                vatInc: detail.vatInc,
                remarks: detail.remarks,
                serialIndicator: detail.serial, // Keep the "Yes"/"No" indicator if needed elsewhere
                actualSerialNumbers: itemSpecificSerials, // Store fetched actual serial numbers here

                PricelistId:
                  detail.malabonItemCode !== 0
                    ? detail.malabonItemCode
                    : detail.batangasItemCode,
                receiverPricelistId:
                  detail.malabonItemCode === 0
                    ? detail.batangasItemCode
                    : detail.malabonItemCode,
              };
            });

            return {
              id: header.stockNumber,
              transferredDate: header.date || header.fromDate,
              fromLocation: header.fromTransfer || header.fromBranch,
              toLocation: header.toTransfer || header.toBranch,
              items: uiItems,
              status: "Awaiting Delivery",
              releaseBy: header.checkBy_Name || header.approvedBy_Name || "N/A",
              originalHeaderData: header,
            };
          } catch (detailError) {
            console.error(
              `Failed to fetch or process details for stockNumber ${header.stockNumber}:`,
              detailError
            );
            return null; // Skip this transfer if details or serials fail catastrophically for it
          }
        }
      );

      let validTransfers = (
        await Promise.all(combinedTransfersPromises)
      ).filter((t) => t !== null && t.items); // Ensure items array exists

      if (showOnlyBatangas) {
        validTransfers = validTransfers.filter(
          (transfer) =>
            transfer.toLocation &&
            transfer.toLocation.toLowerCase().includes("batangas")
        );
      }

      setTransfers(validTransfers);
    } catch (err) {
      console.error("Error fetching transfers:", err);
      setError(err);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [domainMark, showOnlyBatangas]); // domain added as per original, though not used in this snippet directly

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers, refreshTrigger]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const handleDeleteTransfer = async (transferId) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete transfer ID ${transferId} and all its associated details? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${domainMark}/api/StockTransferDetails/DeleteByStockNumber/${transferId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(
        `Stock Transfer Details associated with stockNumber ${transferId} deleted.`
      );

      await axios.delete(
        `${domainMark}/api/StockTransferHeader/${transferId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(`Stock Transfer Header ${transferId} deleted.`);

      setTransfers((prevTransfers) =>
        prevTransfers.filter((t) => t.id !== transferId)
      );
      alert(`Transfer ${transferId} and its details successfully deleted.`);
    } catch (err) {
      console.error(
        `Failed to delete transfer ${transferId}:`,
        err.response ? err.response.data : err.message
      );
      alert(
        `Failed to delete transfer ${transferId}. Please check the console for more details.
          (Note: If details deletion failed, the header might still exist.)`
      );
    }
  };

  // --- Functions for Receive Modal ---
  const openReceiveModal = (transfer) => {
    setSelectedTransfer(transfer);
    setIsReceiveModalOpen(true); // Use receive modal state
  };

  const closeReceiveModal = () => {
    setIsReceiveModalOpen(false);
    setSelectedTransfer(null);
    fetchTransfers();
  };

  //   const handleConfirmReceive = async (transfer, processedItems) => {
  //     console.log("Processing items for receive:", processedItems);
  //     console.log("transfer", transfer);

  //     try {
  //       const receivedDate = new Date();
  //       const payloadForReceive = {
  //         transferId: transfer.id,
  //         fromLocation:
  //           transfer.originalHeaderData.fromBranch ||
  //           transfer.originalHeaderData.fromTransfer,
  //         toLocation:
  //           transfer.originalHeaderData.toBranch ||
  //           transfer.originalHeaderData.toTransfer,
  //         status: "Completed",
  //         releaseBy: transfer.releaseBy,
  //         receiveBy: fullName,
  //         transferredDate: transfer.transferredDate,
  //         receivedDate: receivedDate.toISOString(),
  //         items: processedItems.map((item) => ({
  //           receiverPricelistId: item.receiverPricelistId,
  //           PricelistId: item.PricelistId,
  //           quantity: item.quantity,
  //           serialNumbers: item.serialNumbers.map((sn) => ({
  //             serialNumberId: sn.serialNumberId,
  //             status: sn.status,
  //             serialName: sn.serialName,
  //           })),
  //         })),
  //       };

  //       console.log(
  //         "Final bulkData for /api/ReceivedTransfers:",
  //         JSON.stringify(payloadForReceive, null, 2)
  //       );

  //  //     await axios.post(`${domain}/api/ReceivedTransfers`, payloadForReceive);

  //       const updateHeaderPayload = {
  //         ...transfer.originalHeaderData,
  //         status_Transfer: true,
  //         receivedBy_Name: fullName,
  //         toDate: receivedDate.toISOString(),
  //       };

  //       // await axios.put(
  //       //   `${domainMark}/api/StockTransferHeader/${transfer.id}`,
  //       //   updateHeaderPayload
  //       // );

  //       setTransfers((prevTransfers) =>
  //         prevTransfers.filter((t) => t.id !== transfer.id)
  //       );
  //       alert(`Transfer ID ${transfer.id} successfully Received and Updated.`);
  //       closeReceiveModal();
  //       if (onReceiveSuccess) {
  //         onReceiveSuccess();
  //       }
  //     } catch (err) {
  //       console.error(
  //         "Receive failed:",
  //         err.response ? err.response.data : err.message
  //       );
  //       alert(`Failed to receive transfer ID ${transfer.id}. Please try again.`);
  //     }
  //   };

  // --- Functions for Update Modal ---
  const openUpdateModal = (transfer) => {
    setSelectedTransfer(transfer);
    setIsUpdateModalOpen(true); // Use update modal state
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedTransfer(null);
    fetchTransfers(); // Refresh after update modal closes
  };

  const handleUpdateTransfer = async (updatedHeader, updatedDetails) => {
    try {
      // 1. Update StockTransferHeader
      console.log("Updating header:", updatedHeader.stockNumber);
      console.log("Final bulkData:", JSON.stringify(updatedHeader, null, 2));
      await axios.put(
        `${domainMark}/api/StockTransferHeader/${updatedHeader.stockNumber}`,
        updatedHeader,
        { headers: { "Content-Type": "application/json" } }
      );

      // 2. Update StockTransferDetails using the new bulk-update endpoint
      console.log("Sending details for bulk update:", updatedDetails);
      console.log("Final bulkData:", JSON.stringify(updatedDetails, null, 2));
      await axios.put(
        `${domainMark}/api/StockTransferDetails/bulk-update/${updatedHeader.stockNumber}`,
        updatedDetails, // Sending the entire array of updated details
        { headers: { "Content-Type": "application/json" } }
      );

      alert(`Transfer ${updatedHeader.stockNumber} successfully updated.`);
      closeUpdateModal();
    } catch (err) {
      console.error(
        "Failed to update transfer:",
        err.response ? err.response.data : err.message
      );
      alert(
        `Failed to update transfer ${updatedHeader.stockNumber}. ${
          err.response?.data?.message || err.message
        }`
      );
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

  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
        Awaiting Delivery 1:{" "}
        {showOnlyBatangas ? "(Batangas Branch)" : "(All Branches)"}
      </h2>
      <div className="mb-4">
        <button
          onClick={() => setShowOnlyBatangas(!showOnlyBatangas)}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
            showOnlyBatangas
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {showOnlyBatangas ? "Show All Branches" : "Show Only Batangas"}
        </button>
      </div>

      {transfers.length === 0 ? (
        <p className="text-center text-gray-600">
          No Awaiting Delivery found for{" "}
          {showOnlyBatangas ? "Batangas Branch." : "all branches."}
        </p>
      ) : (
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
              {transfers.map((transfer) => {
                return (
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
                          {transfer.items.map(
                            (
                              item // item.id is now detail.id from API
                            ) => (
                              <li key={item.id} className="mb-1">
                                {" "}
                                {/* item.id is now unique (e.g., 1006, 1008) */}
                                <strong>Product:</strong>{" "}
                                {item.itemDescription || "N/A"}{" "}
                                <strong>Qty:</strong> {item.quantity}
                                {item.actualSerialNumbers &&
                                item.actualSerialNumbers.length > 0 ? (
                                  item.actualSerialNumbers.map(
                                    (sn, snIndex) => (
                                      <span key={snIndex}>
                                        {" "}
                                        {/* Key for map of SNs */}
                                        {" - "}
                                        <strong>SN:</strong> {sn}
                                      </span>
                                    )
                                  )
                                ) : item.serialIndicator === "Yes" ? ( // Fallback if no actual SNs but indicator is "Yes"
                                  <span>
                                    {" - "}
                                    <strong>SN:</strong> Required (not found)
                                  </span>
                                ) : (
                                  <span>{" - "}No SN</span> // If serialIndicator is "No" or not "Yes"
                                )}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600 italic">
                          No items associated with this transfer or details
                          failed to load.
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteTransfer(transfer.id)}
                        className="bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-3 py-1 rounded mr-2"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openReceiveModal(transfer)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1 rounded mr-2" // Added mr-2 for spacing
                      >
                        Item Received
                      </button>
                      <button
                        onClick={() => openUpdateModal(transfer)} // Use the new update modal function
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded" // Changed color for distinction
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Receive Modal */}
      {isReceiveModalOpen && selectedTransfer && (
        <AddRecievingTransfer
          transfer={selectedTransfer}
          onClose={closeReceiveModal}
          // onConfirmReceive={handleConfirmReceive}
        />
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && selectedTransfer && (
        <UpdateTransfer
          transfer={selectedTransfer} // Pass the selected transfer data
          onClose={closeUpdateModal} // Pass a specific close function
          onUpdate={handleUpdateTransfer} // Pass the new update handler
        />
      )}
    </div>
  );
};

export default OutsideApiTable;
