import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { UserCheck, Search, Plus, Edit, Trash2, Users } from "lucide-react";

import Loader from "../../../loader/Loader";
import AddApprover from "./AddApprover"; // We will create this next
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Mobile Card Component for Approvers
const ApproverCard = ({ approver, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <UserCheck size={18} />
        </div>
        <div>
          <span className="font-bold text-slate-800 text-lg block">
            {approver.employeeName}
          </span>
          <span className="text-xs text-slate-500">{approver.jobRole}</span>
        </div>
      </div>
    </div>
    <div className="text-sm text-slate-600 mb-3 space-y-1">
      <p>
        <span className="font-medium">Username:</span> {approver.userName}
      </p>
      <p>
        <span className="font-medium">Dept:</span>{" "}
        {approver.department || "N/A"}
      </p>
      <p>
        <span className="font-medium">Location:</span>{" "}
        {approver.location || "N/A"}
      </p>
    </div>
    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
      <button
        onClick={() => onEdit(approver)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(approver.approverId)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllApprovers = () => {
  const [approverData, setApproverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approverToEdit, setApproverToEdit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApprovers, setFilteredApprovers] = useState([]);

  // Fetch Approvers from API
  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Approvers`;
    try {
      const response = await axios.get(apiUrl);
      setApproverData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Approvers.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search Logic (Filters by Employee Name or Username)
  useEffect(() => {
    const results = approverData.filter(
      (item) =>
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredApprovers(results);
    setCurrentPage(1);
  }, [searchTerm, approverData]);

  const deleteApprover = async (id) => {
    if (!window.confirm("Are you sure you want to remove this approver?")) {
      return;
    }

    const apiUrl = `${domain}/api/Approvers/${id}`;
    try {
      await axios.delete(apiUrl);
      toast.success("Approver Removed Successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting approver:", error);
      toast.error("Failed to remove Approver.");
    }
  };

  const openModal = (approver = null) => {
    setApproverToEdit(approver);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setApproverToEdit(null);
    fetchData();
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApprovers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="text-indigo-600" /> Approver Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage authorized approvers for the system.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Approver
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats --- */}
        <div className="grid grid-cols-1 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Approvers</p>
              <p className="text-2xl font-bold text-slate-800">
                {approverData.length}
              </p>
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-2 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee Name or Username..."
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
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <tr
                      key={item.approverId}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.employeeName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.userName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100">
                          {item.jobRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.department || "-"}</td>
                      <td className="px-6 py-4">{item.location || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteApprover(item.approverId)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No approvers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentItems.map((item) => (
                <ApproverCard
                  key={item.approverId}
                  approver={item}
                  onEdit={openModal}
                  onDelete={deleteApprover}
                />
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredApprovers.length}
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
            <AddApprover
              onClose={closeModal}
              refreshData={fetchData}
              approverToEdit={approverToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllApprovers;
