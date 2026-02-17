import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUserID } from "../../../../redux/IchthusSlice";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Truck,
  Search,
  CheckCircle,
  XCircle,
  Package,
  Ban,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  MapPin,
  User,
  Info, // Added Info icon
  AlertTriangle,
  FileText,
  Layers,
  DollarSign,
  RefreshCw,
  Gift,
  ArrowRight,
  TrendingDown,
  CornerDownRight,
  Clock, // Added Clock icon
  Lock,
  RefreshCcw,
  LockIcon, // Added Lock icon
} from "lucide-react";

import Loader from "../../../loader/Loader";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";
import RevertTransactionModal from "../../Transactions/Modals/RevertTransactionModal";
import RejectItemModal from "../../PurchaseOrder/PurchaseOrderModule/RejectItemModal";
import ExchangeModal from "../../DeliveryReturns/DeliveryReturnsModule/ExchangeModal";

// --- NEW HOOK: Get Online Time with Fallback ---
const useOnlineTime = () => {
  const [currentTime, setCurrentTime] = useState(null);
  const [isOnlineTime, setIsOnlineTime] = useState(false);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        // Attempt to get accurate online time
        const response = await axios.get("https://worldtimeapi.org/api/ip", {
          timeout: 3000, // 3 second timeout
        });
        const onlineDate = new Date(response.data.datetime);
        setCurrentTime(onlineDate);
        setIsOnlineTime(true);
      } catch (error) {
        // Fallback to PC Clock if offline or API fails
        console.warn(
          "Could not fetch online time, falling back to system clock.",
        );
        setCurrentTime(new Date());
        setIsOnlineTime(false);
      }
    };

    fetchTime();
  }, []);

  return { currentTime, isOnlineTime };
};

// --- NEW COMPONENT: Time Restriction Wrapper ---
// --- NEW COMPONENT: Time Restriction Wrapper ---
const TimeRestrictedWrapper = ({ deliveryDate, children }) => {
  const { currentTime } = useOnlineTime();
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!currentTime || !deliveryDate) return;

    const deliveryTime = new Date(deliveryDate).getTime();
    const nowTime = currentTime.getTime();

    // CHANGE: 24 hours -> 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const diff = nowTime - deliveryTime;

    if (diff > sevenDays) {
      setIsExpired(true);
    } else {
      setIsExpired(false);
      const remaining = sevenDays - diff;

      // Improved display: Show days and hours
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours}h left`);
      }
    }
  }, [currentTime, deliveryDate]);

  if (!currentTime) {
    return <span className="text-[10px] text-slate-300">Checking time...</span>;
  }

  if (isExpired) {
    return (
      <span className="relative inline-flex">
        <span className="group cursor-not-allowed opacity-50 grayscale inline-flex">
          <span className="pointer-events-none">{children}</span>

          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
            <span className="w-28 bg-slate-800 text-white text-[9px] text-center py-1 rounded flex flex-col items-center gap-1 px-2">
              <Lock size={10} />
              {/* CHANGE: Update Tooltip Text */}
              <span>Time Exceeded (&gt;7 days)</span>
            </span>
            <span className="block mx-auto w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800" />
          </span>
        </span>
      </span>
    );
  }

  // ✅ ACTIVE (rest of the component remains same)
  return (
    <span className="relative inline-flex">
      <span className="group inline-flex">
        {children}
        {timeLeft && (
          <span className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-700 text-[8px] font-bold px-1 rounded-full border border-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {timeLeft}
          </span>
        )}
      </span>
    </span>
  );
};

// --- Helpers ---
const cleanName = (name) => {
  if (!name) return "";
  return name
    .replace("(RETURNED)", "")
    .replace("(REPLACEMENT)", "")
    .replace("(COMPLIMENTARY)", "")
    .replace("(EXCHANGED)", "")
    .trim();
};

// --- Status Badges ---
const getStatusBadge = (status) => {
  switch (status) {
    case "Sold":
      return (
        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-emerald-200">
          <CheckCircle size={10} /> Sold
        </span>
      );
    case "Voided":
      return (
        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-red-200">
          <XCircle size={10} /> Voided
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold w-fit uppercase border border-gray-200">
          {status}
        </span>
      );
  }
};

// --- SUB-COMPONENT: Product Row with Collapsible Logic ---
const ProductRowItem = ({
  originalItem,
  replacementItem,
  isVoid,
  onRefund,
  onReplace,
  onReset, // New prop
  hasDebitMemo, // New prop
  deliveryDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 1. STATS
  const originalQty = originalItem.quantityExpected;
  const netQty = originalItem.quantityReceived;

  // 2. REPLACEMENT QUANTITY
  const replacedQty = replacementItem ? replacementItem.quantityReceived : 0;

  // 3. PURE RETURNED QUANTITY (The fix)
  // Total Missing (Original - Net) minus the ones that were Replaced
  const pureReturnedQty = originalQty - netQty - replacedQty;

  // 4. VISUALS
  const hasReplacement = !!replacementItem;
  const hasReturn = pureReturnedQty > 0; // Only show red section if there's a real refund
  const showDropdown = hasReplacement || hasReturn;

  const isComplimentary = originalItem.productName.includes("(COMPLIMENTARY)");

  // 5. FINANCIALS (Now uses pureReturnedQty)
  const refundAmount = pureReturnedQty * originalItem.unitPrice;

  return (
    <>
      {/* PARENT ROW */}
      <tr
        className={`group transition-all border-b border-slate-50 ${
          isOpen ? "bg-slate-50" : "bg-white hover:bg-slate-50"
        }`}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            {showDropdown ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1 rounded-full border transition-all ${
                  isOpen
                    ? "bg-slate-200 border-slate-300 text-slate-600 rotate-180"
                    : "bg-white border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300"
                }`}
              >
                <ChevronDown size={14} />
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div>
              <div className="font-bold text-slate-700 flex items-center gap-2">
                {isComplimentary && (
                  <Gift size={14} className="text-purple-500" />
                )}
                {cleanName(originalItem.productName)}
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {originalItem.priceType || "Standard"}
                </span>
              </div>
            </div>
          </div>
        </td>

        <td className="py-3 px-2 text-center text-slate-400 font-medium">
          {originalQty || "-"}
        </td>

        {/* RETURNED STATUS (Shows actual refunded units) */}
        <td className="py-3 px-2 text-center">
          {pureReturnedQty > 0 ? (
            <span
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-red-600 text-[10px] font-bold uppercase whitespace-nowrap hover:bg-red-50 rounded"
            >
              <RotateCcw size={10} /> {pureReturnedQty} Returned
            </span>
          ) : (
            <span className="text-slate-200">-</span>
          )}
        </td>

        {/* REPLACED STATUS */}
        <td className="py-3 px-2 text-center">
          {hasReplacement ? (
            <span
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-blue-600 text-[10px] font-bold uppercase whitespace-nowrap hover:bg-blue-50 rounded"
            >
              <RefreshCw size={10} /> {replacedQty} Replaced
            </span>
          ) : (
            <span className="text-slate-200">-</span>
          )}
        </td>

        <td className="py-3 px-2 text-center font-bold text-emerald-600">
          <span className="bg-emerald-50 px-2 py-1 rounded">{netQty}</span>
        </td>

        <td className="py-3 px-4 text-right font-medium text-slate-600">
          ₱{originalItem.unitPrice.toLocaleString()}
        </td>

        <td className="py-3 px-4 text-center">
          {!isVoid && netQty > 0 && originalItem.unitPrice > 0 && (
            <div className="flex justify-center gap-1 ">
              <TimeRestrictedWrapper deliveryDate={deliveryDate}>
                <button
                  onClick={onRefund}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold uppercase rounded hover:border-red-300 hover:text-red-500 transition-all shadow-sm"
                >
                  <RotateCcw size={12} /> Return
                </button>
              </TimeRestrictedWrapper>

              <TimeRestrictedWrapper deliveryDate={deliveryDate}>
                <button
                  onClick={onReplace}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-500 border border-indigo-100 text-[10px] font-bold uppercase rounded hover:bg-indigo-100 transition-all shadow-sm"
                >
                  <RefreshCw size={12} /> Replace
                </button>
              </TimeRestrictedWrapper>
            </div>
          )}
        </td>
      </tr>

      {/* DROPDOWN ROW */}
      {isOpen && showDropdown && (
        <tr className="bg-slate-50/50 border-b border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <td colSpan="7" className="px-4 py-3 pl-14">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => onReset(originalItem.id)} // Pass the ID up
                  disabled={hasDebitMemo}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 border rounded text-[10px] font-bold uppercase transition-all shadow-sm
    ${
      hasDebitMemo
        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
        : "bg-white border-slate-300 text-slate-600 hover:border-red-300 hover:text-red-500"
    }`}
                >
                  {hasDebitMemo ? <Lock size={12} /> : <RefreshCcw size={12} />}
                  Reset Item
                </button>
              </div>
              {hasReturn && (
                <div className="flex items-center gap-4 p-3 bg-red-50/50 border border-red-100 rounded-lg shadow-sm relative overflow-hidden max-w-4xl">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-500 rounded-full shrink-0">
                    <RotateCcw size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] font-black uppercase text-red-500 tracking-wider">
                      Items Returned (Refunded)
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {cleanName(originalItem.productName)}
                    </div>
                  </div>
                  <div className="text-right px-6 border-l border-red-200">
                    <div className="text-[9px] text-red-400 uppercase font-bold">
                      Total Returned
                    </div>
                    <div className="font-bold text-red-600 text-lg leading-none">
                      {pureReturnedQty} <span className="text-xs">Units</span>
                    </div>
                  </div>
                  <div className="text-right px-6 border-l border-red-200">
                    <div className="text-[9px] text-red-400 uppercase font-bold">
                      Refund Amount
                    </div>
                    <div className="font-bold text-red-600 text-lg leading-none">
                      ₱{refundAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {/* 2. REPLACEMENT SECTION (BLUE) */}
              {hasReplacement && (
                <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden max-w-4xl">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-500 rounded-full shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">
                        Replacement Unit Sent
                      </span>
                      <span className="text-[9px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded font-mono">
                        ID: {replacementItem.id}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {cleanName(replacementItem.productName)}
                    </div>
                  </div>
                  <div className="text-right px-6 border-l border-slate-100">
                    <div className="text-[9px] text-slate-400 uppercase font-bold">
                      Quantity
                    </div>
                    <div className="font-bold text-blue-600 text-lg leading-none">
                      {replacedQty}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// --- MAIN COMPONENT ---
const AllTradeReturns = () => {
  // 1. GET CURRENT USER ID FROM REDUX
  const currentUserId = useSelector(selectUserID);

  const [doData, setDoData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState("Sold");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // UI State
  const [expandedRow, setExpandedRow] = useState(null);

  // --- MODAL STATES ---

  // 1. Revert (Refund/Void)
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [selectedDOToRevert, setSelectedDOToRevert] = useState(null);
  const [isRejectItemModalOpen, setIsRejectItemModalOpen] = useState(false);
  const [selectedItemToReject, setSelectedItemToReject] = useState(null);
  const [pendingRejectData, setPendingRejectData] = useState(null);
  const [isProcessingSingleItem, setIsProcessingSingleItem] = useState(false);

  // 2. Exchange / Complimentary
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeMode, setExchangeMode] = useState("REPLACE"); // "REPLACE" or "COMPLIMENTARY"
  const [exchangeTargetDO, setExchangeTargetDO] = useState(null); // The Order Header
  const [exchangeTargetItem, setExchangeTargetItem] = useState(null); // The specific item being replaced (null if complimentary)

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      // Intentionally silent loading on refresh to not flicker UI too much
      const response = await axios.get(`${domain}/api/DeliveryOrders`);
      setDoData(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch Delivery Orders.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering Logic ---
  const filteredDOs = useMemo(() => {
    return doData.filter((item) => {
      // DEFENSIVE PROGRAMMING: Ensure strings exist before calling .toLowerCase()
      const term = searchTerm.toLowerCase();
      const doNum = item.deliveryOrderNumber || "";
      const soNum = item.salesOrderNumber || "";
      const custName = item.customerName || "";

      // Search
      const matchesSearch =
        doNum.toLowerCase().includes(term) ||
        soNum.toLowerCase().includes(term) ||
        custName.toLowerCase().includes(term);

      // Location
      // Handle potential null locationName safely
      const matchesLoc =
        selectedLocation === "All" ||
        (item.locationName && item.locationName === selectedLocation);

      // Tabs
      let matchesTab = true;
      if (activeTab === "Sold") matchesTab = !item.isVoid;
      else if (activeTab === "Voided") matchesTab = item.isVoid;

      return matchesSearch && matchesLoc && matchesTab;
    });
  }, [searchTerm, doData, selectedLocation, activeTab]);

  // --- Handlers ---

  const handleResetAll = async (doId) => {
    if (
      !window.confirm(
        "CRITICAL: This will delete ALL replacement and complimentary records and restore ALL original quantities for this Delivery Order. This cannot be undone. Continue?",
      )
    )
      return;

    try {
      await axios.post(`${domain}/api/DeliveryOrders/reset-all/${doId}`);
      toast.success("Delivery Order fully restored.");
      fetchData(); // Refresh table
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset All failed");
    }
  };
  // Function to toggle the Debit Memo (Lock)
  const handleLockOrder = async (id) => {
    if (
      !window.confirm(
        "Locking this order will generate a Debit Memo and prevent any further resets/returns for this order. Continue?",
      )
    )
      return;

    try {
      await axios.post(`${domain}/api/DeliveryOrders/lock-debit-memo/${id}`);
      toast.success("Debit Memo generated. Order is now locked.");
      fetchData(); // Refresh the list to update the UI
    } catch (err) {
      toast.error(err.response?.data?.message || "Locking failed.");
    }
  };

  // Reset Item Function
  const handleResetItem = async (doId, itemId) => {
    if (
      !window.confirm(
        "Are you sure you want to reset this item? This will remove all replacement records and restore original quantities.",
      )
    )
      return;

    try {
      await axios.post(`${domain}/api/DeliveryOrders/reset-item`, {
        deliveryOrderId: doId,
        originalItemId: itemId,
      });
      toast.success("Item reset successfully.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    }
  };
  // 1. REVERT / REFUND HANDLER
  const handleConfirmRevert = async (id, returnCondition) => {
    try {
      if (isProcessingSingleItem) {
        // Handle Single Item Return
        let finalImage = null;
        if (pendingRejectData.image) {
          finalImage = pendingRejectData.image.includes(",")
            ? pendingRejectData.image.split(",")[1]
            : pendingRejectData.image;
        }

        const payload = {
          deliveryOrderId: selectedItemToReject.deliveryOrderId,
          productId: selectedItemToReject.productId,
          quantity: pendingRejectData.quantity,
          reason: pendingRejectData.reason,
          returnCondition: returnCondition,
          voidBy: String(currentUserId),
          imageBase64: finalImage,
        };

        await axios.post(`${domain}/api/DeliveryOrders/revert-item`, payload);
        toast.success("Item returned and refunded successfully.");
      } else {
        // Handle Whole Order Void
        const payload = {
          returnCondition,
          voidBy: String(currentUserId),
        };
        await axios.post(`${domain}/api/DeliveryOrders/revert/${id}`, payload);
        toast.success("Delivery Order Voided completely.");
      }

      setIsRevertModalOpen(false);
      setPendingRejectData(null);
      fetchData(); // Refresh data to update financials
    } catch (error) {
      toast.error(error.response?.data?.message || "Process failed.");
    }
  };

  // 2. EXCHANGE / COMPLIMENTARY SETUP HANDLERS
  const openReplaceModal = (doHeader, itemLine) => {
    setExchangeTargetDO(doHeader);
    setExchangeTargetItem(itemLine);
    setExchangeMode("REPLACE");
    setIsExchangeModalOpen(true);
  };

  const openComplimentaryModal = (doHeader) => {
    setExchangeTargetDO(doHeader);
    setExchangeTargetItem(null); // No specific item to replace
    setExchangeMode("COMPLIMENTARY");
    setIsExchangeModalOpen(true);
  };

  const tabs = [
    { id: "Sold", label: "Active Orders", icon: DollarSign },
    { id: "Voided", label: "Voided / Returns", icon: RotateCcw },
    { id: "All", label: "All Transactions", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-12 relative">
      <ToastContainer autoClose={2000} position="top-right" />

      {/* --- MODALS --- */}

      {/* 1. Item Condition Modal (Good/Bad) + Qty */}
      <RejectItemModal
        isOpen={isRejectItemModalOpen}
        onClose={() => setIsRejectItemModalOpen(false)}
        onSubmit={(qty, reason, img) => {
          setPendingRejectData({ quantity: qty, reason, image: img });
          setIsRejectItemModalOpen(false);
          setIsRevertModalOpen(true); // Open confirmation modal next
        }}
        lineItem={selectedItemToReject}
      />

      {/* 2. Confirm Revert/Void */}
      <RevertTransactionModal
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        onConfirm={handleConfirmRevert}
        transactionId={
          isProcessingSingleItem
            ? selectedItemToReject?.deliveryOrderId
            : selectedDOToRevert?.id
        }
      />

      {/* 3. Exchange / Complimentary Modal */}
      <ExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        mode={exchangeMode}
        originalItem={exchangeTargetItem}
        deliveryOrder={exchangeTargetDO}
        currentUserId={currentUserId}
        onSuccess={() => {
          fetchData(); // Refresh to show new items and updated totals
        }}
      />

      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-emerald-600" /> Trade Returns Management
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Dynamic Order Management • User ID: {currentUserId}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 mt-6">
        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Active Orders
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {doData.filter((x) => !x.isVoid).length}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Original Value
              </p>
              <p className="text-xl font-bold text-slate-800">
                ₱
                {doData
                  .filter((x) => !x.isVoid)
                  .reduce((a, b) => a + b.salesOrderTotalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Current Value
              </p>
              <p className="text-xl font-bold text-slate-800">
                ₱
                {doData
                  .filter((x) => !x.isVoid)
                  .reduce((a, b) => a + b.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Total Refunded/Lost
              </p>
              <p className="text-xl font-bold text-red-600">
                ₱
                {doData
                  .filter((x) => !x.isVoid)
                  .reduce(
                    (a, b) => a + (b.salesOrderTotalAmount - b.totalAmount),
                    0,
                  )
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* --- TAB NAVIGATION --- */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200 mb-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-emerald-600" : "text-slate-400"}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Clock size={14} className="text-amber-600 mt-0.5" />
          <p className="text-[11px] font-semibold text-amber-800 leading-snug">
            <span className="font-bold">
              Delivery Returns are strictly based on the Expected Delivery Date.
            </span>
            <br />
            Return and exchange actions are allowed within
            {/* CHANGE: Update Banner Text */}
            <span className="font-bold"> seven (7) days only.</span>
          </p>
        </div>

        {/* --- SEARCH & LOCATION FILTER --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search DO #, Sales Order #, or Customer..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative min-w-[220px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-700"
            >
              <option value="All">All Locations</option>
              {[...new Set(doData.map((d) => d.locationName))]
                ?.filter(Boolean)
                .map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4">Delivery Order</th>
                    <th className="px-6 py-4">Location & Customer</th>
                    <th className="px-6 py-4 ">Current Net Amount</th>
                    <th className="px-6 py-4 ">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDOs
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage,
                    )
                    .map((item) => (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === item.id ? null : item.id,
                            )
                          }
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${item.isVoid ? "bg-red-50/20" : ""}`}
                        >
                          <td className="px-6 py-4 text-slate-400">
                            {expandedRow === item.id ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">
                              {item.deliveryOrderNumber}
                              {/* Show delivery date */}
                              <div className="text-[10px] text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(
                                  item.deliveryDate,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-100">
                                SO: {item.salesOrderNumber}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase border border-slate-200">
                                SQ: {item.quoteNumber}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                              <User size={14} className="text-slate-400" />{" "}
                              {item.customerName}
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[10px] uppercase mt-1">
                              <MapPin size={12} /> {item.locationName}
                            </div>
                          </td>
                          <td className="px-6 py-4  ">
                            <div className="font-black text-slate-900 text-base items-center">
                              ₱{item.totalAmount.toLocaleString()}
                            </div>
                            {item.salesOrderTotalAmount > item.totalAmount &&
                              !item.isVoid && (
                                <div className="text-[9px] font-bold text-red-500 mt-1">
                                  (Refunded: ₱
                                  {(
                                    item.salesOrderTotalAmount -
                                    item.totalAmount
                                  ).toLocaleString()}
                                  )
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(item.isVoid ? "Voided" : "Sold")}
                          </td>
                          <td
                            className="px-6 py-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => handleLockOrder(item.id)}
                                disabled={item.hasDebitMemo} // Disable if already locked
                                className={`flex items-center gap-1.5 px-3 py-2 rounded font-bold text-[10px] uppercase transition-all border
        ${
          item.hasDebitMemo
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
        }`}
                                title={
                                  item.hasDebitMemo ? "Locked" : "Lock Order"
                                }
                              >
                                {item.hasDebitMemo ? (
                                  <Lock size={14} />
                                ) : (
                                  <FileText size={14} />
                                )}
                                {item.hasDebitMemo
                                  ? "Locked (Debit Memo)"
                                  : "Debit Memo"}
                              </button>
                            </div>
                          </td>
                          {/* <td
                            className="px-6 py-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-center gap-3">
                              {!item.isVoid && (
                                // ALSO APPLY TIME RESTRICTION TO VOID WHOLE ORDER IF NEEDED
                                // For now, just wrapping the buttons inside
                                <button
                                  onClick={() => {
                                    setSelectedDOToRevert(item);
                                    setIsProcessingSingleItem(false);
                                    setIsRevertModalOpen(true);
                                  }}
                                  className="p-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 border border-orange-100 transition-colors"
                                  title="Void Whole Order"
                                >
                                  <Ban size={16} />
                                </button>
                              )}
                            </div>
                          </td> */}
                        </tr>

                        {/* --- EXPANDED VIEW --- */}
                        {expandedRow === item.id && (
                          <tr className="bg-slate-50/50 border-b border-slate-200">
                            <td colSpan="6" className="px-4 py-4">
                              <div className="bg-white rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
                                {/* LEFT: PRODUCT TABLE */}
                                <div className="lg:col-span-3 border-r border-slate-100 p-6">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                      <Package size={16} /> Product Line Items
                                    </h4>
                                    <div className="flex gap-2">
                                      {/* NEW RESET ALL BUTTON */}
                                      {!item.isVoid && (
                                        <button
                                          onClick={() =>
                                            handleResetAll(item.id)
                                          }
                                          disabled={item.hasDebitMemo}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all
          ${
            item.hasDebitMemo
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
          }`}
                                        >
                                          <RefreshCcw size={14} /> Reset All
                                          Items
                                        </button>
                                      )}

                                      {/* EXISTING COMPLIMENTARY BUTTON */}
                                      {!item.isVoid && (
                                        <button
                                          onClick={() =>
                                            openComplimentaryModal(item)
                                          }
                                          disabled={item.hasDebitMemo}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all
                                            ${
                                              item.hasDebitMemo
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                : "bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100"
                                            }`}
                                        >
                                          <Gift size={14} /> Add Complimentary
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-y border-slate-200">
                                        <tr>
                                          <th className="py-3 px-4 text-left w-[30%]">
                                            Product
                                          </th>
                                          <th className="py-3 px-2 text-center w-[10%]">
                                            Original
                                          </th>
                                          <th className="py-3 px-2 text-center w-[10%]">
                                            Returned
                                          </th>
                                          <th className="py-3 px-2 text-center w-[10%]">
                                            Replaced
                                          </th>
                                          <th className="py-3 px-2 text-center w-[10%] text-emerald-600">
                                            Net Qty
                                          </th>
                                          <th className="py-3 px-4 text-right w-[15%]">
                                            Price
                                          </th>
                                          <th className="py-3 px-4 text-center w-[15%]">
                                            Action
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {(() => {
                                          const rootItems =
                                            item.deliveryOrderItems.filter(
                                              (x) => !x.relatedLineItemId,
                                            );
                                          const childItems =
                                            item.deliveryOrderItems.filter(
                                              (x) => x.relatedLineItemId,
                                            );

                                          return rootItems.map((prod) => {
                                            const replacementItem =
                                              childItems.find(
                                                (child) =>
                                                  child.relatedLineItemId ===
                                                  prod.id,
                                              );
                                            return (
                                              <ProductRowItem
                                                key={prod.id}
                                                hasDebitMemo={item.hasDebitMemo} // Pass from parent DO
                                                onReset={(originalItemId) =>
                                                  handleResetItem(
                                                    item.id,
                                                    originalItemId,
                                                  )
                                                } // Pass handler
                                                originalItem={prod}
                                                replacementItem={
                                                  replacementItem
                                                }
                                                isVoid={item.isVoid}
                                                deliveryDate={item.deliveryDate} // Pass delivery date here
                                                onRefund={() => {
                                                  setIsProcessingSingleItem(
                                                    true,
                                                  );
                                                  setSelectedItemToReject({
                                                    ...prod,
                                                    deliveryOrderId: item.id,
                                                  });
                                                  setIsRejectItemModalOpen(
                                                    true,
                                                  );
                                                }}
                                                onReplace={() =>
                                                  openReplaceModal(item, prod)
                                                }
                                              />
                                            );
                                          });
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* RIGHT: SUMMARY CARD */}
                                <div className="lg:col-span-1 bg-slate-50 p-6 flex flex-col justify-between">
                                  {/* ... existing summary code ... */}
                                  <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                      <FileText size={16} /> Summary
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                      {/* Original Baseline */}
                                      <div className="flex justify-between items-center text-xs opacity-60">
                                        <span className="font-bold text-slate-500">
                                          Original SO Amount
                                        </span>
                                        <span className="font-mono text-slate-700">
                                          ₱
                                          {item.salesOrderTotalAmount.toLocaleString()}
                                        </span>
                                      </div>

                                      {/* Adjustments (Refunds) */}
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-red-500 flex items-center gap-1">
                                          <ArrowRight size={10} /> Total Lost /
                                          Refunded
                                        </span>
                                        <span className="font-mono font-bold text-red-600">
                                          - ₱
                                          {(
                                            item.salesOrderTotalAmount -
                                            item.totalAmount
                                          ).toLocaleString()}
                                        </span>
                                      </div>

                                      <div className="border-t border-slate-200 my-2"></div>

                                      {/* Current Snapshot */}
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Net Subtotal
                                        </span>
                                        <span className="font-bold text-slate-800">
                                          ₱{item.totalAmount.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Shipping
                                        </span>
                                        <span className="font-bold text-slate-800">
                                          + ₱
                                          {item.shippingCost.toLocaleString()}
                                        </span>
                                      </div>

                                      {item.hasVat && (
                                        <div className="flex justify-between text-[11px] text-emerald-600 font-bold bg-emerald-100/50 p-1.5 rounded">
                                          <span>VAT Included</span>
                                          <span>
                                            ₱{item.vatAmount.toLocaleString()}
                                          </span>
                                        </div>
                                      )}

                                      {item.hasEwt && (
                                        <div className="flex justify-between text-[11px] text-orange-600 font-bold">
                                          <span>EWT Withheld</span>
                                          <span>
                                            - ₱{item.ewtAmount.toLocaleString()}
                                          </span>
                                        </div>
                                      )}

                                      <div className="border-t border-dashed border-slate-300 pt-3 mt-2">
                                        <div className="flex justify-between items-end">
                                          <span className="text-[10px] font-black uppercase text-slate-400">
                                            Current Net Total
                                          </span>
                                          <span className="text-xl font-black text-emerald-700">
                                            ₱
                                            {(
                                              item.totalAmount +
                                              item.shippingCost -
                                              (item.hasEwt ? item.ewtAmount : 0)
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-6">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                      Remarks / Audit
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded text-xs text-slate-500 italic h-24 overflow-y-auto">
                                      {item.remarks ||
                                        "No additional remarks logged for this transaction."}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredDOs.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllTradeReturns;
