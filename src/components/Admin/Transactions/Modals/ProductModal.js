import React from "react";
import { X, Package, Hash, Tag, Copy } from "lucide-react";
import { toast } from "react-toastify";

const ProductModal = ({ products, transactionId, onClose }) => {
  // Helper to calculate total of the specific modal view
  const modalTotal = products.reduce(
    (acc, curr) => acc + (curr.subtotal || 0),
    0
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Serial copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* --- Header --- */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-indigo-600" size={24} />
              Purchased Items
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Transaction ID:{" "}
              <span className="font-mono text-slate-700">#{transactionId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              {/* Product Main Row */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left: Product Info */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-indigo-600">
                      {product.productName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">
                      {product.productName}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Product Codes Badges */}
                      {product.itemCode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Tag size={10} /> {product.itemCode}
                        </span>
                      )}
                      {product.barCode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Hash size={10} /> {product.barCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Financials */}
                <div className="text-right shrink-0 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                  <div className="text-sm text-slate-500 mb-1">
                    <span className="font-medium text-slate-900">
                      {product.quantity}
                    </span>{" "}
                    x ₱{product.price?.toFixed(2)}
                  </div>
                  <div className="text-xl font-bold text-indigo-600">
                    ₱{product.subtotal?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Serials Section (Render only if serials exist) */}
              {product.serialNumbers && product.serialNumbers.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 p-3 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Hash size={12} /> Serial Numbers (
                    {product.serialNumbers.length})
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.serialNumbers.map((serial, idx) => (
                      <div
                        key={serial.id || idx}
                        className="group relative flex items-center gap-2 bg-white border border-slate-200 rounded-md pl-2 pr-1 py-1.5 hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100 transition-all cursor-pointer"
                        title={`Batch: ${serial.batchName}`}
                        onClick={() => copyToClipboard(serial.serialName)}
                      >
                        <span className="font-mono text-xs font-medium text-slate-700 select-all">
                          {serial.serialName}
                        </span>

                        {/* Copy Icon on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity">
                          <Copy size={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* --- Footer --- */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            Total Items:{" "}
            <span className="font-semibold text-slate-800">
              {products.reduce((acc, p) => acc + p.quantity, 0)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm text-slate-500 mr-2">Grand Total:</span>
            <span className="text-2xl font-bold text-indigo-600">
              ₱{modalTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
