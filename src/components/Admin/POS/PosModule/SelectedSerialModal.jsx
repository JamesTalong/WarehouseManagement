// src/components/AllPos/SelectedSerialModal.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { domain } from "../../../../security";

// 1. Add excludedSerialIds to props
const SelectedSerialModal = ({
  product,
  onClose,
  onSave,
  excludedSerialIds = [],
}) => {
  const [availableSerials, setAvailableSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSerials, setSelectedSerials] = useState(new Set());

  const salesQty = product.quantity || 0;
  const conversionRate = product.conversionRate || 1;
  const totalRequired = Math.round(salesQty * conversionRate);

  useEffect(() => {
    const fetchSerials = async () => {
      try {
        setLoading(true);

        const locParam = product.locationId
          ? `?locationId=${product.locationId}`
          : "";
        const apiUrl = `${domain}/api/SerialNumbers/available/${product.productId}${locParam}`;

        const response = await axios.get(apiUrl);
        let allSerials = response.data;

        // =================================================================================
        // 2. FILTER OUT EXCLUDED SERIALS (Used by other cart items)
        // =================================================================================
        if (excludedSerialIds.length > 0) {
          const excludedSet = new Set(excludedSerialIds);
          allSerials = allSerials.filter((s) => !excludedSet.has(s.id));
        }

        setAvailableSerials(allSerials);

        // =================================================================================
        // 3. AUTO SELECT (FIFO) FROM REMAINING POOL
        // =================================================================================
        // Use functional update to check previous state.
        // This avoids adding 'selectedSerials' to the dependency array.
        setSelectedSerials((prev) => {
          if (prev.size === 0) {
            const autoSelectIds = allSerials
              .slice(0, totalRequired)
              .map((s) => s.id);
            return new Set(autoSelectIds);
          }
          return prev;
        });
      } catch (err) {
        console.error("Error fetching serials:", err);
        setError("Failed to load serial numbers.");
      } finally {
        setLoading(false);
      }
    };

    if (product && product.productId) {
      fetchSerials();
    }
    // dependencies updated
  }, [product, totalRequired, excludedSerialIds]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredSerials = availableSerials.filter((serial) =>
    (serial.serialName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckboxChange = (serialId) => {
    setSelectedSerials((prevSelected) => {
      const newSet = new Set(prevSelected);
      if (newSet.has(serialId)) {
        newSet.delete(serialId);
      } else {
        if (newSet.size < totalRequired) {
          newSet.add(serialId);
        } else {
          alert(
            `You only need ${totalRequired} serials (${salesQty} ${
              product.uomName || "Unit"
            } x ${conversionRate}).`
          );
        }
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedSerials.size < totalRequired) {
      alert(
        `Not enough serials selected. Required: ${totalRequired}, Selected: ${selectedSerials.size}`
      );
      return;
    }

    try {
      const deleteUrl = `${domain}/api/SerialTemps/by-product/${product.productId}`;
      await axios.delete(deleteUrl).catch(() => {});
      onSave(product.id, Array.from(selectedSerials));
    } catch (error) {
      console.error("Error saving selection:", error);
      alert("Failed to save selection.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold mb-1">Select Serial Numbers</h2>

        <div className="bg-gray-100 p-2 rounded mb-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Product:</span>{" "}
            {product.productName || product.name}
          </p>
          <div className="flex gap-4 mt-1">
            <span>
              Buy Qty:{" "}
              <b>
                {salesQty} {product.uomName}
              </b>
            </span>
            <span>
              Rate: <b>{conversionRate}</b>
            </span>
            <span className="text-blue-600 font-bold">
              Total Serials: {totalRequired}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 bg-blue-50 p-2 rounded">
          <span className="font-semibold text-blue-800">
            Target: {totalRequired}
          </span>
          <span
            className={`font-bold ${
              selectedSerials.size === totalRequired
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            Selected: {selectedSerials.size}
          </span>
        </div>

        <input
          type="text"
          placeholder="Search serial numbers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md"
        />

        {error ? (
          <p className="text-red-500">{error}</p>
        ) : loading ? (
          <p>Loading...</p>
        ) : filteredSerials.length > 0 ? (
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-2">
            {filteredSerials.map((serial) => (
              <div
                key={serial.id}
                className={`flex items-center mb-2 p-2 rounded hover:bg-gray-50 ${
                  selectedSerials.has(serial.id)
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  id={`serial-${serial.id}`}
                  className="mr-3 h-4 w-4 cursor-pointer"
                  checked={selectedSerials.has(serial.id)}
                  onChange={() => handleCheckboxChange(serial.id)}
                />
                <div className="flex flex-col">
                  <label
                    htmlFor={`serial-${serial.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {serial.serialName || "(Empty Serial)"}
                  </label>
                  <span className="text-xs text-gray-500">
                    Batch Date: {formatDate(serial.batchDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            No available serial numbers found (some may be selected in other
            items).
          </p>
        )}

        <div className="flex justify-end mt-6 gap-2">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedSerials.size !== totalRequired}
            className={`px-4 py-2 rounded-md text-white ${
              selectedSerials.size === totalRequired
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedSerialModal;
