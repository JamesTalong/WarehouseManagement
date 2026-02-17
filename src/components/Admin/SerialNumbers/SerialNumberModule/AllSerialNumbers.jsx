import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  BarChart2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Package,
  Plus,
  Hash,
  MapPin,
  Tag,
  RefreshCw,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddSerialNumber from "./AddSerialNumber";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const SerialCard = ({ serial, onEdit }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <Hash className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-slate-800 font-mono">
          {serial.serialName || (
            <span className="text-gray-400 italic">No Serial Code</span>
          )}
        </span>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          serial.isAvailable
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {serial.isAvailable ? "Available" : "Sold"}
      </span>
    </div>
    <div className="text-sm text-slate-600 space-y-1">
      <p className="flex items-center gap-2">
        <Package size={14} /> {serial.productName}
      </p>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Tag size={12} /> Batch: {serial.batchNumber || "N/A"}
      </p>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <MapPin size={12} /> {serial.locationName}
      </p>
    </div>
    <button
      onClick={() => onEdit(serial)}
      className="mt-3 w-full py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium"
    >
      Edit Details
    </button>
  </div>
);

const AllSerialNumbers = () => {
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [serialToEdit, setSerialToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [batchOrProductSearch, setBatchOrProductSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all"); // NEW: Location Filter State
  const [filteredSerials, setFilteredSerials] = useState([]);

  // Memoized list of unique locations for the dropdown
  const uniqueLocations = useMemo(() => {
    const locations = serialNumbers
      .map((item) => item.locationName)
      .filter((name) => name && name.trim() !== "");
    return [...new Set(locations)].sort();
  }, [serialNumbers]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/SerialNumbers`);
      setSerialNumbers(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch serial numbers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering Logic
  useEffect(() => {
    let results = serialNumbers.filter((item) => {
      // 1. Search Serial Name
      const serialMatch = (item.serialName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // 2. Search Batch Name OR Product Name
      const batchMatch = (item.batchNumber || "")
        .toLowerCase()
        .includes(batchOrProductSearch.toLowerCase());
      const productMatch = (item.productName || "")
        .toLowerCase()
        .includes(batchOrProductSearch.toLowerCase());

      // 3. Filter by Location
      const locationMatch =
        filterLocation === "all" || item.locationName === filterLocation;

      return (
        serialMatch &&
        (batchOrProductSearch === "" || batchMatch || productMatch) &&
        locationMatch
      );
    });

    // 4. Filter by Status (Available vs Sold)
    if (filterStatus === "sold") {
      results = results.filter((item) => item.isAvailable === false);
    } else if (filterStatus === "available") {
      results = results.filter((item) => item.isAvailable === true);
    }

    setFilteredSerials(results);
    setCurrentPage(1);
  }, [
    searchTerm,
    batchOrProductSearch,
    filterStatus,
    filterLocation,
    serialNumbers,
  ]);

  const openModal = (serial = null) => {
    setSerialToEdit(serial);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSerialToEdit(null);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSerials = filteredSerials.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalAvailable = serialNumbers.filter(
    (item) => item.isAvailable,
  ).length;
  const totalSold = serialNumbers.length - totalAvailable;

  return (
    <div className="min-h-screen pb-12 ">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Hash className="text-indigo-600" /> Serial Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage individual serial numbers, track status and history.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="p-2.5 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition"
                title="Refresh Data"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <Plus size={18} />
                Add Serial
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Serials</p>
              <p className="text-2xl font-bold text-slate-800">
                {serialNumbers.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle />
            </div>
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalAvailable}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-500 rounded-lg">
              <XCircle />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sold / Unavailable</p>
              <p className="text-2xl font-bold text-slate-800">{totalSold}</p>
            </div>
          </div>
        </div>

        {/* --- Updated Filters Section --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Serial..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by Product/Batch..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={batchOrProductSearch}
              onChange={(e) => setBatchOrProductSearch(e.target.value)}
            />
          </div>

          {/* New Location Dropdown */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white outline-none appearance-none"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white outline-none appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Only</option>
              <option value="sold">Sold Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Serial Number</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Batch Info</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentSerials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-indigo-700 font-mono">
                        {item.serialName || (
                          <span className="text-gray-400 font-normal italic">
                            Empty
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {item.productName}
                        </div>

                        <div className="text-[10px] text-slate-500 ">
                          ID: {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono text-slate-600">
                          {item.batchNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.locationName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.inventoryStatusName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentSerials.map((item) => (
                <SerialCard key={item.id} serial={item} onEdit={openModal} />
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredSerials.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <AddSerialNumber
              onClose={closeModal}
              refreshData={fetchData}
              serialToEdit={serialToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSerialNumbers;
