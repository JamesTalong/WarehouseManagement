import React, { useState } from "react";
import {
  X,
  Search,
  CheckCircle,
  ShoppingCart,
  AlertCircle,
  QrCode,
} from "lucide-react";

const SerialNumberModal = ({ isOpen, onClose, item }) => {
  const [activeTab, setActiveTab] = useState("unsold");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !item) return null;

  const getList = () => {
    let list = [];
    if (activeTab === "unsold") list = item.unsoldSerials || [];
    if (activeTab === "sold") list = item.soldSerials || [];
    if (activeTab === "bad") list = item.badSerials || [];

    return list.filter((s) =>
      s.serialName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const currentList = getList();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <QrCode className="text-indigo-600" size={20} />
              Serial Numbers
            </h3>
            <p className="text-sm text-slate-500">
              {item.productName} ({item.itemCode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-4">
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab("unsold")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "unsold"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle size={14} /> Good ({item.unsoldSerials?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "sold"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShoppingCart size={14} /> Sold ({item.soldSerials?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("bad")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "bad"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AlertCircle size={14} /> Bad ({item.badSerials?.length || 0})
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial number..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {currentList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentList.map((serial) => (
                <div
                  key={serial.id || serial.serialName}
                  className="bg-white px-3 py-2.5 rounded border border-slate-200 text-sm font-mono text-slate-700 hover:border-indigo-300 transition-colors shadow-sm flex items-center justify-between"
                >
                  <span>{serial.serialName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Search size={32} className="mb-2 opacity-50" />
              <p>No serial numbers found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SerialNumberModal;
