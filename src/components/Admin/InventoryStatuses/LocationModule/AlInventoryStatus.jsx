import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Activity,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart2,
  Lock, // Imported Lock icon
  Shield, // Imported Shield icon
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddInventoryStatus from "./AddInventoryStatus";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const SYSTEM_STATUSES = [
  "SOLD",
  "QUARANTINE",
  "IN_REPAIR",
  "RETURNED_BAD",
  "EXPIRED",
  "DAMAGED",
  "REFURBISHED",
  "RETURNED_GOOD",
  "GOOD",
  "MISSING",
  "TRANSFERRED",
];

const isSystemData = (name) => {
  return name && SYSTEM_STATUSES.includes(name.toUpperCase());
};

// --- Mobile Card Component ---
const StatusCard = ({ status, onEdit, onDelete }) => {
  const id = status.id || status.Id;
  const name = status.name || status.Name;
  const desc = status.description || status.Description;
  const available =
    status.isAvailable !== undefined ? status.isAvailable : status.IsAvailable;

  const isLocked = isSystemData(name);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Activity size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg flex items-center gap-2">
              {name}
              {isLocked && (
                <Shield
                  size={14}
                  className="text-orange-500"
                  title="System Data"
                />
              )}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                available
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {available ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {available ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      </div>

      {desc && (
        <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded">
          {desc}
        </p>
      )}

      {/* Only show buttons if NOT locked */}
      <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
        {!isLocked ? (
          <>
            <button
              onClick={() => onEdit(status)}
              className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
            >
              <Edit size={16} /> Edit
            </button>
            <button
              onClick={() => onDelete(id)}
              className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </>
        ) : (
          <div className="w-full text-center text-xs text-slate-400 font-medium py-2 flex justify-center items-center gap-1">
            <Lock size={12} /> Default System Status (Read Only)
          </div>
        )}
      </div>
    </div>
  );
};

const AllInventoryStatus = () => {
  // --- State ---
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusToEdit, setStatusToEdit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStatuses, setFilteredStatuses] = useState([]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/InventoryStatuses`;
    try {
      setLoading(true);
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setStatusData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Inventory Statuses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filter Logic ---
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const results = statusData.filter((item) => {
      const name = item.name || item.Name || "";
      return name.toLowerCase().includes(lowerSearch);
    });
    setFilteredStatuses(results);
    setCurrentPage(1);
  }, [searchTerm, statusData]);

  // --- Actions ---
  const deleteStatus = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Status?")) {
      return;
    }
    const apiUrl = `${domain}/api/InventoryStatuses/${id}`;
    try {
      await axios.delete(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Status Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting status:", error);
      toast.error("Failed to delete Status. It might be in use.");
    }
  };

  const openModal = (status = null) => {
    setStatusToEdit(status);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setStatusToEdit(null);
    fetchData();
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStatuses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Sticky Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-indigo-600" /> Inventory Statuses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Define item conditions (e.g., Good, Damaged, Repair).
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Status
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats Card --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Statuses</p>
              <p className="text-2xl font-bold text-slate-800">
                {statusData.length}
              </p>
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Status Name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Status Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Availability</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => {
                    const id = item.id || item.Id;
                    const name = item.name || item.Name;
                    const desc = item.description || item.Description;
                    const available =
                      item.isAvailable !== undefined
                        ? item.isAvailable
                        : item.IsAvailable;

                    // CHECK IF LOCKED
                    const isLocked = isSystemData(name);

                    return (
                      <tr key={id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            {name}
                            {isLocked && (
                              <Shield
                                size={14}
                                className="text-orange-500"
                                title="System Data"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-500">
                          {desc || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              available
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* IF LOCKED: Show Lock Icon. IF NOT: Show Buttons */}
                            {!isLocked ? (
                              <>
                                <button
                                  onClick={() => openModal(item)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => deleteStatus(id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">
                                <Lock size={12} /> System
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No statuses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentItems.map((item) => (
                <StatusCard
                  key={item.id || item.Id}
                  status={item}
                  onEdit={openModal}
                  onDelete={deleteStatus}
                />
              ))}
              {currentItems.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No statuses found.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredStatuses.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <AddInventoryStatus
              onClose={closeModal}
              refreshData={fetchData}
              statusToEdit={statusToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllInventoryStatus;
