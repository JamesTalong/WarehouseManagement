// src/components/YourModule/SalesQuotationModule/AllSalesQuotations.jsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
  FileText,
  Search,
  XCircle,
  BarChart2,
  User,
  Calendar,
  DollarSign,
  Printer,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  MapPin,
  ChevronDown,
  Layers, // Added for 'All' tab icon
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddSalesOrder from "../../SalesOrders/SalesOrderModule/AddSalesOrder";
import Pagination from "../../Pagination";

import { domain } from "../../../../security";
import SalesQuotationPrint from "../../POS/SalesQuotationPrint";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const StatusBadge = ({ status }) => {
  const currentStatus = status || "Open";
  let styles = "bg-blue-100 text-blue-700";
  let icon = <FileText size={12} />;

  if (currentStatus === "Converted") {
    styles = "bg-green-100 text-green-700";
    icon = <CheckCircle size={12} />;
  } else if (currentStatus === "Cancelled") {
    styles = "bg-red-100 text-red-700";
    icon = <AlertCircle size={12} />;
  }

  return (
    <span
      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${styles}`}
    >
      {icon} {currentStatus}
    </span>
  );
};

// --- Updated Mobile Card View ---
const QuotationCard = ({ quote, onCancel, onPrint, onConvertToOrder }) => {
  const isLocked = quote.status === "Converted" || quote.status === "Cancelled";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <FileText size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-base block">
              {quote.quoteNumber}
            </span>
            <span className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
              <MapPin size={12} /> {quote.locationName || "N/A"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={quote.status} />
          <span className="text-xs text-slate-400 mt-1">
            {formatDate(quote.date)}
          </span>
        </div>
      </div>

      <div className="mb-3 p-2 bg-slate-50 rounded border border-slate-100 space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User size={14} className="text-slate-400" />
          <span className="font-medium truncate">
            {quote.customer?.customerName || "Unknown Customer"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200 mt-1">
          <span className="text-slate-500 font-semibold">Total Value:</span>
          <span className="font-bold text-green-700">
            {formatCurrency(quote.totalAmount)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {!isLocked && (
          <button
            onClick={() => onConvertToOrder(quote)}
            className="flex-1 py-2 border border-blue-100 text-blue-600 rounded bg-blue-50/50 hover:bg-blue-50 text-xs font-bold flex justify-center items-center gap-1"
          >
            <ShoppingCart size={14} /> ORDER
          </button>
        )}
        <button
          onClick={() => onPrint(quote)}
          className="flex-1 py-2 border border-slate-200 text-slate-600 rounded bg-white hover:bg-slate-50 text-xs font-bold flex justify-center items-center gap-1"
        >
          <Printer size={14} /> PRINT
        </button>
        {!isLocked && (
          <button
            onClick={() => onCancel(quote.id)}
            className="flex-1 py-2 border border-red-100 text-red-600 rounded bg-red-50/50 hover:bg-red-50 text-xs font-bold flex justify-center items-center gap-1"
          >
            <XCircle size={14} /> CANCEL
          </button>
        )}
      </div>
    </div>
  );
};

const AllSalesQuotations = () => {
  const [quotationData, setQuotationData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Filter States ---
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeTab, setActiveTab] = useState("Open"); // Added Tab State

  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [quotePrintData, setQuotePrintData] = useState(null);
  const quotePrintRef = useRef();

  const handlePrintAction = useReactToPrint({
    content: () => quotePrintRef.current,
    documentTitle: "Sales Quotation",
  });

  const handlePrintClick = (quote) => {
    setQuotePrintData(quote);
    setTimeout(() => {
      handlePrintAction();
    }, 200);
  };

  // --- 2. Extract Unique Locations Logic ---
  const locations = useMemo(() => {
    const unique = [
      ...new Set(quotationData.map((q) => q.locationName).filter(Boolean)),
    ].sort();
    return unique.length > 0 ? [...unique, "All"] : ["All"];
  }, [quotationData]);

  // --- 3. Auto-select Default Location ---
  useEffect(() => {
    if (locations.length > 0 && selectedLocation === "") {
      setSelectedLocation(locations[0] !== "All" ? locations[0] : "All");
    }
  }, [locations, selectedLocation]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const apiUrl = `${domain}/api/SalesQuotations`;
    try {
      const response = await axios.get(apiUrl);
      setQuotationData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Sales Quotations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 4. Updated Filter Logic (Search + Location + Tab) ---
  const filteredQuotes = useMemo(() => {
    return quotationData.filter((q) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        q.quoteNumber?.toLowerCase().includes(searchLower) ||
        q.customer?.customerName?.toLowerCase().includes(searchLower) ||
        q.fullName?.toLowerCase().includes(searchLower);

      // Location
      const matchesLocation =
        selectedLocation === "All" ||
        q.locationName === selectedLocation ||
        selectedLocation === "";

      // Tab Status
      // Note: Usually "Open" or null implies active/draft.
      const currentStatus = q.status || "Open";
      let matchesTab = true;

      if (activeTab !== "All") {
        matchesTab = currentStatus === activeTab;
      }

      return matchesSearch && matchesLocation && matchesTab;
    });
  }, [searchTerm, quotationData, selectedLocation, activeTab]);

  const totalAmount = filteredQuotes.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0,
  );

  const cancelQuotation = async (id) => {
    if (!window.confirm("Are you sure you want to CANCEL this quotation?"))
      return;
    try {
      await axios.put(`${domain}/api/SalesQuotations/cancel/${id}`, {});
      toast.success("Quotation Cancelled Successfully!");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel Quotation.",
      );
    }
  };

  const openOrderModal = (quote) => {
    if (quote.status === "Converted") {
      toast.info("Already converted to Order.");
      return;
    }
    if (quote.status === "Cancelled") {
      toast.error("Quotation is cancelled.");
      return;
    }
    setSelectedQuoteForOrder(quote);
    setIsOrderModalVisible(true);
  };

  const closeOrderModal = () => {
    setIsOrderModalVisible(false);
    setSelectedQuoteForOrder(null);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Define Tabs Configuration
  const tabs = [
    { id: "Open", label: "Open", icon: FileText },
    { id: "Converted", label: "Converted", icon: CheckCircle },
    { id: "Cancelled", label: "Cancelled", icon: AlertCircle },
    { id: "All", label: "All Quotes", icon: Layers },
  ];

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" /> Sales Quotations
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage customer quotations and pricing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Filtered Quotes
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredQuotes.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <DollarSign />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Filtered Value
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="mb-6">
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

        {/* SEARCH & LOCATION FILTER */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Quote # or Customer..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* --- Location Dropdown --- */}
            <div className="relative min-w-[220px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-sm text-slate-700 cursor-pointer transition-shadow"
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
                    <th className="px-6 py-4">Quote #</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => {
                    const isLocked =
                      item.status === "Converted" ||
                      item.status === "Cancelled";
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.quoteNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                            <MapPin size={14} /> {item.locationName || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.customer?.customerName}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {formatCurrency(item.totalAmount)}
                        </td>

                        {/* --- UPDATED ACTIONS COLUMN --- */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* 1. PRIMARY ACTION: GENERATE SO (New Design) */}
                            {!isLocked && (
                              <button
                                onClick={() => openOrderModal(item)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold uppercase rounded hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                              >
                                <ShoppingCart size={14} />
                                Generate SO
                              </button>
                            )}

                            {/* 2. SECONDARY ACTIONS (Icons) */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handlePrintClick(item)}
                                title="Print"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              >
                                <Printer size={18} />
                              </button>

                              {!isLocked && (
                                <button
                                  onClick={() => cancelQuotation(item.id)}
                                  title="Cancel"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <XCircle size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center text-slate-400 flex flex-col items-center justify-center"
                      >
                        <AlertCircle size={40} className="mb-2 opacity-50" />
                        No quotations found for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentItems.map((item) => (
                <QuotationCard
                  key={item.id}
                  quote={item}
                  onCancel={cancelQuotation}
                  onPrint={handlePrintClick}
                  onConvertToOrder={openOrderModal}
                />
              ))}
              {currentItems.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  No results found in this tab.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredQuotes.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {isOrderModalVisible && (
        <AddSalesOrder
          onClose={closeOrderModal}
          sourceQuote={selectedQuoteForOrder}
          refreshData={fetchData}
        />
      )}

      <div style={{ display: "none" }}>
        <SalesQuotationPrint ref={quotePrintRef} data={quotePrintData} />
      </div>
    </div>
  );
};

export default AllSalesQuotations;
