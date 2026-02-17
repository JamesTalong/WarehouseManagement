import React from "react";
import { ChevronRight } from "lucide-react";

const InventoryCard = ({
  item,
  selectedDate,
  uniqueDates,
  onDateChange,
  onShowPopup,
  status,
  statusColor,
  soldCount,
  unsoldCount,
}) => {
  const totalCount = soldCount + unsoldCount;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200 text-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-slate-800 text-base leading-tight">
          {item.product}
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center text-slate-600 mb-2">
        <span className="text-xs mr-1">📍</span>
        <span className="text-xs">{item.location}</span>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs font-medium">
        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
          Unsold:{" "}
          <button
            onClick={() => {
              const filteredBatches =
                selectedDate === "All Dates"
                  ? item.batches
                  : item.batches.filter((b) =>
                      b.batchDate.startsWith(selectedDate)
                    );
              const unsoldSerials = filteredBatches
                .flatMap((b) => b.serialNumbers)
                .filter((s) => !s.isSold);
              onShowPopup(unsoldSerials);
            }}
            className="font-bold hover:underline"
          >
            {unsoldCount}
          </button>
        </div>
        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-md">
          Sold:{" "}
          <button
            onClick={() => {
              const filteredBatches =
                selectedDate === "All Dates"
                  ? item.batches
                  : item.batches.filter((b) =>
                      b.batchDate.startsWith(selectedDate)
                    );
              const soldSerials = filteredBatches
                .flatMap((b) => b.serialNumbers)
                .filter((s) => s.isSold);
              onShowPopup(soldSerials);
            }}
            className="font-bold hover:underline"
          >
            {soldCount}
          </button>
        </div>
        <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md">
          Total: <span className="font-bold">{totalCount}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <label htmlFor={`batch-date-${item.id}`} className="sr-only">
          Filter batch date for {item.product}
        </label>
        <select
          id={`batch-date-${item.id}`}
          value={selectedDate}
          onChange={(e) => onDateChange(item.id, e.target.value)}
          className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          {uniqueDates.map((date, idx) => (
            <option key={idx} value={date}>
              Batch: {date}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default InventoryCard;
