import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddCustomer = ({ onClose, refreshData, customerToEdit }) => {
  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    tinNumber: "",
    mobileNumber: "",
    businessStyle: "",
    rfid: "",
    customerType: "Walk-In", // Default value
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        customerName: customerToEdit.customerName,
        address: customerToEdit.address,
        tinNumber: customerToEdit.tinNumber,
        mobileNumber: customerToEdit.mobileNumber,
        businessStyle: customerToEdit.businessStyle,
        rfid: customerToEdit.rfid,
        customerType: customerToEdit.customerType || "Walk-In",
      });
    }
  }, [customerToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleRadioChange = (e) => {
    setFormData({ ...formData, customerType: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/Customers";

    try {
      if (customerToEdit) {
        // Update existing customer
        await axios.put(`${apiUrl}/${customerToEdit.id}`, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Customer updated successfully");
      } else {
        // Add new customer
        await axios.post(apiUrl, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Customer added successfully");
      }

      setIsLoading(false);
      refreshData(); // Refresh the parent component data
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast.error(
        `${customerToEdit ? "Error updating" : "Error adding"} customer: ${
          error.message
        }`
      );
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
        <h2 className="text-3xl mb-4">
          {customerToEdit ? "Edit Customer" : "Add Customer"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          <div className="mt-5">
            <label>Customer Type</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Walk-In"
                  checked={formData.customerType === "Walk-In"}
                  onChange={handleRadioChange}
                  className="mr-2"
                />
                Walk-In
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Client"
                  checked={formData.customerType === "Client"}
                  onChange={handleRadioChange}
                  className="mr-2"
                />
                Client
              </label>
            </div>
          </div>
          {[
            { id: "customerName", label: "Customer Name" },
            { id: "address", label: "Address" },
            { id: "tinNumber", label: "TIN Number" },
            { id: "mobileNumber", label: "Mobile Number" },
            { id: "businessStyle", label: "Business Style" },
            { id: "rfid", label: "RFID" },
          ].map(({ id, label }) => (
            <div key={id} className="mt-5">
              <label>{label}</label>
              <input
                id={id}
                type="text"
                placeholder={`Enter ${label}`}
                className="border border-gray-400 py-1 px-2 w-full global-search-input"
                value={formData[id] || ""}
                onChange={handleInputChange}
              />
            </div>
          ))}
          <div className="mt-5">
            <button className="w-full bg-blue-600 py-3 text-center text-white">
              {customerToEdit ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
