import React, { useEffect, useState } from "react";
import { IoBagHandle, IoPeople, IoCart } from "react-icons/io5";
import axios from "axios";
import { domain } from "../../../../security";

// Receive props from Parent
export default function DashboardStatsGrid({ sourceType, selectedLocation }) {
  const [stats, setStats] = useState({
    totalSales: 0,
    salesThisMonth: 0,
    ordersThisMonth: 0,
  });

  // Fetch Stats whenever props change
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        params.append("sourceType", sourceType);
        if (selectedLocation && selectedLocation !== "All") {
          params.append("locationId", selectedLocation);
        }

        const response = await axios.get(`${domain}/api/Dashboard/stats`, {
          params,
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    fetchStats();
  }, [sourceType, selectedLocation]); // Dependencies are now the props

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <StatCard
        icon={<IoBagHandle className="w-6 h-6" />}
        label={`Total ${sourceType === "Transactions" ? "POS" : "DO"} Revenue`}
        value={`₱ ${stats.totalSales.toLocaleString()}`}
        color="blue"
        delay="0"
      />
      <StatCard
        icon={<IoPeople className="w-6 h-6" />}
        label="Revenue This Month"
        value={`₱ ${stats.salesThisMonth.toLocaleString()}`}
        color="emerald"
        delay="100"
      />
      <StatCard
        icon={<IoCart className="w-6 h-6" />}
        label={
          sourceType === "Transactions"
            ? "Orders This Month"
            : "Deliveries This Month"
        }
        value={stats.ordersThisMonth.toLocaleString()}
        color="violet"
        delay="200"
      />
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }) {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      shadow: "shadow-blue-500/5",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      shadow: "shadow-emerald-500/5",
    },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      border: "border-violet-100",
      shadow: "shadow-violet-500/5",
    },
  };

  const theme = colorStyles[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ${theme.shadow} border ${theme.border} transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-4 rounded-xl ${theme.bg} ${theme.text}`}>{icon}</div>
      </div>
    </div>
  );
}
