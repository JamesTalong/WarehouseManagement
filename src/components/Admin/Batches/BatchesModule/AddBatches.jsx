import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  Calendar as CalendarIcon,
  Hash,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { domain } from "../../../../security";
import SearchableDropdown from "../../../../UI/common/SearchableDropdown";

// --- SUB-COMPONENT: Product Selector (No Changes) ---
const ProductSelector = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedProduct = options.find((p) => p.id === value);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 240;
      const newStyle = {
        left: rect.left,
        width: rect.width,
        position: "fixed",
        zIndex: 9999,
      };

      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        newStyle.bottom = window.innerHeight - rect.top + 8;
      } else {
        newStyle.top = rect.bottom + 8;
      }
      setMenuStyle(newStyle);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (product) => {
    onChange(product);
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((p) => {
    const term = searchTerm.toLowerCase();
    const name = p.productName?.toLowerCase() || "";
    const code = p.itemCode?.toLowerCase() || "";
    const barcode = p.barCode?.toLowerCase() || "";
    return name.includes(term) || code.includes(term) || barcode.includes(term);
  });

  const DropdownMenu = (
    <div
      ref={menuRef}
      style={menuStyle}
      className={`bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col max-h-60
        transform transition-all duration-150 ease-out overflow-hidden
        ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }
      `}
    >
      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Name, Code, Barcode..."
            className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pl-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <ul className="py-1 overflow-y-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((product) => (
            <li
              key={product.id}
              onClick={() => handleSelect(product)}
              className={`px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors duration-150
                ${product.id === value ? "bg-orange-50" : "hover:bg-gray-50"}
              `}
            >
              <div className="flex flex-col">
                <span
                  className={`font-medium text-sm ${
                    product.id === value ? "text-orange-700" : "text-gray-800"
                  }`}
                >
                  {product.productName}
                </span>
                <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500 font-mono">
                  <span>
                    Code:{" "}
                    <span className="text-gray-600">
                      {product.itemCode || "-"}
                    </span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>
                    Bar:{" "}
                    <span className="text-gray-600">
                      {product.barCode || "-"}
                    </span>
                  </span>
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-3 text-center text-sm text-gray-500">
            No matching products found.
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-white border border-gray-300 rounded-lg py-2 px-3 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-orange-500 transition 
            ${
              disabled
                ? "bg-gray-100 cursor-not-allowed opacity-60"
                : "hover:border-gray-400"
            }`}
      >
        <span className="truncate block">
          {selectedProduct ? (
            selectedProduct.productName
          ) : (
            <span className="text-gray-400">
              {placeholder || "Select Product..."}
            </span>
          )}
        </span>
        <FiChevronDown
          className={`w-5 h-5 text-gray-400 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && createPortal(DropdownMenu, document.body)}
    </>
  );
};

// --- SUB-COMPONENT: Serial Reduction Modal (No Changes) ---
const SerialReductionModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentSerials,
  targetQuantity,
}) => {
  const [selectedIndices, setSelectedIndices] = useState([]);

  if (!isOpen) return null;

  const currentQuantity = currentSerials.length;
  const quantityToRemove = currentQuantity - targetQuantity;
  const remainingToRemove = quantityToRemove - selectedIndices.length;

  const handleToggleSelect = (index) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        if (prev.length < quantityToRemove) {
          return [...prev, index];
        }
        return prev;
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedIndices);
    setSelectedIndices([]);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Reduce Quantity?
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              You are reducing quantity from{" "}
              <span className="font-bold">{currentQuantity}</span> to{" "}
              <span className="font-bold">{targetQuantity}</span>.
              <br />
              Please select{" "}
              <span className="font-bold text-red-600">
                {quantityToRemove}
              </span>{" "}
              serial number(s) to remove.
            </p>
          </div>
        </div>

        <div className="p-6 max-h-[300px] overflow-y-auto bg-gray-50 border-y border-gray-100">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">
            Select items to delete ({remainingToRemove} remaining)
          </h4>
          <div className="space-y-2">
            {currentSerials.map((serial, index) => {
              const isSelected = selectedIndices.includes(index);
              return (
                <div
                  key={index}
                  onClick={() => handleToggleSelect(index)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                ${
                                  isSelected
                                    ? "bg-red-50 border-red-300 ring-1 ring-red-500"
                                    : "bg-white border-gray-200 hover:border-gray-300"
                                }
                            `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition
                                    ${
                                      isSelected
                                        ? "bg-red-500 border-red-500"
                                        : "border-gray-300 bg-white"
                                    }
                                `}
                    >
                      {isSelected && <X className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`font-mono text-sm ${
                        isSelected
                          ? "text-red-700 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {serial.serialName || "(Empty Serial)"}
                    </span>
                  </div>
                  {isSelected && <Trash2 className="w-4 h-4 text-red-500" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel (Keep Current)
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIndices.length !== quantityToRemove}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition
                ${
                  selectedIndices.length === quantityToRemove
                    ? "bg-red-600 hover:bg-red-700 shadow-md"
                    : "bg-gray-300 cursor-not-allowed"
                }
            `}
          >
            <Trash2 className="w-4 h-4" />
            Confirm Removal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- MAIN COMPONENT ---

const AddBatches = ({ onClose, refreshData, batchToEdit }) => {
  const [formData, setFormData] = useState({
    name: "",
    batchDate: new Date(),
    quantity: 0,
    productId: null,
    locationId: null,
    inventoryStatusId: null,
    hasSerial: false,
    serialNumbers: [],
  });

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isReductionModalOpen, setReductionModalOpen] = useState(false);
  const [reductionTargetQty, setReductionTargetQty] = useState(0);

  // --- Initialization ---
  useEffect(() => {
    if (batchToEdit) {
      setFormData({
        name: batchToEdit.name || "",
        batchDate: new Date(batchToEdit.batchDate),
        quantity: batchToEdit.quantity || 0,
        productId: batchToEdit.productId,
        locationId: batchToEdit.locationId,
        inventoryStatusId: batchToEdit.inventoryStatusId,
        hasSerial: batchToEdit.hasSerial || false,
        serialNumbers:
          batchToEdit.serialNumbers?.map((s) => ({
            serialName: s.serialName,
            isSold: s.isSold || false,
          })) || [],
      });
    }
  }, [batchToEdit]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsLoading(true);
      try {
        const [prodRes, locRes, statusRes] = await Promise.all([
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/Locations`),
          axios.get(`${domain}/api/InventoryStatuses`),
        ]);

        setProducts(prodRes.data);
        setLocations(locRes.data);
        setStatuses(statusRes.data);
      } catch (error) {
        console.error("Error loading references:", error);
        toast.error("Could not load dropdown data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdowns();
  }, []);

  // --- Form Handlers ---
  const handleProductSelect = useCallback((selectedProduct) => {
    if (!selectedProduct) return;
    setFormData((prev) => ({
      ...prev,
      productId: selectedProduct.id,
      hasSerial: selectedProduct.hasSerial === true,
      quantity: 0,
      serialNumbers: [],
    }));
  }, []);

  const handleQuantityChange = (e) => {
    const newQty = parseInt(e.target.value, 10) || 0;
    const currentQty = formData.quantity || 0;

    if (newQty > currentQty) {
      const addedCount = newQty - formData.serialNumbers.length;
      let updatedSerials = [...formData.serialNumbers];

      if (addedCount > 0) {
        const newSlots = Array(addedCount).fill({
          serialName: "",
          isSold: false,
        });
        updatedSerials = [...updatedSerials, ...newSlots];
      }

      setFormData({
        ...formData,
        quantity: newQty,
        serialNumbers: updatedSerials,
      });
      return;
    }

    if (newQty < currentQty) {
      if (formData.hasSerial) {
        setReductionTargetQty(newQty);
        setReductionModalOpen(true);
      } else {
        const updatedSerials = formData.serialNumbers.slice(0, newQty);
        setFormData({
          ...formData,
          quantity: newQty,
          serialNumbers: updatedSerials,
        });
      }
    }
  };

  const handleConfirmReduction = (indicesToRemove) => {
    const updatedSerials = formData.serialNumbers.filter(
      (_, index) => !indicesToRemove.includes(index)
    );

    setFormData({
      ...formData,
      quantity: reductionTargetQty,
      serialNumbers: updatedSerials,
    });
    setReductionModalOpen(false);
    toast.info(`Updated quantity to ${reductionTargetQty}`);
  };

  const handleCloseReductionModal = () => {
    setReductionModalOpen(false);
    toast.info("Quantity change cancelled.");
  };

  const handleSerialNameChange = (index, value) => {
    const updatedSerials = [...formData.serialNumbers];
    updatedSerials[index] = { ...updatedSerials[index], serialName: value };
    setFormData({ ...formData, serialNumbers: updatedSerials });
  };

  const handleGenericDropdownChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.name) return toast.warning("Batch Name is required.");
    if (!formData.productId) return toast.warning("Product is required.");
    if (!formData.locationId) return toast.warning("Location is required.");
    if (!formData.inventoryStatusId)
      return toast.warning("Status is required.");
    if (formData.quantity <= 0)
      return toast.warning("Quantity must be greater than 0.");

    if (formData.hasSerial) {
      if (formData.serialNumbers.length !== formData.quantity) {
        return toast.error("Number of serials must match quantity.");
      }
      const hasEmpty = formData.serialNumbers.some(
        (s) => !s.serialName || !s.serialName.trim()
      );
      if (hasEmpty) return toast.error("All serial numbers must be filled.");

      const names = formData.serialNumbers.map((s) =>
        s.serialName.trim().toUpperCase()
      );
      const uniqueNames = new Set(names);
      if (uniqueNames.size !== names.length) {
        return toast.error("Duplicate serial numbers detected in this batch.");
      }
    }

    setIsLoading(true);

    const payload = {
      name: formData.name,
      productId: formData.productId,
      locationId: formData.locationId,
      inventoryStatusId: formData.inventoryStatusId,
      quantity: formData.quantity,
      hasSerial: formData.hasSerial,
      batchDate: formData.batchDate.toISOString(),

      // FIXED: Must send null explicitly if using manual entry, not undefined/0
      goodsReceiptLineId: null,

      serialNumbers: formData.hasSerial
        ? formData.serialNumbers.map((s) => ({
            serialName: s.serialName.toUpperCase(),
            isSold: false,
          }))
        : [],
    };

    try {
      console.log("Submitting payload:", payload);
      if (batchToEdit) {
        await axios.put(`${domain}/api/Batches/${batchToEdit.id}`, payload);
        toast.success("Batch updated successfully");
      } else {
        await axios.post(`${domain}/api/Batches`, payload);
        toast.success("Batch added successfully");
      }
      refreshData();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      const msg = error.response?.data?.message || "Failed to save batch.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg relative">
      {isLoading && <Loader />}

      <SerialReductionModal
        isOpen={isReductionModalOpen}
        onClose={handleCloseReductionModal}
        onConfirm={handleConfirmReduction}
        currentSerials={formData.serialNumbers}
        targetQuantity={reductionTargetQty}
      />

      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {batchToEdit ? "Edit Batch" : "Create New Batch"}
          </h2>
          <p className="text-sm text-gray-500">
            Fill in the details below to manage inventory.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form id="batchForm" onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Batch Name & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name / Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="e.g. BATCH-2023-001"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Date
              </label>
              <div className="relative z-10">
                <DatePicker
                  selected={formData.batchDate}
                  onChange={(date) =>
                    setFormData({ ...formData, batchDate: date })
                  }
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  dateFormat="MMMM d, yyyy"
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Specialized Product Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Product
            </label>
            <ProductSelector
              options={products}
              value={formData.productId}
              onChange={handleProductSelect}
              placeholder="Select product (Search by Name, Code, Barcode)"
              disabled={!!batchToEdit}
            />
          </div>

          {/* Row 3: Location & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Location
              </label>
              <SearchableDropdown
                options={locations}
                value={formData.locationId}
                onChange={(value) =>
                  handleGenericDropdownChange("locationId", value)
                }
                placeholder="Select Location"
                labelKey="locationName"
                valueKey="id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Inventory Status
              </label>
              <SearchableDropdown
                options={statuses}
                value={formData.inventoryStatusId}
                onChange={(value) =>
                  handleGenericDropdownChange("inventoryStatusId", value)
                }
                placeholder="Select Status"
                labelKey="name"
                valueKey="id"
              />
            </div>
          </div>

          {/* Row 4: Quantity */}
          <div>
            <div className="flex items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              {formData.hasSerial && (
                <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Hash size={10} /> Serialized
                </span>
              )}
            </div>

            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={formData.quantity}
              onChange={handleQuantityChange}
              disabled={!formData.productId}
              placeholder={!formData.productId ? "Select a product first" : ""}
            />

            {formData.hasSerial && (
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 p-2 rounded border border-orange-100">
                <AlertTriangle size={14} />
                Reducing the quantity will require you to select which serial
                numbers to remove.
              </p>
            )}
          </div>

          {/* Serial Numbers Section */}
          {formData.hasSerial && formData.quantity > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-700">
                  Serial Numbers
                </h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                  Count: {formData.serialNumbers.length}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {formData.serialNumbers.map((serial, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-1 duration-200"
                  >
                    <span className="text-xs text-gray-400 font-mono w-6 text-right">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      placeholder={`Scan/Type Serial #${index + 1}`}
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase font-mono transition"
                      value={serial.serialName}
                      onChange={(e) =>
                        handleSerialNameChange(index, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          Cancel
        </button>
        {/* FIXED: Removed onClick={handleSubmit} to prevent double-submit bug, added type="submit" */}
        <button
          type="submit"
          form="batchForm"
          className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition flex items-center gap-2"
        >
          {batchToEdit ? "Update Batch" : "Save Batch"}
        </button>
      </div>
    </div>
  );
};

export default AddBatches;
