import React, { useEffect, useState, useRef } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddCustomer = ({ onClose, refreshData, customerToEdit }) => {
  // 1. State Definition
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    mobileNumber: "",
    address: "",
    businessStyle: "",
    customerType: "Walk-In",
    tinNumber: "",
    rfid: "",
    ewt: false,
    cor: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  // Ref for auto-focusing the name input
  const nameInputRef = useRef(null);

  // 2. Initialization Logic
  useEffect(() => {
    const initForm = async () => {
      if (customerToEdit) {
        setFormData({
          customerName: customerToEdit.customerName || "",
          email: customerToEdit.email || "",
          mobileNumber: customerToEdit.mobileNumber || "",
          address: customerToEdit.address || "",
          businessStyle: customerToEdit.businessStyle || "",
          customerType: customerToEdit.customerType || "Walk-In",
          tinNumber: customerToEdit.tinNumber || "",
          rfid: customerToEdit.rfid || "",
          ewt: customerToEdit.ewt === true,
          cor: null,
        });

        // Fetch COR image logic
        try {
          setIsFetchingImage(true);
          const response = await axios.get(
            `${domain}/api/Customers/${customerToEdit.id}`
          );
          const fullData = response.data;
          const backendImage = fullData.cor || fullData.COR;

          if (backendImage) {
            setImagePreview(`data:image/png;base64,${backendImage}`);
          } else {
            setImagePreview(null);
          }
        } catch (error) {
          console.error("Error fetching customer image details:", error);
        } finally {
          setIsFetchingImage(false);
        }
      } else {
        // Reset for New Entry
        setFormData({
          customerName: "",
          email: "",
          mobileNumber: "",
          address: "",
          businessStyle: "",
          customerType: "Walk-In",
          tinNumber: "",
          rfid: "",
          ewt: false,
          cor: null,
        });
        setImagePreview(null);

        // Auto-focus on name when adding new
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }
    };

    initForm();
  }, [customerToEdit]);

  // 3. Handlers
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleTypeChange = (value) => {
    setFormData({ ...formData, customerType: value });
  };

  const handleEwtChange = (value) => {
    setFormData({ ...formData, ewt: value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      try {
        const base64 = await convertToBase64(file);
        const base64String = base64.split(",")[1];
        setFormData({ ...formData, cor: base64String });
      } catch (error) {
        console.error("Error converting file", error);
        toast.error("Error processing image");
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const openImageInNewTab = () => {
    if (imagePreview) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<body style="margin:0; display:flex; justify-content:center; align-items:center; background-color:#1a1a1a;">
               <img src="${imagePreview}" style="max-width:100%; height:auto;" alt="COR Preview" />
             </body>`
        );
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = `${domain}/api/Customers`;

    try {
      if (customerToEdit) {
        await axios.put(`${apiUrl}/${customerToEdit.id}`, formData);
        toast.success("Customer updated successfully");
      } else {
        // Uncommented API Call
        await axios.post(apiUrl, formData);
        toast.success("Customer added successfully");
      }
      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setIsLoading(false);
      toast.error(
        `${customerToEdit ? "Error updating" : "Error adding"} customer.`
      );
    }
  };

  // Styles
  const inputStyle =
    "mt-1 border border-gray-300 py-2 px-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      {isLoading && <Loader />}

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {customerToEdit ? "Edit Customer Details" : "Add New Customer"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete the profile below.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
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
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="customerForm" onSubmit={handleFormSubmit}>
            {/* HERO SECTION: Customer Name */}
            <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
              <label
                htmlFor="customerName"
                className="block text-sm font-bold text-indigo-900 mb-2 uppercase tracking-wide"
              >
                Customer Name <span className="text-red-600">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="customerName"
                type="text"
                required
                placeholder="ENTER CUSTOMER NAME HERE"
                className="w-full text-lg font-semibold text-gray-800 placeholder-gray-400 border-2 border-indigo-200 rounded-lg focus:border-indigo-600 focus:ring-0 px-4 py-3 transition-colors shadow-sm"
                value={formData.customerName}
                onChange={handleInputChange}
              />
              <p className="text-xs text-indigo-500 mt-2 font-medium">
                This field is mandatory and will be used as the primary
                identifier.
              </p>
            </div>

            {/* Standard Grid Section */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Type */}
                <div className="md:col-span-2">
                  <label className={labelStyle}>Customer Type</label>
                  <div className="flex items-center gap-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="customerType"
                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        checked={formData.customerType === "Walk-In"}
                        onChange={() => handleTypeChange("Walk-In")}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                        Walk-In
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="customerType"
                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        checked={formData.customerType === "Client"}
                        onChange={() => handleTypeChange("Client")}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                        Client (Corporate)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelStyle}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="e.g., contact@abc.com"
                    className={inputStyle}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="mobileNumber" className={labelStyle}>
                    Mobile Number
                  </label>
                  <input
                    id="mobileNumber"
                    type="tel"
                    placeholder="e.g., 09123456789"
                    className={inputStyle}
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                  />
                </div>

                {/* TIN */}
                <div>
                  <label htmlFor="tinNumber" className={labelStyle}>
                    TIN Number
                  </label>
                  <input
                    id="tinNumber"
                    type="text"
                    placeholder="000-000-000-000"
                    className={inputStyle}
                    value={formData.tinNumber}
                    onChange={handleInputChange}
                  />
                </div>

                {/* EWT (Boolean Radio) */}
                <div>
                  <label className={labelStyle}>
                    Expanded Withholding Tax (EWT)
                  </label>
                  <div className="flex items-center gap-6 mt-3 pl-1">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="ewt"
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        checked={formData.ewt === true}
                        onChange={() => handleEwtChange(true)}
                      />
                      <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                        Yes
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="ewt"
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        checked={formData.ewt === false}
                        onChange={() => handleEwtChange(false)}
                      />
                      <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                        No
                      </span>
                    </label>
                  </div>
                </div>

                {/* Business Style */}
                <div>
                  <label htmlFor="businessStyle" className={labelStyle}>
                    Business Style / Company
                  </label>
                  <input
                    id="businessStyle"
                    type="text"
                    placeholder="e.g., Retail, Manufacturing"
                    className={inputStyle}
                    value={formData.businessStyle}
                    onChange={handleInputChange}
                  />
                </div>

                {/* RFID */}
                <div>
                  <label htmlFor="rfid" className={labelStyle}>
                    RFID Tag
                  </label>
                  <input
                    id="rfid"
                    type="text"
                    placeholder="Scan or enter RFID"
                    className={inputStyle}
                    value={formData.rfid}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelStyle}>
                    Address
                  </label>
                  <textarea
                    id="address"
                    placeholder="e.g., 123 Main St, City, Province"
                    rows="3"
                    className={inputStyle}
                    value={formData.address}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                {/* COR Image Upload Section */}
                <div className="md:col-span-2 border-t border-gray-200 pt-6">
                  <label className="block text-lg font-bold text-gray-800 mb-2">
                    Certificate of Registration (COR)
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload the customer's Certificate of Registration if
                    applicable.
                  </p>

                  {isFetchingImage ? (
                    <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                        <span className="text-sm text-gray-500">
                          Loading image...
                        </span>
                      </div>
                    </div>
                  ) : imagePreview ? (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-indigo-200 border-dashed rounded-lg bg-indigo-50/50">
                      <div
                        className="relative w-full max-w-md h-64 cursor-zoom-in group overflow-hidden rounded-lg shadow-lg bg-white"
                        onClick={openImageInNewTab}
                      >
                        <img
                          src={imagePreview}
                          alt="COR Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="mt-6">
                        <label
                          htmlFor="cor-upload-change"
                          className="cursor-pointer bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
                        >
                          Change Image
                        </label>
                        <input
                          id="cor-upload-change"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="cor-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-10 h-10 mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-bold text-gray-700">
                              Click to upload image
                            </span>
                          </p>
                        </div>
                        <input
                          id="cor-upload"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="customerForm"
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md"
          >
            {customerToEdit ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
