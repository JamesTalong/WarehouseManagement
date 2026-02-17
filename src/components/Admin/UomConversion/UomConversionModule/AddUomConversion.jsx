// File: UomConversionMatrix.js

import React, { useEffect, useState } from "react";
import Loader from "../../../loader/Loader"; // Adjust path as needed
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security"; // Adjust path as needed

const UomConversionMatrix = ({ onClose, refreshData }) => {
  // State to hold all available Units of Measurement
  const [uoms, setUoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State to hold the dynamic list of conversion rules
  const [conversions, setConversions] = useState([]);

  useEffect(() => {
    const fetchUoms = async () => {
      setIsLoading(true);
      try {
        const uomsUrl = `${domain}/api/UnitOfMeasurements`;
        const response = await axios.get(uomsUrl);
        setUoms(response.data);
        // Start with one empty row for the user
        handleAddConversionRow();
      } catch (error) {
        console.error("Failed to fetch UOM data:", error);
        toast.error("Could not load units of measurement.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUoms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler to add a new, empty conversion row
  const handleAddConversionRow = () => {
    setConversions([
      ...conversions,
      // Use a unique ID for React's key prop and for easy removal
      {
        id: Date.now() + Math.random(), // Simple unique ID
        fromUomId: "",
        toUomId: "",
        conversionRate: "",
      },
    ]);
  };

  // Handler to remove a conversion row by its unique ID
  const handleRemoveConversionRow = (id) => {
    setConversions(conversions.filter((conv) => conv.id !== id));
  };

  // Handler to update a specific field in a specific conversion row
  const handleConversionChange = (id, field, value) => {
    setConversions(
      conversions.map((conv) =>
        conv.id === id ? { ...conv, [field]: value } : conv
      )
    );
  };

  // Handler for form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const validConversions = conversions
      .filter(
        (c) =>
          c.fromUomId &&
          c.toUomId &&
          c.conversionRate &&
          !isNaN(parseFloat(c.conversionRate))
      )
      .map((c) => ({
        fromUomId: parseInt(c.fromUomId, 10),
        toUomId: parseInt(c.toUomId, 10),
        conversionRate: parseFloat(c.conversionRate),
      }));

    // Check for duplicate fromUomId -> toUomId pairs
    const uniqueKeys = new Set();
    const payload = [];
    for (const conv of validConversions) {
      const key = `${conv.fromUomId}-${conv.toUomId}`;
      if (!uniqueKeys.has(key)) {
        uniqueKeys.add(key);
        payload.push(conv);
      } else {
        const fromUomName =
          uoms.find((u) => u.id === conv.fromUomId)?.code || "unit";
        const toUomName =
          uoms.find((u) => u.id === conv.toUomId)?.code || "unit";
        toast.warn(
          `Duplicate conversion rule found for ${fromUomName} to ${toUomName}. Only the first one will be saved.`
        );
      }
    }

    if (payload.length === 0) {
      toast.warn(
        "Please enter at least one complete and valid conversion rule."
      );
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = `${domain}/api/UomConversions`;
      await axios.post(apiUrl, payload);
      toast.success(`${payload.length} UOM Conversion(s) added successfully`);
      if (refreshData) refreshData();
      onClose();
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response?.data || error.message
      );
      toast.error(
        `Error adding conversions: ${
          error.response?.data?.title || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 ">
      {isLoading && <Loader />}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          UOM Conversion Rules
        </h2>
        <p className="mt-2 text-md text-gray-600">
          Define conversion rules by adding rows. For example: 1 Box = 12
          Pieces.
        </p>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="space-y-4">
          {/* Header Row */}
          <div className=" hidden md:grid grid-cols-12 gap-4 items-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
            <div className="col-span-1"></div>
            <div className="col-span-4">From Unit</div>
            <div className="col-span-1 text-center"></div>{" "}
            {/* For the '=' sign */}
            <div className="col-span-2">Rate</div>
            <div className="col-span-4">To Unit</div>
          </div>

          {/* Dynamic Conversion Rows */}
          {conversions.map((conv, index) => (
            <div
              key={conv.id}
              className="relative grid grid-cols-12 gap-x-4 gap-y-2 items-center p-2 rounded-lg transition-colors hover:bg-gray-50"
            >
              {/* Row number / Label */}
              <div className="col-span-12 md:col-span-1 flex items-center justify-end">
                <span className="font-semibold text-gray-700">1</span>
              </div>

              {/* From UOM Dropdown */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-sm font-medium text-gray-700 md:hidden">
                  From Unit
                </label>
                <select
                  value={conv.fromUomId}
                  onChange={(e) =>
                    handleConversionChange(conv.id, "fromUomId", e.target.value)
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="" disabled>
                    Select Unit
                  </option>
                  {uoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>
                      {uom.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equals Sign */}
              <div className="hidden md:flex col-span-1 items-center justify-center">
                <span className="text-gray-600 font-bold text-lg">=</span>
              </div>

              {/* Conversion Rate Input */}
              <div className="col-span-6 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 md:hidden">
                  Rate
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., 12"
                  value={conv.conversionRate}
                  onChange={(e) =>
                    handleConversionChange(
                      conv.id,
                      "conversionRate",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* To UOM Dropdown */}
              <div className="col-span-6 md:col-span-4">
                <label className="text-sm font-medium text-gray-700 md:hidden">
                  To Unit
                </label>
                <select
                  value={conv.toUomId}
                  onChange={(e) =>
                    handleConversionChange(conv.id, "toUomId", e.target.value)
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="" disabled>
                    Select Unit
                  </option>
                  {uoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>
                      {uom.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove Button */}
              <div className="col-span-12 md:col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveConversionRow(conv.id)}
                  className="absolute -top-3 -right-2 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"
                  title="Remove this rule"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Fallback for when no rows exist */}
          {conversions.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              <p>No conversion rules have been added yet.</p>
              <p>Click the button below to add your first rule.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleAddConversionRow}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 py-3 px-6 text-center text-gray-700 font-semibold rounded-md border border-gray-300 hover:bg-gray-200 transition duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Add Conversion Rule
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto bg-orange-600 py-3 px-8 text-center text-white font-semibold rounded-md hover:bg-orange-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Save All Conversions
          </button>
        </div>
      </form>
    </div>
  );
};

export default UomConversionMatrix;
