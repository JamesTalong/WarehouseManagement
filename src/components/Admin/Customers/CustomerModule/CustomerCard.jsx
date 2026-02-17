import React from "react";
import {
  User,
  MapPin,
  Phone,
  Hash,
  MoreVertical,
  Pencil,
  Trash2,
  Building,
} from "lucide-react";

const CustomerCard = ({ customer, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <div
      onClick={() => onSelect(customer)}
      className={`bg-white rounded-xl shadow-md overflow-hidden ring-1 transition-all duration-300 ${
        isSelected
          ? "ring-indigo-500 ring-2"
          : "ring-slate-200/50 hover:shadow-lg"
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          {/* Main Info */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-slate-100 rounded-full p-2">
                <User size={20} className="text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                  {customer.customerName || "N/A"}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {customer.customerType}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          <div className="relative group">
            <button
              className="p-1 text-slate-500 hover:text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={20} />
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <a
                  href="#"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(customer);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Pencil size={14} /> Edit
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(customer.id);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            <span>{customer.mobileNumber || "No phone number"}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-slate-400 mt-0.5" />
            <span>{customer.address || "No address"}</span>
          </div>
          {customer.tinNumber && (
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-slate-400" />
              <strong>TIN:</strong>
              <span>{customer.tinNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
