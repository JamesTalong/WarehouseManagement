import { useState, useEffect, useMemo } from "react";
import Pagination from "../Pagination";
import Loader from "../../loader/Loader";
import useInventoryData from "./useInventoryData";
import SummaryCard from "./SummaryCard";
import MobileSummaryCards from "./MobileSummaryCards";
import InventoryFilters from "./InventoryFilters";
import InventoryTable from "./InventoryTable";
import InventoryStockTable from "./InventoryStockTable";
import InventoryComparisonTable from "./InventoryComparisonTable";
import ItemComparisonTable from "./ItemComparisonTable";
import ProductHistoryModal from "./ProductHistoryModal";
import {
  formatPrice,
  LocationIcon,
  OutOfStockIcon,
  PRICE_TYPES,
  ProductIcon,
  ValueIcon,
} from "./Constant";
import InventoryThresholdModal from "./InventoryThresholdModal";

// --- Constants ---
const ITEMS_PER_PAGE = 8;

const formatForMobile = (value) => {
  if (value >= 1_000_000_000_000)
    return (value / 1_000_000_000_000).toFixed(1) + "T";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
  return value.toString();
};

const formatCurrencyForMobile = (value) => {
  if (value >= 1_000_000_000_000)
    return (value / 1_000_000_000_000).toFixed(1) + "T";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
  return value.toFixed(2);
};

const InventoryCost = () => {
  const {
    pricelists,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    setSelectedLocation,
    locations,
    priceType,
    setPriceType,
    refreshData,
  } = useInventoryData();

  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

  // Default viewMode
  const [viewMode, setViewMode] = useState("stock");

  const [selectedProductHistory, setSelectedProductHistory] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [selectedProductThreshold, setSelectedProductThreshold] =
    useState(null);

  // NEW HANDLER
  const handleOpenThresholdModal = (item) => {
    setSelectedProductThreshold(item);
    setIsThresholdModalOpen(true);
  };

  const handleProductClick = (productItem) => {
    setSelectedProductHistory(productItem);
    setIsHistoryModalOpen(true);
  };

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // --- Filtering Logic ---
  const filteredFlatList = useMemo(() => {
    let tempItems = pricelists;

    if (selectedLocation && selectedLocation !== "All") {
      tempItems = tempItems.filter(
        (item) =>
          item.location?.trim().toLowerCase() ===
          selectedLocation.trim().toLowerCase(),
      );
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery?.toLowerCase();
      tempItems = tempItems?.filter(
        (item) =>
          item.product?.toLowerCase()?.includes(lowerCaseQuery) ||
          item.itemCode?.toLowerCase()?.includes(lowerCaseQuery) ||
          (typeof item.brand === "string" &&
            item.brand.toLowerCase().includes(lowerCaseQuery)),
      );
    }

    if (stockFilter === "outOfStock") {
      tempItems = tempItems.filter((item) => item.unsoldCount === 0);
    } else if (stockFilter === "withStock") {
      tempItems = tempItems.filter((item) => item.unsoldCount > 0);
    }

    return tempItems;
  }, [pricelists, searchQuery, selectedLocation, stockFilter]);

  // --- Grouping Logic ---
  const groupedPricelists = useMemo(() => {
    const groups = {};

    filteredFlatList.forEach((item) => {
      const groupKey = `${item.productId}-${item.location}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          mainInfo: item,
          variants: [],
        };
      }
      groups[groupKey].variants.push(item);
    });

    return Object.values(groups);
  }, [filteredFlatList]);

  // --- Pagination ---
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const currentData = useMemo(
    () => groupedPricelists.slice(indexOfFirstItem, indexOfLastItem),
    [groupedPricelists, indexOfFirstItem, indexOfLastItem],
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, priceType, stockFilter, viewMode]);

  // --- Totals Calculations ---
  const totalInventoryValue = useMemo(() => {
    return filteredFlatList.reduce((sum, item) => {
      const price = parseFloat(item[priceType]) || 0;
      return sum + price * item.unsoldCount;
    }, 0);
  }, [filteredFlatList, priceType]);

  const totalUniqueProducts = useMemo(() => {
    return new Set(filteredFlatList.map((p) => p.product)).size;
  }, [filteredFlatList]);

  const itemsOutOfStock = useMemo(() => {
    return filteredFlatList.filter((item) => item.unsoldCount === 0).length;
  }, [filteredFlatList]);

  const activeLocationsCount = useMemo(() => {
    return locations.length > 1 ? locations.length - 1 : 0;
  }, [locations]);

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 min-h-screen">
      <header className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
          Inventory Dashboard 📊
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Manage and analyze your inventory costs and stock levels.
        </p>
      </header>

      {/* Summary Cards */}
      {isMobile ? (
        <MobileSummaryCards
          totalInventoryValue={totalInventoryValue}
          totalUniqueProducts={totalUniqueProducts}
          activeLocationsCount={activeLocationsCount}
          itemsOutOfStock={itemsOutOfStock}
          priceType={priceType}
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <SummaryCard
            title={`Total Value (${PRICE_TYPES[priceType]?.label})`}
            value={formatPrice(totalInventoryValue)}
            mobileValue={formatCurrencyForMobile(totalInventoryValue)}
            icon={<ValueIcon />}
          />
          <SummaryCard
            title="Unique Products"
            value={totalUniqueProducts.toLocaleString()}
            mobileValue={formatForMobile(totalUniqueProducts)}
            icon={<ProductIcon />}
          />
          <SummaryCard
            title="Active Locations"
            value={activeLocationsCount.toLocaleString()}
            mobileValue={formatForMobile(activeLocationsCount)}
            icon={<LocationIcon />}
          />
          <SummaryCard
            title="Out of Stock (Variants)"
            value={itemsOutOfStock.toLocaleString()}
            mobileValue={formatForMobile(itemsOutOfStock)}
            icon={<OutOfStockIcon />}
            bgColor={itemsOutOfStock > 0 ? "bg-red-50" : "bg-white"}
          />
        </div>
      )}

      {/* Filters */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        locations={locations}
        selectedPriceType={priceType}
        onPriceTypeChange={setPriceType}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
      />

      {/* View Switcher Dropdown */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-slate-600">
            View Mode:
          </label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm border bg-white"
          >
            <option value="stock">Stock Overview</option>
            <option value="table">Detailed Pricing</option>
            <option value="comparison">Price Comparison</option>
            {/* 2. Added New Option Here */}
            <option value="ItemComparisonTable">Items Comparison</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : (
        <>
          {/* RENDER LOGIC */}

          {/* 3. Logic for New Table */}
          {viewMode === "ItemComparisonTable" ? (
            <div className="overflow-x-auto">
              {currentData.length > 0 ? (
                <ItemComparisonTable
                  groupedData={currentData}
                  onRowClick={handleProductClick}
                  onSetThreshold={handleOpenThresholdModal} // Pass the handler
                />
              ) : (
                <EmptyState />
              )}
            </div>
          ) : viewMode === "comparison" ? (
            <div className="overflow-x-auto">
              {filteredFlatList.length > 0 ? (
                <InventoryComparisonTable
                  groupedData={currentData}
                  priceType={priceType}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          ) : currentData.length > 0 ? (
            <>
              {viewMode === "table" ? (
                <InventoryTable
                  groupedData={currentData}
                  priceType={priceType}
                  onRowClick={handleProductClick}
                />
              ) : (
                <InventoryStockTable
                  groupedData={currentData}
                  onRowClick={handleProductClick}
                />
              )}

              <div className="mt-6 flex justify-center">
                <Pagination
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={groupedPricelists.length}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </>
      )}

      {/* History Modal */}
      <ProductHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        product={selectedProductHistory}
      />

      <InventoryThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        product={selectedProductThreshold}
        onSuccess={refreshData} // This triggers a re-fetch of the data to show updated warnings
      />
    </div>
  );
};

// Helper component for empty results
const EmptyState = () => (
  <div className="text-center py-10 bg-white shadow-md rounded-lg">
    <p className="mt-4 text-xl font-semibold text-gray-700">
      No products found.
    </p>
    <p className="text-gray-500">
      Try adjusting your search or filter criteria.
    </p>
  </div>
);

export default InventoryCost;
