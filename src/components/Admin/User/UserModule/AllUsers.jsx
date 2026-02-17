import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  BarChart2,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddUsers from "../UserModule/AddUsers";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Mobile Card Component for Users
const UserCard = ({ user, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <UserCheck size={18} />
        </div>
        <div>
          <span className="block font-bold text-slate-800 text-lg leading-tight">
            {user.employeeName}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            ID: {user.employeeId} | @{user.userName}
          </span>
        </div>
      </div>
      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold border border-slate-200">
        {user.roleName}
      </span>
    </div>
    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
      <button
        onClick={() => onEdit(user)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2 transition-colors"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(user.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2 transition-colors"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllUsers = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Users`;
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setUserData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch users.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = userData.filter(
      (user) =>
        user.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
    setCurrentPage(1);
  }, [searchTerm, userData]);

  const deleteUser = async (id) => {
    const apiUrl = `${domain}/api/Users/${id}`;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(apiUrl);
      toast.success("User Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const openModal = (user = null) => {
    setUserToEdit(user);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setUserToEdit(null);
    fetchData();
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

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
                <Users className="text-indigo-600" /> User Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage system users, roles, and account access permissions.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add New User
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
              <p className="text-sm text-slate-500">Total System Users</p>
              <p className="text-2xl font-bold text-slate-800">
                {userData.length}
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
              placeholder="Search by name, username or ID..."
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
                    <th className="px-6 py-4">Employee Details</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {user.employeeName}
                          </span>
                          <span className="text-xs text-slate-400">
                            ID: {user.employeeId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">
                          @{user.userName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Shield size={14} className="text-indigo-500" />
                          {user.roleName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(user)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit User"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={openModal}
                  onDelete={deleteUser}
                />
              ))}
              {currentUsers.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No users found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={usersPerPage}
                totalItems={filteredUsers.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <AddUsers
              onClose={closeModal}
              refreshData={fetchData}
              userToEdit={userToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
