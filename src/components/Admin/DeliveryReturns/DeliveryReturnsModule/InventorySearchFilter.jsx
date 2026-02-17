import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Package, Loader2 } from "lucide-react"; // Added Loader2

const InventorySearchFilter = ({
  data,
  inventoryMap,
  onSelect,
  disabled,
  placeholder,
  isLoading, // New prop for loading state
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const wrapperRef = useRef(null);

  const filteredData = useMemo(() => {
    if (disabled || !data || isLoading) return [];

    // Only show items with stock > 0
    const availableItems = data.filter((p) => {
      const stockInfo = inventoryMap[p.id];
      return stockInfo && stockInfo.qty > 0;
    });

    if (!searchTerm.trim()) return availableItems;

    const lowerTerm = searchTerm.toLowerCase();
    return availableItems.filter(
      (p) =>
        p.productName.toLowerCase().includes(lowerTerm) ||
        (p.itemCode && p.itemCode.toLowerCase().includes(lowerTerm)),
    );
  }, [data, inventoryMap, searchTerm, disabled, isLoading]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelectItem = (item) => {
    onSelect(item);
    setSearchTerm("");
    setIsSearchActive(false);
  };

  // 1. Loading State Display
  if (isLoading) {
    return (
      <div className="w-full animate-pulse">
        <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 w-full bg-gray-100 border border-gray-200 rounded-lg flex items-center px-3">
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin mr-2" />
          <div className="h-3 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
        Select New Product
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search
            className={`h-4 w-4 ${disabled ? "text-gray-300" : "text-gray-400"}`}
          />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          disabled={disabled}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchActive(true)}
          className={`w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none transition-all ${
            disabled
              ? "bg-gray-100 border-gray-200 cursor-not-allowed"
              : "border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          }`}
        />
        {searchTerm && !disabled && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* 2. Z-INDEX FIX: Added z-[100] to ensure it sits above modal overlays */}
        {isSearchActive && !disabled && (
          <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
            {filteredData.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {filteredData.map((p) => {
                  const stockInfo = inventoryMap[p.id];
                  return (
                    <li
                      key={p.id}
                      onClick={() => handleSelectItem(p)}
                      className="flex justify-between items-center px-4 py-3 text-sm text-gray-800 hover:bg-emerald-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-100 rounded text-gray-500">
                          <Package size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">
                            {p.productName}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {p.itemCode}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {stockInfo?.qty} {stockInfo?.uom}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-xs text-gray-500 text-center">
                No available items found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySearchFilter;
