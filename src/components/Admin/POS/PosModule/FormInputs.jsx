import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  Users,
  Briefcase,
  User,
  MapPin,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  FileText, // Replaced CreditCard with FileText for EWT context
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddCustomer from "../../Customers/CustomerModule/AddCustomer";
import { domain } from "../../../../security";

const FormInputs = ({ onCustomerSelect, onSave, onCancel }) => {
  // --- 1. State Management ---
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);

  // Selection & Filter State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("Walk-In"); // 'Walk-In' or 'Client'
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // --- 2. Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/Customers`);
      setCustomerData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 3. Filtering Logic ---
  useEffect(() => {
    const results = customerData.filter((item) => {
      const itemType = item.customerType || "Walk-In";
      const matchesType = itemType === viewMode;
      const searchLower = searchQuery.toLowerCase();

      // Removed TIN search, kept Name and Email
      const matchesSearch =
        (item.customerName || "").toLowerCase().includes(searchLower) ||
        (item.email || "").toLowerCase().includes(searchLower);

      return matchesType && matchesSearch;
    });
    setFilteredCustomers(results);
  }, [viewMode, searchQuery, customerData]);

  // --- 4. Handlers ---
  const handleRowClick = (customer) => {
    setSelectedCustomer(customer);
    if (onCustomerSelect) onCustomerSelect(customer);
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`${domain}/api/Customers/${id}`);
      toast.success("Deleted successfully!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const openModal = (customer = null) => {
    setCustomerToEdit(customer);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setCustomerToEdit(null);
    fetchData();
  };

  // --- 5. Render ---
  return (
    // Outer Modal Overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <h3 className="text-lg font-bold mb-4 flex-shrink-0">
          Select or Manage Customers
        </h3>

        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
          <div className="flex flex-col bg-gray-50/50 min-h-full">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="text-indigo-600" size={24} /> Select
                  Customer
                </h2>
                <p className="text-xs text-slate-500">
                  Click a row to select for transaction.
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center shadow-sm flex-1 md:flex-none">
                  <button
                    onClick={() => setViewMode("Walk-In")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      viewMode === "Walk-In"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-slate-500"
                    }`}
                  >
                    <User size={14} /> Walk-In
                  </button>
                  <button
                    onClick={() => setViewMode("Client")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      viewMode === "Client"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-slate-500"
                    }`}
                  >
                    <Briefcase size={14} /> Client
                  </button>
                </div>

                <button
                  onClick={() => openModal()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 transition-all"
                >
                  <Plus size={16} /> New
                </button>
              </div>
            </div>

            {/* Search Bar - Updated Placeholder */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Name or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Main Content: Table (Desktop) / Cards (Mobile) */}
            <div className="flex-grow overflow-auto rounded-xl shadow-sm border border-slate-200 bg-white relative custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader />
                </div>
              ) : (
                <>
                  {/* --- DESKTOP TABLE --- */}
                  <table className="w-full text-sm text-left text-slate-600 hidden md:table">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 w-16">Status</th>
                        <th className="px-6 py-3">Customer Name</th>
                        <th className="px-6 py-3">Email</th>
                        {/* Changed TIN to EWT */}
                        <th className="px-6 py-3">EWT</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          className={`cursor-pointer transition-colors ${
                            selectedCustomer?.id === item.id
                              ? "bg-indigo-50/80"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            {selectedCustomer?.id === item.id ? (
                              <CheckCircle
                                size={20}
                                className="text-green-500"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {item.customerName}
                            <div className="text-xs text-slate-400 font-normal">
                              {item.businessStyle || item.customerType}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-slate-400" />
                              {item.email || "-"}
                            </div>
                          </td>
                          {/* EWT Status Badge */}
                          <td className="px-6 py-4">
                            {item.ewt ? (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold border border-blue-200">
                                Yes
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs px-2 py-1">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(item);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomer(item.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-10 text-center text-slate-400"
                          >
                            No customers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* --- MOBILE CARDS --- */}
                  <div className="md:hidden p-3 space-y-3">
                    {filteredCustomers.map((item) => {
                      const isSelected = selectedCustomer?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          className={`p-4 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-500 shadow-md"
                              : "bg-white border-slate-200 shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  isSelected
                                    ? "bg-green-100 text-green-600"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {isSelected ? (
                                  <CheckCircle size={18} />
                                ) : (
                                  <User size={18} />
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">
                                  {item.customerName}
                                </h4>
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                  {item.customerType}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-slate-600 space-y-1 pl-11 mb-3">
                            <p className="flex items-center gap-2 truncate">
                              <Mail size={14} className="text-slate-400" />{" "}
                              {item.email || "No Email"}
                            </p>
                            <p className="flex items-center gap-2 truncate">
                              <MapPin size={14} className="text-slate-400" />{" "}
                              {item.address || "No Address"}
                            </p>

                            {/* EWT Mobile Row */}
                            <p className="flex items-center gap-2">
                              <FileText size={14} className="text-slate-400" />{" "}
                              <span className="text-xs text-slate-500 mr-1">
                                EWT:
                              </span>
                              {item.ewt ? (
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  Active
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Inactive
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex gap-2 border-t pt-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(item);
                              }}
                              className="flex-1 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCustomer(item.id);
                              }}
                              className="flex-1 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Internal Modal Render */}
            {isModalVisible && (
              <AddCustomer
                onClose={closeModal}
                refreshData={fetchData}
                customerToEdit={customerToEdit}
              />
            )}
          </div>
        </div>

        {/* Modal Footer (Buttons) */}
        <div className="mt-4 flex justify-end flex-shrink-0">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
            onClick={onSave}
          >
            Save
          </button>
          <button
            className="bg-gray-300 px-4 py-2 rounded-md"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormInputs;
