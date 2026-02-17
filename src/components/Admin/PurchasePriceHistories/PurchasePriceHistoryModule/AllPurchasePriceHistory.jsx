import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Calendar,
  DollarSign,
  Truck,
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  Tag,
  MapPin,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddPurchasePrice from "./AddPurchasePrice";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const AllPurchasePriceHistories = () => {
  // Store raw flat data
  const [rawData, setRawData] = useState([]);
  // Store grouped data for display
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Pagination & Search & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Location State
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("All");

  // Track expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // 1. Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/PurchasePriceHistories`);
      setRawData(response.data);

      // Extract Unique Locations for the Dropdown
      const uniqueLocs = [
        "All",
        ...new Set(
          response.data
            .map((item) => item.locationName)
            .filter((loc) => loc && loc !== "N/A"),
        ),
      ];
      setLocations(uniqueLocs);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch purchase prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Process Data: Filter by Location -> Then Group by Product + Vendor
  useEffect(() => {
    if (!rawData.length) return;

    // A. Filter by Location First
    let filteredByLocation = rawData;
    if (selectedLocation !== "All") {
      filteredByLocation = rawData.filter(
        (item) => item.locationName === selectedLocation,
      );
    }

    // B. Grouping Logic
    const groups = {};
    filteredByLocation.forEach((item) => {
      // Create a unique key for grouping
      const key = `${item.productName}-${item.vendorName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // C. Sort and Format
    const processedGroups = Object.values(groups).map((groupItems) => {
      // Sort by date descending (newest first)
      const sortedItems = groupItems.sort(
        (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate),
      );

      return {
        key: `${sortedItems[0].productName}-${sortedItems[0].vendorName}`,
        recommended: sortedItems[0], // The newest one for this location
        history: sortedItems.slice(1), // The previous prices for this location
        all: sortedItems,
      };
    });

    setGroupedData(processedGroups);
    setCurrentPage(1); // Reset page on filter change
  }, [rawData, selectedLocation]);

  // 3. Search Filtering
  const filteredItems = groupedData.filter((group) => {
    const { recommended } = group;
    const searchStr = searchTerm.toLowerCase();

    return (
      (recommended.productName || "").toLowerCase().includes(searchStr) ||
      (recommended.vendorName || "").toLowerCase().includes(searchStr) ||
      (recommended.notes || "").toLowerCase().includes(searchStr)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroups = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // 4. Toggle Accordion
  const toggleRow = (key) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${domain}/api/PurchasePriceHistories/${id}`);
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item.");
    }
  };

  const openModal = (item = null) => {
    setItemToEdit(item);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setItemToEdit(null);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {/* Changed to Indigo */}
                <DollarSign className="text-indigo-600" /> Purchase Price
                Manager
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View recommended prices and drill down for history.
              </p>
            </div>
            {/* Changed to Indigo */}
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Filters: Search + Location Dropdown */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Product or Vendor..."
              // Changed focus ring to Indigo
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative w-full md:w-64">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              // Changed focus ring to Indigo
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white text-slate-700 cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "All" ? "All Locations" : loc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-8"></th>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Vendor</th>
                    <th className="px-6 py-4 font-semibold align-top">
                      <div>Recommended Price</div>
                      {/* Location displayed BELOW the header text */}
                      {selectedLocation !== "All" && (
                        <div className="text-indigo-600 text-[10px] font-normal mt-1 normal-case tracking-wide">
                          ({selectedLocation})
                        </div>
                      )}
                    </th>
                    <th className="px-6 py-4 font-semibold">Effective Date</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentGroups.length > 0 ? (
                    currentGroups.map((group) => {
                      const isExpanded = expandedRows.has(group.key);
                      const { recommended, history } = group;

                      return (
                        <React.Fragment key={group.key}>
                          {/* Main Row: Recommended Price */}
                          <tr
                            // Changed hover/active bg to Indigo
                            className={`transition duration-150 cursor-pointer ${isExpanded ? "bg-indigo-50/50" : "hover:bg-slate-50"}`}
                            onClick={() => toggleRow(group.key)}
                          >
                            <td className="px-6 py-4 text-center">
                              {history.length > 0 ? (
                                isExpanded ? (
                                  <ChevronUp
                                    size={16}
                                    className="text-indigo-600"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={16}
                                    className="text-slate-400"
                                  />
                                )
                              ) : (
                                <span className="w-4 block"></span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-base">
                                {recommended.productName}
                              </div>
                              {recommended.notes && (
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <FileText size={10} /> {recommended.notes}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Truck size={14} className="text-slate-400" />
                                <span>{recommended.vendorName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-bold text-emerald-600">
                                  {formatCurrency(recommended.price)}
                                </span>
                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                  {recommended.uomCode}
                                </span>
                                {/* Changed Badge to Indigo */}
                                <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full ml-2">
                                  LATEST
                                </span>
                              </div>
                              {/* Location Badge: Displayed BELOW the price */}
                              {selectedLocation === "All" && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    <MapPin size={10} className="mr-1" />{" "}
                                    {recommended.locationName}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Calendar
                                  size={14}
                                  className="text-slate-400"
                                />
                                {new Date(
                                  recommended.effectiveDate,
                                ).toLocaleDateString()}
                              </div>
                            </td>
                            <td
                              className="px-6 py-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => openModal(recommended)}
                                  // Changed hover color to Indigo
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                  title="Edit Latest"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => deleteItem(recommended.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition"
                                  title="Delete Latest"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row: History Table */}
                          {isExpanded && history.length > 0 && (
                            <tr className="bg-slate-50/50 shadow-inner">
                              <td colSpan="6" className="px-6 py-4">
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden ml-8">
                                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                    <History size={14} /> Previous Price History
                                    {/* Changed text color to Indigo */}
                                    {selectedLocation !== "All" && (
                                      <span className="text-indigo-600 ml-1">
                                        ({selectedLocation})
                                      </span>
                                    )}
                                  </div>
                                  <table className="w-full text-sm text-left">
                                    <thead>
                                      <tr className="border-b border-slate-100 text-xs text-slate-400">
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Price</th>
                                        <th className="px-4 py-2">Location</th>
                                        <th className="px-4 py-2">PO Number</th>
                                        <th className="px-4 py-2">Notes</th>
                                        <th className="px-4 py-2 text-right">
                                          Action
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {history.map((histItem) => (
                                        <tr
                                          key={histItem.id}
                                          className="hover:bg-slate-50"
                                        >
                                          <td className="px-4 py-3 text-slate-600">
                                            {new Date(
                                              histItem.effectiveDate,
                                            ).toLocaleDateString()}
                                            <span className="text-xs text-slate-400 ml-2">
                                              {new Date(
                                                histItem.effectiveDate,
                                              ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 font-mono text-slate-600">
                                            {formatCurrency(histItem.price)}
                                          </td>
                                          <td className="px-4 py-3 text-xs text-slate-500">
                                            {histItem.locationName}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded">
                                              <Tag size={10} />{" "}
                                              {histItem.poNumber}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-xs text-slate-500 italic max-w-xs truncate">
                                            {histItem.notes || "-"}
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            <button
                                              onClick={() =>
                                                deleteItem(histItem.id)
                                              }
                                              className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 ml-auto"
                                            >
                                              <Trash2 size={12} /> Remove
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        No records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredItems.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddPurchasePrice
              onClose={closeModal}
              refreshData={fetchData}
              itemToEdit={itemToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPurchasePriceHistories;
