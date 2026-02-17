import { useState } from "react";
import { ToastContainer } from "react-toastify";

import InTransitTable from "./ShippingTransfer/InTransitTable";
import ReceivingTable from "./ReceivingTransfer/ReceivingTable";
import AddShippingTransfer from "./ShippingTransfer/AddShippingTransfer"; // Assuming this is the correct path for Component 2
import OutsideApiTable from "./ShippingTransfer/OutsideApiTable";

const TransferItems = () => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [refreshTransferHistory, setRefreshTransferHistory] = useState(false);
  const [refreshReceivedTransfer, setRefreshReceivedTransfer] = useState(false); // New state for ReceivedTransfer

  const handleOpenTransferModal = () => {
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
  };

  const triggerTransferHistoryRefresh = () => {
    setRefreshTransferHistory((prev) => !prev);
  };

  const triggerReceivedTransferRefresh = () => {
    setRefreshReceivedTransfer((prev) => !prev);
  };

  return (
    <div className="p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl sm:text-3xl font-semibold text-center text-gray-800 mb-6 sm:mb-8">
        All Inventory
      </h1>
      <button
        onClick={() => handleOpenTransferModal()} // Pass the specific product
        className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1 px-3 rounded-md shadow-sm transition-colors duration-150"
      >
        Transfer This Item
      </button>
      <OutsideApiTable />
      <InTransitTable
        refreshTrigger={refreshTransferHistory}
        onReceiveSuccess={triggerReceivedTransferRefresh} // Pass the new refresh function
      />
      <ReceivingTable refreshTrigger={refreshReceivedTransfer} />

      {isTransferModalOpen && (
        <AddShippingTransfer
          onClose={handleCloseTransferModal}
          refreshData={triggerTransferHistoryRefresh}
        />
      )}
    </div>
  );
};

export default TransferItems;
