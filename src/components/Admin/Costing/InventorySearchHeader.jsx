import React, { useEffect, useMemo } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";

const InventorySearchHeader = ({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  locations,
}) => {
  // Logic: Specific locations first, "All" last
  const sortedLocations = useMemo(() => {
    // Ensure locations is an array to prevent errors
    const safeLocations = Array.isArray(locations) ? locations : [];
    const specific = safeLocations.filter((l) => l !== "All" && l !== "");
    return [...specific, "All"];
  }, [locations]);

  // Auto-select first location if "All" is default (optional)
  useEffect(() => {
    const safeLocations = Array.isArray(locations) ? locations : [];
    const specific = safeLocations.filter((l) => l !== "All" && l !== "");

    // Only auto-select if we have specific locations and current selection is "All"
    if (specific.length > 0 && selectedLocation === "All") {
      onLocationChange(specific[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  return (
    <div className="mb-6 p-4 bg-white shadow-md rounded-lg border border-gray-100">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
            Search Product
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, code, or brand..."
              className="pl-10 p-2.5 block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="w-full sm:w-72">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
            Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMapMarkerAlt className="text-gray-400" />
            </div>
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="pl-10 p-2.5 block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-colors"
            >
              {sortedLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "All" ? "All Locations" : loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySearchHeader;
