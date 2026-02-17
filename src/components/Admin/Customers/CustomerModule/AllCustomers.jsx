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
  CreditCard,
  Edit,
  Trash2,
  BarChart2,
  Eye,
  Mail,
  Percent,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddCustomer from "./AddCustomer";
import ViewCustomer from "./ViewCustomer";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// --- Mobile Card Component ---
const CustomerCard = ({ customer, onView, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <User size={18} />
        </div>
        <div>
          <span className="font-bold text-slate-800 text-lg block">
            {customer.customerName}
          </span>
          <span className="font-bold text-slate-800 text-lg block">
            {customer.customerCode}
          </span>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {customer.customerType}
          </span>
        </div>
      </div>
    </div>

    <div className="space-y-2 text-sm text-slate-600 mb-4">
      {/* Email Display */}
      <div className="flex items-center gap-2">
        <Mail size={14} className="text-slate-400" />
        <span className="truncate">{customer.email || "N/A"}</span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-slate-400" />
        <span className="truncate">{customer.address || "No Address"}</span>
      </div>
      <div className="flex items-center gap-2">
        <CreditCard size={14} className="text-slate-400" />
        <span className="font-mono text-xs">
          {customer.tinNumber || "No TIN"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Percent size={14} className="text-slate-400" />
        <span>EWT: </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            customer.ewt === true
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {customer.ewt ? "Yes" : "No"}
        </span>
      </div>
    </div>

    <div className="flex gap-2 pt-3 border-t border-slate-100">
      <button
        onClick={() => onView(customer.id)}
        className="flex-1 py-2 border border-blue-100 text-blue-600 rounded hover:bg-blue-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Eye size={16} /> View
      </button>
      <button
        onClick={() => onEdit(customer)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(customer.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllCustomers = () => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [customerToViewId, setCustomerToViewId] = useState(null);

  // Filters
  const [viewMode, setViewMode] = useState("Walk-In");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  useEffect(() => {
    const results = customerData.filter((item) => {
      const itemType = item.customerType || "Walk-In";
      const matchesType = itemType === viewMode;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (item.customerName || "").toLowerCase().includes(searchLower) ||
        (item.email || "").toLowerCase().includes(searchLower) ||
        (item.tinNumber || "").toLowerCase().includes(searchLower);

      return matchesType && matchesSearch;
    });

    setFilteredCustomers(results);
    setCurrentPage(1);
  }, [viewMode, searchQuery, customerData]);

  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await axios.delete(`${domain}/api/Customers/${id}`);
      toast.success("Customer successfully deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer.");
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

  const openViewModal = (id) => {
    setCustomerToViewId(id);
    setIsViewModalVisible(true);
  };

  const closeViewModal = () => {
    setIsViewModalVisible(false);
    setCustomerToViewId(null);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12 ">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-indigo-600" /> Customer Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage walk-in customers and corporate clients.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Customer
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total {viewMode}s</p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredCustomers.length}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center">
            <div className="flex w-full p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setViewMode("Walk-In")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === "Walk-In"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User size={16} /> Walk-In
              </button>
              <button
                onClick={() => setViewMode("Client")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  viewMode === "Client"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Briefcase size={16} /> Client
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${viewMode} by Name, Email, or TIN...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </div>

        {/* Table Content */}
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
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">TIN</th>
                    <th className="px-6 py-4 text-center">EWT</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentCustomers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.customerName}
                        <div className="text-xs text-slate-400 font-normal mt-1">
                          {item.businessStyle || item.customerType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          {item.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {item.tinNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            item.ewt === true
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.ewt ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(item.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteCustomer(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No customers found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentCustomers.map((item) => (
                <CustomerCard
                  key={item.id}
                  customer={item}
                  onView={openViewModal}
                  onEdit={openModal}
                  onDelete={deleteCustomer}
                />
              ))}
              {currentCustomers.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No customers found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredCustomers.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {isModalVisible && (
        <AddCustomer
          onClose={closeModal}
          refreshData={fetchData}
          customerToEdit={customerToEdit}
        />
      )}

      {isViewModalVisible && (
        <ViewCustomer customerId={customerToViewId} onClose={closeViewModal} />
      )}
    </div>
  );
};

export default AllCustomers;
