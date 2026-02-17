// src/components/YourModule/GoodsReceiptModule/SerialNumberModal.jsx
import React, { useState, useEffect } from "react";
import { X, Search, Barcode, Copy, Check } from "lucide-react";

const SerialNumberModal = ({
  isOpen,
  onClose,
  serialNumbers = [],
  productName,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (isOpen) setSearchTerm("");
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logic handles both plain strings and object structures
  const filteredSerials = serialNumbers.filter((sn) => {
    const val = typeof sn === "object" ? sn.serialNumber : sn;
    return val.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Serial Numbers</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Product: {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search serials..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Total: {serialNumbers.length}</span>
            <span>Showing: {filteredSerials.length}</span>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSerials.length > 0 ? (
            filteredSerials.map((sn, idx) => {
              const displaySN = typeof sn === "object" ? sn.serialNumber : sn;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded text-slate-500">
                      <Barcode size={16} />
                    </div>
                    <span className="font-mono text-sm text-slate-700 font-medium">
                      {displaySN}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(displaySN, idx)}
                    className="p-1.5 text-slate-300 group-hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm">
                No serial numbers found matching "{searchTerm}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SerialNumberModal;
