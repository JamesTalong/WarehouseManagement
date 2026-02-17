import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  Building2,
  BarChart2,
  UserCheck,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddEmployee from "./AddEmployee";
import ViewEmployeeModal from "./ViewEmployeeModal";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Simplified Mobile Card Component
const EmployeeCard = ({ employee, onView, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <UserCheck size={18} />
        </div>
        <div>
          <span className="block font-bold text-slate-800 text-lg leading-tight">
            {employee.firstName} {employee.lastName}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            ID: {employee.id}
          </span>
        </div>
      </div>
      <span
        className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
          employee.employmentStatus === "Active"
            ? "bg-green-50 text-green-600 border-green-100"
            : "bg-red-50 text-red-600 border-red-100"
        }`}
      >
        {employee.employmentStatus}
      </span>
    </div>

    <div className="space-y-1 mb-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Briefcase size={14} className="text-slate-400" /> {employee.position}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Building2 size={14} className="text-slate-400" /> {employee.department}
      </div>
    </div>

    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
      <button
        onClick={() => onView(employee)}
        className="flex-1 py-2 border border-slate-100 text-slate-600 rounded hover:bg-slate-50 text-sm font-medium flex justify-center items-center gap-2 transition-colors"
      >
        <Eye size={16} /> View
      </button>
      <button
        onClick={() => onEdit(employee)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2 transition-colors"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(employee.id)}
        className="p-2 border border-red-100 text-red-600 rounded hover:bg-red-50 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

const AllEmployees = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeToView, setEmployeeToView] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const apiUrl = `${domain}/api/Employees`;
    try {
      const response = await axios.get(apiUrl);
      setEmployeeData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = employeeData.filter((employee) => {
      const fullName = `${employee.firstName || ""} ${
        employee.middleName || ""
      } ${employee.lastName || ""}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    setFilteredEmployees(results);
    setCurrentPage(1);
  }, [searchTerm, employeeData]);

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await axios.delete(`${domain}/api/Employees/${id}`);
      toast.success("Employee Successfully Deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete Employee.");
    }
  };

  const openModal = async (employee = null) => {
    if (!employee) {
      setEmployeeToEdit(null);
      setIsModalVisible(true);
      return;
    }
    setIsDetailLoading(true);
    try {
      const response = await axios.get(
        `${domain}/api/Employees/${employee.id}`
      );
      setEmployeeToEdit(response.data);
      setIsModalVisible(true);
    } catch (error) {
      toast.error("Failed to fetch employee details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEmployeeToEdit(null);
    fetchData();
  };

  const openViewModal = async (employee) => {
    setIsDetailLoading(true);
    try {
      const response = await axios.get(
        `${domain}/api/Employees/${employee.id}`
      );
      setEmployeeToView(response.data);
    } catch (error) {
      toast.error("Failed to fetch employee details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />
      {isDetailLoading && <Loader />}

      {/* --- Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-indigo-600" /> Employee Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your workforce, positions, and departmental structure.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Employee
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
              <p className="text-sm text-slate-500">Total Employees</p>
              <p className="text-2xl font-bold text-slate-800">
                {employeeData.length}
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
              placeholder="Search by Employee Name..."
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
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Employee Name</th>
                    <th className="px-6 py-4">Position / Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentEmployees.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-400">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.firstName} {item.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-medium">
                          {item.position}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.department}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            item.employmentStatus === "Active"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {item.employmentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(item)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
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
                            onClick={() => deleteEmployee(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentEmployees.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentEmployees.map((item) => (
                <EmployeeCard
                  key={item.id}
                  employee={item}
                  onView={openViewModal}
                  onEdit={openModal}
                  onDelete={deleteEmployee}
                />
              ))}
              {currentEmployees.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No employees found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={employeesPerPage}
                totalItems={filteredEmployees.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AddEmployee
              onClose={closeModal}
              refreshData={fetchData}
              employeeToEdit={employeeToEdit}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {employeeToView && (
        <ViewEmployeeModal
          employee={employeeToView}
          onClose={() => setEmployeeToView(null)}
        />
      )}
    </div>
  );
};

export default AllEmployees;
