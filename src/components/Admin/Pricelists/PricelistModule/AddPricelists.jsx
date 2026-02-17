import React, { useState, useEffect, useMemo } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import Select from "react-select";
import { IoMdCloseCircle } from "react-icons/io";
import { domain } from "../../../../security";

const AddPricelists = ({ onClose, refreshData, pricelistToEdit }) => {
  const [formData, setFormData] = useState({
    productId: "",
    locationId: "",
    colorId: "",
    vatEx: 0,
    vatInc: 0,
    reseller: 0,
    zeroRated: 0,
  });

  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDropdownLoading, setIsDropdownLoading] = useState(true);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [locationsRes, productsRes, colorsRes] = await Promise.all([
          axios.get(`${domain}/api/Locations`),
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/Colors`),
        ]);

        setLocations(locationsRes.data);
        setProducts(productsRes.data);
        setColors(colorsRes.data);
      } catch (error) {
        toast.error("Error fetching dropdown data");
      } finally {
        setIsDropdownLoading(false); // Done loading dropdown data
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (pricelistToEdit) {
      setFormData({
        productId: pricelistToEdit.productId || "",
        locationId: pricelistToEdit.locationId || "",
        colorId: pricelistToEdit.colorId || "",
        vatEx: pricelistToEdit.vatEx || 0,
        vatInc: pricelistToEdit.vatInc || 0,
        reseller: pricelistToEdit.reseller || 0,
        zeroRated: pricelistToEdit.zeroRated || 0,
      });
    }
  }, [pricelistToEdit]);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.productName, // Keep it a string
        productImage: product.productImage,
        productName: product.productName,
        barCode: product.barCode,
        itemCode: product.itemCode,
        searchTerms: [
          product.productName.toLowerCase(),
          product.barCode?.toLowerCase() || "",
          product.itemCode?.toLowerCase() || "",
        ],
      })),
    [products]
  );

  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return productOptions;
    const searchLower = inputValue.trim().toLowerCase();
    return productOptions.filter(({ searchTerms }) =>
      searchTerms.some((term) => term.includes(searchLower))
    );
  }, [inputValue, productOptions]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredOptions.length > 0) {
      setFormData((prev) => ({ ...prev, productId: filteredOptions[0].value }));
    }
  };

  const locationOptions = useMemo(
    () => locations.map((loc) => ({ value: loc.id, label: loc.locationName })),
    [locations]
  );

  const colorOptions = useMemo(
    () => colors.map((col) => ({ value: col.id, label: col.colorName })),
    [colors]
  );

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = `${domain}/api/Pricelists`;
      if (pricelistToEdit) {
        await axios.put(`${apiUrl}/${pricelistToEdit.id}`, formData);
        toast.success("Pricelist updated successfully");
      } else {
        await axios.post(apiUrl, formData);
        toast.success("Pricelist added successfully");
      }
      refreshData();
      onClose();
    } catch (error) {
      toast.error("Error saving pricelist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      {(isDropdownLoading || isLoading) && <Loader />}
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-3 text-gray-500 hover:text-gray-700"
        >
          <IoMdCloseCircle size={32} />
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {pricelistToEdit ? "Edit Pricelist" : "Add Pricelist"}
        </h2>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <span className="font-medium">Product</span>
            <Select
              options={filteredOptions}
              getOptionLabel={(option) => option.searchTerms.join(" ")}
              getOptionValue={(option) => option.value}
              placeholder="Search Product"
              value={
                filteredOptions.find(
                  (opt) => opt.value === formData.productId
                ) || null
              }
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  productId: selected?.value || "",
                }))
              }
              className="mt-1"
              isSearchable
              onInputChange={(value) => setInputValue(value)}
              onKeyDown={handleKeyDown}
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2">
                  <img
                    src={
                      option.productImage
                        ? option.productImage.startsWith("http")
                          ? option.productImage
                          : `data:image/jpeg;base64,${option.productImage}`
                        : "path/to/placeholder/image.jpg"
                    }
                    alt={option.productName}
                    className="w-6 h-6 rounded"
                  />
                  <div>
                    <span className="font-semibold">{option.productName}</span>
                    <div className="text-gray-500 text-[8px]">
                      {option.barCode || "No Barcode"} |{" "}
                      {option.itemCode || "No Item Code"}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
          <div>
            <span className="font-medium">Location</span>
            <Select
              options={locationOptions}
              placeholder="Search Location"
              value={
                locationOptions.find(
                  (loc) => loc.value === formData.locationId
                ) || null
              }
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  locationId: selected?.value || "",
                }))
              }
              className="mt-1"
              isSearchable
            />
          </div>
          <div>
            <span className="font-medium">Color</span>
            <Select
              options={colorOptions}
              placeholder="Search Color"
              value={
                colorOptions.find((col) => col.value === formData.colorId) ||
                null
              }
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  colorId: selected?.value || "",
                }))
              }
              className="mt-1"
              isSearchable
            />
          </div>
          {[
            { id: "vatEx", label: "VAT Exclusive" },
            { id: "vatInc", label: "VAT Inclusive" },
            { id: "reseller", label: "Reseller Price" },
          ].map(({ id, label }) => (
            <div key={id}>
              <span className="font-medium">{label}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                step="1"
                placeholder={`Enter ${label}`}
                className="border border-gray-300 py-2 px-3 w-full rounded-md"
                value={formData[id]}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    // Allows only digits
                    setFormData({
                      ...formData,
                      [id]: value === "" ? 0 : parseInt(value, 10),
                    });
                  }
                }}
              />
            </div>
          ))}
          <div>
            <button className="w-full bg-orange-600 hover:bg-orange-700 transition text-white py-3 rounded-md font-medium">
              {pricelistToEdit ? "Update Pricelist" : "Add Pricelist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPricelists;
