import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Store,
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Award,
  BarChart2,
  FileText,
  Percent,
  Eye, // Added Eye Icon
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddVendor from "../VendorModule/AddVendor";
import ViewVendor from "../VendorModule/ViewVendor"; // Import the new component
import Pagination from "../../Pagination";
import { domain } from "../../../../security";
import { useSelector } from "react-redux";
import { selectFullName } from "../../../../redux/IchthusSlice";

// --- Mobile Card Component ---
const VendorCard = ({ vendor, onView, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Store size={18} />
        </div>
        <div>
          <span className="font-bold text-slate-800 text-lg block">
            {vendor.vendorName}
          </span>
          <div className="text-[10px] text-slate-400 font-formal ">
            {vendor.vendorCode}
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              vendor.vendorStatus === "Active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {vendor.vendorStatus}
          </span>
        </div>
      </div>
    </div>

    <div className="space-y-2 text-sm text-slate-600 mb-4">
      <div className="flex items-center gap-2">
        <User size={14} className="text-slate-400" />
        <span className="font-medium">Contact:</span>{" "}
        {vendor.contactPerson || "N/A"}
      </div>
      <div className="flex items-center gap-2">
        <Mail size={14} className="text-slate-400" />
        <span className="truncate">{vendor.email || "N/A"}</span>
      </div>
      <div className="flex items-center gap-2">
        <Award size={14} className="text-slate-400" />
        <span>{vendor.specialization || "General"}</span>
      </div>
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-slate-400" />
        <span>TIN: {vendor.tin || "N/A"}</span>
      </div>
      {/* Fixed EWT Display */}
      <div className="flex items-center gap-2">
        <Percent size={14} className="text-slate-400" />
        <span>EWT: </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            vendor.ewt === true
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {vendor.ewt ? "Yes" : "No"}
        </span>
      </div>
    </div>

    <div className="flex gap-2 pt-3 border-t border-slate-100">
      <button
        onClick={() => onView(vendor.id)}
        className="flex-1 py-2 border border-blue-100 text-blue-600 rounded hover:bg-blue-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Eye size={16} /> View
      </button>
      <button
        onClick={() => onEdit(vendor)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(vendor.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllVendors = () => {
  // --- State ---
  const [vendorData, setVendorData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState(null);

  // View Modal State (New)
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [vendorToViewId, setVendorToViewId] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);
  const fullName = useSelector(selectFullName);
  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Vendors`;
    try {
      setLoading(true);
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setVendorData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch vendors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering Logic ---
  useEffect(() => {
    const results = vendorData.filter(
      (vendor) =>
        (vendor.vendorName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (vendor.contactPerson || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (vendor.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.tin || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredVendors(results);
    setCurrentPage(1);
  }, [searchTerm, vendorData]);

  // --- Actions ---
  const deleteVendor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) {
      return;
    }
    const apiUrl = `${domain}/api/Vendors/${id}`;
    try {
      await axios.delete(apiUrl);
      toast.success("Vendor Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor.");
    }
  };

  // Add/Edit Modal Handlers
  const openModal = (vendor = null) => {
    setVendorToEdit(vendor);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setVendorToEdit(null);
    fetchData();
  };

  // View Modal Handlers (New)
  const openViewModal = (id) => {
    setVendorToViewId(id);
    setIsViewModalVisible(true);
  };

  const closeViewModal = () => {
    setIsViewModalVisible(false);
    setVendorToViewId(null);
  };

  // --- Pagination Logic ---
  const indexOfLastVendor = currentPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = filteredVendors.slice(
    indexOfFirstVendor,
    indexOfLastVendor,
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
                <Store className="text-indigo-600" /> Vendor Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage hardware suppliers, contact details, and tax info.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Vendor
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
              <p className="text-sm text-slate-500">Total Vendors</p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredVendors.length}
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
              placeholder="Search Vendor Name, Contact, Email or TIN..."
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
                    <th className="px-6 py-4">Id</th>
                    <th className="px-6 py-4">Vendor Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">TIN</th>
                    <th className="px-6 py-4 text-center">EWT</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {vendor.id}
                        <div className="text-[10px] text-slate-400 font-formal ">
                          {vendor.vendorCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {vendor.vendorName}
                        <div className="text-xs text-slate-400 font-normal mt-1">
                          {vendor.specialization}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <User size={12} className="text-slate-400" />
                            {vendor.contactPerson}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Mail size={12} className="text-slate-400" />
                            {vendor.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-mono text-slate-700">
                          {vendor.tin || "-"}
                        </div>
                      </td>
                      {/* Fixed EWT Column Logic */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            vendor.ewt === true
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {vendor.ewt ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.vendorStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {vendor.vendorStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(vendor.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openModal(vendor)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteVendor(vendor.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentVendors.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No vendors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onView={openViewModal}
                  onEdit={openModal}
                  onDelete={deleteVendor}
                />
              ))}
              {currentVendors.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No vendors found.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                itemsPerPage={vendorsPerPage}
                totalItems={filteredVendors.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}
      {isModalVisible && (
        <AddVendor
          onClose={closeModal}
          refreshData={fetchData}
          vendorToEdit={vendorToEdit}
        />
      )}

      {isViewModalVisible && (
        <ViewVendor vendorId={vendorToViewId} onClose={closeViewModal} />
      )}
    </div>
  );
};

export default AllVendors;
