import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Pencil,
  CheckCircle,
  Package,
  Calendar,
  Hash,
} from "lucide-react";

// Keep your existing components
import Loader from "../../../loader/Loader";
import AddBatches from "../BatchesModule/AddBatches";
import SerialViewModal from "./SerialViewModal";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const AllBatches = () => {
  const [batchData, setBatchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSerialModalVisible, setIsSerialModalVisible] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState(null);
  const [serialData, setSerialData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Increased items per page for wider view
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locations, setLocations] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Based on your controller: GET /api/Batches returns everything we need (Product Name, Location Name included)
      const response = await axios.get(`${domain}/api/Batches`, {
        headers: { "Content-Type": "application/json" },
      });

      setBatchData(response.data);

      // Extract unique locations from the loaded batch data
      const uniqueLocations = [
        "All",
        ...new Set(
          response.data.map((item) => item.locationName).filter(Boolean)
        ),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteBatch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;
    try {
      await axios.delete(`${domain}/api/Batches/${id}`, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error("Failed to delete batch.");
    }
  };

  const openModal = (batch = null) => {
    setBatchToEdit(batch);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBatchToEdit(null);
  };

  const openSerialModal = async (batchId) => {
    try {
      // Re-fetching specific batch to get fresh serials
      const response = await axios.get(`${domain}/api/Batches/${batchId}`);
      // The controller returns 'serialNumbers' array inside the batch object
      setSerialData(response.data.serialNumbers || []);
      setIsSerialModalVisible(true);
    } catch (error) {
      console.error("Error fetching serials:", error);
      toast.error("Failed to fetch serials.");
    }
  };

  const closeSerialModal = () => {
    setIsSerialModalVisible(false);
    setSerialData([]);
  };

  // Filter Logic
  const filteredBatches = batchData.filter((batch) => {
    // Helper to safely get string
    const safeStr = (str) => (str ? String(str).toLowerCase() : "");

    // Safely handle date
    let dateStr = "";
    try {
      if (batch.batchDate)
        dateStr = new Date(batch.batchDate).toLocaleDateString();
    } catch (e) {}

    const searchString = `
      ${safeStr(batch.name)} 
      ${safeStr(batch.productName)} 
      ${safeStr(batch.locationName)} 
      ${safeStr(batch.inventoryStatusName)}
      ${dateStr}
    `.toLowerCase();

    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesLocation =
      selectedLocation === "All" || batch.locationName === selectedLocation;

    return matchesSearch && matchesLocation;
  });
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBatches.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setCurrentPage(1);
  };

  return (
    <div className=" min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header Section --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Batch Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track inventory batches, locations, and serialization status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <Plus size={18} />
                Add New Batch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Filters Section --- */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Batch #, Product, Location..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // <--- ADD THIS LINE
              }}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Batch Info</th>
                      <th className="px-6 py-4 font-semibold">Product</th>
                      <th className="px-6 py-4 font-semibold">Location</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-center">
                        Qty
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        Serials
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentItems.length > 0 ? (
                      currentItems.map((batch) => {
                        // 1. Log the individual item here

                        // FIX: Added 'return (' here so the JSX is rendered
                        return (
                          <tr
                            key={batch.id}
                            className="hover:bg-indigo-50/30 transition duration-150 group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 flex items-center gap-2">
                                  <Hash size={14} className="text-indigo-400" />{" "}
                                  {batch.name || "N/A"}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  <Calendar size={12} />{" "}
                                  {new Date(
                                    batch.batchDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                              {batch.productName}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                {batch.locationName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  batch.inventoryStatusName === "Available" ||
                                  batch.inventoryStatusName === "Good"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                }`}
                              >
                                {batch.inventoryStatusName || "Unknown"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                              {batch.quantity}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {batch.hasSerial ? (
                                <button
                                  onClick={() => openSerialModal(batch.id)}
                                  className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md border border-indigo-200 transition"
                                >
                                  View List
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  No Serials
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => openModal(batch)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => deleteBatch(batch.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ); // FIX: Added closing parenthesis and semicolon for the return
                      }) // FIX: Added closing brace for the map logic block
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Package
                              size={48}
                              className="mb-4 text-slate-200"
                            />
                            <p>No batches found matching your criteria.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Closing tags for the table and containers that opened before this snippet */}
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {currentItems.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-lg shadow border border-slate-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800">
                      {batch.name}
                    </h3>
                    <span className="bg-slate-100 text-xs px-2 py-1 rounded">
                      {batch.inventoryStatusName}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    Product:{" "}
                    <span className="font-medium">{batch.productName}</span>
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    Loc: {batch.locationName}
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    Qty: {batch.quantity}
                  </p>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openModal(batch)}
                      className="flex-1 py-2 text-center text-sm bg-slate-50 border rounded text-slate-600"
                    >
                      Edit
                    </button>
                    {batch.hasSerial && (
                      <button
                        onClick={() => openSerialModal(batch.id)}
                        className="flex-1 py-2 text-center text-sm bg-indigo-50 border border-indigo-100 rounded text-indigo-600"
                      >
                        Serials
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards (Assuming BatchCard is updated to handle new props or omitted for brevity) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {currentItems.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-lg shadow border border-slate-200"
                >
                  {/* Simplified Mobile View */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800">
                      {batch.name}
                    </h3>
                    <span className="bg-slate-100 text-xs px-2 py-1 rounded">
                      {batch.inventoryStatusName}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    Product:{" "}
                    <span className="font-medium">{batch.productName}</span>
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    Loc: {batch.locationName}
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    Qty: {batch.quantity}
                  </p>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openModal(batch)}
                      className="flex-1 py-2 text-center text-sm bg-slate-50 border rounded text-slate-600"
                    >
                      Edit
                    </button>
                    {batch.hasSerial && (
                      <button
                        onClick={() => openSerialModal(batch.id)}
                        className="flex-1 py-2 text-center text-sm bg-indigo-50 border border-indigo-100 rounded text-indigo-600"
                      >
                        Serials
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredBatches.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddBatches
              onClose={closeModal}
              refreshData={fetchData}
              batchToEdit={batchToEdit}
            />
          </div>
        </div>
      )}

      <SerialViewModal
        isVisible={isSerialModalVisible}
        onClose={closeSerialModal}
        serialData={serialData}
      />
    </div>
  );
};

export default AllBatches;
