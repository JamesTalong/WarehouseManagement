// src/components/YourModule/GoodsReceiptModule/AddGoodsReceipt.js

import React, { useEffect, useState, useMemo } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import Select from "react-select";
import {
  FaTimes,
  FaBoxOpen,
  FaBarcode,
  FaInfoCircle,
  FaCheckCircle,
  FaTrash,
  FaExclamationTriangle,
  FaBan,
  FaCheckDouble,
} from "react-icons/fa";
import SearchableDropdown from "../../../../UI/common/SearchableDropdown";

// --- REDUX IMPORTS ---
import { useSelector } from "react-redux";
import { selectFullName } from "../../../../redux/IchthusSlice";

// --- SERIAL ENTRY MODAL ---
const SerialEntryModal = ({
  isOpen,
  onClose,
  productName,
  quantity,
  expectedCount,
  serials,
  onSave,
}) => {
  const [localSerials, setLocalSerials] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const newSlots = [...serials];
      if (newSlots.length < expectedCount) {
        const diff = expectedCount - newSlots.length;
        for (let i = 0; i < diff; i++) newSlots.push("");
      } else if (newSlots.length > expectedCount) {
        newSlots.splice(expectedCount);
      }
      setLocalSerials(newSlots);
    }
  }, [isOpen, quantity, expectedCount, serials]);

  if (!isOpen) return null;

  const handleSerialChange = (index, value) => {
    const updated = [...localSerials];
    updated[index] = value.toUpperCase();
    setLocalSerials(updated);
  };

  const handleConfirm = () => {
    onSave(localSerials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-4 border-b border-indigo-700 flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FaBarcode /> Serial Numbers
            </h3>
            <p className="text-xs text-indigo-100 opacity-80">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition"
          >
            <FaTimes size={18} />
          </button>
        </div>
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Qty: <b>{quantity}</b> | Rate: <b>{expectedCount / quantity}</b>
            <br />
            Please scan <b>{expectedCount}</b> serial numbers.
          </p>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 bg-white">
          {localSerials.map((serial, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400 w-6 text-right">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={serial}
                onChange={(e) => handleSerialChange(idx, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border font-mono uppercase placeholder-gray-300"
                placeholder={`SERIAL-NO-${idx + 1}`}
                autoFocus={idx === 0}
              />
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-100 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Save Serials
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const AddGoodsReceipt = ({ onClose, refreshData }) => {
  const fullName = useSelector(selectFullName);

  const [formData, setFormData] = useState({
    receiptDate: new Date().toISOString().split("T")[0],
    purchaseOrderHeaderId: "",
    receivedBy: "",
    notes: "",
    goodsReceiptLines: [],
  });

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [conversions, setConversions] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // For the Modal
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(null);

  const inputStyles =
    "block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white";
  const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

  useEffect(() => {
    if (fullName) {
      setFormData((prev) => ({ ...prev, receivedBy: fullName }));
    }
  }, [fullName]);

  // 1. FETCH DATA (UPDATED LOGIC HERE)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [poRes, productRes, uomRes] = await Promise.all([
          axios.get(`${domain}/api/PurchaseOrderHeaders`),
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/UomConversions`),
        ]);

        // --- CHANGED: LOGIC TO KEEP PO ACTIVE IF ITEMS REMAIN ---
        const activePOs = poRes.data.filter((po) => {
          // 1. If explicitly closed or cancelled, hide it
          if (po.status === "Closed" || po.status === "Cancelled") return false;

          // 2. Check individual lines. If ANY line has quantity remaining, keep the PO active.
          if (
            po.purchaseOrderLineItems &&
            po.purchaseOrderLineItems.length > 0
          ) {
            const hasItemsRemaining = po.purchaseOrderLineItems.some((item) => {
              const received = item.receivedQuantity || 0;
              const rejected = item.rejectedQuantity || 0;
              const ordered = item.orderedQuantity || item.quantity;
              return ordered - received - rejected > 0;
            });
            return hasItemsRemaining;
          }

          // If no lines (rare), assume active if status is not closed
          return true;
        });

        setPurchaseOrders(activePOs);
        setConversions(uomRes.data);

        // Process Products
        const options = [];
        const map = {};

        productRes.data.forEach((item) => {
          map[item.id] = item;
          options.push({
            value: item.id,
            label: `${item.productName} - ${item.itemCode}`,
            itemCode: item.itemCode,
            productName: item.productName,
            hasSerial: item.hasSerial,
            baseUomId: item.baseUomId,
          });
        });

        setProductOptions(options);
        setProductsMap(map);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. PO SELECTION & INITIALIZATION
  useEffect(() => {
    if (formData.purchaseOrderHeaderId && Object.keys(productsMap).length > 0) {
      const po = purchaseOrders.find(
        (p) => p.id === parseInt(formData.purchaseOrderHeaderId)
      );
      setSelectedPO(po);

      if (po && po.purchaseOrderLineItems) {
        const initialLines = po.purchaseOrderLineItems.map((item) => {
          const previouslyReceived = item.receivedQuantity || 0;
          const rejected = item.rejectedQuantity || 0;
          let trueRemaining =
            (item.orderedQuantity || item.quantity) -
            previouslyReceived -
            rejected;
          if (trueRemaining < 0) trueRemaining = 0;

          const productDetails = item.productId
            ? productsMap[item.productId]
            : null;
          const hasSerial = productDetails ? productDetails.hasSerial : false;

          let rate = 1;
          if (
            productDetails &&
            item.unitOfMeasureId &&
            item.unitOfMeasureId !== productDetails.baseUomId
          ) {
            const foundConv = conversions.find(
              (c) =>
                c.productId === item.productId &&
                c.fromUomId === item.unitOfMeasureId &&
                c.toUomId === productDetails.baseUomId
            );
            if (foundConv) rate = foundConv.conversionRate;
          }

          return {
            purchaseOrderLineItemId: item.id,
            productId: item.productId,
            productName: item.productName,
            remainingQuantity: trueRemaining,
            orderedQuantity: item.orderedQuantity || item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            conversionRate: rate,
            isCustom: !item.productId,
            hasSerial: hasSerial,
            quantityReceived: 0,
            serialNumbers: [],
          };
        });

        setFormData((prev) => ({ ...prev, goodsReceiptLines: initialLines }));
      }
    } else {
      setSelectedPO(null);
      setFormData((prev) => ({ ...prev, goodsReceiptLines: [] }));
    }
  }, [
    formData.purchaseOrderHeaderId,
    purchaseOrders,
    productsMap,
    conversions,
  ]);

  const handleHeaderChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlePOSelect = (value) => {
    setFormData({ ...formData, purchaseOrderHeaderId: value });
  };

  const handleProductMapping = (index, selectedOption) => {
    const lines = [...formData.goodsReceiptLines];
    if (selectedOption) {
      lines[index].productId = selectedOption.value;
      lines[index].hasSerial = selectedOption.hasSerial;
      lines[index].conversionRate = 1;
      if (!selectedOption.hasSerial) {
        lines[index].serialNumbers = [];
      }
    } else {
      lines[index].productId = null;
      lines[index].hasSerial = false;
      lines[index].serialNumbers = [];
    }
    setFormData({ ...formData, goodsReceiptLines: lines });
  };

  const handleQuantityChange = (index, value) => {
    const lines = [...formData.goodsReceiptLines];
    const max = lines[index].remainingQuantity;
    let newQty = parseInt(value) || 0;

    if (newQty < 0) newQty = 0;
    // Don't allow typing if max is 0
    if (max === 0) newQty = 0;

    if (newQty > max) {
      toast.warn(`Cannot receive more than ${max} (Remaining Order).`);
      newQty = max;
    }

    lines[index].quantityReceived = newQty;

    const expectedSerials = newQty * lines[index].conversionRate;
    if (lines[index].hasSerial) {
      const currentSerials = lines[index].serialNumbers;
      if (expectedSerials < currentSerials.length) {
        lines[index].serialNumbers = currentSerials.slice(0, expectedSerials);
      }
    }

    setFormData({ ...formData, goodsReceiptLines: lines });
  };

  const openSerialModal = (index) => {
    setActiveLineIndex(index);
    setSerialModalOpen(true);
  };

  const handleSerialSave = (updatedSerials) => {
    const lines = [...formData.goodsReceiptLines];
    if (activeLineIndex !== null) {
      lines[activeLineIndex].serialNumbers = updatedSerials;
      setFormData({ ...formData, goodsReceiptLines: lines });
    }
  };

  const handleRevertLine = (index) => {
    const lines = [...formData.goodsReceiptLines];
    lines[index].quantityReceived = 0;
    lines[index].serialNumbers = [];
    setFormData({ ...formData, goodsReceiptLines: lines });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validLines = formData.goodsReceiptLines.filter(
        (l) => l.quantityReceived > 0
      );

      if (validLines.length === 0) {
        toast.warn("Please enter a received quantity for at least one item.");
        setIsLoading(false);
        return;
      }

      for (const line of validLines) {
        if (!line.productId) {
          toast.error(
            `Please select a System Product for custom item: "${line.productName}"`
          );
          setIsLoading(false);
          return;
        }
        if (line.hasSerial) {
          const expected = line.quantityReceived * line.conversionRate;
          if (line.serialNumbers.length !== expected) {
            toast.error(
              `Error on ${line.productName}: Expected ${expected} serial numbers, got ${line.serialNumbers.length}.`
            );
            setIsLoading(false);
            return;
          }
        }
      }

      const submitPayload = {
        receiptDate: new Date(formData.receiptDate).toISOString(),
        purchaseOrderHeaderId: parseInt(formData.purchaseOrderHeaderId),
        receivedBy: formData.receivedBy,
        notes: formData.notes,
        goodsReceiptLines: validLines.map((line) => ({
          purchaseOrderLineItemId: line.purchaseOrderLineItemId,
          productId: line.productId,
          quantityReceived: line.quantityReceived,
          serialNumbers: line.hasSerial
            ? line.serialNumbers.filter((s) => s.trim() !== "")
            : [],
        })),
      };

      await axios.post(`${domain}/api/GoodsReceipts`, submitPayload);
      toast.success("Goods Receipt & Batches created successfully!");
      refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to create Goods Receipt."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const autoBatchNamePreview = useMemo(() => {
    if (!selectedPO) return "...";
    const dateStr = formData.receiptDate.replace(/-/g, "");
    return `${selectedPO.poNumber}-${selectedPO.vendorId}-${dateStr}`;
  }, [selectedPO, formData.receiptDate]);

  const poDropdownOptions = useMemo(() => {
    return purchaseOrders.map((po) => ({
      ...po,
      displayLabel: `${po.poNumber} | Location: ${po.location}`,
    }));
  }, [purchaseOrders]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 p-4 backdrop-blur-sm">
      {/* SERIAL MODAL RENDER */}
      {activeLineIndex !== null &&
        formData.goodsReceiptLines[activeLineIndex] && (
          <SerialEntryModal
            isOpen={serialModalOpen}
            onClose={() => setSerialModalOpen(false)}
            onSave={handleSerialSave}
            productName={
              formData.goodsReceiptLines[activeLineIndex].productName
            }
            quantity={
              formData.goodsReceiptLines[activeLineIndex].quantityReceived
            }
            expectedCount={
              formData.goodsReceiptLines[activeLineIndex].quantityReceived *
              formData.goodsReceiptLines[activeLineIndex].conversionRate
            }
            serials={formData.goodsReceiptLines[activeLineIndex].serialNumbers}
          />
        )}

      <div className="relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex flex-shrink-0 items-center justify-between border-b bg-indigo-50 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <FaBoxOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                New Goods Receipt
              </h2>
              <p className="text-sm text-gray-500">
                Receive inventory against a Purchase Order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 transition hover:bg-red-50 rounded-full"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {isLoading && <Loader />}

        <form
          className="flex-grow overflow-y-auto p-6 space-y-8 bg-white"
          onSubmit={handleFormSubmit}
        >
          {/* SECTION 1: HEADER INPUTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="receiptDate" className={labelStyles}>
                Receipt Date & Time *
              </label>
              <input
                id="receiptDate"
                type="datetime-local"
                value={formData.receiptDate}
                onChange={handleHeaderChange}
                required
                className={inputStyles}
              />
            </div>
            <div className="z-10 relative">
              <label htmlFor="purchaseOrderHeaderId" className={labelStyles}>
                Purchase Order *
              </label>
              <SearchableDropdown
                options={poDropdownOptions}
                labelKey="displayLabel"
                valueKey="id"
                placeholder="-- Select Pending PO --"
                value={
                  formData.purchaseOrderHeaderId
                    ? parseInt(formData.purchaseOrderHeaderId)
                    : ""
                }
                onChange={handlePOSelect}
              />
            </div>
            <div>
              <label htmlFor="receivedBy" className={labelStyles}>
                Received By
              </label>
              <input
                type="text"
                id="receivedBy"
                value={formData.receivedBy}
                className="bg-gray-100 cursor-not-allowed block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-600"
                disabled
              />
            </div>
          </div>
          <div>
            <label className={labelStyles}>Notes</label>
            <textarea
              id="notes"
              rows={2}
              className={`${inputStyles} resize-none`}
              placeholder="Comments..."
              value={formData.notes}
              onChange={handleHeaderChange}
            ></textarea>
          </div>

          {selectedPO && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <FaInfoCircle className="text-blue-500 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">
                  Automated Inventory Processing
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Batch:{" "}
                  <span className="font-mono bg-blue-100 px-2 py-0.5 rounded ml-1 text-blue-800 font-bold">
                    {autoBatchNamePreview}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* SECTION 2: LINE ITEMS TABLE */}
          {selectedPO && (
            <div className="border rounded-xl overflow-hidden shadow-sm h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 relative">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[40%]">
                      Product Information
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                      Ord / Rem
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider w-40">
                      Rec. Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Serials / Config
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-20">
                      Revert
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.goodsReceiptLines.map((line, index) => {
                    const isFullyReceived = line.remainingQuantity <= 0;
                    return (
                      <tr
                        key={index}
                        className={
                          // --- CHANGED: GRAY OUT FULLY RECEIVED ROWS ---
                          isFullyReceived
                            ? "bg-gray-100 opacity-60 pointer-events-none" // Optional: pointer-events-none to prevent clicking
                            : line.quantityReceived > 0
                            ? "bg-indigo-50/30"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-gray-900">
                              {line.productName}
                            </span>
                            {!line.isCustom ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded w-fit flex items-center gap-1">
                                <FaCheckCircle size={10} /> matched Product ID:{" "}
                                {line.productId}
                                {line.hasSerial && (
                                  <span className="ml-1 text-indigo-600 font-bold">
                                    (Serial Required)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <div className="w-full mt-1">
                                <label className="text-xs text-orange-600 font-bold flex items-center gap-1 mb-1">
                                  <FaExclamationTriangle /> Map to System
                                  Product:
                                </label>
                                <Select
                                  // Re-enable pointer events for dropdown if row is disabled but you need to see it (removed pointer-events-none above if this is needed)
                                  isDisabled={isFullyReceived}
                                  menuPortalTarget={document.body}
                                  styles={{
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 9999,
                                    }),
                                    control: (base) => ({
                                      ...base,
                                      minHeight: "30px",
                                      fontSize: "12px",
                                    }),
                                  }}
                                  options={productOptions}
                                  placeholder="Search System Product..."
                                  value={
                                    productOptions.find(
                                      (opt) => opt.value === line.productId
                                    ) || null
                                  }
                                  onChange={(option) =>
                                    handleProductMapping(index, option)
                                  }
                                  className="text-sm"
                                />
                              </div>
                            )}
                            {/* Visual Badge for Completed Items */}
                            {isFullyReceived && (
                              <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded w-fit flex items-center gap-1 border border-gray-300">
                                <FaCheckDouble size={10} /> Fully Received
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            <span className="font-bold">
                              {line.orderedQuantity}
                            </span>{" "}
                            / {/* --- CHANGED: Highlight 0 remaining --- */}
                            <span
                              className={
                                isFullyReceived
                                  ? "text-gray-400 font-bold"
                                  : "text-orange-600 font-bold"
                              }
                            >
                              {line.remainingQuantity}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {line.unitOfMeasure}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {/* --- CHANGED: Disable input if 0 remaining --- */}
                          <input
                            type="number"
                            min="0"
                            max={line.remainingQuantity}
                            disabled={isFullyReceived}
                            value={line.quantityReceived}
                            onChange={(e) =>
                              handleQuantityChange(index, e.target.value)
                            }
                            className={`w-24 text-center rounded border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-gray-800 ${
                              isFullyReceived
                                ? "bg-gray-200 cursor-not-allowed text-gray-400 border-gray-200"
                                : line.quantityReceived > 0
                                ? "border-indigo-500 bg-white"
                                : "bg-gray-50"
                            }`}
                          />
                        </td>

                        <td className="px-6 py-4">
                          {line.hasSerial ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => openSerialModal(index)}
                                // --- CHANGED: Disable button if 0 remaining ---
                                disabled={
                                  isFullyReceived || line.quantityReceived <= 0
                                }
                                className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors text-sm
                                              ${
                                                isFullyReceived
                                                  ? "border-gray-200 text-gray-400 bg-transparent cursor-not-allowed"
                                                  : line.quantityReceived > 0
                                                  ? "border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm"
                                                  : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
                                              }
                                          `}
                              >
                                <FaBarcode
                                  className={
                                    !isFullyReceived &&
                                    line.quantityReceived > 0
                                      ? "text-indigo-500"
                                      : ""
                                  }
                                />
                                <span>
                                  {line.serialNumbers.filter((s) => s).length >
                                  0
                                    ? `${
                                        line.serialNumbers.filter((s) => s)
                                          .length
                                      } Serials`
                                    : "Add Serials"}
                                </span>
                              </button>

                              {line.serialNumbers.length > 0 &&
                                line.serialNumbers.length ===
                                  line.quantityReceived *
                                    line.conversionRate && (
                                  <FaCheckCircle
                                    className="text-green-500"
                                    title="All serials added"
                                  />
                                )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <FaBan className="text-gray-300" />
                              <span className="text-xs italic">
                                No serials required
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {line.quantityReceived > 0 && !isFullyReceived && (
                            <button
                              type="button"
                              onClick={() => handleRevertLine(index)}
                              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition"
                              title="Revert Line"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {formData.goodsReceiptLines.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500 italic"
                      >
                        No items found in this PO.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </form>

        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isLoading || !selectedPO}
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGoodsReceipt;
