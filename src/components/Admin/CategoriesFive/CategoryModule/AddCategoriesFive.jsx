import React, { useEffect, useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddCategoriesFive = ({ onClose, refreshData, CategoryToEdit }) => {
  const [formData, setFormData] = useState({
    categoryFiveName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (CategoryToEdit) {
      setFormData({
        categoryFiveName: CategoryToEdit.categoryFiveName,
      });
    } else {
      setFormData({
        categoryFiveName: "",
      });
    }
  }, [CategoryToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/CategoriesFive";

    try {
      if (CategoryToEdit) {
        // Update logic
        await axios.put(`${apiUrl}/${CategoryToEdit.id}`, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("categoryFive updated successfully");
      } else {
        await axios.post(apiUrl, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("categoryFive added successfully");
      }
      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setIsLoading(false);
      toast.error(
        `${CategoryToEdit ? "Error updating" : "Error adding"} categoryFive: ${
          error.response?.data || error.message
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
        <h2 className="text-3xl mb-4">Add categoryFive</h2>
        <p className="mb-4">Add categoryFive to this form.</p>
        <form onSubmit={handleFormSubmit}>
          <div className="mt-5">
            <span>categoryFive</span>
            <input
              id="categoryFiveName"
              type="text"
              placeholder="PC case, RAM, etc."
              className="border border-gray-400 py-1 px-2 w-full"
              value={formData.categoryFiveName}
              onChange={handleInputChange}
            />
          </div>
          <div className="mt-5">
            <button className="w-full bg-orange-600 py-3 text-center text-white">
              {CategoryToEdit ? "Update categoryFive" : "Add categoryFive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoriesFive;
