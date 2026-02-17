import { useState } from "react";
import { ToastContainer } from "react-toastify";

import TransferInventoryModal from "./AddTransfer";
import TransferHistoryTable from "./TransferHistoryTable";
import ReceivedTransfer from "./ReceivedTransfer";

const Transfer = () => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [refreshTransferHistory, setRefreshTransferHistory] = useState(false);
  const [refreshReceivedTransfer, setRefreshReceivedTransfer] = useState(false);

  const handleOpenTransferModal = () => setIsTransferModalOpen(true);
  const handleCloseTransferModal = () => setIsTransferModalOpen(false);

  const triggerTransferHistoryRefresh = () =>
    setRefreshTransferHistory((prev) => !prev);
  const triggerReceivedTransferRefresh = () =>
    setRefreshReceivedTransfer((prev) => !prev);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 font-sans text-gray-800">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transfer Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage outgoing and received inventory items.
          </p>
        </div>
        <button
          onClick={handleOpenTransferModal}
          className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-md shadow-sm transition-all"
        >
          + New Transfer
        </button>
      </div>

      <div className="space-y-12">
        {/* Section 1: Active Transfers */}
        <section>
          <TransferHistoryTable
            refreshTrigger={refreshTransferHistory}
            onReceiveSuccess={triggerReceivedTransferRefresh}
          />
        </section>

        {/* Section 2: History */}
        <section>
          <ReceivedTransfer refreshTrigger={refreshReceivedTransfer} />
        </section>
      </div>

      {isTransferModalOpen && (
        <TransferInventoryModal
          onClose={handleCloseTransferModal}
          refreshData={triggerTransferHistoryRefresh}
        />
      )}
    </div>
  );
};

export default Transfer;
