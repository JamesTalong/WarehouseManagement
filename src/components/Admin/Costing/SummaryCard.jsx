import React from "react";

const SummaryCard = ({ title, value, icon, bgColor = "bg-white" }) => (
  <div
    className={`${bgColor} dark:bg-slate-800 shadow-lg rounded-xl p-3 sm:p-4 lg:p-6 flex items-center space-x-2 sm:space-x-3 lg:space-x-4 transition-transform hover:scale-105`}
  >
    {/* Icon */}
    <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-700 rounded-full flex-shrink-0">
      {icon}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
        {title}
      </p>
      <p className="text-xl lg:text-2xl font-semibold text-slate-800 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

export default SummaryCard;
