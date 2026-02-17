import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import { X, Hash, AlertCircle, Ban } from "lucide-react";

import SearchableDropdown from "../../../../UI/common/SearchableDropdown";

const AddSerialNumber = ({ onClose, refreshData, serialToEdit }) => {
  // Form State
  const [formData, setFormData] = useState({
    serialName: "",
    batchId: null,
    productId: null,
    locationId: null,
    inventoryStatusId: null,
  });

  // Reference Data State
  const [batches, setBatches] = useState([]);
  const [inventoryStatuses, setInventoryStatuses] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived display state
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

  // 1. Fetch Reference Data (Batches & Statuses)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingRefs(true);
      try {
        const [batchesRes, statusRes] = await Promise.all([
          axios.get(`${domain}/api/Batches`),
          axios.get(`${domain}/api/InventoryStatuses`),
        ]);
        setBatches(batchesRes.data);
        setInventoryStatuses(statusRes.data);
      } catch (error) {
        console.error("Error loading references:", error);
        toast.error("Failed to load batches or statuses.");
      } finally {
        setLoadingRefs(false);
      }
    };
    fetchData();
  }, []);

  // 2. Initialize Form (Edit vs Create)
  useEffect(() => {
    if (serialToEdit && batches.length > 0) {
      // If editing, fill data directly
      setFormData({
        serialName: serialToEdit.serialName || "",
        batchId: serialToEdit.batchId,
        productId: serialToEdit.productId,
        locationId: serialToEdit.locationId,
        inventoryStatusId: serialToEdit.inventoryStatusId,
      });

      // Set batch details for display
      const foundBatch = batches.find((b) => b.id === serialToEdit.batchId);
      if (foundBatch) {
        setSelectedBatchDetails(foundBatch);
      }
    } else if (!serialToEdit) {
      // Reset for Create
      setFormData({
        serialName: "",
        batchId: null,
        productId: null,
        locationId: null,
        inventoryStatusId: null,
      });
      setSelectedBatchDetails(null);
    }
  }, [serialToEdit, batches]);

  // 3. Handle Batch Selection
  const handleBatchChange = (batchId) => {
    const selectedBatch = batches.find((b) => b.id === batchId);

    if (selectedBatch) {
      setSelectedBatchDetails(selectedBatch);
      setFormData((prev) => ({
        ...prev,
        batchId: selectedBatch.id,
        productId: selectedBatch.productId, // Auto-fill from Batch
        locationId: selectedBatch.locationId, // Auto-fill from Batch
        // Reset serial name if switching to a non-serialized batch
        serialName: selectedBatch.hasSerial === false ? "" : prev.serialName,
      }));
    } else {
      setSelectedBatchDetails(null);
      setFormData((prev) => ({
        ...prev,
        batchId: null,
        productId: null,
        locationId: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.batchId) return toast.warning("Please select a Batch.");
    if (!formData.inventoryStatusId)
      return toast.warning("Please select a Status.");

    // Validation: Only require Serial Name if the batch says it has serials
    if (selectedBatchDetails?.hasSerial && !formData.serialName.trim()) {
      return toast.warning("Serial Name is required for this product.");
    }

    setIsSubmitting(true);
    const apiUrl = `${domain}/api/SerialNumbers`;

    try {
      const payload = {
        ...formData,
        // If not serialized, ensure it sends empty string, else uppercase the input
        serialName: selectedBatchDetails?.hasSerial
          ? formData.serialName.toUpperCase()
          : "",
      };

      if (serialToEdit) {
        await axios.put(`${apiUrl}/${serialToEdit.id}`, payload);
        toast.success("Item updated successfully!");
      } else {
        await axios.post(apiUrl, payload);
        toast.success("Item created successfully!");
      }
      refreshData();
      onClose();
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.response?.data?.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTERING LOGIC ---
  const availableBatches = batches.filter((batch) => {
    // 1. Always show batches marked as Serialized
    if (batch.hasSerial === true) return true;
    // 2. If we are editing, allow the currently assigned batch (even if non-serialized)
    if (serialToEdit && batch.id === serialToEdit.batchId) return true;
    return false;
  });

  // Helper to check if input should be shown
  const shouldShowSerialInput = selectedBatchDetails
    ? selectedBatchDetails.hasSerial
    : true;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {(loadingRefs || isSubmitting) && <Loader />}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {serialToEdit ? "Edit Item Detail" : "Add Serial Number"}
          </h2>
          <p className="text-sm text-gray-500">
            {serialToEdit
              ? "Update details for this item instance."
              : "Register a new serial code."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        <form id="serialForm" onSubmit={handleSubmit}>
          {/* 1. Batch Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Batch <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={availableBatches}
              value={formData.batchId}
              onChange={handleBatchChange}
              placeholder="Search by Batch Name..."
              labelKey="name"
              valueKey="id"
              disabled={loadingRefs}
            />
            {!serialToEdit && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Only batches marked as "Has Serial"
                are shown for new items.
              </p>
            )}
          </div>

          {/* 2. Read-Only Info (Product & Location) */}
          {selectedBatchDetails && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-5 grid grid-cols-2 gap-4 animate-in fade-in zoom-in duration-200">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  Product
                </span>
                <p className="text-sm font-semibold text-indigo-900 mt-0.5 truncate">
                  {selectedBatchDetails.productName || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  Location
                </span>
                <p className="text-sm font-semibold text-indigo-900 mt-0.5 truncate">
                  {selectedBatchDetails.locationName || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* 3. Serial Name - CONDITIONALLY RENDERED */}
          {shouldShowSerialInput ? (
            <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Serial Number Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.serialName}
                  onChange={(e) =>
                    setFormData({ ...formData, serialName: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase font-mono transition"
                  placeholder="e.g. SN-2023-XYZ"
                  required
                />
              </div>
            </div>
          ) : (
            selectedBatchDetails && (
              <div className="mb-5 p-3 bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 bg-gray-200 rounded-full">
                  <Ban size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    Non-Serialized Item
                  </p>
                  <p className="text-xs text-gray-500">
                    This product batch does not use unique serial numbers.
                  </p>
                </div>
              </div>
            )
          )}

          {/* 4. Inventory Status */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Inventory Status <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={inventoryStatuses}
              value={formData.inventoryStatusId}
              onChange={(val) =>
                setFormData({ ...formData, inventoryStatusId: val })
              }
              placeholder="Select Status"
              labelKey="name"
              valueKey="id"
              disabled={loadingRefs}
            />
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
        <button
          onClick={onClose}
          type="button"
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          type="button"
          className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition flex items-center gap-2"
        >
          {serialToEdit ? "Update Item" : "Save Serial"}
        </button>
      </div>
    </div>
  );
};

export default AddSerialNumber;
