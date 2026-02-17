import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  toggleCategory,
  toggleBrand,
  toggleCategoryTwo,
  toggleCategoryThree,
  toggleCategoryFour,
  toggleCategoryFive,
  setSelectedCustomer,
} from "../../../../redux/IchthusSlice";
import PaginationPos from "./PaginationPos";
import ProductPos from "./ProductPos";
import SearchableFilter from "./SearchableFilter";
import CustomerDisplay from "./CustomerDisplay";
import FormInputs from "./FormInputs";
import { domain } from "../../../../security";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  X,
  User,
  Search,
  Filter,
  Users,
} from "lucide-react";
import { Range } from "react-range";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const AllPos = () => {
  const dispatch = useDispatch();

  // UI States
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isFilterSectionVisible, setIsFilterSectionVisible] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Filter States
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [currentRange, setCurrentRange] = useState([0, 0]);

  // Redux
  const posProducts = useSelector((state) => state.orebiReducer.posProducts);
  const selectedCustomer = useSelector(
    (state) => state.orebiReducer.selectedCustomer
  );

  // Customer Logic
  const [refreshCustomerData, setRefreshCustomerData] = useState(
    () => () => {}
  );

  const handleCustomerSelect = (customer) => {
    const customerData = {
      customerId: customer?.id,
      customerName: customer?.customerName,
      address: customer?.address,
      businessStyle: customer?.businessStyle,
      customerType: customer?.customerType,
      mobileNumber: customer?.mobileNumber,
      rfid: customer?.rfid,
      tinNumber: customer?.tinNumber,
      ewt: customer?.ewt,
    };
    dispatch(setSelectedCustomer(customerData));
  };

  const handleSaveCustomerForm = async () => {
    if (!selectedCustomer || !selectedCustomer.customerId) {
      alert("No customer selected to save.");
      return;
    }
    try {
      await axios.delete(`${domain}/api/CustomerTemps/delete-all`, {
        headers: { "Content-Type": "application/json" },
      });
      const response = await axios.post(
        `${domain}/api/CustomerTemps`,
        selectedCustomer,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        refreshCustomerData();
        alert("Customer saved successfully!");
        setIsCustomerModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer. Please try again.");
    }
  };

  const handlePriceRangeChange = useCallback((newRange) => {
    setPriceRange(newRange);
    setCurrentRange(newRange);
  }, []);

  // Calculate total items for badge
  const totalItems = posProducts.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen font-sans pb-32 ">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">
              POS Terminal
            </h1>
          </div>

          <div className="flex-1"></div>

          <div className="text-sm text-gray-500 font-medium">
            {/* Optional info */}
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- CUSTOMER SECTION (Thinner) --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 transition-all duration-300 relative z-20">
          <div className="p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Title Section */}
            <div className="flex items-center gap-3 text-gray-800 w-full md:w-auto min-w-0">
              <div className="text-indigo-600">
                <Users size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate">Customer</span>
              </div>
            </div>

            {/* Selection Area */}
            <div className="flex items-center gap-2 w-full md:max-w-xl border border-gray-100 rounded-md p-1">
              <div className="flex-1 min-w-0">
                <CustomerDisplay
                  onRefresh={(refreshFunc) =>
                    setRefreshCustomerData(() => refreshFunc)
                  }
                />
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex-shrink-0 bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <User size={14} />
                <span>{selectedCustomer ? "Edit" : "Select"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- PRODUCT GRID & FILTERS --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-800">
              <Search size={18} className="text-gray-400" />
              <span className="font-semibold text-sm">Product Catalog</span>
            </div>
            <button
              onClick={() => setIsFilterSectionVisible(!isFilterSectionVisible)}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded transition-all border ${
                isFilterSectionVisible
                  ? "bg-gray-800 border-gray-800 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter size={14} />
              {isFilterSectionVisible ? "Hide" : "Filter"}
            </button>
          </div>

          {/* Filter Drawer */}
          <div
            className={`bg-white transition-all duration-300 ease-in-out border-b border-gray-100 ${
              isFilterSectionVisible
                ? "max-h-[1000px] opacity-100 p-4 overflow-visible"
                : "max-h-0 opacity-0 p-0 overflow-hidden"
            }`}
          >
            {/* Reduced gap from 6 to 3 for compact look */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
              <SearchableFilter
                title="Category"
                apiEndpoint="/api/Categories"
                dataKey="categoryName"
                placeholder="Category..."
                reduxSelector={(state) => state.orebiReducer.checkedCategories}
                toggleAction={toggleCategory}
              />
              <SearchableFilter
                title="Brand"
                apiEndpoint="/api/Brands"
                dataKey="brandName"
                placeholder="Brand..."
                reduxSelector={(state) => state.orebiReducer.checkedBrands}
                toggleAction={toggleBrand}
              />
              <SearchableFilter
                title="Sub Category"
                apiEndpoint="/api/CategoriesTwo"
                dataKey="categoryTwoName"
                placeholder="Sub-cat..."
                reduxSelector={(state) =>
                  state.orebiReducer.checkedCategoriesTwo
                }
                toggleAction={toggleCategoryTwo}
              />
            </div>

            <div className="mt-4 pt-2">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="mx-auto flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
              >
                {showMoreFilters ? "Less Options" : "More Options"}
                {showMoreFilters ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </button>

              {showMoreFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fadeIn relative z-0">
                  <SearchableFilter
                    title="Level 3"
                    apiEndpoint="/api/CategoriesThree"
                    dataKey="categoryThreeName"
                    placeholder="Search..."
                    reduxSelector={(state) =>
                      state.orebiReducer.checkedCategoriesThree
                    }
                    toggleAction={toggleCategoryThree}
                  />
                  <SearchableFilter
                    title="Level 4"
                    apiEndpoint="/api/CategoriesFour"
                    dataKey="categoryFourName"
                    placeholder="Search..."
                    reduxSelector={(state) =>
                      state.orebiReducer.checkedCategoriesFour
                    }
                    toggleAction={toggleCategoryFour}
                  />
                  <SearchableFilter
                    title="Level 5"
                    apiEndpoint="/api/CategoriesFive"
                    dataKey="categoryFiveName"
                    placeholder="Search..."
                    reduxSelector={(state) =>
                      state.orebiReducer.checkedCategoriesFive
                    }
                    toggleAction={toggleCategoryFive}
                  />

                  {priceRange[0] < priceRange[1] && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-2 px-1 mt-2">
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-xs font-bold text-gray-700">
                          Price Range
                        </label>
                        <div className="text-xs font-mono text-gray-500">
                          {formatCurrency(currentRange[0])} -{" "}
                          {formatCurrency(currentRange[1])}
                        </div>
                      </div>
                      <div className="px-1">
                        <Range
                          step={1}
                          min={priceRange[0]}
                          max={priceRange[1]}
                          values={currentRange}
                          onChange={setCurrentRange}
                          renderTrack={({ props, children }) => (
                            <div
                              {...props}
                              // Made track thinner (4px)
                              style={{ ...props.style, height: "4px" }}
                              className="w-full rounded-full bg-gray-200"
                            >
                              <div
                                style={{
                                  height: "4px",
                                  width: `${
                                    ((currentRange[1] - currentRange[0]) /
                                      (priceRange[1] - priceRange[0])) *
                                    100
                                  }%`,
                                  marginLeft: `${
                                    ((currentRange[0] - priceRange[0]) /
                                      (priceRange[1] - priceRange[0])) *
                                    100
                                  }%`,
                                }}
                                className="bg-gray-800 rounded-full"
                              />
                              {children}
                            </div>
                          )}
                          renderThumb={({ props }) => (
                            <div
                              {...props}
                              style={{ ...props.style }}
                              // Made thumb smaller and cleaner
                              className="h-4 w-4 bg-white border border-gray-400 rounded-full shadow-sm focus:outline-none cursor-pointer hover:border-black hover:scale-110 transition-transform"
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow">
            <PaginationPos
              itemsPerPage={12}
              onPriceRangeChange={handlePriceRangeChange}
              currentPriceRange={currentRange}
            />
          </div>
        </div>
      </main>

      {/* --- CUSTOMER MODAL --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-lg text-gray-800">
                Customer Details
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <FormInputs
                onCustomerSelect={handleCustomerSelect}
                onSave={handleSaveCustomerForm}
                onCancel={() => setIsCustomerModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING CHECKOUT BUTTON --- */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCheckoutModalOpen(true)}
          className="group relative flex items-center gap-3 bg-gray-900 text-white pl-5 pr-6 py-3 rounded-full shadow-lg shadow-gray-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          <div className="relative">
            <div className="bg-gray-800 p-1.5 rounded-full group-hover:bg-gray-700 transition-colors">
              <ShoppingCart size={20} className="text-white" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-gray-900">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              Total
            </span>
            <span className="font-bold text-sm leading-none">Checkout</span>
          </div>
        </button>
      </div>

      {/* --- CHECKOUT MODAL --- */}
      {isCheckoutModalOpen && (
        <ProductPos
          isCheckoutView={true}
          onBackToProducts={() => setIsCheckoutModalOpen(false)}
          hideCustomerEdit={true}
        />
      )}
    </div>
  );
};

export default AllPos;
