import React, { useEffect, useState, useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import axios from "axios";
import { IoStatsChart, IoCalendar, IoChevronDown } from "react-icons/io5";
import { domain } from "../../../../security";

export default function TransactionChart({
  sourceType,
  selectedLocation,
  className,
}) {
  // --- States ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep Year state local as it is specific to this chart
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Fetch Chart Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("sourceType", sourceType);
        params.append("year", selectedYear);
        if (selectedLocation && selectedLocation !== "All") {
          params.append("locationId", selectedLocation);
        }

        const response = await axios.get(
          `${domain}/api/Dashboard/popular-products-monthly`,
          { params }
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sourceType, selectedLocation, selectedYear]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const monthMap = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.productName]) {
        grouped[item.productName] = Array(12)
          .fill(0)
          .map((_, i) => ({ x: monthMap[i], y: 0 }));
      }
      const monthIndex = item.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        grouped[item.productName][monthIndex].y = item.totalQuantity;
      }
    });

    return Object.keys(grouped).map((productName) => ({
      id: productName,
      data: grouped[productName],
    }));
  }, [data]);

  return (
    <div
      className={`flex flex-col h-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in ${className}`}
    >
      {/* --- HEADER --- */}
      <div className="flex flex-row justify-between items-center mb-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <IoStatsChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Product Trends</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Top 5 Items
            </p>
          </div>
        </div>

        {/* Styled Year Selector (Matches DashboardFilter) */}
        <div className="flex items-center gap-2">
          <IoCalendar className="text-slate-400 hidden sm:block" />
          <div className="relative group">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-28 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* --- CHART --- */}
      <div className="h-[400px] w-full relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {chartData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <IoStatsChart className="w-12 h-12 mb-2 opacity-20" />
            <p>No data available for this selection.</p>
          </div>
        ) : (
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
            }}
            axisBottom={{
              tickSize: 0,
              tickPadding: 15,
              legend: "Month",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 15,
              legend: "Qty",
              legendOffset: -40,
              legendPosition: "middle",
            }}
            enableGridX={false}
            gridYValues={5}
            colors={{ scheme: "category10" }}
            lineWidth={3}
            pointSize={8}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            useMesh={true}
            theme={{
              axis: { ticks: { text: { fill: "#64748b", fontSize: 11 } } },
              grid: { line: { stroke: "#f1f5f9" } },
            }}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: "circle",
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
