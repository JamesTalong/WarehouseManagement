import React from "react";
import { FaTimes, FaBoxOpen, FaBarcode } from "react-icons/fa";

const ViewManifestModal = ({ isOpen, onClose, transferId, items }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaBoxOpen className="text-indigo-600" />
              Package Manifest
            </h3>
            <p className="text-sm text-slate-500">
              Transfer Reference #{transferId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-800">
                    {item.productName}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                    {item.productCode || item.itemCode || "N/A"}
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold text-indigo-600 bg-indigo-50/30">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {item.hasSerial ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        <FaBarcode /> Serialized
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                        Standard
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-8 text-center text-gray-400">No items found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewManifestModal;
