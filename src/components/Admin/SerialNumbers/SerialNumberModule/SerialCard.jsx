import React from "react";
import { Check, X, Package, Hash, MoreVertical, Pencil } from "lucide-react";

const SerialCard = ({ serial, onEdit }) => {
  const isSold = serial.isSold;

  // Dynamic classes for the status badge
  const statusBadgeClasses = isSold
    ? "bg-slate-200 text-slate-600"
    : "bg-green-100 text-green-800";

  const statusIcon = isSold ? <X size={14} /> : <Check size={14} />;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden ring-1 ring-slate-200/50 hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        <div className="flex justify-between items-start">
          {/* Main Info */}
          <div>
            <p className="text-sm text-slate-500">Serial Number</p>
            <h3 className="font-bold text-slate-800 text-lg leading-tight font-mono tracking-wide">
              {serial.serialName || "N/A"}
            </h3>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses}`}
          >
            {statusIcon}
            <span>{isSold ? "Sold" : "Available"}</span>
          </div>
        </div>

        {/* Product and Batch Info */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Package size={14} className="text-slate-400" />
            <strong>Product:</strong>
            <span className="truncate">
              {serial.pricelistProduct?.productName || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Hash size={14} className="text-slate-400" />
            <strong>Batch ID:</strong>
            <span className="font-mono text-xs">{serial.batchId || "N/A"}</span>
          </div>
        </div>

        {/* Actions (Example for future use) */}
        {/* If you re-enable editing, this is where it would go. */}
        {/* <div className="mt-4">
          <button 
            onClick={() => onEdit(serial)}
            className="flex items-center justify-center gap-2 w-full text-sm text-indigo-600 font-semibold p-2 rounded-lg hover:bg-indigo-50"
          >
            <Pencil size={14} /> Edit Serial
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default SerialCard;
