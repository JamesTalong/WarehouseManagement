import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import {
  addToPos,
  increasePosQuantity,
  setExistingLocation,
} from "../../../../redux/IchthusSlice";
import { ImPlus } from "react-icons/im";
import profile from "../../../../Images/profile.jpg";
import { domain } from "../../../../security";

const PaginationPos = ({
  itemsPerPage,
  onPriceRangeChange,
  currentPriceRange,
}) => {
  const [itemOffset, setItemOffset] = useState(0);
  const [pricelists, setPricelists] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [priceType, setPriceType] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // NEW: State to track selected UOM variant for each product row
  const [selectedVariants, setSelectedVariants] = useState({});

  const dispatch = useDispatch();
  const posProducts = useSelector((state) => state.orebiReducer.posProducts);
  const refreshProducts = useSelector(
    (state) => state.orebiReducer.refreshProducts,
  );

  // Redux Filters
  const checkedBrands = useSelector(
    (state) => state.orebiReducer.checkedBrands,
  );
  const checkedCategories = useSelector(
    (state) => state.orebiReducer.checkedCategories,
  );
  const checkedCategoriesTwo = useSelector(
    (state) => state.orebiReducer.checkedCategoriesTwo,
  );
  const checkedCategoriesThree = useSelector(
    (state) => state.orebiReducer.checkedCategoriesThree,
  );
  const checkedCategoriesFour = useSelector(
    (state) => state.orebiReducer.checkedCategoriesFour,
  );
  const checkedCategoriesFive = useSelector(
    (state) => state.orebiReducer.checkedCategoriesFive,
  );

  const openImageModal = (imageUrl) => setSelectedImage(imageUrl);
  const closeImageModal = () => setSelectedImage(null);

  // 1. Fetch Locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${domain}/api/Locations`);
        setLocations(response.data);
      } catch (error) {
        toast.error("Failed to load locations.");
      }
    };
    fetchLocations();
  }, []);

  // 2. Fetch Pricelists
  const fetchPricelists = useCallback(async () => {
    if (!selectedLocationId) {
      setPricelists([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${domain}/api/Products/pos-pricelist-by-location?locationId=${selectedLocationId}`,
      );
      const formattedPricelists = response.data.map((item) => ({
        ...item,
      }));
      setPricelists(formattedPricelists);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch products for this location.");
      setPricelists([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetchPricelists();
  }, [fetchPricelists, refreshProducts]);

  // 3. Price Range Logic
  useEffect(() => {
    if (pricelists.length > 0 && priceType) {
      const prices = pricelists
        .map((item) => item[priceType])
        .filter((price) => typeof price === "number");

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        onPriceRangeChange([
          minPrice,
          minPrice === maxPrice ? maxPrice + 1 : maxPrice,
        ]);
      } else {
        onPriceRangeChange([0, 0]);
      }
    } else {
      onPriceRangeChange([0, 0]);
    }
  }, [pricelists, priceType, onPriceRangeChange]);

  // 4. Restore Settings
  useEffect(() => {
    const savedLocationId = localStorage.getItem("selectedLocationId");
    const savedPriceType = localStorage.getItem("priceType");
    if (savedLocationId) setSelectedLocationId(Number(savedLocationId));
    if (savedPriceType) setPriceType(savedPriceType);
  }, []);

  useEffect(() => {
    setItemOffset(0);
  }, [
    checkedBrands,
    checkedCategories,
    checkedCategoriesTwo,
    checkedCategoriesThree,
    checkedCategoriesFour,
    checkedCategoriesFive,
    selectedLocationId,
    currentPriceRange,
    searchQuery,
  ]);

  const handleLocationChange = (e) => {
    const newLocationId = Number(e.target.value);
    if (posProducts.length > 0) {
      toast.error(
        "Cannot change location while items are in POS. Please clear POS first.",
      );
      return;
    }
    setSelectedLocationId(newLocationId);
    localStorage.setItem("selectedLocationId", newLocationId);
    setSearchQuery("");
    setFilteredProducts([]);
    setSelectedVariants({});
  };

  const handlePriceTypeChange = (e) => {
    const selectedPriceType = e.target.value;
    if (posProducts.length > 0) {
      toast.error(
        "Cannot change price type while items are in POS. Please clear POS first.",
      );
      return;
    }
    setPriceType(selectedPriceType);
    localStorage.setItem("priceType", selectedPriceType);
  };

  // 5. Filtering Logic
  const filteredFlatItems = (
    searchQuery ? filteredProducts : pricelists
  ).filter((item) => {
    const price = item[priceType];
    const priceMatches =
      price >= currentPriceRange[0] && price <= currentPriceRange[1];
    if (!priceMatches) return false;

    const brandMatches =
      checkedBrands.length === 0 ||
      checkedBrands.some((b) => b.id === item.brandId);
    if (!brandMatches) return false;

    const catMatches =
      checkedCategories.length === 0 ||
      checkedCategories.some((c) => c.id === item.categoryId);
    if (!catMatches) return false;
    const catTwoMatches =
      checkedCategoriesTwo.length === 0 ||
      checkedCategoriesTwo.some((c) => c.id === item.categoryTwoId);
    if (!catTwoMatches) return false;
    const catThreeMatches =
      checkedCategoriesThree.length === 0 ||
      checkedCategoriesThree.some((c) => c.id === item.categoryThreeId);
    if (!catThreeMatches) return false;
    const catFourMatches =
      checkedCategoriesFour.length === 0 ||
      checkedCategoriesFour.some((c) => c.id === item.categoryFourId);
    if (!catFourMatches) return false;
    const catFiveMatches =
      checkedCategoriesFive.length === 0 ||
      checkedCategoriesFive.some((c) => c.id === item.categoryFiveId);
    if (!catFiveMatches) return false;

    return true;
  });

  // Group by Product ID
  const groupedProducts = Object.values(
    filteredFlatItems.reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = [];
      }
      acc[item.productId].push(item);
      return acc;
    }, {}),
  );

  const pageCount = Math.ceil(groupedProducts.length / itemsPerPage);
  const currentGroups = groupedProducts.slice(
    itemOffset,
    itemOffset + itemsPerPage,
  );

  const handlePageClick = (event) => {
    const newOffset =
      (event.selected * itemsPerPage) % (groupedProducts.length || 1);
    setItemOffset(newOffset);
  };

  const handleVariantChange = (productId, uniqueId) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: uniqueId,
    }));
  };

  // 6. Add To POS
  const handleAddToPos = useCallback(
    async (item) => {
      if (!priceType) {
        toast.error("Please select a price type before adding items.");
        return;
      }
      try {
        if (posProducts.length === 0) {
          const deleteUrl = `${domain}/api/SerialTemps/by-pricelist/${item.uniqueId}`;
          await axios.delete(deleteUrl).catch(() => {});
        }

        if (posProducts.length > 0) {
          if (item.locationId !== posProducts[0].locationId) {
            toast.error(`You can only add items from the same location.`);
            return;
          }
          if (posProducts[0].vatType && posProducts[0].vatType !== priceType) {
            toast.error(`You can only add items with the same price type.`);
            return;
          }
        }

        const existingItem = posProducts.find(
          (posItem) => posItem.id === item.uniqueId,
        );

        if (existingItem) {
          dispatch(increasePosQuantity({ id: item.uniqueId }));
          return;
        }

        dispatch(
          setExistingLocation({
            id: item.locationId,
            location: item.locationName,
          }),
        );
        dispatch(
          addToPos({
            id: item.uniqueId,
            ItemCode: item.itemCode,

            name: item.productName,
            productId: item.productId,
            quantity: 1,
            location: item.locationName,
            locationId: item.locationId,
            price: item[priceType],
            vatType: priceType,
            hasSerial: item.hasSerial,
            maxQuantity: item.stockCount,
            uom: item.uomName,
            uomId: item.uomId,
            priceTypeLabel: item.priceType,
            conversionRate: item.conversionRate,
          }),
        );
      } catch (error) {
        console.error(error);
        toast.error("An error occurred while adding the item.");
      }
    },
    [posProducts, priceType, dispatch],
  );

  // 7. Search Logic
  const searchInputRef = useRef(null);
  const handleSearchChange = useCallback(
    (e) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (query) {
        const results = pricelists.filter(
          (item) =>
            item.stockCount > 0 &&
            ((item.barCode &&
              item.barCode.toLowerCase().includes(query.toLowerCase())) ||
              (item.itemCode &&
                item.itemCode.toLowerCase().includes(query.toLowerCase())) ||
              (item.productName &&
                item.productName.toLowerCase().includes(query.toLowerCase()))),
        );
        setFilteredProducts(results);
      } else {
        setFilteredProducts([]);
      }
    },
    [pricelists],
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && filteredFlatItems.length > 0) {
      handleAddToPos(filteredFlatItems[0]);
      setSearchQuery("");
      setFilteredProducts([]);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);

  // =========================================================================================
  // HELPER COMPONENT: Render Logic for a Single Product Group
  // =========================================================================================
  const ProductRow = ({ group, isMobile }) => {
    const productId = group[0].productId;
    const selectedId = selectedVariants[productId];
    const activeItem =
      group.find((item) => item.uniqueId === selectedId) || group[0];

    const unsoldCount = activeItem.stockCount;
    const isOutOfStock = unsoldCount <= 0;
    const isPromo = activeItem.priceType === "PROMO";

    const totalBaseInCart = posProducts
      .filter((p) => p.productId === productId)
      .reduce((sum, p) => sum + p.quantity * (p.conversionRate || 1), 0);

    const activeConversion = activeItem.conversionRate || 1;
    const totalBaseStock = activeItem.stockCount * activeConversion;

    const isDisabled =
      isOutOfStock || totalBaseInCart + activeConversion > totalBaseStock;

    const renderUnitSelector = () => {
      if (group.length === 1) {
        return (
          <span className="text-gray-700 font-medium text-xs">
            {activeItem.uomName}
          </span>
        );
      }
      return (
        <select
          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-800 bg-white cursor-pointer"
          value={activeItem.uniqueId}
          onChange={(e) => handleVariantChange(productId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {group.map((variant) => (
            <option key={variant.uniqueId} value={variant.uniqueId}>
              {variant.uomName}
            </option>
          ))}
        </select>
      );
    };

    if (isMobile) {
      return (
        <div
          className={`border border-gray-100 rounded-lg shadow-sm p-2 bg-white ${
            isOutOfStock ? "bg-red-50/50" : ""
          }`}
        >
          <div className="flex gap-2">
            <div className="relative w-14 h-14 flex-shrink-0">
              {isOutOfStock && (
                <p className="absolute -top-1 -left-1 text-white bg-red-600 px-1.5 py-0.5 text-[9px] font-bold rounded shadow-sm z-10">
                  SOLD
                </p>
              )}
              {isPromo && (
                <p className="absolute -bottom-1 -right-1 text-white bg-green-600 px-1.5 py-0.5 text-[9px] font-bold rounded shadow-sm z-10">
                  PROMO
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between min-w-0 flex-grow">
              <div>
                <p className="font-semibold text-xs text-gray-800 truncate leading-tight">
                  {activeItem.productName}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-gray-400 text-[10px] truncate">
                    {activeItem.itemCode}
                  </p>
                  <div className="origin-right scale-95">
                    {renderUnitSelector()}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col">
                  {priceType && activeItem.hasOwnProperty(priceType) ? (
                    <span
                      className={`font-bold text-sm leading-none ${
                        isPromo ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(activeItem[priceType])}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">No Price</span>
                  )}
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isOutOfStock
                        ? "text-red-500 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {isOutOfStock ? "Unavailable" : `${unsoldCount} in stock`}
                  </span>
                </div>

                <button
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs transition-all shadow-sm ${
                    isDisabled
                      ? "bg-gray-200 cursor-not-allowed text-gray-400"
                      : "bg-gray-900 hover:bg-black hover:scale-105 active:scale-95"
                  }`}
                  onClick={() => !isDisabled && handleAddToPos(activeItem)}
                  disabled={isDisabled}
                >
                  <ImPlus />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Desktop Row
    return (
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
          isOutOfStock ? "bg-red-50/30" : ""
        }`}
      >
        <td className="py-3 px-4 text-xs text-left">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-gray-900">
                {activeItem.productName}
              </p>
              <p className="text-gray-400 text-[11px]">{activeItem.itemCode}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-center">
          {renderUnitSelector()}
        </td>
        <td className="py-3 px-4 text-xs text-center">
          <span
            className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide ${
              isPromo
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {activeItem.priceType || "REG"}
          </span>
        </td>
        <td
          className={`py-3 px-4 text-xs text-center font-mono text-gray-600 ${
            priceType === "vatEx" ? "bg-blue-50/50 text-blue-700 font-bold" : ""
          }`}
        >
          {formatCurrency(activeItem.vatEx)}
        </td>
        <td
          className={`py-3 px-4 text-xs text-center font-mono text-gray-600 ${
            priceType === "vatInc"
              ? "bg-blue-50/50 text-blue-700 font-bold"
              : ""
          }`}
        >
          {formatCurrency(activeItem.vatInc)}
        </td>
        <td
          className={`py-3 px-4 text-xs text-center font-mono text-gray-600 ${
            priceType === "reseller"
              ? "bg-blue-50/50 text-blue-700 font-bold"
              : ""
          }`}
        >
          {formatCurrency(activeItem.reseller)}
        </td>
        <td className="py-3 px-4 text-xs text-center">
          {isOutOfStock ? (
            <span className="text-red-500 font-medium text-[11px]">
              Out of Stock
            </span>
          ) : (
            <span className="text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded-full text-[11px]">
              {unsoldCount}
            </span>
          )}
        </td>
        <td className="py-3 px-4 text-xs text-center">
          <button
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100 hover:text-black active:scale-95"
            }`}
            onClick={() => !isDisabled && handleAddToPos(activeItem)}
            disabled={isDisabled}
          >
            <ImPlus size={16} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div>
      {selectedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 z-[100] backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <img
            src={selectedImage}
            alt="Product full view"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">
            Loading products...
          </p>
        </div>
      ) : (
        <div className="p-2 md:p-4">
          <div className="w-full mb-4">
            <input
              ref={searchInputRef}
              type="text"
              className="
      w-full
      pl-10 pr-4
      py-3.5
      text-base
      border border-gray-300
      rounded-lg
      bg-white
      placeholder-gray-400
      focus:outline-none
      focus:ring-1 focus:ring-gray-900
      focus:border-gray-900
      shadow-sm
      transition-all
    "
              placeholder="Search by Barcode, Item Code, or Product..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {!priceType && !selectedLocationId && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3"
              role="alert"
            >
              <div className="text-amber-500 mt-0.5">ℹ️</div>
              <div>
                <p className="font-semibold text-sm text-amber-800">
                  Setup Required
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Please select a price type and location to begin.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              className={`border rounded-md px-3 py-2 text-sm w-full sm:w-auto sm:flex-grow focus:outline-none focus:ring-1 focus:ring-gray-900 transition duration-200 bg-white shadow-sm ${
                !priceType
                  ? "border-amber-300 text-amber-700"
                  : "border-gray-300 text-gray-700"
              }`}
              value={priceType}
              onChange={handlePriceTypeChange}
            >
              <option value="" disabled>
                Select Price Type
              </option>
              <option value="vatEx">VAT Exclusive</option>
              <option value="vatInc">VAT Inclusive</option>
              <option value="reseller">Reseller</option>
              <option value="zeroRated">Zero Rated</option>
            </select>

            <select
              className={`border rounded-md px-3 py-2 text-sm w-full sm:w-auto sm:flex-grow focus:outline-none focus:ring-1 focus:ring-gray-900 transition duration-200 bg-white shadow-sm ${
                !selectedLocationId
                  ? "border-amber-300 text-amber-700"
                  : "border-gray-300 text-gray-700"
              }`}
              value={selectedLocationId}
              onChange={handleLocationChange}
            >
              <option value="" disabled>
                Select Location
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.locationName}
                </option>
              ))}
            </select>
          </div>

          <div>
            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-3">
              {currentGroups.map((group) => (
                <ProductRow
                  key={group[0].productId}
                  group={group}
                  isMobile={true}
                />
              ))}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-left uppercase tracking-wider">
                      Product
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      Type
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      VAT Ex
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      VAT Inc
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      Reseller
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      Stocks
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-600 text-center uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentGroups.map((group) => (
                    <ProductRow
                      key={group[0].productId}
                      group={group}
                      isMobile={false}
                    />
                  ))}
                  {currentGroups.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-12 text-center text-gray-400 text-sm"
                      >
                        {searchQuery
                          ? "No products found matching your search."
                          : "No products available."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center md:justify-end items-center py-4 mt-2">
            <ReactPaginate
              forcePage={pageCount > 0 ? itemOffset / itemsPerPage : -1}
              nextLabel=">"
              previousLabel="<"
              onPageChange={handlePageClick}
              pageRangeDisplayed={2}
              marginPagesDisplayed={1}
              pageCount={pageCount}
              pageLinkClassName="w-8 h-8 text-xs font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-md flex justify-center items-center transition-all text-gray-600"
              pageClassName="mx-1"
              previousLinkClassName="w-8 h-8 border border-gray-200 hover:bg-gray-50 rounded-md flex justify-center items-center text-gray-500 text-xs"
              nextLinkClassName="w-8 h-8 border border-gray-200 hover:bg-gray-50 rounded-md flex justify-center items-center text-gray-500 text-xs"
              containerClassName="flex items-center"
              activeLinkClassName="!bg-gray-900 !text-white !border-gray-900 shadow-sm"
              disabledLinkClassName="opacity-40 cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginationPos;
