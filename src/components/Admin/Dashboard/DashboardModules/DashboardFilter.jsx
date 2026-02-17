import React, { useEffect, useState } from "react";
import { IoFilter, IoChevronDown } from "react-icons/io5";
import axios from "axios";
import { domain } from "../../../../security";

export default function DashboardFilter({
  sourceType,
  setSourceType,
  selectedLocation,
  setSelectedLocation,
}) {
  const [locations, setLocations] = useState([]);

  // Fetch Locations only once for the dropdown
  useEffect(() => {
    axios
      .get(`${domain}/api/Dashboard/locations`)
      .then((res) => setLocations(res.data))
      .catch((err) => console.error("Err loading locations", err));
  }, []);

  return (
    <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between z-10 animate-fade-in">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <IoFilter className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg tracking-tight text-slate-800">
            Performance Overview
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Real-time Analytics
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        {/* Custom Select: Source */}
        <div className="relative group">
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="appearance-none bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-48 transition-all cursor-pointer hover:bg-slate-100 font-medium"
          >
            <option value="Transactions">POS Transactions</option>
            <option value="DeliveryOrders">Delivery Orders</option>
          </select>
          <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
        </div>

        {/* Custom Select: Location */}
        <div className="relative group">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="appearance-none bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 w-full sm:w-48 transition-all cursor-pointer hover:bg-slate-100 font-medium"
          >
            <option value="All">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.locationName}
              </option>
            ))}
          </select>
          <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </div>
  );
}
