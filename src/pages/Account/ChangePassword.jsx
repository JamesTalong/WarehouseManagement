import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../Images/logo.png";
import axios from "axios";
import { domain } from "../../security";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../components/loader/Loader";

const ChangePassword = () => {
  // State for form inputs
  const [userName, setUserName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // --- Client-side validation ---
    if (!userName || !oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      // Send request to the new C# endpoint
      const response = await axios.post(`${domain}/api/Users/change-password`, {
        userName,
        oldPassword,
        newPassword,
      });

      toast.success(response.data.message || "Password changed successfully!");

      // Navigate to the sign-in page after a short delay
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error) {
      const message =
        error.response?.data || "An error occurred. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
          <div className="text-center">
            <img className="mx-auto h-20 w-auto" src={logo} alt="Logo" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Change Password
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handlePasswordChange}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Username"
                />
              </div>
              {/* Old Password */}
              <div>
                <label htmlFor="old-password">Old Password</label>
                <input
                  id="old-password"
                  name="oldPassword"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Old Password"
                />
              </div>
              {/* New Password */}
              <div>
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="New Password"
                />
              </div>
              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm-new-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password"
                  name="confirmNewPassword"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Confirm New Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;
