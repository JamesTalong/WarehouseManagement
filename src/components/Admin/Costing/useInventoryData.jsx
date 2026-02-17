import React, { useCallback, useEffect, useState } from "react";
import { domain } from "../../../security";
import axios from "axios";
import { toast } from "react-toastify";
import { PRICE_TYPES } from "./Constant";

const useInventoryData = () => {
  const [pricelists, setPricelists] = useState([]);
  const [filteredPricelists, setFilteredPricelists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locations, setLocations] = useState(["All"]);
  const [priceType, setPriceType] = useState(PRICE_TYPES.vatEx.key);

  const fetchPricelists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${domain}/api/products/pos-pricelist`);

      const formattedPricelists = response.data.map((item) => ({
        ...item,
        product: item.productName,
        location: item.locationName,
        unsoldCount: item.stockCount || 0,
        brand: item.brandName || "",
        itemCode: item.itemCode || "",
        barCode: item.barCode || "",
        minStock: item.minStock || 0,
        maxStock: item.maxStock || 0,
      }));

      setPricelists(formattedPricelists);

      const uniqueLocations = [
        "All",
        ...new Set(
          formattedPricelists.map((item) => item.location).filter(Boolean),
        ),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricelists();
  }, [fetchPricelists]);

  useEffect(() => {
    let filtered = [...pricelists];

    if (selectedLocation !== "All") {
      filtered = filtered.filter(
        (pricelist) => pricelist.location === selectedLocation,
      );
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((pricelist) =>
        ["product", "location", "brand", "itemCode", "barCode"].some((key) => {
          const value = pricelist[key];
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowercasedQuery);
          }
          if (
            key === "brand" &&
            typeof value === "object" &&
            value?.brandName
          ) {
            return value.brandName.toLowerCase().includes(lowercasedQuery);
          }
          return false;
        }),
      );
    }
    setFilteredPricelists(filtered);
  }, [searchQuery, selectedLocation, pricelists]);

  return {
    pricelists,
    filteredPricelists,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    setSelectedLocation,
    locations,
    priceType,
    setPriceType,
    refreshData: fetchPricelists, // <--- ADD THIS LINE (expose the function)
  };
};

export default useInventoryData;
