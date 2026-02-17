import React, { useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import axios from "axios";
import { IoStatsChart, IoCalendar, IoChevronDown } from "react-icons/io5"; // Added Icons
import { domain } from "../../../../security";

export default function StockDemandChart({
  sourceType,
  selectedLocation,
  className,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- NEW DATE STATES ---
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = All Months

  // Generate Year Options (Last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Month Options
  const months = [
    { value: 0, label: "All Months" },
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("sourceType", sourceType);
        params.append("locationId", selectedLocation);

        // --- APPEND NEW FILTERS ---
        params.append("year", selectedYear);
        if (selectedMonth > 0) {
          params.append("month", selectedMonth);
        }

        const response = await axios.get(
          `${domain}/api/Dashboard/stock-vs-demand`,
          { params }
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching stock vs demand:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sourceType, selectedLocation, selectedYear, selectedMonth]); // Add dependencies

  return (
    <div
      className={`flex flex-col h-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in ${className}`}
    >
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <IoStatsChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Stock vs Demand
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Top 10 Items
            </p>
          </div>
        </div>

        {/* --- DATE FILTERS --- */}
        <div className="flex items-center gap-2">
          <IoCalendar className="text-slate-400 hidden sm:block" />

          {/* MONTH SELECT */}
          <div className="relative group">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>

          {/* YEAR SELECT */}
          <div className="relative group">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="h-[400px] w-full relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {data.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>No data available for this period.</p>
          </div>
        ) : (
          <ResponsiveBar
            data={data}
            keys={["demand", "stock"]}
            indexBy="productName"
            margin={{ top: 20, right: 130, bottom: 60, left: 60 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={({ id }) => (id === "demand" ? "#6366f1" : "#10b981")}
            borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -15,
              legend: "Product",
              legendPosition: "middle",
              legendOffset: 50,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Quantity",
              legendPosition: "middle",
              legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
            role="application"
            ariaLabel="Stock vs Demand Bar Chart"
            tooltip={({ id, value, color }) => (
              <div
                style={{
                  padding: 12,
                  color: "#fff",
                  background: "#222222",
                  borderRadius: 4,
                }}
              >
                <strong>
                  {id === "demand" ? "Demand" : "Stock"}: {value}
                </strong>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
