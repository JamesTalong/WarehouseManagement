// src/components/YourModule/PurchaseOrderModule/AllPurchaseOrders.jsx

import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
  Package,
  Eye,
  Printer,
  Archive,
  Clock,
  MapPin,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import Loader from "../../../loader/Loader";
import AddPurchaseOrder from "./AddPurchaseOrder";
import Pagination from "../../Pagination";
import RejectItemModal from "./RejectItemModal";
import { domain } from "../../../../security";
import ViewRejectionModal from "./ViewRejectionModal";
import PrintPurchaseOrder from "./PrintPurchaseOrder";
import POApprovalActions from "./POApprovalActions";
import { selectUserID } from "../../../../redux/IchthusSlice";

// --- Helper to calculate Original Total based on Ordered Qty ---
const calculateOriginalTotal = (po) => {
  if (!po || !po.purchaseOrderLineItems) return 0;

  // 1. Sum up the Original Subtotal (OrderedQty * UnitPrice)
  const originalSubtotal = po.purchaseOrderLineItems.reduce((acc, item) => {
    const qty = item.orderedQuantity || item.quantity || 0;
    const price = item.unitPrice || 0;
    return acc + qty * price;
  }, 0);

  // 2. Re-calculate Tax Deductions (EWT) if applicable
  // We use current flags to assume if it was originally taxable
  let originalEwt = 0;
  if (po.ewt > 0) {
    // If VAT exists, Tax Base is Net (Gross/1.12), otherwise it's Gross
    const taxBase = po.vat > 0 ? originalSubtotal / 1.12 : originalSubtotal;
    originalEwt = taxBase * 0.01; // Assuming 1% EWT
  }

  // 3. Original Grand Total = Subtotal + Shipping - EWT
  return originalSubtotal + (po.shippingCost || 0) - originalEwt;
};

// --- Price Display Component ---
const PriceDisplay = ({ currentTotal, originalTotal, currency }) => {
  const hasChanged = Math.abs(currentTotal - originalTotal) > 0.1; // Tolerance for float math

  return (
    <div className="flex flex-col items-end">
      <span className="font-bold text-gray-900">
        {formatCurrency(currentTotal, currency)}
      </span>
      {hasChanged && (
        <span className="text-xs text-gray-400 line-through">
          {formatCurrency(originalTotal, currency)}
        </span>
      )}
    </div>
  );
};

const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// --- Design Component: Status Badge ---
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "closed")
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle size={12} />,
      };
    if (s.includes("draft"))
      return {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <FileText size={12} />,
      };
    if (s === "pending")
      return {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock size={12} />,
      };
    if (s === "rejected")
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle size={12} />,
      };
    return {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <Info size={12} />,
    };
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.icon}
      <span>{status}</span>
    </div>
  );
};

// --- Mobile Card Component ---
const MobilePOCard = ({
  po,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onDevDelete,
  onRejectItem,
  onPrint,
  currentUserId,
  refreshData,
}) => {
  const originalTotal = calculateOriginalTotal(po);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => onToggle(po.id)}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{po.poNumber}</h3>
                  <p className="text-sm text-gray-500">
                    {po.vendorDetails?.vendorName || po.vendor}
                  </p>
                </div>
              </div>
              {po.isStaging && (
                <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Draft
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={po.status} />
            <div className="mt-2">
              {/* Updated Price Display */}
              <PriceDisplay
                currentTotal={po.grandTotal}
                originalTotal={originalTotal}
                currency={po.currency}
              />
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 mb-4 bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <span>
                Location: <strong>{po.location || "N/A"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span>
                Approver: <strong>{po.approverName || "N/A"}</strong>
              </span>
            </div>
          </div>

          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <Package size={16} /> Order Items
          </h4>

          <div className="space-y-3">
            {po.purchaseOrderLineItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {item.productName}
                  </span>
                  <span className="font-bold text-sm">
                    {item.rejectedQuantity > 0 ? (
                      <span className="flex items-center gap-1">
                        <span>
                          {formatCurrency(
                            ((item.orderedQuantity || item.quantity) -
                              item.rejectedQuantity) *
                              item.unitPrice,
                            po.currency,
                          )}
                        </span>
                        <span className="text-xs text-red-500">
                          (-
                          {formatCurrency(
                            item.rejectedQuantity * item.unitPrice,
                            po.currency,
                          )}
                          )
                        </span>
                      </span>
                    ) : (
                      formatCurrency(item.lineTotal, po.currency)
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                  <span>
                    Qty: {item.orderedQuantity || item.quantity}{" "}
                    {item.unitOfMeasure}
                  </span>
                  <span>
                    Price: {formatCurrency(item.unitPrice, po.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => onPrint(po)}
              className="flex-1 py-2.5 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Print
            </button>

            {po.isStaging ? (
              <div className="flex-1">
                <POApprovalActions
                  po={po}
                  currentUserId={currentUserId}
                  refreshData={refreshData}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ) : (
              <>
                {po.status !== "Closed" && (
                  <button
                    onClick={() => onEdit(po)}
                    className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => onDelete(po.id)}
                  className="flex-1 py-2.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AllPurchaseOrders = () => {
  const currentUserId = useSelector(selectUserID);

  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [poToEdit, setPoToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedLocation, setSelectedLocation] = useState("");

  const [expandedPO, setExpandedPO] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("temp");

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState({
    lineItem: null,
    headerId: null,
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [itemToView, setItemToView] = useState(null);

  const [printData, setPrintData] = useState(null);
  const printPORef = useRef();

  const locations = useMemo(() => {
    const unique = [
      ...new Set(poData.map((po) => po.location).filter(Boolean)),
    ].sort();
    return ["All", ...unique];
  }, [poData]);

  useEffect(() => {
    if (locations.length > 0 && selectedLocation === "") {
      setSelectedLocation("All");
    }
  }, [locations, selectedLocation]);

  const handlePrintPO = useReactToPrint({
    content: () => printPORef.current,
    documentTitle: `PO_${printData?.poNumber || "Document"}`,
  });

  const triggerPrint = (po) => {
    setPrintData(po);
    setTimeout(() => {
      handlePrintPO();
    }, 300);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [liveResponse, stagingResponse] = await Promise.all([
        axios.get(`${domain}/api/PurchaseOrderHeaders`),
        axios.get(`${domain}/api/PurchaseOrderStaging`),
      ]);

      const liveOrders = liveResponse.data.map((po) => ({
        ...po,
        isStaging: false,
        vendor: po.vendorDetails?.vendorName || po.vendor,
      }));

      const stagingOrders = stagingResponse.data.map((draft) => ({
        ...draft,
        poNumber: `TMP-${draft.id}`,
        isStaging: true,
        vendor: draft.vendorDetails?.vendorName || draft.vendor,
        purchaseOrderLineItems: draft.purchaseOrderLineItems || [],
      }));

      const combinedData = [...stagingOrders, ...liveOrders].sort(
        (a, b) => b.id - a.id,
      );

      setPoData(combinedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch purchase orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openRejectModal = (item, headerId) => {
    setItemToReject({ lineItem: item, headerId: headerId });
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setItemToReject({ lineItem: null, headerId: null });
  };

  const openViewModal = (item) => {
    setItemToView(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setItemToView(null);
  };

  const handleRejectSubmit = async (totalRejectedQty, reason, image) => {
    if (!itemToReject.lineItem || !itemToReject.headerId) return;
    setLoading(true);
    try {
      const apiUrl = `${domain}/api/PurchaseOrderHeaders/${itemToReject.headerId}/lineitems/${itemToReject.lineItem.id}/reject`;
      const payload = {
        TotalRejectedQuantity: parseInt(totalRejectedQty),
        ReasonDescription: reason || "",
        ReasonImage: image || null,
      };
      await axios.post(apiUrl, payload);
      toast.success("Rejection status updated successfully!");
      closeRejectModal();
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update rejection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseOrder = async (id) => {
    const targetPO = poData.find((p) => p.id === id);
    if (!targetPO) return;
    if (!window.confirm("Are you sure you want to delete this purchase order?"))
      return;

    try {
      const endpoint = targetPO.isStaging
        ? `${domain}/api/PurchaseOrderStaging/${id}`
        : `${domain}/api/PurchaseOrderHeaders/${id}`;

      await axios.delete(endpoint);
      toast.success("Purchase Order Deleted!");
      if (expandedPO === id) setExpandedPO(null);
      fetchData();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(
          error.response.data.message ||
            "Cannot delete: items have been received (GN exists).",
        );
      } else {
        toast.error("Failed to delete purchase order.");
      }
    }
  };

  const handleDeveloperDelete = async (id) => {
    if (
      !window.confirm(
        "⚠️ DEVELOPER DELETE WARNING ⚠️\n\nThis will permanently delete the PO AND ALL associated Goods Notes.\n\nAre you sure?",
      )
    )
      return;
    setLoading(true);
    try {
      await axios.delete(
        `${domain}/api/PurchaseOrderHeaders/developersDelete/${id}`,
      );
      toast.success("Developer Delete Successful: PO and GNs removed.");
      if (expandedPO === id) setExpandedPO(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Developer delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const tabFilteredPOs = poData.filter((po) => {
    if (activeTab === "temp") return po.isStaging;
    if (activeTab === "open") return !po.isStaging && po.status !== "Closed";
    if (activeTab === "closed") return !po.isStaging && po.status === "Closed";
    return false;
  });

  const filteredPOs = tabFilteredPOs.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorDetails?.vendorName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesLocation =
      selectedLocation === "All" ||
      po.location === selectedLocation ||
      selectedLocation === "";

    return matchesSearch && matchesLocation;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPOs = filteredPOs.slice(indexOfFirstItem, indexOfLastItem);

  const openModal = (po = null) => {
    setPoToEdit(po);
    setIsModalVisible(true);
  };
  const closeModal = () => {
    setIsModalVisible(false);
    setPoToEdit(null);
  };
  const toggleExpandPO = (poId) =>
    setExpandedPO(expandedPO === poId ? null : poId);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen pb-12 bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Purchase Orders
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your purchase orders and drafts
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={20} />
              Create New PO
            </button>
          </div>

          <div className="flex gap-1 mt-8 p-1 bg-gray-100 rounded-xl max-w-max">
            <button
              onClick={() => handleTabChange("temp")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "temp"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Drafts ({poData.filter((p) => p.isStaging).length})
            </button>
            <button
              onClick={() => handleTabChange("open")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "open"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock size={16} />
                Open (
                {
                  poData.filter((p) => !p.isStaging && p.status !== "Closed")
                    .length
                }
                )
              </span>
            </button>
            <button
              onClick={() => handleTabChange("closed")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "closed"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Archive size={16} />
                Closed (
                {
                  poData.filter((p) => !p.isStaging && p.status === "Closed")
                    .length
                }
                )
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by PO Number or Vendor..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === "All" ? "All Locations" : loc}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-6 py-4"></th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                      PO Number
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                      Vendor
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                      Date
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">
                      Amount
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-xs text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentPOs.map((po) => (
                    <React.Fragment key={po.id}>
                      <tr
                        onClick={() => toggleExpandPO(po.id)}
                        className={`hover:bg-gray-50 transition cursor-pointer ${
                          expandedPO === po.id ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          <button className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                            {expandedPO === po.id ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {po.poNumber}
                            </span>
                            {po.isStaging && (
                              <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                DRAFT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {po.vendorDetails?.vendorName || po.vendor}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {po.vendorDetails?.vendorCode || ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {formatDate(po.creationDate)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* Updated Price Display in Table */}
                          <PriceDisplay
                            currentTotal={po.grandTotal}
                            originalTotal={calculateOriginalTotal(po)}
                            currency={po.currency}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {po.isStaging ? (
                              <>
                                <POApprovalActions
                                  po={po}
                                  currentUserId={currentUserId}
                                  refreshData={fetchData}
                                  onEdit={openModal}
                                  onDelete={deletePurchaseOrder}
                                />
                                <button
                                  onClick={() => triggerPrint(po)}
                                  title="Print PO"
                                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                                >
                                  <Printer size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => triggerPrint(po)}
                                  title="Print PO"
                                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                                >
                                  <Printer size={18} />
                                </button>
                                {po.status !== "Closed" && (
                                  <button
                                    onClick={() => openModal(po)}
                                    title="Edit Order"
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                  >
                                    <Edit size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deletePurchaseOrder(po.id)}
                                  title="Delete Order (Safe)"
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedPO === po.id && (
                        <tr>
                          <td colSpan="7" className="bg-gray-50 p-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                              {/* Header Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="space-y-1">
                                  <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                                    <MapPin size={12} /> Location
                                  </span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {po.location || "N/A"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                                    <Calendar size={12} /> Delivery Date
                                  </span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDate(po.expectedDeliveryDate)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                                    <User size={12} /> Approver
                                  </span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {po.approverName || "N/A"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                                    <CreditCard size={12} /> Payment Terms
                                  </span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {po.paymentTerms || "N/A"}
                                  </p>
                                </div>
                                {po.internalNotes && (
                                  <div className="col-span-1 md:col-span-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <span className="text-xs text-yellow-800 font-bold uppercase block mb-1">
                                      Internal Notes
                                    </span>
                                    <p className="text-sm text-yellow-900">
                                      {po.internalNotes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                                <Package size={16} /> Order Items
                              </h4>

                              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-sm text-left text-gray-600">
                                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs">
                                    <tr>
                                      <th className="px-4 py-3">Product</th>
                                      <th className="px-4 py-3">Quantity</th>
                                      <th className="px-4 py-3 text-right">
                                        Unit Price
                                      </th>
                                      {!po.isStaging && (
                                        <>
                                          <th className="px-4 py-3 text-green-600 text-center">
                                            Received
                                          </th>
                                          <th className="px-4 py-3 text-red-600 text-center">
                                            Rejected
                                          </th>
                                        </>
                                      )}
                                      <th className="px-4 py-3 text-right text-gray-400">
                                        Original PO
                                      </th>
                                      <th className="px-4 py-3 text-right">
                                        Line Total
                                      </th>
                                      {!po.isStaging && (
                                        <th className="px-4 py-3 text-center">
                                          Action
                                        </th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {po.purchaseOrderLineItems.map((item) => {
                                      const qty =
                                        item.orderedQuantity || item.quantity;
                                      const originalAmount =
                                        qty * item.unitPrice;

                                      return (
                                        <tr
                                          key={item.id}
                                          className="hover:bg-gray-50"
                                        >
                                          <td className="px-4 py-3 font-medium text-gray-900">
                                            {item.productName}
                                          </td>
                                          <td className="px-4 py-3">
                                            {qty} {item.unitOfMeasure}
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            {formatCurrency(
                                              item.unitPrice,
                                              po.currency,
                                            )}
                                          </td>
                                          {!po.isStaging && (
                                            <>
                                              <td className="px-4 py-3 text-green-600 text-center font-bold">
                                                {item.receivedQuantity || 0}
                                              </td>
                                              <td className="px-4 py-3 text-red-600 text-center font-bold">
                                                {item.rejectedQuantity || 0}
                                              </td>
                                            </>
                                          )}
                                          <td className="px-4 py-3 text-right text-gray-400">
                                            {formatCurrency(
                                              originalAmount,
                                              po.currency,
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {item.rejectedQuantity > 0 ? (
                                              <div>
                                                <span>
                                                  {formatCurrency(
                                                    (qty -
                                                      item.rejectedQuantity) *
                                                      item.unitPrice,
                                                    po.currency,
                                                  )}
                                                </span>
                                              </div>
                                            ) : (
                                              formatCurrency(
                                                item.lineTotal,
                                                po.currency,
                                              )
                                            )}
                                          </td>
                                          {!po.isStaging && (
                                            <td className="px-4 py-3 text-center">
                                              <div className="flex items-center justify-center gap-2">
                                                {item.rejectedQuantity > 0 && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openViewModal(item);
                                                    }}
                                                    title="View"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                  >
                                                    <Eye size={16} />
                                                  </button>
                                                )}

                                                {po.status !== "Closed" && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openRejectModal(
                                                        item,
                                                        po.id,
                                                      );
                                                    }}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                                  >
                                                    Reject
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex justify-end">
                                <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>Shipping Cost:</span>
                                    <span className="font-medium">
                                      {formatCurrency(
                                        po.shippingCost,
                                        po.currency,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>VAT:</span>
                                    <span className="font-medium">
                                      {formatCurrency(po.vat, po.currency)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>EWT (Withholding):</span>
                                    <span className="text-red-500 font-medium">
                                      -{formatCurrency(po.ewt, po.currency)}
                                    </span>
                                  </div>

                                  {/* --- REJECTION DETAILS --- */}
                                  {po.purchaseOrderLineItems.some(
                                    (i) => i.rejectedQuantity > 0,
                                  ) && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                      <span>Rejected Amount:</span>
                                      <span className="text-red-500 font-medium">
                                        -
                                        {formatCurrency(
                                          po.purchaseOrderLineItems.reduce(
                                            (sum, item) =>
                                              sum +
                                              (item.rejectedQuantity || 0) *
                                                (item.unitPrice || 0),
                                            0,
                                          ),
                                          po.currency,
                                        )}
                                      </span>
                                    </div>
                                  )}

                                  <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between text-base font-bold text-gray-900">
                                    <span>Grand Total:</span>
                                    {/* Updated Price Display in Expanded View */}
                                    <PriceDisplay
                                      currentTotal={po.grandTotal}
                                      originalTotal={calculateOriginalTotal(po)}
                                      currency={po.currency}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {currentPOs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={24} className="text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            No orders found
                          </h3>
                          <p className="text-gray-500 mt-1">
                            {searchTerm
                              ? "Try adjusting your search terms."
                              : `No ${activeTab === "temp" ? "drafts" : activeTab === "closed" ? "closed orders" : "open orders"} available.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden">
              {currentPOs.map((po) => (
                <MobilePOCard
                  key={po.id}
                  po={po}
                  expanded={expandedPO === po.id}
                  onToggle={toggleExpandPO}
                  onEdit={openModal}
                  onDelete={deletePurchaseOrder}
                  onDevDelete={handleDeveloperDelete}
                  onRejectItem={openRejectModal}
                  onPrint={triggerPrint}
                  currentUserId={currentUserId}
                  refreshData={fetchData}
                />
              ))}
              {currentPOs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                  No orders found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredPOs.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ display: "none" }}>
        <PrintPurchaseOrder ref={printPORef} po={printData} />
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <AddPurchaseOrder
              onClose={closeModal}
              refreshData={fetchData}
              poToEdit={poToEdit}
            />
          </div>
        </div>
      )}

      <RejectItemModal
        isOpen={isRejectModalOpen}
        onClose={closeRejectModal}
        onSubmit={handleRejectSubmit}
        lineItem={itemToReject.lineItem}
      />
      <ViewRejectionModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        lineItem={itemToView}
      />
    </div>
  );
};

export default AllPurchaseOrders;
