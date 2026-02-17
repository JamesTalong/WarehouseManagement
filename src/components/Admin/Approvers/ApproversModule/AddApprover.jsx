import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddApprover = ({ onClose, refreshData, approverToEdit }) => {
  const [formData, setFormData] = useState({
    userId: "",
  });

  // State to store the list of users for the dropdown
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // 1. Fetch Users on Component Mount to populate Dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${domain}/api/Users`);
        setUsersList(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Could not load users list.");
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // 2. If editing, set the existing User ID
  useEffect(() => {
    if (approverToEdit) {
      setFormData({
        userId: approverToEdit.userId, // The API returns 'userId' in the GET response
      });
    }
  }, [approverToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId) {
      toast.warning("Please select a user.");
      return;
    }

    setIsLoading(true);
    const apiUrl = domain + "/api/Approvers";

    // Prepare payload (API expects an integer for userId)
    const payload = {
      userId: parseInt(formData.userId),
    };

    try {
      if (approverToEdit) {
        // Update existing Approver
        await axios.put(`${apiUrl}/${approverToEdit.approverId}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Approver updated successfully");
      } else {
        // Add new Approver
        await axios.post(apiUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Approver added successfully");
      }

      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      // Check if it's a specific API error message (e.g., "User already an approver")
      const errMsg = error.response?.data || error.message;
      toast.error(`Error: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && <Loader />}
      <div className="relative w-full pt-4 py-4 px-12">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-3xl mb-4 font-semibold text-slate-800">
          {approverToEdit ? "Edit Approver" : "Add Approver"}
        </h2>

        <form onSubmit={handleFormSubmit}>
          <div className="mt-5">
            <label className="block text-slate-600 mb-2 font-medium">
              Select User
            </label>

            {fetchingUsers ? (
              <div className="text-sm text-gray-500 animate-pulse">
                Loading users...
              </div>
            ) : (
              <div className="relative">
                <select
                  id="userId"
                  className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={formData.userId}
                  onChange={handleInputChange}
                >
                  <option value="">-- Select a User --</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {/* Display Employee Name and Username for clarity */}
                      {user.employeeName} ({user.userName})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Select a user to grant approval privileges.
            </p>
          </div>

          <div className="mt-8">
            <button
              disabled={fetchingUsers || isLoading}
              className={`w-full py-3 text-center text-white rounded-lg transition-colors font-medium
                ${fetchingUsers ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}
                `}
            >
              {approverToEdit ? "Update Approver" : "Add Approver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApprover;
