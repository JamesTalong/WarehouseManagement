import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useDispatch } from "react-redux";

// --- New: Import Icons ---
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

import logo from "../../Images/logo.png";
import { domain } from "../../security";
import Loader from "../../components/loader/Loader";
import { SET_ACTIVE_USER } from "../../redux/IchthusSlice";

const SignIn = () => {
  // State for inputs
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isLoading, setIsLoading] = useState(false);

  // Error states remain the same
  const [errUserName, setErrUserName] = useState("");
  const [errPassword, setErrPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Handlers remain the same
  const handleUserName = (e) => {
    setUserName(e.target.value);
    setErrUserName("");
  };

  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  // Login logic remains the same
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (userName === "") {
      setIsLoading(false);
      setErrUserName("Enter your username");
      toast.error("Enter your username");
      return;
    }

    if (password === "") {
      setIsLoading(false);
      setErrPassword("Enter your password");
      toast.error("Enter your password");
      return;
    }

    try {
      const response = await axios.post(`${domain}/api/Users/login`, {
        userName: userName,
        password: password,
      });

      const userData = response.data;
      console.log("Login successful, user data:", userData);

      dispatch(
        SET_ACTIVE_USER({
          userID: userData.id,
          userName: userData.userName,
          employeeId: userData.employeeId,
          roleName: userData.roleName,
          roleId: userData.roleId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName,
          imgUrl: userData.employeeImage,
          locationId: userData.locationId,
          locationName: userData.locationName,
        }),
      );

      toast.success("Login Successful...");
      navigate("/admin");
    } catch (error) {
      const message =
        error.response?.data ||
        error.message ||
        "Invalid username or password.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      {/* Loader component is now conditionally rendered inside the button */}

      <div className="min-h-screen flex bg-gray-50">
        {/* Left section: Image with a subtle overlay for better contrast */}
        <div
          className="hidden lg:block relative lg:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://www.shippingbo.com/content/uploads/2023/09/travailleurs-marchandise-stock-entrepot-2309x1299-1-1024x576.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-10">
            <h1 className="text-4xl font-bold">Inventory Management System</h1>
            <p className="mt-4 text-lg text-gray-200 text-center">
              Streamline your operations, from stock to shipment.
            </p>
          </div>
        </div>

        {/* Right section: The Form */}
        <div className="flex items-center justify-center w-full lg:w-1/2 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
            <div className="text-center">
              <img className="mx-auto h-20 w-auto" src={logo} alt="Logo" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                POINT7VEN
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
              {/* Username Input */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={userName}
                    onChange={handleUserName}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                    placeholder="your_username"
                  />
                </div>
                {errUserName && (
                  <p className="text-red-500 text-xs mt-1">{errUserName}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    // --- Dynamic type for password visibility ---
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handlePassword}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                    placeholder="••••••••"
                  />
                  {/* --- The Eye Icon Button --- */}
                  <button
                    type="button" // Important to prevent form submission
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errPassword && (
                  <p className="text-red-500 text-xs mt-1">{errPassword}</p>
                )}
              </div>

              <div className="text-sm text-right">
                <Link
                  to="/forgot-password" // A more standard route name
                  className="font-medium text-orange-600 hover:text-orange-500"
                >
                  Forgot your password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading} // Disable button when loading
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? <Loader /> : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;
