import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddBrands = ({ onClose, refreshData, brandToEdit }) => {
  const [formData, setFormData] = useState({
    brandName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (brandToEdit) {
      setFormData({
        brandName: brandToEdit.brandName,
      });
    }
  }, [brandToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/Brands";

    try {
      if (brandToEdit) {
        // Update existing brand
        await axios.put(`${apiUrl}/${brandToEdit.id}`, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Brand updated successfully");
      } else {
        // Add new brand
        await axios.post(apiUrl, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Brand added successfully");
      }

      setIsLoading(false);
      refreshData(); // Refresh the parent component data
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast.error(
        `${brandToEdit ? "Error updating" : "Error adding"} brand: ${
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
          {brandToEdit ? "Edit Brand" : "Add Brand"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          <div className="mt-5">
            <span>Brand</span>
            <input
              id="brandName"
              type="text"
              placeholder="PC case, RAM, etc."
              className="border border-gray-400 py-1 px-2 w-full"
              value={formData.brandName}
              onChange={handleInputChange}
            />
          </div>
          <div className="mt-5">
            <button className="w-full bg-orange-600 py-3 text-center text-white">
              {brandToEdit ? "Update Brand" : "Add Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBrands;
