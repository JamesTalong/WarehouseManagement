import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import profile from "../../../../Images/profile.jpg";
import {
  IoMdArrowDown,
  IoMdArrowUp,
  IoMdCloseCircle,
  IoMdTrash,
  IoMdAdd,
  IoMdCheckmark,
  IoMdArrowDropright,
} from "react-icons/io";
import { domain } from "../../../../security";

// Utility to convert file to Base64
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject("No file provided");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const AddProducts = ({ onClose, refreshData, productToEdit }) => {
  // --- STEPPER STATE ---
  const [currentStep, setCurrentStep] = useState(1);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    productImage: null,
    productName: "",
    itemCode: "",
    barCode: "",
    description: "",
    hasSerial: true,
    brandId: null,
    brand: "",
    categoryId: null,
    category: "",
    categoryTwoId: null,
    categoryTwo: "",
    categoryThreeId: null,
    categoryThree: "",
    categoryFourId: null,
    categoryFour: "",
    categoryFiveId: null,
    categoryFive: "",
    salesUomId: null,
    purchaseUomId: null,
    baseUomId: null,
  });

  // --- UOM CONVERSION STATE ---
  const [conversionList, setConversionList] = useState([]);
  const [newConversion, setNewConversion] = useState({
    fromUomId: "",
    toUomId: "",
    conversionRate: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(profile);

  // --- DROPDOWN DATA ---
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesTwo, setCategoriesTwo] = useState([]);
  const [categoriesThree, setCategoriesThree] = useState([]);
  const [categoriesFour, setCategoriesFour] = useState([]);
  const [categoriesFive, setCategoriesFive] = useState([]);
  const [unitOfMeasurements, setUnitOfMeasurements] = useState([]);
  const [showExtraCategories, setShowExtraCategories] = useState(false);

  // --- FETCH HELPERS ---
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [
          uomsRes,
          brandsRes,
          catsRes,
          cats2Res,
          cats3Res,
          cats4Res,
          cats5Res,
        ] = await Promise.all([
          axios.get(`${domain}/api/UnitOfMeasurements`),
          axios.get(`${domain}/api/Brands`),
          axios.get(`${domain}/api/Categories`),
          axios.get(`${domain}/api/CategoriesTwo`),
          axios.get(`${domain}/api/CategoriesThree`),
          axios.get(`${domain}/api/CategoriesFour`),
          axios.get(`${domain}/api/CategoriesFive`),
        ]);

        setUnitOfMeasurements(uomsRes.data);
        setBrands(brandsRes.data);
        setCategories(catsRes.data);
        setCategoriesTwo(cats2Res.data);
        setCategoriesThree(cats3Res.data);
        setCategoriesFour(cats4Res.data);
        setCategoriesFive(cats5Res.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdowns();
  }, []);

  // --- INITIALIZE FORM IF EDITING ---
  useEffect(() => {
    const fetchFullProductDetails = async () => {
      if (productToEdit) {
        setIsLoading(true);
        try {
          setFormData((prev) => ({
            ...prev,
            productName: productToEdit.productName || "",
            itemCode: productToEdit.itemCode || "",
            barCode: productToEdit.barCode || "",
            description: productToEdit.description || "",
            hasSerial: productToEdit.hasSerial,
            brandId: productToEdit.brandId || null,
            brand: productToEdit.brandName || "",
            categoryId: productToEdit.categoryId || null,
            category: productToEdit.categoryName || "",
            categoryTwoId: productToEdit.categoryTwoId || null,
            categoryThreeId: productToEdit.categoryThreeId || null,
            categoryFourId: productToEdit.categoryFourId || null,
            categoryFiveId: productToEdit.categoryFiveId || null,
            salesUomId: productToEdit.salesUomId || null,
            purchaseUomId: productToEdit.purchaseUomId || null,
            baseUomId: productToEdit.baseUomId || null,
          }));

          const response = await axios.get(
            `${domain}/api/Products/${productToEdit.id}`
          );
          const fullProduct = response.data;

          if (fullProduct.productImage) {
            const imageSrc = fullProduct.productImage.startsWith("data:image")
              ? fullProduct.productImage
              : `data:image/jpeg;base64,${fullProduct.productImage}`;
            setPreviewImage(imageSrc);
            setFormData((prev) => ({
              ...prev,
              productImage: fullProduct.productImage,
            }));
          } else {
            setPreviewImage(profile);
          }

          await fetchUomConversions(productToEdit.id);
        } catch (error) {
          console.error("Error fetching full product details:", error);
          toast.error("Could not load full product details.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFullProductDetails();
  }, [productToEdit]);

  const fetchUomConversions = async (productId) => {
    try {
      const res = await axios.get(`${domain}/api/UomConversions`);
      const productConversions = res.data.filter(
        (c) => c.productId === productId
      );
      setConversionList(productConversions);
    } catch (err) {
      console.error("Error fetching conversions", err);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const setDropdown = (list, idField, nameField) => {
      const item = list.find((i) => i.id === Number(value));
      setFormData((prev) => ({
        ...prev,
        [id]: value || null,
        [nameField]: item ? item.brandName || item.categoryName : "",
      }));
    };

    if (id === "brandId") setDropdown(brands, "brandId", "brand");
    else if (id === "categoryId")
      setDropdown(categories, "categoryId", "category");
    else setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setFormData({ ...formData, productImage: file });
    }
  };

  // --- NAVIGATION HANDLERS (STEPPER) ---
  const handleNext = () => {
    const form = document.getElementById("productForm");
    if (form.checkValidity()) {
      setCurrentStep(2);
    } else {
      form.reportValidity();
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // --- UOM CONVERSION HANDLERS ---
  const handleAddConversion = () => {
    if (
      !newConversion.fromUomId ||
      !newConversion.toUomId ||
      !newConversion.conversionRate
    ) {
      toast.warning("Please fill all conversion fields");
      return;
    }

    const baseUomId = Number(formData.baseUomId);
    const selectedToUomId = Number(newConversion.toUomId);
    const selectedFromUomId = Number(newConversion.fromUomId);
    let enteredRate = parseFloat(newConversion.conversionRate);

    let finalRate = enteredRate;
    let finalToUomId = selectedToUomId;

    if (selectedToUomId !== baseUomId) {
      const parentRule = conversionList.find(
        (c) => c.fromUomId === selectedToUomId && c.toUomId === baseUomId
      );

      if (parentRule) {
        finalRate = enteredRate * parentRule.conversionRate;
        finalToUomId = baseUomId;
        toast.info(
          `Auto-calculated: 1 ${
            unitOfMeasurements.find((u) => u.id === selectedFromUomId)?.code
          } = ${finalRate} ${
            unitOfMeasurements.find((u) => u.id === baseUomId)?.code
          }`
        );
      } else {
        toast.error(
          "Please define the conversion to the Base Unit first. (e.g., Define Kg -> Pcs before defining Box -> Kg)"
        );
        return;
      }
    }

    const fromUomObj = unitOfMeasurements.find(
      (u) => u.id === selectedFromUomId
    );
    const toUomObj = unitOfMeasurements.find((u) => u.id === finalToUomId);

    const item = {
      id: null,
      fromUomId: selectedFromUomId,
      toUomId: finalToUomId,
      fromUomCode: fromUomObj ? fromUomObj.code : "",
      toUomCode: toUomObj ? toUomObj.code : "",
      conversionRate: finalRate,
      productId: productToEdit ? productToEdit.id : null,
    };

    const exists = conversionList.some((c) => c.fromUomId === item.fromUomId);
    if (exists) {
      toast.error("A conversion rule for this unit already exists.");
      return;
    }

    setConversionList([...conversionList, item]);
    setNewConversion({ fromUomId: "", toUomId: "", conversionRate: 1 });
  };

  const handleRemoveConversion = async (index, id) => {
    if (id) {
      try {
        await axios.delete(`${domain}/api/UomConversions/${id}`);
        toast.success("Conversion deleted");
      } catch (err) {
        toast.error("Failed to delete conversion");
        return;
      }
    }
    const newList = [...conversionList];
    newList.splice(index, 1);
    setConversionList(newList);
  };

  // --- MAIN SUBMIT HANDLER ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // ==========================================
    // REQUIRED CONVERSION VALIDATION
    // ==========================================
    const baseUomId = Number(formData.baseUomId);
    const salesUomId = Number(formData.salesUomId);
    const purchaseUomId = Number(formData.purchaseUomId);

    if (!baseUomId) {
      toast.error("Base UOM is required.");
      return;
    }

    // 1. Validate Sales UOM Conversion
    if (salesUomId && salesUomId !== baseUomId) {
      const hasSalesConversion = conversionList.some(
        (c) => c.fromUomId === salesUomId
      );

      if (!hasSalesConversion) {
        const salesUomName =
          unitOfMeasurements.find((u) => u.id === salesUomId)?.code || "Sales";
        const baseUomName =
          unitOfMeasurements.find((u) => u.id === baseUomId)?.code || "Base";

        toast.error(
          `Sales UOM (${salesUomName}) is different from Base UOM (${baseUomName}). Please add a conversion rule in the table.`
        );
        return;
      }
    }

    // 2. Validate Purchase UOM Conversion
    if (purchaseUomId && purchaseUomId !== baseUomId) {
      const hasPurchaseConversion = conversionList.some(
        (c) => c.fromUomId === purchaseUomId
      );

      if (!hasPurchaseConversion) {
        const purchaseUomName =
          unitOfMeasurements.find((u) => u.id === purchaseUomId)?.code ||
          "Purchase";
        const baseUomName =
          unitOfMeasurements.find((u) => u.id === baseUomId)?.code || "Base";

        toast.error(
          `Purchase UOM (${purchaseUomName}) is different from Base UOM (${baseUomName}). Please add a conversion rule in the table.`
        );
        return;
      }
    }

    setIsLoading(true);

    let imageToBeSaved = null;

    if (formData.productImage && typeof formData.productImage !== "string") {
      const base64String = await toBase64(formData.productImage);
      imageToBeSaved = base64String.split(",")[1];
    } else {
      imageToBeSaved = null;
    }

    const productPayload = {
      productName: formData.productName,
      itemCode: formData.itemCode,
      barCode: formData.barCode,
      description: formData.description,
      productImage: imageToBeSaved,
      hasSerial: formData.hasSerial,
      brandId: formData.brandId ? Number(formData.brandId) : null,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      categoryTwoId: formData.categoryTwoId
        ? Number(formData.categoryTwoId)
        : null,
      categoryThreeId: formData.categoryThreeId
        ? Number(formData.categoryThreeId)
        : null,
      categoryFourId: formData.categoryFourId
        ? Number(formData.categoryFourId)
        : null,
      categoryFiveId: formData.categoryFiveId
        ? Number(formData.categoryFiveId)
        : null,
      salesUomId: salesUomId || null,
      purchaseUomId: purchaseUomId || null,
      baseUomId: baseUomId || null,
    };

    try {
      let productId = productToEdit?.id;

      if (productToEdit) {
        await axios.put(
          `${domain}/api/Products/${productToEdit.id}`,
          productPayload
        );
        toast.success("Product updated successfully");
      } else {
        const res = await axios.post(`${domain}/api/Products`, productPayload);
        productId = res.data.id;
        toast.success("Product added successfully");
      }

      const newConversions = conversionList
        .filter((c) => !c.id)
        .map((c) => ({
          productId: productId,
          fromUomId: c.fromUomId,
          toUomId: c.toUomId,
          conversionRate: c.conversionRate,
        }));

      if (newConversions.length > 0) {
        await axios.post(`${domain}/api/UomConversions`, newConversions);
      }

      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">
            {productToEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <IoMdCloseCircle size={32} />
          </button>
        </div>

        {/* --- STEPPER INDICATOR --- */}
        <div className="py-6 px-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-center w-full max-w-2xl mx-auto">
            {/* Step 1 Circle */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                  currentStep >= 1
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 1 ? <IoMdCheckmark /> : "1"}
              </div>
              <span
                className={`text-sm mt-2 font-medium ${
                  currentStep >= 1 ? "text-orange-600" : "text-gray-500"
                }`}
              >
                General Info
              </span>
            </div>

            {/* Connecting Line */}
            <div
              className={`flex-1 h-1 mx-4 rounded ${
                currentStep >= 2 ? "bg-orange-600" : "bg-gray-200"
              }`}
            ></div>

            {/* Step 2 Circle */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                  currentStep >= 2
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm mt-2 font-medium ${
                  currentStep >= 2 ? "text-orange-600" : "text-gray-500"
                }`}
              >
                UOM Rules
              </span>
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {isLoading && <Loader />}

          <form id="productForm" onSubmit={handleFormSubmit}>
            {/* --- STEP 1: GENERAL INFO --- */}
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image Upload */}
                <div className="lg:col-span-1 flex flex-col items-center">
                  <div className="w-full aspect-square max-w-[250px] overflow-hidden rounded-full border-2 border-dashed border-gray-300 relative group bg-gray-50 mb-4">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="object-cover w-full h-full"
                      onError={(e) => (e.target.src = profile)}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium">Change Image</p>
                    </div>
                    <input
                      type="file"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                  </p>
                </div>

                {/* Right Column: Inputs */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Details */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Product Name *
                    </label>
                    <input
                      id="productName"
                      type="text"
                      value={formData.productName}
                      onChange={handleInputChange}
                      className="form-input w-full rounded-md border-gray-300 p-2 border"
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Item Code *
                    </label>
                    <input
                      id="itemCode"
                      type="text"
                      value={formData.itemCode}
                      onChange={handleInputChange}
                      className="form-input w-full rounded-md border-gray-300 p-2 border"
                      required
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Brand
                    </label>
                    <select
                      id="brandId"
                      value={formData.brandId || ""}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 p-2 border"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.brandName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Barcode
                    </label>
                    <input
                      id="barCode"
                      type="text"
                      value={formData.barCode}
                      onChange={handleInputChange}
                      className="form-input w-full rounded-md border-gray-300 p-2 border"
                    />
                  </div>

                  {/* Categories */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <select
                      id="categoryId"
                      value={formData.categoryId || ""}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 p-2 border"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex flex-col ">
                    <span className="text-sm font-medium text-gray-900 mb-3">
                      Has SerialNumber ?
                    </span>

                    <label className="inline-flex items-center cursor-pointer ml-5">
                      <input
                        type="checkbox"
                        checked={formData.hasSerial}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hasSerial: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowExtraCategories(!showExtraCategories)
                      }
                      className="text-blue-600 flex items-center gap-1 text-sm font-semibold"
                    >
                      {showExtraCategories ? (
                        <IoMdArrowUp />
                      ) : (
                        <IoMdArrowDown />
                      )}
                      {showExtraCategories
                        ? "Hide Advanced Categories"
                        : "Show Advanced Categories"}
                    </button>
                    {showExtraCategories && (
                      <div className="grid grid-cols-2 gap-4 mt-3 bg-gray-50 p-4 rounded-md">
                        <select
                          id="categoryTwoId"
                          value={formData.categoryTwoId || ""}
                          onChange={handleInputChange}
                          className="border p-2 rounded"
                        >
                          <option value="">Category Two</option>
                          {categoriesTwo.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.categoryTwoName}
                            </option>
                          ))}
                        </select>
                        <select
                          id="categoryThreeId"
                          value={formData.categoryThreeId || ""}
                          onChange={handleInputChange}
                          className="border p-2 rounded"
                        >
                          <option value="">Category Three</option>
                          {categoriesThree.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.categoryThreeName}
                            </option>
                          ))}
                        </select>
                        <select
                          id="categoryFourId"
                          value={formData.categoryFourId || ""}
                          onChange={handleInputChange}
                          className="border p-2 rounded"
                        >
                          <option value="">Category Four</option>
                          {categoriesFour.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.categoryFourName}
                            </option>
                          ))}
                        </select>
                        <select
                          id="categoryFiveId"
                          value={formData.categoryFiveId || ""}
                          onChange={handleInputChange}
                          className="border p-2 rounded"
                        >
                          <option value="">Category Five</option>
                          {categoriesFive.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.categoryFiveName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {/* Base Units */}
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Base UOM *
                      </label>
                      <select
                        id="baseUomId"
                        value={formData.baseUomId || ""}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 p-2 border"
                        required
                      >
                        <option value="">Select Base Unit</option>
                        {unitOfMeasurements.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Sales UOM
                      </label>
                      <select
                        id="salesUomId"
                        value={formData.salesUomId || ""}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 p-2 border"
                      >
                        <option value="">Select Sales Unit</option>
                        {unitOfMeasurements.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Purchase UOM
                      </label>
                      <select
                        id="purchaseUomId"
                        value={formData.purchaseUomId || ""}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 p-2 border"
                      >
                        <option value="">Select Purchase Unit</option>
                        {unitOfMeasurements.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 p-2 border"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* --- STEP 2: UOM CONVERSIONS --- */}
            <div className={currentStep === 2 ? "block" : "hidden"}>
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Add New Conversion Rule
                </h4>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold uppercase text-gray-500">
                      From Unit
                    </label>
                    <select
                      value={newConversion.fromUomId}
                      onChange={(e) =>
                        setNewConversion({
                          ...newConversion,
                          fromUomId: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Unit</option>
                      {/* 
                         FILTERING LOGIC:
                         Only show units that are currently selected as Sales or Purchase UOM
                         AND are different from the Base UOM.
                      */}
                      {unitOfMeasurements
                        .filter((u) => {
                          const uId = u.id;
                          const bId = Number(formData.baseUomId);
                          const sId = Number(formData.salesUomId);
                          const pId = Number(formData.purchaseUomId);

                          // Check if this unit is Sales UOM and Sales != Base
                          const isSalesNeeded =
                            sId && uId === sId && sId !== bId;

                          // Check if this unit is Purchase UOM and Purchase != Base
                          const isPurchaseNeeded =
                            pId && uId === pId && pId !== bId;

                          return isSalesNeeded || isPurchaseNeeded;
                        })
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            1 {u.code}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold uppercase text-gray-500">
                      To Unit (Base)
                    </label>
                    <select
                      value={newConversion.toUomId}
                      onChange={(e) =>
                        setNewConversion({
                          ...newConversion,
                          toUomId: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Unit</option>
                      {unitOfMeasurements
                        .filter((u) => u.id === Number(formData.baseUomId))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code} (Base)
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold uppercase text-gray-500">
                      Conversion
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={newConversion.conversionRate}
                      onChange={(e) =>
                        setNewConversion({
                          ...newConversion,
                          conversionRate: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded mt-1"
                      placeholder="1.00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddConversion}
                    className="bg-blue-600 text-white p-2.5 rounded hover:bg-blue-700 transition w-full md:w-auto flex items-center justify-center"
                  >
                    <IoMdAdd size={20} />{" "}
                    <span className="md:hidden ml-2">Add</span>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700">
                        Conversion Rule
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {conversionList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="2"
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-lg">No rules defined</span>
                            <span className="text-xs text-gray-400">
                              Add a conversion rule to get started.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      conversionList.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className="group hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 font-medium">
                              {/* From Side */}
                              <div className="flex items-baseline gap-1">
                                <span className="text-gray-500 text-xs uppercase tracking-wide">
                                  1
                                </span>
                                <span className="text-gray-900 px-2 py-1 rounded text-base">
                                  {item.fromUomCode}
                                </span>
                              </div>

                              {/* Arrow Icon */}
                              <IoMdArrowDropright className="text-gray-400" />

                              {/* To Side */}
                              <div className="flex items-baseline gap-1">
                                <span className="text-emerald-600 font-bold">
                                  {item.conversionRate}
                                </span>
                                <span className="text-gray-700">
                                  {item.toUomCode}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveConversion(index, item.id)
                              }
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                              title="Remove Rule"
                            >
                              <IoMdTrash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow transition"
            >
              Next
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                form="productForm"
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition disabled:opacity-50"
              >
                {isLoading
                  ? "Saving..."
                  : productToEdit
                  ? "Update Product"
                  : "Submit Product"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProducts;
