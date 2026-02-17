import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  ChevronDown,
  Search,
  Calendar,
  Tag,
  MapPin,
  Box,
  Clock,
  Zap,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { domain } from "../../../../security";

// --- Custom Product Selector ---
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
        top: rect.bottom + 6,
        position: "fixed",
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  const filteredOptions = options.filter(
    (p) =>
      (p.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.itemCode || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-white border rounded-lg py-2.5 px-3 flex justify-between items-center transition-all ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        }`}
      >
        <span
          className={`truncate text-sm ${
            !selectedProduct ? "text-gray-400" : "text-gray-900 font-medium"
          }`}
        >
          {selectedProduct
            ? selectedProduct.productName
            : placeholder || "Select Product"}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div
          style={menuStyle}
          className="bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col max-h-64 overflow-hidden"
        >
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                autoFocus
                type="text"
                className="w-full pl-9 p-2 text-sm bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 outline-none"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul className="overflow-y-auto p-1">
            {filteredOptions.map((opt) => (
              <li
                key={opt.id}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="px-3 py-2 hover:bg-green-50 hover:text-green-700 rounded-md cursor-pointer transition-colors text-sm"
              >
                <div className="font-medium text-gray-800">
                  {opt.productName}
                </div>
                <div className="text-xs text-gray-400">{opt.itemCode}</div>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-4 py-3 text-center text-xs text-gray-400">
                No results found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const AddSellingPrice = ({ onClose, refreshData, itemToEdit, prefillData }) => {
  const [pricingMode, setPricingMode] = useState("STANDARD");

  const [formData, setFormData] = useState({
    productId: null,
    uomId: null,
    vatInc: "",
    vatEx: "",
    reseller: "",
    zeroRated: 0,
    effectiveDate: new Date(),
    endDate: null,
    notes: "",
    locationId: null,
    batchId: null,
  });

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [productSpecificUoms, setProductSpecificUoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch References
  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsLoading(true);
      try {
        const [prodRes, locRes] = await Promise.all([
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/Locations`),
        ]);
        setProducts(prodRes.data);
        setLocations(locRes.data);
      } catch (error) {
        console.error(error);
        toast.error("Could not load reference data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const fetchUomsForProduct = async (productId) => {
    if (!productId) {
      setProductSpecificUoms([]);
      return [];
    }
    try {
      const response = await axios.get(
        `${domain}/api/Products/${productId}/pricing-uoms`
      );
      setProductSpecificUoms(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleProductSelect = (product) => {
    setFormData((prev) => ({ ...prev, productId: product.id, uomId: null }));
    fetchUomsForProduct(product.id);
  };

  // 2. Edit Mode Initialization
  useEffect(() => {
    if (itemToEdit) {
      setPricingMode(itemToEdit.endDate ? "PROMO" : "STANDARD");
      setFormData({
        productId: itemToEdit.productId,
        uomId: itemToEdit.uomId,
        vatInc: itemToEdit.vatInc,
        vatEx: itemToEdit.vatEx,
        reseller: itemToEdit.reseller,
        zeroRated: itemToEdit.zeroRated,
        effectiveDate: new Date(itemToEdit.effectiveDate),
        endDate: itemToEdit.endDate ? new Date(itemToEdit.endDate) : null,
        notes: itemToEdit.notes || "",
        locationId: itemToEdit.locationId,
        batchId: itemToEdit.batchId || null,
      });
      fetchUomsForProduct(itemToEdit.productId);
    }
  }, [itemToEdit]);

  // 3. Prefill Data Initialization
  useEffect(() => {
    if (prefillData && !itemToEdit) {
      const { productId, locationId, prefillUom, isSpecial } = prefillData;
      setPricingMode(isSpecial ? "PROMO" : "STANDARD");

      setFormData((prev) => ({
        ...prev,
        productId: productId || null,
        locationId: locationId || null,
        endDate: null,
      }));

      if (productId) {
        fetchUomsForProduct(productId).then((uoms) => {
          if (prefillUom && prefillUom !== "SPECIAL") {
            const match = uoms.find(
              (u) => u.code === prefillUom || u.name === prefillUom
            );
            if (match) {
              setFormData((prev) => ({ ...prev, uomId: match.id }));
            }
          }
        });
      }
    }
  }, [prefillData, itemToEdit]);

  // 4. Handle Pricing Mode Switching
  const handleModeChange = (mode) => {
    setPricingMode(mode);
    if (mode === "STANDARD") {
      setFormData((prev) => ({ ...prev, endDate: null }));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData((prev) => ({ ...prev, endDate: tomorrow }));
    }
  };

  // 5. Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (
      !formData.productId ||
      !formData.uomId ||
      !formData.locationId ||
      !formData.vatInc
    ) {
      return toast.warning("Please fill in all required fields.");
    }
    if (pricingMode === "PROMO" && !formData.endDate) {
      return toast.warning("Promos require an End Date.");
    }

    setIsLoading(true);

    const payload = {
      ...formData,
      vatInc: parseFloat(formData.vatInc) || 0,
      vatEx: parseFloat(formData.vatEx) || 0,
      reseller: parseFloat(formData.reseller) || 0,
      effectiveDate: formData.effectiveDate.toISOString(),
      endDate:
        pricingMode === "STANDARD" ? null : formData.endDate?.toISOString(),
    };

    try {
      if (itemToEdit) {
        await axios.put(
          `${domain}/api/SellingPriceHistories/${itemToEdit.id}`,
          payload
        );
        toast.success("Price updated successfully");
      } else {
        await axios.post(`${domain}/api/SellingPriceHistories`, payload);
        toast.success("Price created successfully");
      }
      refreshData();
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save pricing.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Label = ({ icon: Icon, children, required, className }) => (
    <label
      className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2 ${
        className || "text-gray-600"
      }`}
    >
      {Icon && <Icon size={14} className="opacity-70" />}
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  // LOGIC FIX: IsLocked applies if we are editing OR if we prefilled the PRODUCT data
  const isLocked = !!itemToEdit || (!!prefillData && !!prefillData.productId);
  const isPromo = pricingMode === "PROMO";

  return (
    <div className="flex flex-col w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden relative max-h-[90vh]">
      {isLoading && <Loader />}

      <div
        className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${
          isPromo
            ? "bg-orange-50 border-orange-100"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isPromo
                ? "bg-orange-100 text-orange-600"
                : "bg-white border border-gray-200 text-green-600"
            }`}
          >
            {isPromo ? <Zap size={20} /> : <Tag size={20} />}
          </div>
          <div>
            <h2
              className={`text-lg font-bold ${
                isPromo ? "text-orange-900" : "text-gray-800"
              }`}
            >
              {itemToEdit
                ? "Edit Price"
                : isLocked
                ? "Add Unit Price"
                : "New Price"}
            </h2>
            <p
              className={`text-xs ${
                isPromo ? "text-orange-600" : "text-gray-500"
              } mt-0.5`}
            >
              {isPromo
                ? "Configure limited time offer details"
                : "Configure standard selling price"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form id="pricingForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <Label icon={Box} required>
                  Product
                </Label>
                <ProductSelector
                  options={products}
                  value={formData.productId}
                  onChange={handleProductSelect}
                  disabled={isLocked}
                />
              </div>
              <div className="col-span-6">
                <Label icon={MapPin} required>
                  Location
                </Label>
                <select
                  required
                  // LOGIC FIX: Disable location if Editing OR if adding a specific item from the list
                  disabled={isLocked}
                  className={`w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                    isLocked
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : ""
                  }`}
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
              </div>
              <div className="col-span-6">
                <Label icon={Tag} required>
                  U.O.M
                </Label>
                <div className="relative">
                  <select
                    required
                    disabled={!formData.productId}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none"
                    value={formData.uomId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        uomId: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="">
                      {formData.productId
                        ? "Select Unit..."
                        : "Select Product First"}
                    </option>
                    {productSpecificUoms.map((uom) => (
                      <option key={uom.id} value={uom.id}>
                        {uom.code} - {uom.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200"></div>

          {/* DATES SECTION */}
          <div
            className={`p-5 rounded-xl border ${
              isPromo
                ? "bg-orange-50/50 border-orange-200"
                : "bg-gray-50/50 border-gray-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <Label
                icon={ShieldCheck}
                className={isPromo ? "text-orange-700" : "text-gray-700"}
              >
                Pricing Type
              </Label>
              <div className="flex bg-gray-200 p-1 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => handleModeChange("STANDARD")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${
                    !isPromo
                      ? "bg-white text-gray-800 shadow"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Standard Price
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("PROMO")}
                  className={`flex items-center gap-1 px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${
                    isPromo
                      ? "bg-white text-orange-600 shadow"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Promo / Special
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label icon={Clock} required>
                  Effective Date
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={formData.effectiveDate}
                    onChange={(date) =>
                      setFormData({ ...formData, effectiveDate: date })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    dateFormat="MMM d, yyyy"
                    required
                  />
                  <Calendar
                    size={16}
                    className="absolute left-3 top-3 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                {isPromo ? (
                  <>
                    <Label icon={Clock} required className="text-orange-700">
                      Ends On (Required)
                    </Label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.endDate}
                        onChange={(date) =>
                          setFormData({ ...formData, endDate: date })
                        }
                        className="w-full pl-10 pr-3 py-2.5 border border-orange-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-orange-900"
                        placeholderText="Select End Date"
                        dateFormat="MMM d, yyyy"
                        minDate={formData.effectiveDate}
                        required
                      />
                      <Calendar
                        size={16}
                        className="absolute left-3 top-3 text-orange-400 pointer-events-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Label icon={Clock} className="text-gray-400">
                      End Date
                    </Label>
                    <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-2 text-gray-400 select-none">
                      <span className="text-xl font-bold">∞</span>
                      <span className="text-sm font-medium">
                        Indefinite (No Expiration)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200"></div>

          {/* MONEY SECTION */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              Pricing Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
              <div>
                <Label required>SRP (VAT Inc)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-3 py-2.5 bg-green-50/50 border border-green-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                    value={formData.vatInc}
                    onChange={(e) =>
                      setFormData({ ...formData, vatInc: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label required>VAT Excluded</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    value={formData.vatEx}
                    onChange={(e) =>
                      setFormData({ ...formData, vatEx: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label required>Reseller Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    value={formData.reseller}
                    onChange={(e) =>
                      setFormData({ ...formData, reseller: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="col-span-12">
              <Label>Notes</Label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none h-20"
                placeholder="Optional remarks..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          form="pricingForm"
          type="submit"
          className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-md transition-all ${
            isPromo
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {itemToEdit ? "Update Price" : "Save Price"}
        </button>
      </div>
    </div>
  );
};

export default AddSellingPrice;
