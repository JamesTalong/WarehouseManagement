// src/components/YourModule/SalesOrderModule/AllSalesOrders.jsx

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  ShoppingCart,
  Search,
  BarChart2,
  CheckCircle,
  XCircle,
  FileText,
  Truck,
  Ban,
  MapPin,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Info,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Send,
  Layers,
  Package,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";
import RevertTransactionModal from "../../Transactions/Modals/RevertTransactionModal";
import { selectUserID } from "../../../../redux/IchthusSlice";

const RejectOrderModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-full text-red-600">
            <ThumbsDown size={20} />
          </div>
          <h3 className="text-lg font-bold text-red-800">Decline Order</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Please provide a reason for declining this Sales Order.
            <br />
            <span className="text-xs text-red-500 font-bold">
              Warning: This will release reserved inventory back to available
              stock.
            </span>
          </p>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm resize-none"
            rows={4}
            placeholder="Enter reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Decline
          </button>
        </div>
      </div>
    </div>
  );
};

// --- HELPER: Status Colors ---
const getStatusBadge = (status, declineReason = null) => {
  switch (status) {
    case "Draft":
      return (
        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-gray-300">
          <FileText size={10} /> Draft
        </span>
      );
    case "Pending Approval":
      return (
        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-amber-200">
          <AlertCircle size={10} /> Pending Approval
        </span>
      );
    case "Approved":
      return (
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-green-200">
          <CheckCircle size={10} /> Approved
        </span>
      );
    case "Declined":
      return (
        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-red-200">
          <XCircle size={10} /> Declined
          {declineReason && (
            <span
              className="text-[8px] text-red-600 ml-1 max-w-[100px] truncate"
              title={declineReason}
            >
              ({declineReason.substring(0, 15)}...)
            </span>
          )}
        </span>
      );
    case "Converted":
    case "Shipped":
      return (
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit uppercase border border-blue-200">
          <Truck size={10} /> {status}
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold w-fit uppercase">
          {status}
        </span>
      );
  }
};

const AllSalesOrders = () => {
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // New Tab State
  const [activeTab, setActiveTab] = useState("Draft");

  // UI State
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Modal States
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedOrderToVoid, setSelectedOrderToVoid] = useState(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedOrderToReject, setSelectedOrderToReject] = useState(null);

  // Get current user ID from Redux
  const currentUserId = useSelector(selectUserID);

  // --- Locations Logic ---
  const locations = useMemo(() => {
    const unique = [
      ...new Set(orderData.map((o) => o.locationName).filter(Boolean)),
    ].sort();
    return unique.length > 0 ? [...unique, "All"] : ["All"];
  }, [orderData]);

  useEffect(() => {
    if (locations.length > 0 && selectedLocation === "") {
      setSelectedLocation(locations[0] !== "All" ? locations[0] : "All");
    }
  }, [locations, selectedLocation]);

  // --- API Fetch ---
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/SalesOrders`);
      setOrderData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch Sales Orders.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---

  // 1. REQUEST APPROVAL
  const handleRequestApproval = async (order) => {
    if (
      !window.confirm(
        "Request approval for this order? It will be sent to the Approver.",
      )
    )
      return;

    try {
      setLoading(true);
      await axios.put(`${domain}/api/SalesOrders/request-approval/${order.id}`);
      toast.success("Approval Requested!");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to request approval.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. APPROVE
  const handleApprove = async (orderId) => {
    if (!window.confirm("Accept and Approve this Sales Order?")) return;

    try {
      setLoading(true);
      await axios.put(`${domain}/api/SalesOrders/approve/${orderId}`);
      toast.success("Order Approved!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve.");
    } finally {
      setLoading(false);
    }
  };

  // 3. DECLINE
  const handleRejectClick = (order) => {
    setSelectedOrderToReject(order);
    setIsRejectModalOpen(true);
  };

  const submitRejection = async (reason) => {
    if (!selectedOrderToReject) return;
    try {
      setLoading(true);
      await axios.put(
        `${domain}/api/SalesOrders/decline/${selectedOrderToReject.id}`,
        { reason: reason },
      );
      toast.success("Order Declined.");
      setIsRejectModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline.");
    } finally {
      setLoading(false);
    }
  };

  // 4. GENERATE DO
  const handleGenerateDO = async (order) => {
    if (order.status !== "Approved") {
      toast.error("Order must be Approved before generating DO.");
      return;
    }
    if (
      !window.confirm(`Generate Delivery Order for ${order.salesOrderNumber}?`)
    )
      return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${domain}/api/DeliveryOrders/generate-from-so/${order.id}`,
      );
      toast.success(`Success! Generated: ${response.data.doNumber}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || "Failed to generate Delivery Order.");
    } finally {
      setLoading(false);
    }
  };

  const openVoidModal = (order) => {
    setSelectedOrderToVoid(order);
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = async (transactionId, returnCondition) => {
    try {
      const payload = { returnCondition: returnCondition, voidBy: "Admin" };
      await axios.post(
        `${domain}/api/SalesOrders/revert/${transactionId}`,
        payload,
      );
      toast.success("Order Voided successfully.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revert Order.");
    }
  };

  const toggleRow = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // --- Filtering ---
  const filteredOrders = useMemo(() => {
    return orderData.filter((order) => {
      // 1. Search Filter
      const matchesSearch =
        order.salesOrderNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.quoteNumber &&
          order.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Location Filter
      const matchesLocation =
        selectedLocation === "All" ||
        order.locationName === selectedLocation ||
        selectedLocation === "";

      // 3. Tab Status Filter
      let matchesTab = true;

      if (activeTab === "Draft") {
        matchesTab = order.status === "Draft";
      } else if (activeTab === "For Approval") {
        matchesTab = order.status === "Pending Approval";
      } else if (activeTab === "Approved") {
        matchesTab = order.status === "Approved";
      } else if (activeTab === "Declined") {
        matchesTab = order.status === "Declined";
      }
      // "All" matches everything

      return matchesSearch && matchesLocation && matchesTab;
    });
  }, [searchTerm, orderData, selectedLocation, activeTab]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const isCurrentUserApprover = (order) => {
    return order.approverUserId === currentUserId;
  };

  // --- CONFIG: Tabs & Instructions ---
  const tabs = [
    { id: "Draft", label: "Drafts", icon: FileText },
    { id: "For Approval", label: "For Approval", icon: AlertCircle },
    { id: "Approved", label: "Approved", icon: CheckCircle },
    { id: "Declined", label: "Declined", icon: XCircle },
    { id: "All", label: "All Orders", icon: Layers },
  ];

  // Specific instructions
  const tabInstructions = {
    Draft: "Draft orders need to be submitted for approval.",
    "For Approval": "Orders currently awaiting the approver's decision.",
    Approved: "Orders ready for Delivery Order (DO) generation.",
    Declined: "Orders that have been rejected by the approver.",
    All: "A complete list of all Sales Orders.",
  };

  return (
    <div className="min-h-screen pb-12 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      <RejectOrderModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={submitRejection}
      />

      <RevertTransactionModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onConfirm={handleConfirmVoid}
        transactionId={selectedOrderToVoid?.id}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-indigo-600" /> Sales Orders
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Workflow: Draft &rarr; Request &rarr; Approve &rarr; Delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
              <FileText />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Drafts
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredOrders.filter((o) => o.status === "Draft").length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Pending
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {
                  filteredOrders.filter((o) => o.status === "Pending Approval")
                    .length
                }
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Approved
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredOrders.filter((o) => o.status === "Approved").length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Value
              </p>
              <p className="text-2xl font-bold text-slate-800">
                ₱
                {filteredOrders
                  .filter((x) => x.status === "Approved")
                  .reduce((acc, curr) => acc + curr.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="mb-2">
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1); // Reset pagination on tab change
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5"
                        : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon
                    size={16}
                    className={isActive ? "text-indigo-600" : "text-slate-400"}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- INSTRUCTION BOX (Dynamic) --- */}
        <div className="mb-6">
          <div className="bg-blue-50 text-blue-800 text-sm px-4 py-3 rounded-lg border border-blue-100 flex items-center gap-2">
            <Info size={18} className="text-blue-600" />
            <span className="font-medium">
              {tabInstructions[activeTab] || ""}
            </span>
          </div>
        </div>

        {/* Filters (Search & Location) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order #, Customer, or Quote #..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="relative min-w-[220px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-sm cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === "All" ? "All Locations" : loc}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleRow(item.id)}
                        className={`hover:bg-slate-50 transition cursor-pointer ${
                          expandedOrderId === item.id ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="px-4 py-4 text-center text-slate-400">
                          {expandedOrderId === item.id ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">
                            {item.salesOrderNumber}
                          </div>
                          {item.quoteNumber && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                              From: {item.quoteNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                            <MapPin size={14} /> {item.locationName || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">{item.customerName}</td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                          ₱{item.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            {getStatusBadge(item.status)}
                            {item.status === "Declined" &&
                              item.declineReason && (
                                <div className="relative group">
                                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs cursor-help">
                                    <Info size={10} />
                                  </div>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-100 text-red-700 text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Reason: {item.declineReason}
                                  </div>
                                </div>
                              )}
                          </div>
                        </td>

                        <td
                          className="px-6 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {/* 1. REQUEST APPROVAL BUTTON */}
                            {item.status === "Draft" && (
                              <button
                                onClick={() => handleRequestApproval(item)}
                                title="Request Approval"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium  text-blue-700  bg-blue-50  rounded-md hover:bg-blue-100 transition"
                              >
                                <Send size={14} />
                                Approval
                              </button>
                            )}

                            {/* 2. APPROVER BUTTONS */}
                            {item.status === "Pending Approval" &&
                              isCurrentUserApprover(item) && (
                                <>
                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    title="Accept"
                                  >
                                    <ThumbsUp size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(item)}
                                    className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    title="Decline"
                                  >
                                    <ThumbsDown size={16} />
                                  </button>
                                </>
                              )}

                            {/* 3. GENERATE DO BUTTON (Hidden unless Approved) */}
                            {item.status === "Approved" && (
                              <button
                                onClick={() => handleGenerateDO(item)}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                title="Generate Delivery Order"
                              >
                                <Truck size={14} /> Generate DO
                              </button>
                            )}

                            {/* 4. VOID BUTTON */}
                            {!item.isVoid &&
                              item.status !== "Declined" &&
                              item.status !== "Shipped" && (
                                <button
                                  onClick={() => openVoidModal(item)}
                                  className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 hover:text-red-500 ml-2"
                                  title="Void Order"
                                >
                                  <Ban size={16} />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>

                      {/* --- EXPANDED DETAILS --- */}
                      {expandedOrderId === item.id && (
                        <tr className="bg-slate-50">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="bg-white rounded border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="col-span-1 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <UserCheck size={12} /> Assigned Approver
                                </span>
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.approverName || "System / N/A"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Approver ID:{" "}
                                  {item.approverId || "Not assigned"}
                                </p>
                                {isCurrentUserApprover(item) && (
                                  <p className="text-xs text-green-600 font-medium">
                                    ✓ You are the assigned approver
                                  </p>
                                )}
                              </div>
                              <div className="col-span-2 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <Info size={12} /> Status Check
                                </span>
                                <div className="flex items-center gap-3">
                                  {/* Step 1 */}
                                  <div
                                    className={`text-xs px-2 py-1 rounded ${
                                      item.status !== "Draft"
                                        ? "text-green-600 bg-green-50"
                                        : "text-blue-600 bg-blue-50 font-bold"
                                    }`}
                                  >
                                    1. Draft
                                  </div>
                                  <span>&rarr;</span>
                                  {/* Step 2 */}
                                  <div
                                    className={`text-xs px-2 py-1 rounded ${
                                      item.status === "Pending Approval"
                                        ? "text-amber-700 bg-amber-50 font-bold"
                                        : item.status === "Approved" ||
                                            item.status === "Shipped"
                                          ? "text-green-600 bg-green-50"
                                          : "text-gray-400"
                                    }`}
                                  >
                                    2. Approval
                                  </div>
                                  <span>&rarr;</span>
                                  {/* Step 3 */}
                                  <div
                                    className={`text-xs px-2 py-1 rounded ${
                                      item.status === "Approved"
                                        ? "text-blue-600 bg-blue-50 font-bold"
                                        : item.status === "Shipped"
                                          ? "text-green-600 bg-green-50"
                                          : "text-gray-400"
                                    }`}
                                  >
                                    3. Delivery Order
                                  </div>
                                </div>
                                {item.status === "Declined" &&
                                  item.declineReason && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                      <span className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-1">
                                        <AlertCircle size={10} /> Decline Reason
                                      </span>
                                      <p className="text-sm text-red-700 mt-1">
                                        {item.declineReason}
                                      </p>
                                    </div>
                                  )}
                              </div>

                              {/* NEW: PRODUCTS TABLE IN EXPANDED VIEW */}
                              <div className="col-span-4 border-t border-slate-100 pt-3 mt-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                  <Package size={12} /> Order Items
                                </h4>
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                  <table className="w-full text-xs text-left text-slate-600">
                                    <thead className="bg-slate-50 text-slate-500">
                                      <tr>
                                        <th className="px-3 py-2">
                                          Product Name
                                        </th>
                                        <th className="px-3 py-2 text-center">
                                          Qty
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                          Unit Price
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {item.salesOrderItems.map((prod) => (
                                        <tr key={prod.id}>
                                          <td className="px-3 py-2 font-medium text-slate-800">
                                            {prod.productName}
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            {prod.quantity}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            ₱{prod.unitPrice.toLocaleString()}
                                          </td>
                                          <td className="px-3 py-2 text-right font-medium">
                                            ₱{prod.lineTotal.toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* FULL ACTIONS BAR */}
                              <div className="col-span-4 border-t border-slate-100 pt-3 mt-1 flex justify-end gap-3">
                                {item.status === "Draft" ? (
                                  <button
                                    onClick={() => handleRequestApproval(item)}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
                                  >
                                    <Send size={16} /> Request Approval
                                  </button>
                                ) : item.status === "Pending Approval" &&
                                  isCurrentUserApprover(item) ? (
                                  <>
                                    <button
                                      onClick={() => handleRejectClick(item)}
                                      className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-sm font-medium rounded-lg flex items-center gap-2"
                                    >
                                      <ThumbsDown size={16} /> Decline
                                    </button>
                                    <button
                                      onClick={() => handleApprove(item.id)}
                                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
                                    >
                                      <ThumbsUp size={16} /> Approve (Enable DO)
                                    </button>
                                  </>
                                ) : (
                                  // ONLY SHOW GENERATE IF APPROVED
                                  item.status === "Approved" && (
                                    <button
                                      onClick={() => handleGenerateDO(item)}
                                      className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm"
                                    >
                                      <Truck size={16} /> Generate Delivery
                                      Order
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No orders found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden grid gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200"
                >
                  <div
                    className="flex justify-between items-start mb-2 cursor-pointer"
                    onClick={() => toggleRow(item.id)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 text-indigo-600">
                        {expandedOrderId === item.id ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-base">
                          {item.salesOrderNumber}
                        </span>
                        {item.quoteNumber && (
                          <div className="text-xs text-slate-500 font-medium">
                            From: {item.quoteNumber}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium mt-1">
                          <MapPin size={10} /> {item.locationName}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-slate-800 font-bold">
                      ₱{item.totalAmount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* 1. Request */}
                      {item.status === "Draft" && (
                        <button
                          onClick={() => handleRequestApproval(item)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-1"
                        >
                          Request
                        </button>
                      )}
                      {/* 2. Decision (Only for assigned approver) */}
                      {item.status === "Pending Approval" &&
                        isCurrentUserApprover(item) && (
                          <>
                            <button
                              onClick={() => handleRejectClick(item)}
                              className="p-2 bg-red-50 text-red-600 rounded border border-red-100"
                            >
                              <ThumbsDown size={16} />
                            </button>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="p-2 bg-green-600 text-white rounded"
                            >
                              <ThumbsUp size={16} />
                            </button>
                          </>
                        )}
                      {/* 3. Action - ONLY IF APPROVED */}
                      {item.status === "Approved" && (
                        <button
                          onClick={() => handleGenerateDO(item)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded flex items-center gap-1"
                        >
                          <Truck size={14} /> Generate DO
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredOrders.length}
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

export default AllSalesOrders;
