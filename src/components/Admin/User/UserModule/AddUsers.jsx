import { useEffect, useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import { FaEye, FaEyeSlash, FaTimes, FaKey } from "react-icons/fa"; // Added FaKey for the button
import SearchableDropdown from "../../../../UI/common/SearchableDropdown";

const AddUsers = ({ onClose, refreshData, userToEdit }) => {
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    employeeId: "",
    roleId: "",
  });
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // --- NEW STATE ---
  // This state controls the visibility of the password field in EDIT mode.
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch Job Roles and Employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, employeesRes] = await Promise.all([
          axios.get(`${domain}/api/JobRole`),
          axios.get(`${domain}/api/Employees`),
        ]);
        setRoles(rolesRes.data);
        const formattedEmployees = employeesRes.data.map((emp) => ({
          ...emp,
          fullName: `${emp.firstName} ${emp.lastName} - ${emp.id}`,
        }));
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Could not load necessary data.");
      }
    };
    fetchData();
  }, []);

  // Populate form if in edit mode
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        userName: userToEdit.userName || "",
        employeeId: userToEdit.employeeId || "",
        roleId: userToEdit.roleId || "",
        password: "", // Always clear password on open
      });
      // --- MODIFICATION ---
      // Reset the password change state every time the modal is opened for editing.
      setIsChangingPassword(false);
    } else {
      setFormData({ userName: "", password: "", employeeId: "", roleId: "" });
    }
  }, [userToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleDropdownChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const apiUrl = `${domain}/api/Users`;
    try {
      if (userToEdit) {
        const updateUserPayload = {
          employeeId: Number(formData.employeeId),
          roleId: Number(formData.roleId),
        };
        // --- MODIFICATION ---
        // Only include the password in the payload if the user is actively changing it.
        if (isChangingPassword && formData.password) {
          updateUserPayload.password = formData.password;
        }
        await axios.put(`${apiUrl}/${userToEdit.id}`, updateUserPayload);
        toast.success("User updated successfully");
      } else {
        const addUserPayload = {
          ...formData,
          employeeId: Number(formData.employeeId),
          roleId: Number(formData.roleId),
        };
        await axios.post(apiUrl, addUserPayload);
        toast.success("User added successfully");
      }
      refreshData();
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data ||
        `${userToEdit ? "Error updating" : "Error adding"} user.`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Helper to cancel password change ---
  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setFormData((prev) => ({ ...prev, password: "" })); // Clear password input
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {isLoading && <Loader />}

        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            {userToEdit ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                User Name
              </label>
              <input
                id="userName"
                type="text"
                placeholder="e.g., john.doe"
                required
                disabled={!!userToEdit}
                className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150"
                value={formData.userName}
                onChange={handleInputChange}
              />
            </div>

            {/* --- COMPLETE REPLACEMENT OF PASSWORD SECTION --- */}

            {/* Condition: Show this block only if we are in EDIT mode AND NOT changing the password yet */}
            {userToEdit && !isChangingPassword && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  <FaKey />
                  Change Password
                </button>
              </div>
            )}

            {/* Condition: Show this block if we are in ADD mode OR if we ARE changing the password */}
            {(!userToEdit || isChangingPassword) && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  {/* Show a "Cancel" button only in edit mode */}
                  {userToEdit && isChangingPassword && (
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="text-xs text-blue-600 hover:underline focus:outline-none"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    placeholder={
                      userToEdit ? "Enter new password" : "Enter password"
                    }
                    // Password is required only when ADDING a user, or when the user has opted to change it
                    required={!userToEdit || isChangingPassword}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12 transition duration-150"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors "
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* --- END OF PASSWORD SECTION --- */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee
              </label>
              <SearchableDropdown
                options={employees}
                value={formData.employeeId}
                onChange={(value) => handleDropdownChange("employeeId", value)}
                placeholder="Select an employee"
                labelKey="fullName"
                valueKey="id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role
              </label>
              <SearchableDropdown
                options={roles}
                value={formData.roleId}
                onChange={(value) => handleDropdownChange("roleId", value)}
                placeholder="Select a role"
                labelKey="roleName"
                valueKey="id"
              />
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-5 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <button
            type="submit"
            onClick={handleFormSubmit}
            className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg"
          >
            {userToEdit ? "Update User" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUsers;
