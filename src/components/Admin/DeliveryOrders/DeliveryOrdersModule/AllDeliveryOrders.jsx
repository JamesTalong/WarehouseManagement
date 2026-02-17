import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
// UPDATE THIS PATH to match your actual Redux slice location
import { selectUserID } from "../../../../redux/IchthusSlice";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Truck,
  Search,
  CheckCircle,
  XCircle,
  Package,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  MapPin,
  User,
  Info,
  AlertTriangle,
  FileText,
  Layers,
  DollarSign,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

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

const AllDeliveryOrders = () => {
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

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
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
      // Search
      const matchesSearch =
        item.deliveryOrderNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.salesOrderNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Location
      const matchesLoc =
        selectedLocation === "All" || item.locationName === selectedLocation;

      // Tabs
      let matchesTab = true;
      if (activeTab === "Sold") matchesTab = !item.isVoid;
      else if (activeTab === "Voided") matchesTab = item.isVoid;

      return matchesSearch && matchesLoc && matchesTab;
    });
  }, [searchTerm, doData, selectedLocation, activeTab]);

  const tabs = [
    { id: "Sold", label: "Settled Orders", icon: DollarSign },
    { id: "Voided", label: "Voided / Returns", icon: RotateCcw },
    { id: "All", label: "All Transactions", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-12 relative">
      <ToastContainer autoClose={2000} position="top-right" />

      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-emerald-600" /> Delivery Orders
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Logged in as ID: {currentUserId}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 mt-6">
        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Settled Count
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {doData.filter((x) => !x.isVoid).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Total Net Value
              </p>
              <p className="text-2xl font-bold text-slate-800">
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
              <XCircle />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                Voided/Returned
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {doData.filter((x) => x.isVoid).length}
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
                .filter(Boolean)
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
                    <th className="px-6 py-4 text-right">Settlement</th>
                    <th className="px-6 py-4 text-center">Status</th>
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
                            </div>
                            {/* NEW: Show SO and Quote Numbers */}
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
                          <td className="px-6 py-4 text-right">
                            <div className="font-black text-slate-900 text-base">
                              ₱{item.totalAmount.toLocaleString()}
                            </div>
                            {item.hasVat && (
                              <div className="text-[8px] font-black text-emerald-500 uppercase">
                                VAT Applied
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(item.isVoid ? "Voided" : "Sold")}
                          </td>
                        </tr>

                        {/* --- EXPANDED VIEW --- */}
                        {expandedRow === item.id && (
                          <tr className="bg-slate-50">
                            <td colSpan="5" className="px-10 py-6">
                              <div className="border-l-4 border-emerald-500 bg-white p-6 rounded shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* 1. Item Breakdown Table */}
                                <div className="lg:col-span-2 space-y-4">
                                  <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                    <Package size={16} /> Fulfillment Details
                                  </h4>
                                  <div className="overflow-hidden rounded-lg border border-slate-100">
                                    <table className="w-full text-xs">
                                      <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                                        <tr>
                                          <th className="p-3 text-left">
                                            Product
                                          </th>
                                          <th className="p-3 text-center">
                                            Expected
                                          </th>
                                          <th className="p-3 text-center">
                                            Returned
                                          </th>
                                          <th className="p-3 text-center text-emerald-600">
                                            Net Received
                                          </th>
                                          <th className="p-3 text-right">
                                            Price
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {item.deliveryOrderItems.map((prod) => (
                                          <tr
                                            key={prod.id}
                                            className="hover:bg-slate-50/50"
                                          >
                                            <td className="p-3 font-bold text-slate-700">
                                              {prod.productName}
                                              <p className="text-[9px] text-slate-400 font-black uppercase">
                                                {prod.priceType || "Standard"}
                                              </p>
                                            </td>
                                            {/* Data from JOIN in Controller */}
                                            <td className="p-3 text-center font-medium">
                                              {prod.quantityExpected}
                                            </td>
                                            <td className="p-3 text-center font-bold text-red-500">
                                              {prod.quantityExpected -
                                                prod.quantityReceived}
                                            </td>
                                            <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/30">
                                              {prod.quantityReceived}
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                              ₱{prod.unitPrice.toLocaleString()}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* 2. Financial Summary Card */}
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5 space-y-5">
                                  <h4 className="text-xs font-black uppercase text-slate-400 border-b pb-2 flex items-center gap-2">
                                    <FileText size={16} /> Settlement Card
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-500 font-medium">
                                        Net Subtotal
                                      </span>
                                      <span className="font-black text-slate-800">
                                        ₱{item.totalAmount.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-500 font-medium">
                                        Shipping Fee
                                      </span>
                                      <span className="font-black text-slate-800">
                                        + ₱{item.shippingCost.toLocaleString()}
                                      </span>
                                    </div>
                                    {item.hasVat && (
                                      <div className="flex justify-between text-[11px] bg-emerald-50 p-2 rounded-lg text-emerald-700 font-bold">
                                        <span className="flex items-center gap-1">
                                          <Info size={12} /> VAT
                                        </span>
                                        <span>
                                          ₱{item.vatAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {item.hasEwt && (
                                      <div className="flex justify-between text-[11px] bg-orange-50 p-2 rounded-lg text-orange-700 font-bold">
                                        <span className="flex items-center gap-1">
                                          <Info size={12} /> EWT (1%)
                                        </span>
                                        <span>
                                          - ₱{item.ewtAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-slate-900">
                                      <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                        Grand Total
                                      </span>
                                      <span className="text-xl font-black">
                                        ₱
                                        {(
                                          item.totalAmount +
                                          item.shippingCost -
                                          (item.hasEwt ? item.ewtAmount : 0)
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-2">
                                    <AlertTriangle
                                      className="text-amber-600 flex-shrink-0"
                                      size={16}
                                    />
                                    <p className="text-[10px] leading-relaxed text-amber-700 font-bold italic">
                                      Warning: Returns will automatically adjust
                                      these figures. Grand Total reflects
                                      current net receivables.
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Audit Trail
                                    </p>
                                    <div className="bg-white p-2 border border-slate-200 rounded text-[10px] text-slate-500 font-medium italic break-words">
                                      {item.remarks ||
                                        "No history logs available."}
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

export default AllDeliveryOrders;
