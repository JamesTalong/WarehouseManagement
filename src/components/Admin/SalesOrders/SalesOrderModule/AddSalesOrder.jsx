import React, { useCallback, useEffect, useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import SelectedSerialModal from "../../POS/PosModule/SelectedSerialModal";
import OrderFinancialSummary from "./OrderFinancialSummary";
import {
  FaTimes,
  FaSave,
  FaArrowRight,
  FaArrowLeft,
  FaShoppingCart,
  FaPaperclip,
  FaTrash,
  FaEye,
  FaBarcode,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";

const AddSalesOrder = ({ onClose, sourceQuote, refreshData }) => {
  // --- COMPACT AESTHETIC CLASSES ---
  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900 transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none";
  const labelClass =
    "mb-1 ml-0.5 block text-[10px] font-black uppercase tracking-widest text-gray-500";
  const readOnlyBox =
    "flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100";

  // --- STATE ---
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());

  // Image & Serials
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [currentSerialProduct, setCurrentSerialProduct] = useState(null);
  const [purchasedSerials, setPurchasedSerials] = useState({});

  // Main Form Data
  const [formData, setFormData] = useState({
    salesOrderNumber: "Draft",
    salesQuotationId: 0,
    date: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    status: "Draft",
    remarks: "",
    locationId: "",
    locationName: "",
    customerId: "",
    customerName: "",
    shippingAddress: "",
    // Financials
    totalAmount: 0,
    shippingCost: 0,
    hasVat: false,
    hasEwt: false,
    vatAmount: 0,
    ewtAmount: 0,
    vatableAmount: 0,
    salesOrderItems: [],
    poImage: null,
    approverId: "",
  });

  // --- HELPERS ---
  const getExcludedSerials = (currentRowIndex) => {
    let usedIds = [];
    Object.keys(purchasedSerials).forEach((key) => {
      if (parseInt(key) !== currentRowIndex) {
        const ids = purchasedSerials[key];
        if (Array.isArray(ids)) usedIds = [...usedIds, ...ids];
      }
    });
    return usedIds;
  };

  const calculateTotals = useCallback((items, shippingCost, hasVat, hasEwt) => {
    const subtotal = items.reduce(
      (acc, item) => acc + (parseFloat(item.lineTotal) || 0),
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

  // --- EFFECTS ---
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        const response = await axios.get(`${domain}/api/Approvers`);
        setApprovers(response.data);
      } catch (error) {
        console.error("Error fetching approvers", error);
      }
    };
    fetchApprovers();
  }, []);

  const fetchQuoteDetails = useCallback(
    async (id) => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${domain}/api/SalesQuotations/${id}`);
        const data = response.data;

        if (data.status === "Cancelled") {
          toast.error("Quotation is Cancelled.");
          onClose();
          return;
        }
        if (data.status === "Converted") {
          toast.info("Quotation already Converted.");
          onClose();
          return;
        }

        setQuoteDetails(data);
        const allIds = new Set(data.quotationProducts.map((p) => p.id));
        setSelectedProductIds(allIds);
      } catch (error) {
        toast.error("Failed to load quotation.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (sourceQuote?.id) fetchQuoteDetails(sourceQuote.id);
  }, [sourceQuote, fetchQuoteDetails]);

  // Update Financials when inputs change
  useEffect(() => {
    const { grandTotal, vatAmt, ewtAmt, netOfVat } = calculateTotals(
      formData.salesOrderItems,
      formData.shippingCost,
      formData.hasVat,
      formData.hasEwt,
    );

    setFormData((prev) => ({
      ...prev,
      totalAmount: grandTotal,
      vatAmount: vatAmt,
      ewtAmount: ewtAmt,
      vatableAmount: netOfVat,
    }));
  }, [
    formData.salesOrderItems,
    formData.shippingCost,
    formData.hasVat,
    formData.hasEwt,
    calculateTotals,
  ]);

  // --- HANDLERS ---
  const handleFinancialUpdate = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleProceedToForm = () => {
    if (selectedProductIds.size === 0) {
      toast.warn("Select at least one product.");
      return;
    }

    // 1. Get the selected items from the quote details
    const selectedItems = quoteDetails.quotationProducts.filter((item) =>
      selectedProductIds.has(item.id),
    );

    // 2. Map items to Order Item format
    const mappedItems = selectedItems.map((item, index) => ({
      lineNumber: index + 1,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
      uomId: item.uomId,
      uom: item.uom,
      conversionRate: item.conversionRate || 1,
      hasSerial: item.hasSerial,
      lineTotal: item.subtotal,
      priceType: item.priceType || "N/A",
    }));

    // --- AUTOMATIC TRIGGERS ---

    // Trigger VAT if any selected item has "vatInc"
    const autoHasVat = mappedItems.some((item) => item.priceType === "vatInc");

    // Trigger EWT based on the Customer record we just fetched from the API
    const autoHasEwt = quoteDetails.customer?.ewt || false;

    // 3. Update the state
    setFormData((prev) => ({
      ...prev,
      salesOrderNumber: "Auto-Generated",
      salesQuotationId: quoteDetails.id,
      locationId: quoteDetails.locationId,
      locationName: quoteDetails.locationName,
      customerId: quoteDetails.customer?.id,
      customerName: quoteDetails.customer?.customerName,
      shippingAddress: quoteDetails.customer?.address,
      remarks: `From Quote #${quoteDetails.quoteNumber}`,
      salesOrderItems: mappedItems,
      shippingCost: 0,
      // Apply the automatic triggers here
      hasVat: autoHasVat,
      hasEwt: autoHasEwt,
    }));

    setPurchasedSerials({});
    setStep(2);
  };

  const handleLineItemChange = (index, field, value) => {
    // 1. Create a copy of the array
    const updatedItems = [...formData.salesOrderItems];

    // 2. Create a copy of the specific object at that index
    const lineItem = { ...updatedItems[index] };

    // 3. Update the value
    lineItem[field] = value;

    // 4. Recalculate totals if Quantity or Price changes
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(lineItem.quantity) || 0;
      const price = parseFloat(lineItem.unitPrice) || 0;

      lineItem.lineTotal = qty * price;

      // If Quantity changes, we MUST reset the selected serials
      // because the previous selection is now invalid (count mismatch)
      if (field === "quantity") {
        const newState = { ...purchasedSerials };
        delete newState[index];
        setPurchasedSerials(newState);
      }
    }

    // 5. IMPORTANT: Put the modified item back into the array
    updatedItems[index] = lineItem; // <--- THIS WAS MISSING

    // 6. Update the main state
    setFormData((prev) => ({
      ...prev,
      salesOrderItems: updatedItems,
    }));
  };

  const handleSave = async () => {
    // 1. Basic Field Validation
    if (!formData.deliveryDate) return toast.error("Delivery Date is required");
    if (!formData.approverId) return toast.warn("Select an Approver.");

    // 2. Confirmation
    if (
      !window.confirm(
        "Create Sales Order? Stock will be reserved pending approval.",
      )
    )
      return;

    setIsLoading(true);

    try {
      const finalItems = [];
      const globalUsedSerialIds = new Set();

      // Collect all manually selected serials into the global set first
      Object.values(purchasedSerials).forEach((ids) =>
        ids.forEach((id) => globalUsedSerialIds.add(id)),
      );

      // 3. Process each item
      for (let i = 0; i < formData.salesOrderItems.length; i++) {
        const item = formData.salesOrderItems[i];
        let finalSerialIds = [];

        // Calculate exact required quantity based on Input and UOM
        const requiredQty = Math.round(
          item.quantity * (item.conversionRate || 1),
        );

        // --- CHECK A: MANUAL SELECTION (The Strict Check You Requested) ---
        if (purchasedSerials[i]?.length > 0) {
          finalSerialIds = purchasedSerials[i];

          // IF TARGET != SELECTED, BLOCK THE SAVE
          if (finalSerialIds.length !== requiredQty) {
            setIsLoading(false);
            return toast.error(
              `Mismatch for ${item.productName}: Target ${requiredQty}, Selected ${finalSerialIds.length}. Please adjust Quantity or Selection.`,
            );
          }
        }
        // --- CHECK B: AUTO SELECTION (If user didn't open the modal) ---
        else {
          try {
            const locParam = formData.locationId
              ? `?locationId=${formData.locationId}`
              : "";

            // Check backend for stock
            const res = await axios.get(
              `${domain}/api/SerialNumbers/available/${item.productId}${locParam}`,
            );

            // Filter out serials already used by other rows
            const available = res.data.filter(
              (s) => !globalUsedSerialIds.has(s.id),
            );

            // If enough stock, auto-select them
            if (available.length >= requiredQty) {
              const selected = available.slice(0, requiredQty).map((s) => s.id);
              selected.forEach((id) => globalUsedSerialIds.add(id));
              finalSerialIds = selected;
            }
            // If not enough stock, BLOCK THE SAVE
            else if (item.hasSerial) {
              setIsLoading(false);
              return toast.error(
                `Insufficient stock for ${item.productName}. Required: ${requiredQty}, Available: ${available.length}`,
              );
            }
          } catch (err) {
            if (item.hasSerial) {
              setIsLoading(false);
              return toast.error(`Stock check failed for ${item.productName}`);
            }
          }
        }

        finalItems.push({
          ...item,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          lineTotal: parseFloat(item.lineTotal),
          serialNumbers: finalSerialIds,
        });
      }

      // 4. Construct Payload
      const payload = {
        ...formData,
        customerId: parseInt(formData.customerId),
        locationId: parseInt(formData.locationId),
        approverId: parseInt(formData.approverId),
        salesQuotationId: parseInt(formData.salesQuotationId),
        totalAmount: parseFloat(formData.totalAmount),
        shippingCost: parseFloat(formData.shippingCost),
        vatAmount: formData.hasVat ? parseFloat(formData.vatAmount) : 0,
        ewtAmount: formData.hasEwt ? parseFloat(formData.ewtAmount) : 0,
        salesOrderItems: finalItems,
      };

      // 5. Send Request
      await axios.post(`${domain}/api/SalesOrders`, payload);
      await axios.delete(`${domain}/api/SerialTemps/delete-all`);

      toast.success("Sales Order Created!");
      if (refreshData) refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.message || "Failed to create Sales Order.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () =>
        setFormData((prev) => ({
          ...prev,
          poImage: reader.result.split(",")[1],
        }));
      reader.readAsDataURL(file);
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="flex h-full max-h-[95vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        {/* === HEADER === */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              {step === 1 ? (
                <FaBoxOpen size={18} />
              ) : (
                <FaShoppingCart size={18} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none">
                {step === 1 ? "Product Selection" : "Order Details"}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {step === 1
                  ? `Quote #${sourceQuote?.quoteNumber}`
                  : "Review and Finalize"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {isLoading && <Loader />}

        {/* === BODY === */}
        <div className="flex-grow overflow-y-auto bg-gray-50/30 px-6 py-6">
          {/* STEP 1: SELECT PRODUCTS */}
          {step === 1 && quoteDetails && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input
                        type="checkbox"
                        onChange={() => {
                          const allIds = new Set(
                            quoteDetails.quotationProducts.map((p) => p.id),
                          );
                          setSelectedProductIds(
                            selectedProductIds.size === allIds.size
                              ? new Set()
                              : allIds,
                          );
                        }}
                        checked={
                          selectedProductIds.size ===
                          quoteDetails.quotationProducts.length
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase text-gray-400">
                      Product
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-black uppercase text-gray-400">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase text-gray-400">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quoteDetails.quotationProducts.map((item) => {
                    const isSelected = selectedProductIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/30" : ""
                        }`}
                        onClick={() => {
                          const newSet = new Set(selectedProductIds);
                          newSet.has(item.id)
                            ? newSet.delete(item.id)
                            : newSet.add(item.id);
                          setSelectedProductIds(newSet);
                        }}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 rounded text-indigo-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-800">
                            {item.productName}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400">
                            {item.itemCode || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-600">
                          {item.quantity} {item.uom}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                          {currencyFormatter.format(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 2: FORM */}
          {step === 2 && (
            <div className="space-y-6">
              {/* TOP CARD: Order Info - COMPACT DESIGN */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Summary Section (Read Only) */}
                  <div className="md:col-span-1 space-y-3 md:border-r border-gray-100 md:pr-6">
                    <div>
                      <label className={labelClass}>Customer Reference</label>
                      <div className={readOnlyBox}>
                        <FaUser className="text-indigo-500" size={14} />
                        <span className="text-sm font-bold text-gray-800 truncate">
                          {formData.customerName}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Stock Location</label>
                      <div className={readOnlyBox}>
                        <FaMapMarkerAlt className="text-slate-400" size={14} />
                        <span className="text-sm font-semibold text-gray-600 truncate">
                          {formData.locationName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Form Inputs */}
                  <div className="md:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Order Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Delivery Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.deliveryDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveryDate: e.target.value,
                            })
                          }
                          className={`${inputClass} !border-indigo-200`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Manager Approver{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.approverId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              approverId: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          <option value="">Select Manager</option>
                          {approvers.map((app) => (
                            <option key={app.approverId} value={app.approverId}>
                              {app.employeeName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* PO Image Upload - More Compact */}
                      <div className="sm:col-span-1">
                        <label className={labelClass}>Client PO File</label>
                        {!imagePreview ? (
                          <label className="flex h-[38px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <FaPaperclip /> Attach Document
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileChange}
                              accept="image/*"
                            />
                          </label>
                        ) : (
                          <div className="flex h-[38px] items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3">
                            <button
                              onClick={() =>
                                imagePreview && window.open(imagePreview)
                              }
                              className="flex items-center gap-2 text-[11px] font-bold text-indigo-700 truncate"
                            >
                              <FaEye /> View File
                            </button>
                            <button
                              onClick={() => {
                                setImagePreview(null);
                                setFileName("");
                                setFormData((p) => ({ ...p, poImage: null }));
                              }}
                              className="text-red-500"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Shipping Address */}
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Shipping Address</label>
                        <textarea
                          type="text"
                          value={formData.shippingAddress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: e.target.value,
                            })
                          }
                          placeholder="Full destination address"
                          className={inputClass}
                        />
                      </div>

                      {/* Remarks - Full Width */}
                      <div className="sm:col-span-3">
                        <label className={labelClass}>Internal Remarks</label>
                        <textarea
                          type="text"
                          rows={1}
                          value={formData.remarks}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              remarks: e.target.value,
                            })
                          }
                          placeholder="Optional notes for fulfillment..."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDDLE: Product Table - COMPACT */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-2 text-left text-[10px] font-black uppercase text-gray-400">
                        Product
                      </th>
                      <th className="px-6 py-2 text-center text-[10px] font-black uppercase text-gray-400 w-24">
                        Qty
                      </th>
                      <th className="px-6 py-2 text-center text-[10px] font-black uppercase text-gray-400 w-32">
                        Config
                      </th>
                      <th className="px-6 py-2 text-right text-[10px] font-black uppercase text-gray-400 w-32">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.salesOrderItems.map((item, index) => {
                      const selectedCount =
                        purchasedSerials[index]?.length || 0;
                      const reqQty = Math.round(
                        item.quantity * (item.conversionRate || 1),
                      );
                      const isReady = selectedCount === reqQty;

                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <p className="text-sm font-bold text-gray-800">
                              {item.productName}
                            </p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase">
                              {item.priceType}
                            </p>
                          </td>
                          <td className="px-6 py-3">
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
                              className="w-full rounded-md border-gray-300 py-1 text-center text-sm font-bold focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            {item.hasSerial && (
                              <button
                                onClick={() => {
                                  setCurrentSerialProduct({
                                    ...item,
                                    rowIndex: index,
                                    locationId: formData.locationId,
                                  });
                                  setIsSerialModalOpen(true);
                                }}
                                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-[10px] font-black transition-all ${
                                  selectedCount > 0
                                    ? isReady
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <FaBarcode />{" "}
                                {selectedCount > 0
                                  ? `${selectedCount}/${reqQty}`
                                  : "Auto"}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                            {currencyFormatter.format(item.lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* BOTTOM: Financial Summary Component */}
              <OrderFinancialSummary
                subtotal={
                  calculateTotals(formData.salesOrderItems, 0, false, false)
                    .subtotal
                }
                shippingCost={formData.shippingCost}
                hasVat={formData.hasVat}
                hasEwt={formData.hasEwt}
                vatAmount={formData.vatAmount}
                ewtAmount={formData.ewtAmount}
                vatableAmount={formData.vatableAmount}
                totalAmount={formData.totalAmount}
                onUpdate={handleFinancialUpdate}
              />
            </div>
          )}
        </div>

        {/* === FOOTER === */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToForm}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Next Step <FaArrowRight />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Back to Selection
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <FaSave />
                )}
                <span>Create Order</span>
              </button>
            </>
          )}
        </div>

        {/* === SERIAL MODAL === */}
        {isSerialModalOpen && currentSerialProduct && (
          <SelectedSerialModal
            product={currentSerialProduct}
            excludedSerialIds={getExcludedSerials(
              currentSerialProduct.rowIndex,
            )}
            onClose={() => setIsSerialModalOpen(false)}
            onSave={(productId, serials) => {
              const newPurchased = {
                ...purchasedSerials,
                [currentSerialProduct.rowIndex]: serials,
              };
              setPurchasedSerials(newPurchased);
              setIsSerialModalOpen(false);
              toast.success("Serials updated");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AddSalesOrder;
