import React, { useState } from "react";
import DashboardStatsGrid from "./DashboardModules/DashboardStatsGrid";
import StockDemandChart from "./DashboardModules/StockDemandChart";
import RecentOrders from "./DashboardModules/RecentOrders";
import LocationPieChart from "./DashboardModules/LocationPieChart";
import PopularProducts from "./DashboardModules/PopularProducts";
import DashboardFilter from "./DashboardModules/DashboardFilter";

export default function Dashboard() {
  const [sourceType, setSourceType] = useState("Transactions");
  const [selectedLocation, setSelectedLocation] = useState("All");

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Global Filter */}
      <DashboardFilter
        sourceType={sourceType}
        setSourceType={setSourceType}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />

      {/* 2. Stats Grid */}
      <DashboardStatsGrid
        sourceType={sourceType}
        selectedLocation={selectedLocation}
      />

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
        {/* Main Chart (Left) */}
        <StockDemandChart
          className="lg:col-span-4 flex flex-col"
          sourceType={sourceType}
          selectedLocation={selectedLocation}
        />

        {/* Pie Chart (Right) - Wrapper handles height via h-full */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
          <LocationPieChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full h-full">
        <div className="lg:col-span-4 flex flex-col h-full">
          <RecentOrders />
        </div>
        <div className="flex flex-col h-full">
          <PopularProducts />
        </div>
      </div>
    </div>
  );
}
