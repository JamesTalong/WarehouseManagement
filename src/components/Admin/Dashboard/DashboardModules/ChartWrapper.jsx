import React from "react";
import { ResponsiveContainer } from "recharts";
import { IoPieChart } from "react-icons/io5"; // Consistent icon usage

const ChartWrapper = ({ children, title = "Month Sales" }) => {
  return (
    <div className="flex flex-col h-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
      {/* Header - Matching StockDemandChart style */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <IoPieChart className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        </div>
      </div>

      {/* Chart Area - flex-1 ensures it fills the remaining height */}
      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWrapper;
