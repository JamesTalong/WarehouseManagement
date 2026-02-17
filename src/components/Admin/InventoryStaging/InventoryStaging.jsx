import AddInventoryStaging from "./AddInventoryStaging";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { domain } from "../../../security";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2 } from "lucide-react";
import MigrateBatchStagingsButton from "./MigrateBatchStagingsButton";
import StagingHistory from "./StagingHistory";
import { HistoryIcon } from "lucide-react";

const InventoryStaging = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchStagings, setBatchStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxSerialCount, setMaxSerialCount] = useState(0);
  const [serialPageIndexes, setSerialPageIndexes] = useState({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const openHistoryModal = () => setIsHistoryModalOpen(true);
  const closeHistoryModal = () => setIsHistoryModalOpen(false);

  const fetchBatchStagings = useCallback(async () => {
    const apiUrl = `${domain}/api/BatchStagings`;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const groupedData = response.data.map((batch) => {
        const serials = batch.hasSerial ? batch.serialStagings : [];
        const anySold = batch.hasSerial
          ? batch.serialStagings.some((s) => s.isSold)
          : false;

        return {
          id: batch.id,
          batchDate: batch.batchDate,
          numberOfItems: batch.hasSerial
            ? batch.serialStagings.length
            : batch.numberOfItems,
          productName: batch.pricelistProduct.productName,
          locationName: batch.pricelistLocation.locationName,
          serialStagings: serials,
          hasSerial: batch.hasSerial,
          isSold: anySold,
        };
      });

      setBatchStagings(groupedData);
      // Determine the maximum number of serials to ensure consistent row height
      const maxSerials = groupedData.reduce((max, batch) => {
        return Math.max(max, batch.serialStagings.length);
      }, 0);
      setMaxSerialCount(maxSerials);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to fetch batch stagings.");
      setLoading(false);
    }
  }, []);

  const handleInventoryAdded = useCallback(() => {
    fetchBatchStagings();
  }, [fetchBatchStagings]);

  const refetchData = useCallback(() => {
    fetchBatchStagings();
  }, [fetchBatchStagings]);

  const deleteBatchStaging = async (id) => {
    const apiUrl = `${domain}/api/BatchStagings/${id}`;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this ?"
    );
    if (!confirmDelete) {
      return; // Exit the function if the user cancels
    }
    try {
      await axios.delete(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Successfully Deleted!");
      fetchBatchStagings();
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item.");
    }
  };

  const handleDeleteSerial = async (serialId) => {
    try {
      await axios.delete(`${domain}/api/BatchStagings/serials/${serialId}`, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Serial deleted successfully");
      fetchBatchStagings(); // refresh
    } catch (err) {
      console.error("Failed to delete serial:", err);
      toast.error("Failed to delete serial.");
    }
  };

  const deleteAllBatchStaging = async () => {
    if (!window.confirm("Are you sure you want to delete *all* staging data ?"))
      return;
    const apiUrl = `${domain}/api/BatchStagings/all`;

    try {
      await axios.delete(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("All Data is deleted successfully!");
      fetchBatchStagings(); // refresh table
    } catch (err) {
      console.error("Error deleting all Data:", err);
      toast.error("Failed to delete all Data.");
    }
  };

  useEffect(() => {
    fetchBatchStagings();
  }, [fetchBatchStagings]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const changeSerialPage = (batchId, direction, totalSerials) => {
    setSerialPageIndexes((prev) => {
      const currentPage = prev[batchId] || 0;
      const maxPage = Math.ceil(totalSerials / 5) - 1;

      let newPage = direction === "next" ? currentPage + 1 : currentPage - 1;
      newPage = Math.max(0, Math.min(newPage, maxPage));

      return { ...prev, [batchId]: newPage };
    });
  };

  if (loading) return <div>Loading inventory staging data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-3xl font-semibold text-gray-800">
          Inventory Staging
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openModal}
            className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Upload Inventory
          </button>

          <button
            onClick={deleteAllBatchStaging}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Clear All
          </button>

          <button
            onClick={openHistoryModal}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            <HistoryIcon className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {isModalOpen && (
        <AddInventoryStaging
          onClose={closeModal}
          onInventoryAdded={handleInventoryAdded}
        />
      )}

      {isHistoryModalOpen && <StagingHistory onClose={closeHistoryModal} />}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {[
                "ID",
                "Batch Date",
                "# Items",
                "Product",
                "Location",
                "Serial Numbers",
                "Actions",
              ].map((header) => (
                <th key={header} className="px-6 py-4 text-left tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {batchStagings.map((batch) => (
              <tr
                key={batch.id}
                style={{ minHeight: `${maxSerialCount * 24 + 16}px` }}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium">{batch.id}</td>
                <td className="px-6 py-4">
                  {new Date(batch.batchDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">{batch.numberOfItems}</td>
                <td className="px-6 py-4">{batch.productName}</td>
                <td className="px-6 py-4">{batch.locationName}</td>

                <td className="px-6 py-4 whitespace-pre-wrap">
                  {batch.hasSerial ? (
                    <div className="space-y-2">
                      {(() => {
                        const page = serialPageIndexes[batch.id] || 0;
                        const serialsToShow = batch.serialStagings.slice(
                          page * 5,
                          page * 5 + 5
                        );

                        return (
                          <>
                            {serialsToShow.map((serial) => (
                              <div
                                key={serial.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-100 rounded-lg px-3 py-2"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-sm font-medium text-gray-800 truncate">
                                    {serial.serialName}
                                  </span>

                                  <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                      serial.isSold
                                        ? "bg-green-100 text-green-600"
                                        : "bg-yellow-100 text-yellow-600"
                                    }`}
                                  >
                                    {serial.isSold ? "Sold" : "Unsold"}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleDeleteSerial(serial.id)}
                                  className="text-red-500 hover:bg-red-100 p-1 rounded transition"
                                  title="Delete Serial"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            {batch.serialStagings.length > 5 && (
                              <div className="flex justify-center items-center mt-2 gap-4 text-xs text-gray-500">
                                <button
                                  onClick={() =>
                                    changeSerialPage(
                                      batch.id,
                                      "prev",
                                      batch.serialStagings.length
                                    )
                                  }
                                  disabled={
                                    (serialPageIndexes[batch.id] || 0) === 0
                                  }
                                  className="hover:underline disabled:opacity-40"
                                >
                                  ← Prev
                                </button>

                                <span className="text-gray-500 font-medium">
                                  {serialPageIndexes[batch.id] + 1 || 1} /{" "}
                                  {Math.ceil(batch.serialStagings.length / 5)}
                                </span>

                                <button
                                  onClick={() =>
                                    changeSerialPage(
                                      batch.id,
                                      "next",
                                      batch.serialStagings.length
                                    )
                                  }
                                  disabled={
                                    (serialPageIndexes[batch.id] || 0) >=
                                    Math.ceil(batch.serialStagings.length / 5) -
                                      1
                                  }
                                  className="hover:underline disabled:opacity-40"
                                >
                                  Next →
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteBatchStaging(batch.id)}
                    className="text-red-500 border border-red-400 hover:bg-red-500 hover:text-white text-xs px-3 py-1 rounded-lg transition"
                    title="Delete Batch"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {batchStagings.length > 0 && (
        <div className="flex justify-center pt-6">
          <MigrateBatchStagingsButton refetchData={refetchData} />
        </div>
      )}
    </div>
  );
};

export default InventoryStaging;
