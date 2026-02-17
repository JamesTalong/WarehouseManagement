import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../security";
import ReceivedItemModal from "./ReceivedItemModal";
import ViewManifestModal from "./ViewManifestModal";
import Pagination from "../Pagination";
import Loader from "../../loader/Loader";
// Only keeping the Search icon as it's standard UX
import { FaSearch } from "react-icons/fa";

const TransferHistoryTable = ({ refreshTrigger, onReceiveSuccess }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [viewItemsModalOpen, setViewItemsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${domain}/api/Transfers`;
      const response = await axios.get(apiUrl);
      const activeTransfers = response.data
        .filter((t) => t.status === "In Transit")
        .sort(
          (a, b) => new Date(b.transferredDate) - new Date(a.transferredDate)
        );
      setTransfers(activeTransfers);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError(err);
      toast.error("Failed to fetch transfers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [refreshTrigger, fetchTransfers]);

  const filteredTransfers = transfers.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.id.toString().includes(query) ||
      (t.fromLocationName &&
        t.fromLocationName.toLowerCase().includes(query)) ||
      (t.toLocationName && t.toLocationName.toLowerCase().includes(query))
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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleRevert = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel Transfer #${id}?`))
      return;
    const revertPromise = axios.post(`${domain}/api/Transfers/revert/${id}`);
    toast.promise(revertPromise, {
      pending: "Cancelling...",
      success: {
        render() {
          fetchTransfers();
          return `Transfer #${id} cancelled.`;
        },
      },
      error: "Failed to cancel.",
    });
  };

  const openReceiveModal = async (transferSummary) => {
    try {
      const res = await axios.get(
        `${domain}/api/Transfers/${transferSummary.id}`
      );
      const fullData = res.data;
      // Processing logic...
      const processedItems = fullData.items.map((item) => {
        let serials = [];
        if (item.serialNumberIds?.length > 0) {
          serials = item.serialNumberIds.map((id) => ({
            id: id,
            serialName: `Ref #${id}`,
          }));
        }
        return { ...item, serialNumbers: serials };
      });
      setSelectedTransfer({ ...fullData, items: processedItems });
      setReceiveModalOpen(true);
    } catch (e) {
      toast.error("Could not load details.");
    }
  };

  const openViewItemsModal = (transfer) => {
    setSelectedTransfer(transfer);
    setViewItemsModalOpen(true);
  };

  const handleConfirmReceive = async (transfer, payloadDto) => {
    try {
      await axios.post(`${domain}/api/ReceivedTransfers`, payloadDto);
      toast.success(`Transfer #${transfer.id} received.`);
      setReceiveModalOpen(false);
      setSelectedTransfer(null);
      if (onReceiveSuccess) onReceiveSuccess();
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to receive.");
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500">Failed to load data.</div>
    );

  return (
    <div className="w-full">
      {/* Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          In Transit
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
            {filteredTransfers.length}
          </span>
        </h2>

        {/* Minimal Search */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 text-xs" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow bg-white"
          />
        </div>
      </div>

      {filteredTransfers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm">No transfers found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3 text-center">Items</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block text-sm font-medium text-gray-900">
                        #{t.id}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {formatDate(t.transferredDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-500 text-xs">
                          From:{" "}
                          <span className="text-gray-700 font-medium">
                            {t.fromLocationName}
                          </span>
                        </span>
                        <span className="text-gray-500 text-xs mt-1">
                          To:{" "}
                          <span className="text-gray-900 font-bold">
                            {t.toLocationName}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openViewItemsModal(t)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                      >
                        View {t.itemsCount} Items
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        In Transit
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => handleRevert(t.id)}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => openReceiveModal(t)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                          Receive Items
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransfers.length > itemsPerPage && (
            <div className="mt-4">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredTransfers.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ViewManifestModal
        isOpen={viewItemsModalOpen}
        onClose={() => setViewItemsModalOpen(false)}
        items={selectedTransfer?.items || []}
        transferId={selectedTransfer?.id}
      />
      {receiveModalOpen && selectedTransfer && (
        <ReceivedItemModal
          transfer={selectedTransfer}
          onClose={() => setReceiveModalOpen(false)}
          onConfirmReceive={handleConfirmReceive}
        />
      )}
    </div>
  );
};

export default TransferHistoryTable;
