import React, { useState, useEffect, useMemo } from "react";
import Pagination from "../../Pagination";
import Loader from "../../../loader/Loader";
import useInventoryData from "../../Costing/useInventoryData";
// Removed InventoryFilters import
import InventorySearchHeader from "../../Costing/InventorySearchHeader";
import ViewModal from "./ViewModal";

// --- Constants ---
const ITEMS_PER_PAGE = 8;

const AllInventory = () => {
  const {
    pricelists,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    setSelectedLocation,
    locations,
    // Removed priceType/setPriceType as they are no longer in the UI
  } = useInventoryData();

  const [currentPage, setCurrentPage] = useState(1);

  // Kept logic variable but removed setter from UI. Defaults to 'all'.
  // eslint-disable-next-line
  const [stockFilter, setStockFilter] = useState("all");

  // --- Filtering Logic ---
  const filteredFlatList = useMemo(() => {
    let tempItems = pricelists;

    // Filter by Location
    if (selectedLocation && selectedLocation !== "All") {
      tempItems = tempItems.filter(
        (item) =>
          (item.location || item.locationName)?.trim().toLowerCase() ===
          selectedLocation.trim().toLowerCase()
      );
    }

    // Filter by Search Query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery?.toLowerCase();
      tempItems = tempItems?.filter(
        (item) =>
          (item.product || item.productName)
            ?.toLowerCase()
            ?.includes(lowerCaseQuery) ||
          item.itemCode?.toLowerCase()?.includes(lowerCaseQuery) ||
          (typeof (item.brand || item.brandName) === "string" &&
            (item.brand || item.brandName)
              .toLowerCase()
              .includes(lowerCaseQuery))
      );
    }

    // Filter by Stock Status (Logic preserved for future use, but currently static 'all')
    if (stockFilter === "outOfStock") {
      tempItems = tempItems.filter((item) => item.unsoldCount === 0);
    } else if (stockFilter === "withStock") {
      tempItems = tempItems.filter((item) => item.unsoldCount > 0);
    }

    return tempItems;
  }, [pricelists, searchQuery, selectedLocation, stockFilter]);

  // --- Grouping Logic (Product + Location) ---
  const groupedPricelists = useMemo(() => {
    const groups = {};

    filteredFlatList.forEach((item) => {
      // Handle potential API field naming variations
      const prodId = item.productId;
      const loc = item.location || item.locationName || item.locationId;

      const groupKey = `${prodId}-${loc}`;
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

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const currentData = useMemo(
    () => groupedPricelists.slice(indexOfFirstItem, indexOfLastItem),
    [groupedPricelists, indexOfFirstItem, indexOfLastItem]
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, stockFilter]);

  // Handler for row clicks (optional)
  const handleRowClick = (productItem) => {
    console.log("Selected Item:", productItem);
    // You can add logic here to open a details modal or navigate
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 min-h-screen">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          All Inventory
        </h1>
        <p className="text-slate-600 mt-1">Full inventory stock overview.</p>
      </header>

      {/* --- NEW SEARCH HEADER (Replaces InventoryFilters) --- */}
      <InventorySearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        locations={locations}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : (
        <>
          {currentData.length > 0 ? (
            <>
              {/* Renders the ViewModal (Table) */}
              <ViewModal
                groupedData={currentData}
                onRowClick={handleRowClick}
              />

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
            <div className="text-center py-10 bg-white shadow-md rounded-lg">
              <p className="mt-4 text-xl font-semibold text-gray-700">
                No inventory found.
              </p>
              <p className="text-gray-500">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllInventory;
