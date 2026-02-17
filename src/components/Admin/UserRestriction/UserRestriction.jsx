import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  ShieldCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import Loader from "../../loader/Loader";
import AddRestriction from "./AddRestriction";
import Pagination from "../Pagination";
import { domain } from "../../../security";

// --- 1. Define the known permissions structure here (Same as AddRestriction) ---
const KNOWN_PERMISSIONS = [
  { title: "Dashboard", key: "dashboard" },
  { title: "Help & FAQ", key: "helpFaq" },
  { title: "Product Setup Access", key: "productSetup" },
  { title: "Inventory Status", key: "inventoryStatus" },
  { title: "Unit Of Measurement", key: "unitOfMeasurement" },
  { title: "Categories", key: "categories" },
  { title: "Categories 2", key: "categories2" },
  { title: "Categories 3", key: "categories3" },
  { title: "Categories 4", key: "categories4" },
  { title: "Categories 5", key: "categories5" },
  { title: "Brands", key: "brands" },
  { title: "Pricelists", key: "pricelists" },
  { title: "Procurement Access", key: "procurement" },
  { title: "Purchase Orders", key: "purchaseOrders" },
  { title: "Goods Receipts", key: "goodsReceipts" },
  { title: "Sales Access", key: "sales" },
  { title: "Sales Quotations", key: "salesQuotations" },
  { title: "Sales Orders", key: "salesOrders" },
  { title: "Delivery Orders", key: "deliveryOrders" },
  { title: "Returns Access", key: "returns" },
  { title: "Delivery Returns", key: "deliveryReturns" },
  { title: "Trade Returns", key: "tradeReturns" },
  { title: "Prices Access", key: "prices" },
  { title: "Selling Price Histories", key: "sellingPriceHistories" },
  { title: "Purchase Price Histories", key: "purchasePriceHistories" },
  { title: "Inventory Access", key: "inventory" },
  { title: "Inventory Dashboard", key: "inventoryDashboard" },
  { title: "Item Details", key: "itemDetails" },
  { title: "Physical Inventory", key: "physicalInventory" },
  { title: "Transfer Items", key: "transferItems" },
  { title: "Staff Access Control", key: "staffAccess" },
  { title: "Users", key: "users" },
  { title: "User Restrictions", key: "userRestriction" },
  { title: "Employees", key: "employees" },
  { title: "Approvers", key: "approvers" },
  { title: "Back Tracking Access", key: "backTracking" },
  { title: "Stock Entry (Batches)", key: "batches" },
  { title: "Serial Numbers", key: "serialNumbers" },
  { title: "Locations", key: "locations" },
  { title: "Products", key: "productList" },
  { title: "Customers", key: "customers" },
  { title: "Vendors", key: "vendors" },
  { title: "Transactions", key: "transactions" },
  { title: "POS", key: "pos" },
];

// Mobile Card Component
const RoleCard = ({ role, expanded, onToggle, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <ShieldCheck size={18} />
        </div>
        <span className="font-bold text-slate-800 text-lg">
          {role.roleName}
        </span>
      </div>
      <button
        onClick={onToggle}
        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
      >
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>

    {expanded && (
      <div className="mt-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Permissions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {/* --- 2. Use KNOWN_PERMISSIONS instead of accessKeys --- */}
          {KNOWN_PERMISSIONS.map((perm) => (
            <div
              key={perm.key}
              className="flex items-center gap-2 text-xs font-medium"
            >
              {role[perm.key] ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <XCircle size={14} className="text-slate-300" />
              )}
              <span
                className={
                  role[perm.key]
                    ? "text-slate-700"
                    : "text-slate-400 line-through"
                }
              >
                {perm.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
      <button
        onClick={() => onEdit(role)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(role.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const UserRestriction = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const itemsPerPage = 10;

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${domain}/api/JobRole`);
      setJobRoles(response.data);
    } catch (error) {
      console.error("Failed to fetch job roles", error);
      toast.error("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEdit = (role) => {
    setSelectedRole(role);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this role and its permissions?",
      )
    )
      return;
    try {
      await axios.delete(`${domain}/api/JobRole/${id}`);
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error) {
      toast.error("Failed to delete job role");
    }
  };

  const toggleExpand = (roleId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const filteredRoles = jobRoles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- 3. Removed the dynamic accessKeys calculation ---
  // We use KNOWN_PERMISSIONS now to ensure nothing is missing.

  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Lock className="text-indigo-600" /> Security Roles
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Define access levels and module permissions for system roles.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedRole(null);
                setIsOpen(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Create New Role
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats Card --- */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Configured Roles</p>
              <p className="text-2xl font-bold text-slate-800">
                {jobRoles.length}
              </p>
            </div>
          </div>
        </div>

        {/* --- Search --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
                    <th className="px-6 py-4">Role Name</th>
                    <th className="px-6 py-4">Access Control</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRoles.map((role) => (
                    <React.Fragment key={role.id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {role.roleName}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpand(role.id)}
                            className="flex items-center gap-1.5 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                          >
                            {expandedRows[role.id] ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                            {expandedRows[role.id]
                              ? "Hide Permissions"
                              : "View Permissions"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(role)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Edit Role"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Role"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[role.id] && (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-6 bg-slate-50 border-y border-slate-100"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {/* --- 4. Loop through KNOWN_PERMISSIONS --- */}
                              {KNOWN_PERMISSIONS.map((perm) => (
                                <div
                                  key={perm.key}
                                  className="flex items-center gap-3 bg-white p-2 rounded border border-slate-200 shadow-sm"
                                >
                                  {role[perm.key] ? (
                                    <CheckCircle2
                                      size={18}
                                      className="text-emerald-500"
                                    />
                                  ) : (
                                    <XCircle
                                      size={18}
                                      className="text-slate-300"
                                    />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      role[perm.key]
                                        ? "text-slate-700"
                                        : "text-slate-400 line-through"
                                    }`}
                                  >
                                    {perm.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {paginatedRoles.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No roles found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {paginatedRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  // accessKeys removed, logic moved inside Component
                  expanded={expandedRows[role.id]}
                  onToggle={() => toggleExpand(role.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredRoles.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modal --- */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddRestriction
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              refreshData={fetchRoles}
              jobRoleToEdit={selectedRole}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRestriction;
