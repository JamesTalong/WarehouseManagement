import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  Search,
  Truck,
  MapPin,
  Scale,
} from "lucide-react";
import { domain } from "../../../../security";

// --- Reusable Product Selector ---
const ProductSelector = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const selectedProduct = options.find((p) => p.id === value);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        left: rect.left,
        width: rect.width,
        top: rect.bottom + 8,
        position: "fixed",
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  const filteredOptions = options.filter((p) =>
    (p.productName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-white border border-gray-300 rounded-lg py-2.5 px-3 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-500"
            : "text-gray-700"
        }`}
      >
        <span className="truncate font-medium">
          {selectedProduct
            ? selectedProduct.productName
            : placeholder || "Select Product..."}
        </span>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            style={menuStyle}
            className="bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col max-h-60 overflow-hidden z-[9999]"
          >
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  autoFocus
                  type="text"
                  className="w-full pl-9 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ul className="overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.id}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 text-gray-700"
                  >
                    {opt.productName}
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">
                  No products found
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Component ---
const AddPurchasePrice = ({ onClose, refreshData, itemToEdit }) => {
  const [formData, setFormData] = useState({
    productId: null,
    vendorId: null,
    uomId: null,
    price: "",
    effectiveDate: new Date(),
    notes: "",
    locationId: null,
    purchaseOrderLineId: null, // Explicitly null for manual entries
  });

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        productId: itemToEdit.product?.id || itemToEdit.productId,
        vendorId: itemToEdit.vendor?.id || itemToEdit.vendorId,
        uomId: itemToEdit.uom?.id || itemToEdit.uomId,
        locationId: itemToEdit.location?.id || itemToEdit.locationId,
        price: itemToEdit.price,
        effectiveDate: new Date(itemToEdit.effectiveDate),
        notes: itemToEdit.notes || "",
        purchaseOrderLineId: itemToEdit.purchaseOrderLineId || null,
      });
    }
  }, [itemToEdit]);

  // Fetch Dropdown Data
  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsLoading(true);
      try {
        const [prodRes, locRes, uomRes, vendRes] = await Promise.all([
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/Locations`),
          axios.get(`${domain}/api/UnitOfMeasurements`),
          axios.get(`${domain}/api/Vendors`),
        ]);
        setProducts(prodRes.data);
        setLocations(locRes.data);
        setUoms(uomRes.data);
        setVendors(vendRes.data);
      } catch (error) {
        console.error(error);
        toast.error("Could not load reference data. Please check connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Validation
    if (
      !formData.productId ||
      !formData.vendorId ||
      !formData.uomId ||
      !formData.locationId ||
      !formData.price ||
      parseFloat(formData.price) <= 0
    ) {
      return toast.warning("Please fill all required fields correctly.");
    }

    setIsLoading(true);

    // Prepare Payload
    const payload = {
      productId: parseInt(formData.productId),
      vendorId: parseInt(formData.vendorId),
      uomId: parseInt(formData.uomId),
      locationId: parseInt(formData.locationId),
      price: parseFloat(formData.price),
      effectiveDate: formData.effectiveDate.toISOString(), // C# expects ISO String
      notes: formData.notes,
      purchaseOrderLineId: formData.purchaseOrderLineId, // Keep existing if editing, null if new
    };

    try {
      if (itemToEdit) {
        await axios.put(
          `${domain}/api/PurchasePriceHistories/${itemToEdit.id}`,
          payload,
        );
        toast.success("Price history updated successfully");
      } else {
        await axios.post(`${domain}/api/PurchasePriceHistories`, payload);
        toast.success("Price history added successfully");
      }
      refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to save record.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl relative overflow-hidden">
      {isLoading && <Loader />}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {itemToEdit ? "Edit Price Record" : "Add Manual Price"}
          </h2>
          <p className="text-sm text-slate-500">
            {itemToEdit
              ? "Update existing price history entry."
              : "Manually record a vendor price quote."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Product & Vendor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <ProductSelector
                options={products}
                value={formData.productId}
                onChange={(p) => setFormData({ ...formData, productId: p.id })}
                disabled={!!itemToEdit} // Lock product on edit to prevent confusion
                placeholder="Search & Select Product"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-slate-700"
                  value={formData.vendorId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vendorId: parseInt(e.target.value),
                    })
                  }
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Price & UOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold text-lg">₱</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 font-mono"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-slate-700"
                  value={formData.uomId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      uomId: parseInt(e.target.value),
                    })
                  }
                >
                  <option value="">Select UOM...</option>
                  {uoms.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} - {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Date & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <div className="relative z-10">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <DatePicker
                  selected={formData.effectiveDate}
                  onChange={(date) =>
                    setFormData({ ...formData, effectiveDate: date })
                  }
                  dateFormat="MM/dd/yyyy"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-slate-700"
                  value={formData.locationId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationId: parseInt(e.target.value),
                    })
                  }
                >
                  <option value="">Select Location...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.locationName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <textarea
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                rows="3"
                placeholder="Optional comments (e.g. Special Quotation)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          {itemToEdit ? (
            <>
              <FileText size={16} /> Update Price
            </>
          ) : (
            <>
              <DollarSign size={16} /> Save Price
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddPurchasePrice;
