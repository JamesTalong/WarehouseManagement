import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  Package,
  Search,
  MapPin,
  History,
  RefreshCw,
  Box,
  Hash,
} from "lucide-react";

import Pagination from "../../Pagination";
import Loader from "../../../loader/Loader";
import InventoryOverrideTable from "./InventoryOverrideTable";
import HistoryModal from "./HistoryModal";
import { domain } from "../../../../security";

const ITEMS_PER_PAGE = 10;

const AllInventoryOverride = () => {
  // --- States ---
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState([]);
  const [serialFilter, setSerialFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const apiUrl = `${domain}/api/Products/physical-inventory-base`;
    try {
      const response = await axios.get(apiUrl);
      setInventoryData(response.data);

      const uniqueLocs = [
        ...new Set(
          response.data.map((item) => item.locationName).filter(Boolean)
        ),
      ];
      setAvailableLocations(uniqueLocs);

      if (uniqueLocs.length > 0 && !selectedLocation) {
        setSelectedLocation(uniqueLocs[0]);
      } else if (uniqueLocs.length === 0) {
        setSelectedLocation("All");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
      setLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- History Logic (UPDATED) ---
  const fetchHistory = async () => {
    try {
      // Calls the new "Grouped" endpoint
      const res = await axios.get(`${domain}/api/Products/adjustment-batches`);
      setHistoryData(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch history batches.");
    }
  };

  // --- NEW: Handle Batch Revert Logic ---
  const handleRevert = async (batchItem) => {
    // 1. Safety Check / Confirmation
    const dateStr = new Date(batchItem.adjustmentDate).toLocaleString();
    const confirmMsg = `WARNING: You are about to revert the ENTIRE upload from ${dateStr}.\n\nThis will restore ${batchItem.itemCount} items to their previous state.\n\nType "CONFIRM" to proceed.`;

    const userInput = window.prompt(confirmMsg);

    if (userInput !== "CONFIRM") {
      if (userInput !== null) toast.info("Revert cancelled.");
      return;
    }

    // 2. Reason Input
    const reason = window.prompt("Please enter a reason for this rollback:");
    if (!reason || !reason.trim()) {
      toast.warning("Revert reason is required.");
      return;
    }

    try {
      // 3. Construct Payload for RevertBatchRequest DTO
      const payload = {
        BatchDate: batchItem.adjustmentDate,
        UserId: batchItem.userId,
        Reason: reason,
      };

      // 4. Call API
      await axios.post(`${domain}/api/Products/RevertBatch`, payload);

      toast.success("Checkpoint restored successfully!");

      // 5. Refresh Data
      fetchHistory(); // Refresh the list in the modal
      fetchData(); // Refresh the background table
    } catch (error) {
      console.error("Revert failed", error);
      const msg = error.response?.data?.message || "Failed to revert batch.";
      toast.error(msg);
    }
  };

  // --- Filtering Logic (Unchanged) ---
  const filteredData = useMemo(() => {
    let data = inventoryData;

    if (selectedLocation && selectedLocation !== "All") {
      data = data.filter((item) => item.locationName === selectedLocation);
    }

    if (serialFilter === "Serialized") {
      data = data.filter((item) => item.hasSerial === true);
    } else if (serialFilter === "Non-Serialized") {
      data = data.filter((item) => item.hasSerial === false);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.productName?.toLowerCase().includes(lowerQuery) ||
          item.itemCode?.toLowerCase().includes(lowerQuery) ||
          item.barCode?.toLowerCase().includes(lowerQuery)
      );
    }

    return data;
  }, [inventoryData, selectedLocation, searchQuery, serialFilter]);

  // --- Pagination Logic (Unchanged) ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, serialFilter]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = useMemo(() => {
    const totalItems = filteredData.length;
    const totalGoodStock = filteredData.reduce(
      (acc, curr) => acc + (curr.unsoldCount || 0),
      0
    );
    return { totalItems, totalGoodStock };
  }, [filteredData]);

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Physical Inventory
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Overview of stock levels (Base Units) across locations.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={fetchHistory}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <History size={18} /> View Checkpoints
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Box size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unique SKUs</p>
              <p className="text-xl font-bold text-slate-800">
                {stats.totalItems}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Good Stock</p>
              <p className="text-xl font-bold text-slate-800">
                {stats.totalGoodStock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-12 gap-4 mb-6">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, item code..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative md:col-span-3">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white cursor-pointer"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="All">All Locations</option>
            </select>
          </div>

          <div className="relative md:col-span-3">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white cursor-pointer"
              value={serialFilter}
              onChange={(e) => setSerialFilter(e.target.value)}
            >
              <option value="All">All Serials</option>
              <option value="Serialized">Has Serial</option>
              <option value="Non-Serialized">No Serial</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            <InventoryOverrideTable
              data={currentItems}
              allData={filteredData}
              serialFilter={serialFilter}
              onRefresh={fetchData}
            />

            <div className="mt-6 mb-10">
              <Pagination
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredData.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        historyData={historyData}
        onRevert={handleRevert}
      />
    </div>
  );
};

export default AllInventoryOverride;
