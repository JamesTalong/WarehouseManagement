import React, { useEffect, useState, useCallback } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import Select from "react-select";
import {
  FaTrash,
  FaTimes,
  FaPlus,
  FaFileInvoiceDollar,
  FaSave,
} from "react-icons/fa";

const initialLineItem = {
  lineNumber: 1,
  productId: null,
  productName: "",
  quantity: 1,
  unitOfMeasureId: "",
  unitPrice: 0,
  recommendedPrice: 0,
  lineTotal: 0,
  rejectedQuantity: 0,
  isCustom: false,
};

const AddItemModal = ({ isOpen, onClose, onSelectOption }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Add Item Type
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          How would you like to add this item?
        </p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => onSelectOption("system")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Item in System
          </button>
          <button
            onClick={() => onSelectOption("new")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            New Custom Item
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const AddPurchaseOrder = ({ onClose, refreshData, poToEdit }) => {
  const [formData, setFormData] = useState({
    poNumber: "Draft",
    creationDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    status: "Draft",
    internalNotes: "",
    locationId: "",
    vendorId: "",
    approverId: "",
    shippingCost: 0,
    currency: "PHP",
    paymentTerms: "Due on Receipt",
    grandTotal: 0,
    purchaseOrderLineItems: [],
    hasVat: false,
    hasEwt: false,
    vatAmount: 0,
    ewtAmount: 0,
    vatableAmount: 0,
  });

  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const inputStyles =
    "block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";
  const readOnlyInputStyles = `${inputStyles} bg-gray-100 cursor-not-allowed`;

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [locationsRes, vendorsRes, uomRes, productsRes, approversRes] =
          await Promise.all([
            axios.get(`${domain}/api/Locations`),
            axios.get(`${domain}/api/Vendors`),
            axios.get(`${domain}/api/UnitOfMeasurements`),
            axios.get(`${domain}/api/Products`),
            axios.get(`${domain}/api/Approvers`),
          ]);

        setLocations(locationsRes.data);
        setVendors(vendorsRes.data);
        setUnitOfMeasures(uomRes.data);
        setApprovers(approversRes.data);

        const formattedProducts = productsRes.data.map((item) => ({
          value: item.id,
          label: `${item.productName} - ${item.itemCode}`,
          unitPrice: 0,
          unitOfMeasureId: item.purchaseUomId,
        }));
        setProductOptions(formattedProducts);
      } catch (error) {
        toast.error("Failed to load form data.");
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (poToEdit) {
      setFormData({
        ...poToEdit,
        poNumber: poToEdit.poNumber || "Draft",
        creationDate: poToEdit.creationDate
          ? poToEdit.creationDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        expectedDeliveryDate: poToEdit.expectedDeliveryDate
          ? poToEdit.expectedDeliveryDate.split("T")[0]
          : "",
        locationId: poToEdit.locationId || "",
        vendorId: poToEdit.vendorId || "",
        approverId: poToEdit.approverId || "",
        shippingCost: poToEdit.shippingCost || 0,
        currency: poToEdit.currency || "PHP",
        paymentTerms: poToEdit.paymentTerms || "Due on Receipt",
        hasVat: poToEdit.vat !== null && poToEdit.vat > 0,
        hasEwt: poToEdit.ewt !== null && poToEdit.ewt > 0,
        vatAmount: poToEdit.vat || 0,
        ewtAmount: poToEdit.ewt || 0,
        purchaseOrderLineItems: poToEdit.purchaseOrderLineItems.map((item) => ({
          ...item,
          productId: item.productId || null,
          productName: item.productName || "",
          quantity: item.quantity || item.orderedQuantity || 0,
          unitPrice: item.unitPrice || 0,
          recommendedPrice: 0,
          unitOfMeasureId: item.unitOfMeasureId || "",
          rejectedQuantity: item.rejectedQuantity || 0,
          lineTotal:
            (item.quantity || item.orderedQuantity || 0) *
            (item.unitPrice || 0),
          isCustom: !item.productId,
        })),
      });
    }
  }, [poToEdit]);

  // Updated to include LocationID
  const fetchRecommendedPrice = async (vendorId, productId, locationId) => {
    if (!vendorId || !productId) return 0;

    let url = `${domain}/api/PurchasePriceHistories/recommendation?vendorId=${vendorId}&productId=${productId}`;

    // Pass the location ID if it exists
    if (locationId) {
      url += `&locationId=${locationId}`;
    }

    try {
      const response = await axios.get(url);
      return response.data.price || 0;
    } catch (error) {
      console.error("Error fetching recommended price:", error);
      return 0;
    }
  };

  const handleHeaderChange = async (e) => {
    const { id, value } = e.target;

    // SCENARIO 1: VENDOR CHANGED
    if (id === "vendorId" && value) {
      const selectedVendor = vendors.find((v) => v.id === parseInt(value));
      const autoVat = selectedVendor?.priceType === "vatInc";
      const autoEwt = selectedVendor?.ewt === true;

      setFormData((prev) => ({
        ...prev,
        [id]: value,
        hasVat: autoVat,
        hasEwt: autoEwt,
      }));

      // Re-fetch prices using NEW Vendor + EXISTING Location
      const currentItems = [...formData.purchaseOrderLineItems];
      const updatedItems = await Promise.all(
        currentItems.map(async (item) => {
          if (item.productId && !item.isCustom) {
            // Pass formData.locationId
            const recPrice = await fetchRecommendedPrice(
              value,
              item.productId,
              formData.locationId,
            );
            if (recPrice > 0) {
              return {
                ...item,
                unitPrice: recPrice,
                recommendedPrice: recPrice,
                lineTotal: (item.quantity || 0) * recPrice,
              };
            } else {
              return { ...item, recommendedPrice: 0 };
            }
          }
          return item;
        }),
      );
      setFormData((prev) => ({
        ...prev,
        purchaseOrderLineItems: updatedItems,
      }));
    }
    // SCENARIO 2: LOCATION CHANGED (This is what you asked for)
    else if (id === "locationId") {
      setFormData((prev) => ({ ...prev, [id]: value }));

      // If we have a Vendor selected, re-fetch prices using EXISTING Vendor + NEW Location
      if (formData.vendorId) {
        const currentItems = [...formData.purchaseOrderLineItems];
        const updatedItems = await Promise.all(
          currentItems.map(async (item) => {
            if (item.productId && !item.isCustom) {
              // Pass 'value' (the new Location ID)
              const recPrice = await fetchRecommendedPrice(
                formData.vendorId,
                item.productId,
                value,
              );
              if (recPrice > 0) {
                return {
                  ...item,
                  unitPrice: recPrice,
                  recommendedPrice: recPrice,
                  lineTotal: (item.quantity || 0) * recPrice,
                };
              } else {
                return { ...item, recommendedPrice: 0 };
              }
            }
            return item;
          }),
        );
        setFormData((prev) => ({
          ...prev,
          purchaseOrderLineItems: updatedItems,
        }));
      }
    } else {
      // Standard update for other fields
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const calculateTotals = useCallback((items, shippingCost, hasVat, hasEwt) => {
    const subtotal = items.reduce(
      (acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0),
      0,
    );

    let vatAmt = 0;
    let ewtAmt = 0;
    let netOfVat = subtotal;

    if (hasVat) {
      netOfVat = subtotal / 1.12;
      vatAmt = netOfVat * 0.12;
    }

    if (hasEwt) {
      const taxBase = hasVat ? netOfVat : subtotal;
      ewtAmt = taxBase * 0.01;
    }

    const grandTotal = subtotal + (parseFloat(shippingCost) || 0) - ewtAmt;

    return { subtotal, grandTotal, vatAmt, ewtAmt, netOfVat };
  }, []);

  useEffect(() => {
    const { grandTotal, vatAmt, ewtAmt, netOfVat } = calculateTotals(
      formData.purchaseOrderLineItems,
      formData.shippingCost,
      formData.hasVat,
      formData.hasEwt,
    );

    setFormData((prev) => {
      if (
        prev.grandTotal === grandTotal &&
        prev.vatAmount === vatAmt &&
        prev.ewtAmount === ewtAmt &&
        prev.vatableAmount === netOfVat
      ) {
        return prev;
      }
      return {
        ...prev,
        grandTotal,
        vatAmount: vatAmt,
        ewtAmount: ewtAmt,
        vatableAmount: netOfVat,
      };
    });
  }, [
    formData.purchaseOrderLineItems,
    formData.shippingCost,
    formData.hasVat,
    formData.hasEwt,
    calculateTotals,
  ]);

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.purchaseOrderLineItems];
    const lineItem = { ...updatedItems[index] };
    lineItem[field] = value;
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(lineItem.quantity) || 0;
      const price = parseFloat(lineItem.unitPrice) || 0;
      lineItem.lineTotal = qty * price;
    }
    updatedItems[index] = lineItem;
    setFormData((prev) => ({ ...prev, purchaseOrderLineItems: updatedItems }));
  };

  const handleProductSelect = async (index, selectedOption) => {
    const updatedItems = [...formData.purchaseOrderLineItems];
    const lineItem = { ...updatedItems[index] };

    if (selectedOption) {
      lineItem.productId = selectedOption.value;
      lineItem.productName = selectedOption.label.split(" - ")[0];
      lineItem.unitOfMeasureId = selectedOption.unitOfMeasureId || "";

      if (!selectedOption.unitOfMeasureId) {
        toast.warning(
          `For "${lineItem.productName}": Please complete your product details, the UOM is essential to complete this transaction.`,
        );
      }

      let priceToUse = selectedOption.unitPrice || 0;
      let recPrice = 0;

      if (formData.vendorId) {
        // Updated to pass formData.locationId
        recPrice = await fetchRecommendedPrice(
          formData.vendorId,
          lineItem.productId,
          formData.locationId,
        );
        if (recPrice > 0) {
          priceToUse = recPrice;
        }
      }
      lineItem.unitPrice = priceToUse;
      lineItem.recommendedPrice = recPrice;
    } else {
      lineItem.productId = null;
      lineItem.productName = "";
      lineItem.unitPrice = 0;
      lineItem.unitOfMeasureId = "";
      lineItem.recommendedPrice = 0;
    }
    lineItem.lineTotal = (lineItem.quantity || 0) * (lineItem.unitPrice || 0);
    updatedItems[index] = lineItem;
    setFormData((prev) => ({ ...prev, purchaseOrderLineItems: updatedItems }));
  };

  const handleCustomProductChange = (index, value) => {
    const updatedItems = [...formData.purchaseOrderLineItems];
    updatedItems[index].productName = value;
    setFormData((prev) => ({ ...prev, purchaseOrderLineItems: updatedItems }));
  };

  const openAddItemModal = () => setIsAddItemModalOpen(true);

  const handleAddItemChoice = (choice) => {
    setIsAddItemModalOpen(false);
    const newLineItem = {
      ...initialLineItem,
      lineNumber: formData.purchaseOrderLineItems.length + 1,
      isCustom: choice === "new",
    };
    setFormData((prev) => ({
      ...prev,
      purchaseOrderLineItems: [...prev.purchaseOrderLineItems, newLineItem],
    }));
  };

  const addLineItem = () => openAddItemModal();

  const removeLineItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      purchaseOrderLineItems: prev.purchaseOrderLineItems.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const prepareSubmissionData = () => {
    const submissionData = {
      ...formData,
      vat: formData.hasVat ? formData.vatAmount : null,
      ewt: formData.hasEwt ? formData.ewtAmount : null,

      purchaseOrderLineItems: formData.purchaseOrderLineItems.map((item) => ({
        id: item.id || 0,
        lineNumber: item.lineNumber,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity ? parseInt(item.quantity, 10) : 0,
        unitOfMeasureId: item.unitOfMeasureId
          ? parseInt(item.unitOfMeasureId, 10)
          : null,
        unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : 0,
        lineTotal: item.lineTotal,
        rejectedQuantity: 0,
        itemStatus: false,
      })),
    };

    submissionData.locationId = parseInt(submissionData.locationId, 10);
    submissionData.vendorId = parseInt(submissionData.vendorId, 10);
    submissionData.approverId = submissionData.approverId
      ? parseInt(submissionData.approverId, 10)
      : null;
    submissionData.shippingCost = parseFloat(submissionData.shippingCost || 0);

    delete submissionData.hasVat;
    delete submissionData.hasEwt;
    delete submissionData.vatAmount;
    delete submissionData.ewtAmount;
    delete submissionData.vatableAmount;

    return submissionData;
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.locationId) errors.push("Location is required.");
    if (!formData.vendorId) errors.push("Vendor is required.");
    if (!formData.approverId) errors.push("Approver is required.");
    if (!formData.creationDate) errors.push("Creation Date is required.");
    if (!formData.expectedDeliveryDate)
      errors.push("Expected Delivery Date is required.");

    if (formData.purchaseOrderLineItems.length === 0) {
      errors.push("Please add at least one line item.");
    }

    formData.purchaseOrderLineItems.forEach((item, index) => {
      const row = index + 1;
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Row ${row}: Quantity must be greater than 0.`);
      }
      if (!item.unitOfMeasureId) {
        if (item.isCustom) {
          errors.push(`Row ${row}: Unit of Measure (UOM) is required.`);
        } else {
          errors.push(
            `Row ${row}: System Item "${item.productName}" has no UOM.`,
          );
        }
      }
    });

    if (errors.length > 0) {
      errors.slice(0, 3).forEach((err) => toast.error(err));
      if (errors.length > 3)
        toast.error(`...and ${errors.length - 3} more errors.`);
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    await processSubmission();
  };

  const processSubmission = async () => {
    setIsLoading(true);
    const submissionData = prepareSubmissionData();
    const id = poToEdit ? poToEdit.id : null;
    const isLiveOrder = poToEdit && poToEdit.isStaging === false;

    try {
      if (isLiveOrder) {
        await axios.put(
          `${domain}/api/PurchaseOrderHeaders/${id}`,
          submissionData,
        );
        toast.success("Live Purchase Order updated successfully!");
      } else if (id) {
        await axios.put(
          `${domain}/api/PurchaseOrderStaging/${id}`,
          submissionData,
        );
        toast.success("Draft updated successfully!");
      } else {
        await axios.post(`${domain}/api/PurchaseOrderStaging`, submissionData);
        toast.success("New Draft created successfully!");
      }

      refreshData();
      onClose();
    } catch (error) {
      console.error(
        "Error submitting PO:",
        error.response?.data || error.message,
      );
      if (error.response?.status === 400) {
        toast.error(
          error.response.data.message || "Operation failed: Bad Request",
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = calculateTotals(
    formData.purchaseOrderLineItems,
    0,
    false,
    false,
  ).subtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSelectOption={handleAddItemChoice}
      />
      <div className="relative flex h-full max-h-[95vh] w-full max-w-7xl flex-col rounded-lg bg-gray-100 shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between rounded-t-lg border-b bg-white p-4">
          <div className="flex items-center space-x-3">
            <FaFileInvoiceDollar className="h-7 w-7 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {poToEdit
                ? poToEdit.isStaging === false
                  ? "Edit Live Purchase Order"
                  : "Edit Draft PO"
                : "Create Purchase Order"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-200"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {isLoading && <Loader />}

        <form className="flex-grow overflow-y-auto p-6 space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              PO Details
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="poNumber" className={labelStyles}>
                  PO Number
                </label>
                <input
                  id="poNumber"
                  type="text"
                  value={formData.poNumber}
                  disabled
                  className={readOnlyInputStyles}
                />
              </div>
              <div>
                <label htmlFor="locationId" className={labelStyles}>
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  id="locationId"
                  value={formData.locationId}
                  onChange={handleHeaderChange}
                  className={inputStyles}
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.locationName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vendorId" className={labelStyles}>
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  id="vendorId"
                  value={formData.vendorId}
                  onChange={handleHeaderChange}
                  className={inputStyles}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="approverId" className={labelStyles}>
                  Approver <span className="text-red-500">*</span>
                </label>
                <select
                  id="approverId"
                  value={formData.approverId}
                  onChange={handleHeaderChange}
                  className={inputStyles}
                >
                  <option value="">Select Approver</option>
                  {approvers.map((app) => (
                    <option key={app.approverId} value={app.approverId}>
                      {app.employeeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="creationDate" className={labelStyles}>
                  Creation Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="creationDate"
                  type="date"
                  value={formData.creationDate}
                  onChange={handleHeaderChange}
                  className={inputStyles}
                />
              </div>
              <div>
                <label htmlFor="expectedDeliveryDate" className={labelStyles}>
                  Expected Delivery <span className="text-red-500">*</span>
                </label>
                <input
                  id="expectedDeliveryDate"
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={handleHeaderChange}
                  className={inputStyles}
                />
              </div>
              <div>
                <label htmlFor="status" className={labelStyles}>
                  Status
                </label>
                <input
                  value={formData.status}
                  readOnly
                  className={readOnlyInputStyles}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Line Items
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <FaPlus />
                <span>Add Item</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product / Description
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Qty
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                      UOM <span className="text-red-500">*</span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-36">
                      Total
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.purchaseOrderLineItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No items added yet. Click "Add Item" to get started.
                      </td>
                    </tr>
                  ) : (
                    formData.purchaseOrderLineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-4">
                          {item.isCustom ? (
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) =>
                                handleCustomProductChange(index, e.target.value)
                              }
                              placeholder="Enter custom item name..."
                              className={`${inputStyles} w-full`}
                            />
                          ) : (
                            <div className="w-full">
                              <Select
                                isClearable
                                options={productOptions}
                                placeholder="Select a product..."
                                value={
                                  productOptions.find(
                                    (opt) => opt.value === item.productId,
                                  ) || null
                                }
                                onChange={(option) =>
                                  handleProductSelect(index, option)
                                }
                                menuPortalTarget={document.body}
                                styles={{
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  control: (base) => ({
                                    ...base,
                                    width: "100%",
                                  }),
                                  container: (base) => ({
                                    ...base,
                                    width: "100%",
                                  }),
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className={`${inputStyles} w-full`}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <select
                            value={item.unitOfMeasureId || ""}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "unitOfMeasureId",
                                e.target.value,
                              )
                            }
                            disabled={!item.isCustom}
                            className={`${inputStyles} w-full ${
                              !item.isCustom
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            } ${
                              !item.unitOfMeasureId
                                ? "border-red-300 ring-1 ring-red-300"
                                : ""
                            }`}
                          >
                            <option value="">Select</option>
                            {unitOfMeasures.map((uom) => (
                              <option key={uom.id} value={uom.id}>
                                {uom.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-4">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "unitPrice",
                                e.target.value,
                              )
                            }
                            className={`${inputStyles} w-full`}
                          />
                          {item.recommendedPrice > 0 && (
                            <div
                              onClick={() =>
                                handleLineItemChange(
                                  index,
                                  "unitPrice",
                                  item.recommendedPrice,
                                )
                              }
                              className="mt-1 text-xs text-indigo-600 font-medium cursor-pointer hover:underline hover:text-indigo-800"
                              title="Click to use this price"
                            >
                              {Number(item.recommendedPrice).toLocaleString()}{" "}
                              (recommended)
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-4 font-medium text-gray-800 whitespace-nowrap">
                          {formData.currency}{" "}
                          {Number(item.lineTotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                            title="Remove item"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-6">
                <label htmlFor="internalNotes" className={labelStyles}>
                  Internal Notes
                </label>
                <textarea
                  id="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleHeaderChange}
                  rows="4"
                  className={`${inputStyles} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-lg border bg-white p-6">
                  <label htmlFor="paymentTerms" className={labelStyles}>
                    Payment Terms
                  </label>
                  <select
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleHeaderChange}
                    className={inputStyles}
                  >
                    <option>Due on Receipt</option>
                    <option>Net 30</option>
                    <option>Net 15</option>
                    <option>Net 60</option>
                  </select>
                </div>
                <div className="rounded-lg border bg-white p-6">
                  <label htmlFor="currency" className={labelStyles}>
                    Currency
                  </label>
                  <input
                    id="currency"
                    type="text"
                    value="PHP"
                    disabled
                    className={readOnlyInputStyles}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="mt-4 flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.hasVat}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            hasVat: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`block w-10 h-6 rounded-full transition ${
                          formData.hasVat ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                          formData.hasVat ? "translate-x-4" : ""
                        }`}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      VAT (12%)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.hasEwt}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            hasEwt: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`block w-10 h-6 rounded-full transition ${
                          formData.hasEwt ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                          formData.hasEwt ? "translate-x-4" : ""
                        }`}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      EWT (1%)
                    </span>
                  </label>
                </div>
                <div className="flex justify-between items-center text-md">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-800">
                    {formData.currency}{" "}
                    {Number(subtotal).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {formData.hasVat && (
                  <>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>VAT (12%):</span>
                      <span>
                        {formData.currency}{" "}
                        {Number(formData.vatAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Vatable Sales:</span>
                      <span>
                        {formData.currency}{" "}
                        {Number(formData.vatableAmount).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                  </>
                )}
                {formData.hasEwt && (
                  <div className="flex justify-between items-center text-xs text-blue-500">
                    <span>Less EWT (1%):</span>
                    <span>
                      -{formData.currency}{" "}
                      {Number(formData.ewtAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-md">
                  <span className="text-gray-600">Shipping Cost:</span>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">
                      {formData.currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      id="shippingCost"
                      value={formData.shippingCost}
                      onChange={handleHeaderChange}
                      className={`${inputStyles} w-32`}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Grand Total:</span>
                  <span>
                    {formData.currency}{" "}
                    {Number(formData.grandTotal).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex flex-shrink-0 items-center justify-end space-x-4 rounded-b-lg border-t bg-gray-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center space-x-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaSave />
            )}
            <span>
              {poToEdit
                ? poToEdit.isStaging === false
                  ? "Update Live Order"
                  : "Update Draft"
                : "Save Draft"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseOrder;
