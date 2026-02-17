import React, { useState, useEffect } from "react";
import axios from "axios";
import { domain } from "../../../security";
import RecoverMissingModal from "./RecoverMissingModal";
import TransactionDetailsModal from "./TransactionDetailsModal";
import Pagination from "../Pagination";
import { FaSearch, FaEye } from "react-icons/fa";

const ReceivedTransfer = ({ refreshTrigger }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // -- Search & Pagination State --
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // -- MODAL STATES --
  const [recoverModalData, setRecoverModalData] = useState(null);
  const [originalTransactionData, setOriginalTransactionData] = useState(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const apiUrl = `${domain}/api/ReceivedTransfers`;
      const response = await axios.get(apiUrl);
      setTransfers(response.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [refreshTrigger]);

  const handleViewOriginalTransaction = async (originalTransferId) => {
    try {
      const response = await axios.get(
        `${domain}/api/Transfers/${originalTransferId}`
      );
      setOriginalTransactionData(response.data);
    } catch (err) {
      console.error(err);
      alert("Could not load original transaction details.");
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.id.toString().includes(query) ||
      (t.fromLocation && t.fromLocation.toLowerCase().includes(query)) ||
      (t.toLocation && t.toLocation.toLowerCase().includes(query)) ||
      t.items.some((item) => item.productName.toLowerCase().includes(query))
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransfers = filteredTransfers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const toggleRowExpansion = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // --- SERIALIZED LOGIC ---
  const handleFoundSerialAction = async (
    transfer,
    item,
    serial,
    locationType
  ) => {
    const locationName =
      locationType === "FROM" ? transfer.fromLocation : transfer.toLocation;
    if (
      !window.confirm(
        `Mark serial #${serial.serialNumberId} as FOUND in ${locationName}?`
      )
    )
      return;

    try {
      const endpoint =
        locationType === "FROM"
          ? "markFoundInFromLocation"
          : "markFoundInToLocation";
      const apiUrl = `${domain}/api/ReceivedTransfers/${transfer.id}/items/${item.id}/serials/${endpoint}`;
      await axios.post(apiUrl, {
        completedTransferSerialId: serial.id,
        serialNumberValue: parseInt(serial.serialNumberId),
      });
      fetchTransfers();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  // --- NON-SERIALIZED LOGIC ---
  const openRecoverModal = (transfer, item) => {
    setRecoverModalData({ transfer, item });
  };

  const getMissingCountTotal = (transfer) => {
    let count = 0;
    transfer.items?.forEach((i) => {
      if (i.serialNumbers)
        i.serialNumbers.forEach((s) => {
          if (s.status === "Missing") count++;
        });
      if (
        !i.hasSerial &&
        i.missingQuantity > 0 &&
        (!i.serialNumbers || i.serialNumbers.length === 0)
      ) {
        count += i.missingQuantity;
      }
    });
    return count;
  };

  const getSerialStatusDisplay = (status, transfer) => {
    if (status === "Found-Returned")
      return {
        text: `(Found in ${transfer.fromLocation})`,
        className: "text-blue-600 font-bold",
      };
    if (status === "Received")
      return {
        text: `(Received in ${transfer.toLocation})`,
        className: "text-green-600 font-medium",
      };
    return { text: `(${status})`, className: "text-gray-500" };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto mt-8 p-4">
      {/* HEADER WITH SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Received Transfers
        </h2>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search ID, Location, Item..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* TABLE */}
      {filteredTransfers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No transfers found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto shadow rounded-lg bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3"></th>
                  {[
                    "ID",
                    "Date",
                    "From",
                    "To",
                    "Items",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTransfers.map((transfer) => {
                  const missingTotal = getMissingCountTotal(transfer);

                  return (
                    <React.Fragment key={transfer.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleRowExpansion(transfer.id)}
                            className="text-gray-500 flex items-center gap-1 hover:text-indigo-600"
                          >
                            {expandedRowId === transfer.id ? "▼" : "▶"}
                            {missingTotal > 0 && (
                              <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                                {missingTotal}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {transfer.id}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {formatDate(transfer.recievedDate)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {transfer.fromLocation}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {transfer.toLocation}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {transfer.items?.length || 0}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            {transfer.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleViewOriginalTransaction(
                                  transfer.transferId
                                )
                              }
                              className="text-blue-600 bg-blue-50 border border-blue-200 p-1.5 rounded hover:bg-blue-100 transition-colors"
                              title="View Original Transaction"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW */}
                      {expandedRowId === transfer.id && (
                        <tr className="bg-gray-50">
                          <td colSpan="8" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* LEFT COLUMN: ITEMS */}
                              <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-2 border-b">
                                  Items
                                </h4>
                                <ul className="space-y-3 text-sm">
                                  {transfer.items.map((item, idx) => (
                                    <li key={idx} className="flex flex-col">
                                      <div className="flex justify-between">
                                        <span className="font-bold">
                                          {item.productName}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                          Rec: {item.quantity}
                                        </span>
                                      </div>
                                      {!item.hasSerial &&
                                        item.missingQuantity > 0 && (
                                          <div className="mt-1">
                                            <button
                                              onClick={() =>
                                                openRecoverModal(transfer, item)
                                              }
                                              className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-3 py-1 rounded text-xs font-bold flex items-center gap-2 w-full justify-center"
                                            >
                                              <span>
                                                ⚠️ Missing:{" "}
                                                {item.missingQuantity}
                                              </span>
                                              <span className="underline">
                                                Resolve
                                              </span>
                                            </button>
                                          </div>
                                        )}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* RIGHT COLUMN: SERIALS / FOUND SUMMARY */}
                              <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-2 border-b">
                                  Serials
                                </h4>
                                {transfer.items.some(
                                  (i) => i.serialNumbers?.length > 0
                                ) ? (
                                  <div className="space-y-2">
                                    {transfer.items.map((item) => {
                                      // Skip if no serial array
                                      if (
                                        !item.serialNumbers ||
                                        item.serialNumbers.length === 0
                                      )
                                        return null;

                                      return (
                                        <div key={item.id}>
                                          <p className="text-xs text-gray-500 mb-1 font-semibold">
                                            {item.productName}
                                          </p>

                                          {/* --- 1. IF NON-SERIALIZED (Aggregation View) --- */}
                                          {!item.hasSerial ? (
                                            <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                                              <div className="flex justify-between border-b border-gray-100 pb-1">
                                                <span className="text-gray-600">
                                                  Found in{" "}
                                                  {transfer.fromLocation}:
                                                </span>
                                                <span className="font-bold text-blue-600">
                                                  {
                                                    item.serialNumbers.filter(
                                                      (s) =>
                                                        s.status ===
                                                        "Found-Returned"
                                                    ).length
                                                  }
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                  Found in {transfer.toLocation}
                                                  :
                                                </span>
                                                <span className="font-bold text-green-600">
                                                  {
                                                    item.serialNumbers.filter(
                                                      (s) =>
                                                        s.status === "Received"
                                                    ).length
                                                  }
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            /* --- 2. IF SERIALIZED (List View) --- */
                                            <ul className="space-y-1">
                                              {item.serialNumbers.map(
                                                (serial) => {
                                                  const isMissing =
                                                    serial.status === "Missing";
                                                  const statusDisplay =
                                                    getSerialStatusDisplay(
                                                      serial.status,
                                                      transfer
                                                    );
                                                  return (
                                                    <li
                                                      key={serial.id}
                                                      className="text-sm flex flex-wrap items-center gap-2 border-b border-gray-100 pb-1"
                                                    >
                                                      <span>
                                                        {serial.serialName}
                                                      </span>
                                                      {isMissing ? (
                                                        <div className="flex gap-1 ml-auto">
                                                          <button
                                                            onClick={() =>
                                                              handleFoundSerialAction(
                                                                transfer,
                                                                item,
                                                                serial,
                                                                "TO"
                                                              )
                                                            }
                                                            className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded"
                                                          >
                                                            Found in{" "}
                                                            {
                                                              transfer.toLocation
                                                            }
                                                          </button>
                                                          <button
                                                            onClick={() =>
                                                              handleFoundSerialAction(
                                                                transfer,
                                                                item,
                                                                serial,
                                                                "FROM"
                                                              )
                                                            }
                                                            className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded"
                                                          >
                                                            Found in{" "}
                                                            {
                                                              transfer.fromLocation
                                                            }
                                                          </button>
                                                        </div>
                                                      ) : (
                                                        <span
                                                          className={`text-xs ml-auto ${statusDisplay.className}`}
                                                        >
                                                          {statusDisplay.text}
                                                        </span>
                                                      )}
                                                    </li>
                                                  );
                                                }
                                              )}
                                            </ul>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">
                                    No serials.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTransfers.length > itemsPerPage && (
            <Pagination
              itemsPerPage={itemsPerPage}
              totalItems={filteredTransfers.length}
              currentPage={currentPage}
              paginate={paginate}
            />
          )}
        </>
      )}

      {/* MODALS */}
      {recoverModalData && (
        <RecoverMissingModal
          transfer={recoverModalData.transfer}
          item={recoverModalData.item}
          onClose={() => setRecoverModalData(null)}
          onSuccess={fetchTransfers}
        />
      )}

      {originalTransactionData && (
        <TransactionDetailsModal
          data={originalTransactionData}
          onClose={() => setOriginalTransactionData(null)}
        />
      )}
    </div>
  );
};

export default ReceivedTransfer;
