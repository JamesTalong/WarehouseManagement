import React from "react";
import {
  Package,
  Calendar,
  MapPin,
  Hash,
  MoreVertical,
  Pencil,
  Trash2,
  ListTree,
} from "lucide-react";

// A single, beautifully designed card for the mobile view
const BatchCard = ({
  batch,
  pricelist,
  onEdit,
  onDelete,
  onViewSerials,
  onViewDetails,
}) => {
  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden ring-1 ring-slate-200/50 hover:shadow-lg transition-shadow duration-300"
      onClick={() => onViewDetails(batch.pricelistId)}
    >
      {/* Card Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">
              {pricelist.product || "N/A"}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <MapPin size={14} />
              <span>{pricelist.location || "N/A"}</span>
            </div>
          </div>
          <div className="relative group">
            <button className="p-1 text-slate-500 hover:text-slate-800">
              <MoreVertical size={20} />
            </button>
            {/* Dropdown for Edit/Delete */}
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <a
                  href="#"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(batch);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Pencil size={14} /> Edit
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(batch.id);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <strong>Date:</strong>
          <span>{new Date(batch.batchDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Package size={14} className="text-slate-400" />
          <strong>Items:</strong>
          <span>{batch.numberOfItems}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 col-span-2">
          <Hash size={14} className="text-slate-400" />
          <strong>Batch ID:</strong>
          <span className="font-mono text-xs">{batch.id || "N/A"}</span>
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="px-4 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewSerials(batch.id);
          }}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
        >
          <ListTree size={16} />
          View Serials
        </button>
      </div>
    </div>
  );
};

export default BatchCard;
