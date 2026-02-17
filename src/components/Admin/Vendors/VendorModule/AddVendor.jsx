import React, { useEffect, useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddVendor = ({ onClose, refreshData, vendorToEdit }) => {
  const [formData, setFormData] = useState({
    vendorName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    address: "",
    specialization: "",
    vendorStatus: "Active",
    tin: "",
    ewt: false,
    priceType: "", // Added to state
    cor: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  useEffect(() => {
    const initForm = async () => {
      if (vendorToEdit) {
        // 1. Populate basic text fields
        setFormData({
          vendorName: vendorToEdit.vendorName || "",
          contactPerson: vendorToEdit.contactPerson || "",
          email: vendorToEdit.email || "",
          phoneNumber: vendorToEdit.phoneNumber || "",
          address: vendorToEdit.address || "",
          specialization: vendorToEdit.specialization || "",
          vendorStatus: vendorToEdit.vendorStatus || "Active",
          tin: vendorToEdit.tin || "",
          ewt: vendorToEdit.ewt === true,
          priceType: vendorToEdit.priceType || "", // Populate from edit data
          cor: null,
        });

        // 2. Fetch the FULL details
        try {
          setIsFetchingImage(true);
          const response = await axios.get(
            `${domain}/api/Vendors/${vendorToEdit.id}`
          );
          const fullData = response.data;

          // Ensure priceType is updated if it wasn't in the list view prop
          setFormData((prev) => ({
            ...prev,
            priceType: fullData.priceType || fullData.PriceType || "",
          }));

          const backendImage = fullData.cor || fullData.COR;

          if (backendImage) {
            setImagePreview(`data:image/png;base64,${backendImage}`);
          } else {
            setImagePreview(null);
          }
        } catch (error) {
          console.error("Error fetching vendor image details:", error);
        } finally {
          setIsFetchingImage(false);
        }
      } else {
        // Reset for New Entry
        setFormData({
          vendorName: "",
          contactPerson: "",
          email: "",
          phoneNumber: "",
          address: "",
          specialization: "",
          vendorStatus: "Active",
          tin: "",
          ewt: false,
          priceType: "", // Reset
          cor: null,
        });
        setImagePreview(null);
      }
    };

    initForm();
  }, [vendorToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = `${domain}/api/Vendors`;

    try {
      if (vendorToEdit) {
        await axios.put(`${apiUrl}/${vendorToEdit.id}`, formData);
        toast.success("Vendor updated successfully");
      } else {
        await axios.post(apiUrl, formData);
        toast.success("Vendor added successfully");
      }
      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setIsLoading(false);
      toast.error(
        `${vendorToEdit ? "Error updating" : "Error adding"} vendor.`
      );
    }
  };

  const openImageInNewTab = () => {
    if (imagePreview) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<body style="margin:0; display:flex; justify-content:center; align-items:center; background-color:#1a1a1a;">
               <img src="${imagePreview}" style="max-width:100%; height:auto; box-shadow: 0 4px 6px rgba(0,0,0,0.3);" alt="COR Preview" />
             </body>`
        );
      }
    }
  };

  // Styles
  const inputStyle =
    "mt-1 border border-gray-300 py-2 px-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      {isLoading && <Loader />}

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {vendorToEdit ? "Edit Vendor Details" : "Add New Vendor"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please fill in the required information.
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form
            id="vendorForm"
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vendor Name */}
              <div className="md:col-span-2">
                <label htmlFor="vendorName" className={labelStyle}>
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="vendorName"
                  type="text"
                  placeholder="e.g., Global Tech Suppliers"
                  required
                  className={inputStyle}
                  value={formData.vendorName}
                  onChange={handleInputChange}
                />
              </div>

              {/* Contact Person */}
              <div>
                <label htmlFor="contactPerson" className={labelStyle}>
                  Contact Person
                </label>
                <input
                  id="contactPerson"
                  type="text"
                  placeholder="e.g., Jane Doe"
                  className={inputStyle}
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelStyle}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g., contact@gts.com"
                  className={inputStyle}
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className={labelStyle}>
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g., (555) 123-4567"
                  className={inputStyle}
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="vendorStatus" className={labelStyle}>
                  Status
                </label>
                <select
                  id="vendorStatus"
                  className={inputStyle}
                  value={formData.vendorStatus}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Price Type (New Field) */}
              <div>
                <label htmlFor="priceType" className={labelStyle}>
                  Price Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="priceType"
                  className={`mt-1 border rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-900 transition duration-200 bg-white shadow-sm ${
                    !formData.priceType
                      ? "border-amber-300 text-amber-700"
                      : "border-gray-300 text-gray-700"
                  }`}
                  value={formData.priceType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>
                    Select Price Type
                  </option>
                  <option value="vatEx">VAT Exclusive</option>
                  <option value="vatInc">VAT Inclusive</option>
                  <option value="reseller">Reseller</option>
                  <option value="zeroRated">Zero Rated</option>
                </select>
              </div>

              {/* TIN */}
              <div>
                <label htmlFor="tin" className={labelStyle}>
                  Taxpayer Identification Number (TIN)
                </label>
                <input
                  id="tin"
                  type="text"
                  placeholder="000-000-000-000"
                  className={inputStyle}
                  value={formData.tin}
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
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
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
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      checked={formData.ewt === false}
                      onChange={() => handleEwtChange(false)}
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                      No
                    </span>
                  </label>
                </div>
              </div>

              {/* Specialization */}
              <div className="md:col-span-2">
                <label htmlFor="specialization" className={labelStyle}>
                  Specialization
                </label>
                <input
                  id="specialization"
                  type="text"
                  placeholder="e.g., Computer Hardware, Network Cabling"
                  className={inputStyle}
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className={labelStyle}>
                  Business Address
                </label>
                <textarea
                  id="address"
                  placeholder="e.g., 123 Tech Way, Silicon Valley, CA"
                  rows="3"
                  className={inputStyle}
                  value={formData.address}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              {/* COR Image Upload Section (Existing Code) */}
              <div className="md:col-span-2 border-t border-gray-200 pt-6">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Certificate of Registration (COR)
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Please upload a clear image of the Certificate of
                  Registration.
                </p>

                {isFetchingImage ? (
                  <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-2"></div>
                      <span className="text-sm text-gray-500">
                        Loading existing image...
                      </span>
                    </div>
                  </div>
                ) : imagePreview ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-orange-200 border-dashed rounded-lg bg-orange-50/50">
                    <div
                      className="relative w-full max-w-md h-64 cursor-zoom-in group overflow-hidden rounded-lg shadow-lg bg-white"
                      onClick={openImageInNewTab}
                      title="Click to view full image"
                    >
                      <img
                        src={imagePreview}
                        alt="COR Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-black/75 text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2">
                          View Full Image
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label
                        htmlFor="cor-upload-change"
                        className="cursor-pointer bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-sm"
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
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-bold text-gray-700">
                            Click to upload image
                          </span>{" "}
                          or drag and drop
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
            form="vendorForm"
            className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-all shadow-md"
          >
            {vendorToEdit ? "Save Changes" : "Create Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVendor;
