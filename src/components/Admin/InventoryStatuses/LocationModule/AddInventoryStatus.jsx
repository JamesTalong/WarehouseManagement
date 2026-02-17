import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddInventoryStatus = ({ onClose, refreshData, statusToEdit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isAvailable: true, // Default to true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (statusToEdit) {
      setFormData({
        name: statusToEdit.name || statusToEdit.Name,
        description: statusToEdit.description || statusToEdit.Description || "",
        isAvailable:
          statusToEdit.isAvailable !== undefined
            ? statusToEdit.isAvailable
            : statusToEdit.IsAvailable,
      });
    }
  }, [statusToEdit]);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [id]: type === "checkbox" ? checked : value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/InventoryStatuses";

    try {
      if (statusToEdit) {
        // Update existing
        await axios.put(
          `${apiUrl}/${statusToEdit.id || statusToEdit.Id}`,
          formData,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        toast.success("Status updated successfully");
      } else {
        // Add new
        await axios.post(apiUrl, formData, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Status added successfully");
      }

      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast.error(
        `${statusToEdit ? "Error updating" : "Error adding"} status: ${
          error.message
        }`
      );
    }
  };

  return (
    <div>
      {isLoading && <Loader />}
      <div className="relative w-full pt-4 py-4 px-8 sm:px-12">
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

        <h2 className="text-3xl mb-6 font-bold text-gray-800">
          {statusToEdit ? "Edit Inventory Status" : "Add Inventory Status"}
        </h2>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. In Stock, Damaged, Reserved"
              required
              className="border border-gray-300 rounded-md py-2 px-3 w-full focus:ring-orange-500 focus:border-orange-500 outline-none"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          {/* Description Input */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Describe this status..."
              className="border border-gray-300 rounded-md py-2 px-3 w-full h-24 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Is Available Checkbox */}
          <div className="flex items-center">
            <input
              id="isAvailable"
              type="checkbox"
              className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              checked={formData.isAvailable}
              onChange={handleInputChange}
            />
            <label
              htmlFor="isAvailable"
              className="ml-2 block text-sm text-gray-900"
            >
              Item is Available for use/sale in this status?
            </label>
          </div>

          <div className="pt-2">
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors duration-200">
              {statusToEdit ? "Update Status" : "Add Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryStatus;
