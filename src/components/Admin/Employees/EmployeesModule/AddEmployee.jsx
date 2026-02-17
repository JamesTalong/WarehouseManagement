import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";
import profile from "../../../../Images/profile.jpg";
import SearchableDropdown from "../../../../UI/common/SearchableDropdown";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const AddEmployee = ({ onClose, refreshData, employeeToEdit }) => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(profile);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    // Image
    employeeImage: null,

    // Personal & Contact Info
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "Male",
    civilStatus: "Single",
    nationality: "",
    mobileNumber: "",
    currentAddress: "",
    permanentAddress: "",

    // Employment Details
    employmentType: "Full-Time",
    position: "",
    department: "",
    dateHired: new Date().toISOString().split("T")[0],
    dateRegularized: "",
    employmentStatus: "Active",
    workSchedule: "",
    locationId: "",
  });

  // --- EFFECTS ---
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toISOString().split("T")[0];
    } catch (error) {
      return "";
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${domain}/api/Locations`);
        setLocations(response.data);
      } catch (error) {
        toast.error("Failed to fetch locations.");
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        ...employeeToEdit,
        employeeImage: null, // Reset file input
        sex: employeeToEdit.sex || "Male",
        civilStatus: employeeToEdit.civilStatus || "Single",
        employmentType: employeeToEdit.employmentType || "Full-Time",
        employmentStatus: employeeToEdit.employmentStatus || "Active",
        dateHired: formatDateForInput(employeeToEdit.dateHired),
        dateRegularized: formatDateForInput(employeeToEdit.dateRegularized),
        dateOfBirth: formatDateForInput(employeeToEdit.dateOfBirth),
        locationId: employeeToEdit.locationId || "",
      });

      // Now this block will work correctly
      if (employeeToEdit.employeeImage) {
        setPreviewImage(
          `data:image/jpeg;base64,${employeeToEdit.employeeImage}`
        );
      } else {
        setPreviewImage(profile);
      }
    }
  }, [employeeToEdit]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleLocationChange = (selectedLocationId) => {
    setFormData({ ...formData, locationId: selectedLocationId });
  };

  const handleGenderChange = (gender) => {
    setFormData({ ...formData, sex: gender });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imagePreviewUrl = URL.createObjectURL(file);
      setPreviewImage(imagePreviewUrl);
      setFormData({ ...formData, employeeImage: file });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = `${domain}/api/Employees`;

    let imageBase64 = null;
    if (formData.employeeImage) {
      const base64String = await toBase64(formData.employeeImage);
      imageBase64 = base64String ? base64String.split(",")[1] : null;
    }

    const payload = {
      ...formData,
      employeeImage: imageBase64,
      dateRegularized: formData.dateRegularized || null,
      dateOfBirth: formData.dateOfBirth || null,
      locationId: formData.locationId
        ? parseInt(formData.locationId, 10)
        : null,
    };

    try {
      if (employeeToEdit) {
        if (!payload.employeeImage) {
          delete payload.employeeImage;
        }
        await axios.put(`${apiUrl}/${employeeToEdit.id}`, payload);
        toast.success("Employee updated successfully!");
      } else {
        await axios.post(apiUrl, payload);
        toast.success("Employee added successfully!");
      }
      refreshData();
      onClose();
    } catch (error) {
      toast.error(
        `Failed to ${employeeToEdit ? "update" : "add"} employee. ${
          error.response?.data?.title || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER LOGIC ---
  const renderBasicInfoTab = () => (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Image Upload */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee Image
          </label>
          <div className="w-32 h-32 overflow-hidden rounded-full border-2 border-gray-300 mb-3">
            <img
              src={previewImage}
              alt="Employee Preview"
              className="object-cover w-full h-full"
              onError={(e) => (e.target.src = profile)}
            />
          </div>
          <input
            type="file"
            id="employeeImage"
            onChange={handleImageChange}
            accept="image/*"
            className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Name Fields */}
        <div className="w-full space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="middleName"
              className="block text-sm font-medium text-gray-700"
            >
              Middle Name
            </label>
            <input
              type="text"
              id="middleName"
              value={formData.middleName}
              onChange={handleInputChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>
      <hr className="my-5" />

      {/* Other Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700"
          >
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="mobileNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            placeholder="+63 9XX XXX XXXX"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="civilStatus"
            className="block text-sm font-medium text-gray-700"
          >
            Civil Status
          </label>
          <select
            id="civilStatus"
            value={formData.civilStatus}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Widowed</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="nationality"
            className="block text-sm font-medium text-gray-700"
          >
            Country / Nationality
          </label>
          <input
            type="text"
            id="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            placeholder="e.g., Filipino"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Male", "Female", "Other"].map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() => handleGenderChange(gender)}
              className={`px-5 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                formData.sex === gender
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="currentAddress"
          className="block text-sm font-medium text-gray-700"
        >
          Current Address
        </label>
        <textarea
          id="currentAddress"
          rows="2"
          value={formData.currentAddress}
          onChange={handleInputChange}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        ></textarea>
      </div>
      <div>
        <label
          htmlFor="permanentAddress"
          className="block text-sm font-medium text-gray-700"
        >
          Permanent Address
        </label>
        <textarea
          id="permanentAddress"
          rows="2"
          value={formData.permanentAddress}
          onChange={handleInputChange}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
      </div>
    </>
  );

  const renderEmploymentTab = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="position"
            className="block text-sm font-medium text-gray-700"
          >
            Job Title / Position
          </label>
          <input
            type="text"
            id="position"
            value={formData.position}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700"
          >
            Department
          </label>
          <input
            type="text"
            id="department"
            value={formData.department}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="employmentType"
            className="block text-sm font-medium text-gray-700"
          >
            Employment Type
          </label>
          <select
            id="employmentType"
            value={formData.employmentType}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option>Full-Time</option>
            <option>Part-Time</option>
            <option>Contract</option>
            <option>Intern</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="employmentStatus"
            className="block text-sm font-medium text-gray-700"
          >
            Employment Status
          </label>
          <select
            id="employmentStatus"
            value={formData.employmentStatus}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option>Active</option>
            <option>Inactive</option>
            <option>On Leave</option>
            <option>Terminated</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="dateHired"
            className="block text-sm font-medium text-gray-700"
          >
            Date Hired
          </label>
          <input
            type="date"
            id="dateHired"
            value={formData.dateHired}
            onChange={handleInputChange}
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="dateRegularized"
            className="block text-sm font-medium text-gray-700"
          >
            Date Regularized
          </label>
          <input
            type="date"
            id="dateRegularized"
            value={formData.dateRegularized}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="workSchedule"
            className="block text-sm font-medium text-gray-700"
          >
            Work Schedule
          </label>
          <input
            type="text"
            id="workSchedule"
            value={formData.workSchedule}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="locationId"
            className="block text-sm font-medium text-gray-700"
          >
            Location / Branch
          </label>
          <SearchableDropdown
            options={locations}
            value={formData.locationId}
            onChange={handleLocationChange}
            placeholder="Select a location..."
            labelKey="locationName"
            valueKey="id"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow-xl w-full  flex flex-col max-h-[90vh]">
      {isLoading && <Loader />}
      {/* Modal Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-900">
            {employeeToEdit ? "Edit Employee Details" : "Add New Employee"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 border-b border-gray-200">
        <nav
          className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto"
          aria-label="Tabs"
        >
          <button
            onClick={() => setActiveTab("basic")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "basic"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Basic information
          </button>
          <button
            onClick={() => setActiveTab("employment")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "employment"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Employment Details
          </button>
        </nav>
      </div>

      {/* Form Content */}
      <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto">
        <div className="p-6 space-y-5">
          {activeTab === "basic" && renderBasicInfoTab()}
          {activeTab === "employment" && renderEmploymentTab()}
        </div>

        {/* Form Footer / Navigation */}
        <div className="flex justify-end items-center p-6 mt-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {activeTab === "basic" && (
            <button
              type="button"
              onClick={() => setActiveTab("employment")}
              className="ml-3 inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
            </button>
          )}
          {activeTab === "employment" && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Previous
              </button>
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : employeeToEdit
                  ? "Save Changes"
                  : "Add Employee"}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;
