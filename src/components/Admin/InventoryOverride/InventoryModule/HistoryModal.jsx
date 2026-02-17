import React from "react";
import { FaTimes, FaUndo, FaLayerGroup } from "react-icons/fa";

const HistoryModal = ({ isOpen, onClose, historyData, onRevert }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaUndo className="text-indigo-600" /> Restore Points
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a previous bulk upload to roll back the system to that
              exact state.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Audit Note</th>
                <th className="px-6 py-4">Summary</th>
                <th className="px-6 py-4 text-center">Items Affected</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyData && historyData.length > 0 ? (
                historyData.map((batch, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-base">
                        {new Date(batch.adjustmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {new Date(batch.adjustmentDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded border border-slate-200">
                        {batch.note}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        By: {batch.adjustedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div
                        className="text-xs text-slate-500 truncate"
                        title={batch.productPreview}
                      >
                        <span className="font-semibold text-slate-700">
                          Includes:
                        </span>{" "}
                        {batch.productPreview}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        <FaLayerGroup /> {batch.itemCount} Items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onRevert(batch)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 group-hover:shadow-md"
                      >
                        <FaUndo /> Restore
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FaUndo size={40} className="mb-4 opacity-20" />
                      <p>No save points found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
