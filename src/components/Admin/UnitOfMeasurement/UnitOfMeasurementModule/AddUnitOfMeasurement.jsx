import React, { useEffect, useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddUnitOfMeasurement = ({ onClose, refreshData, unitToEdit }) => {
  // UPDATED: formData state to include 'code'
  const [formData, setFormData] = useState({
    code: "",
    unitName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // UPDATED: Populate both code and unitName when editing
    if (unitToEdit) {
      setFormData({
        code: unitToEdit.code,
        unitName: unitToEdit.unitName,
      });
    } else {
      setFormData({
        code: "",
        unitName: "",
      });
    }
  }, [unitToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/UnitOfMeasurements";

    try {
      if (unitToEdit) {
        // Update sends the complete formData object
        await axios.put(`${apiUrl}/${unitToEdit.id}`, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Unit of Measurement updated successfully");
      } else {
        // Add sends the complete formData object
        await axios.post(apiUrl, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Unit of Measurement added successfully");
      }
      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setIsLoading(false);
      toast.error(
        `${unitToEdit ? "Error updating" : "Error adding"} unit: ${
          error.response?.data?.title || error.message
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
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
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
        <h2 className="text-3xl mb-4 font-bold text-gray-800">
          {unitToEdit
            ? "Edit Unit of Measurement"
            : "Add New Unit of Measurement"}
        </h2>
        <p className="mb-6 text-gray-600">
          Please fill out the details for the unit of measurement.
        </p>
        <form onSubmit={handleFormSubmit}>
          {/* ADDED: Input field for Code */}
          <div className="mb-5">
            <label
              htmlFor="code"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Code
            </label>
            <input
              id="code"
              type="text"
              placeholder="e.g., PCS, KG, BOX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.code}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="unitName"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Unit Name
            </label>
            <input
              id="unitName"
              type="text"
              placeholder="e.g., Pieces, Kilogram, Box"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.unitName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-md shadow-md hover:bg-orange-700 transition duration-300 ease-in-out disabled:bg-gray-400"
            >
              {isLoading
                ? "Saving..."
                : unitToEdit
                ? "Update Unit"
                : "Add Unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUnitOfMeasurement;
