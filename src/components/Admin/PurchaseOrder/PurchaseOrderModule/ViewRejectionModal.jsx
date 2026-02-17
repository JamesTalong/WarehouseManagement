// src/components/YourModule/PurchaseOrderModule/ViewRejectionModal.jsx

import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Package,
  AlertCircle,
  Hash,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { domain } from "../../../../security";

const ViewRejectionModal = ({ isOpen, onClose, lineItem }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !lineItem) {
      setDetails(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${domain}/api/PurchaseOrderHeaders/lineitems/${lineItem.id}/rejection-details`
        );
        setDetails(response.data);
      } catch (err) {
        setError("Failed to load rejection details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, lineItem]);

  if (!isOpen || !lineItem) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* 1. Made container WIDER (max-w-3xl) and removed inner paddings to let content flow */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-none">
                QC Rejection Report
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Ref ID: #{lineItem.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body - Single Unified View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="animate-spin mb-3 text-blue-600" size={32} />
              <p className="text-sm font-medium">Retrieving evidence...</p>
            </div>
          ) : error ? (
            <div className="p-8 flex flex-col items-center justify-center text-red-600">
              <AlertCircle size={40} className="mb-3 opacity-20" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : (
            // 2. The "One Div" Layout: Flex container splitting Image (Left) and Details (Right)
            <div className="flex flex-col md:flex-row h-full">
              {/* LEFT SIDE: Visual Evidence (Image) */}
              <div className="w-full md:w-5/12 bg-gray-900 flex flex-col items-center justify-center p-4 min-h-[300px] relative">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <ImageIcon size={14} className="text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Evidence
                  </span>
                </div>

                {details?.rejectReasonImage ? (
                  <img
                    src={`data:image/jpeg;base64,${details.rejectReasonImage}`}
                    alt="Rejection Evidence"
                    className="w-full h-full object-contain max-h-[350px]"
                  />
                ) : (
                  <div className="text-center">
                    <div className="bg-white/10 p-4 rounded-full inline-block mb-3">
                      <ImageIcon size={30} className="text-white/40" />
                    </div>
                    <p className="text-white/40 text-sm font-medium">
                      No image attached
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Details & Reason */}
              <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col gap-6 bg-white">
                {/* Product Title Section */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-600 uppercase tracking-wider mb-2 border border-red-100">
                    <AlertTriangle size={12} /> Rejected Status
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    {lineItem.productName}
                  </h2>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
                      Quantity Rejected
                    </p>
                    <div className="flex items-center gap-2">
                      <Package className="text-blue-500" size={18} />
                      <span className="text-xl font-bold text-gray-900">
                        {details?.rejectedQuantity ||
                          lineItem.rejectedQuantity ||
                          0}
                      </span>
                      <span className="text-sm text-gray-400">units</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
                      Item Reference
                    </p>
                    <div className="flex items-center gap-2">
                      <Hash className="text-purple-500" size={18} />
                      <span className="text-sm font-mono font-bold text-gray-700">
                        {lineItem.poNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-gray-400" />
                    <h5 className="text-sm font-bold text-gray-900">
                      QC Notes & Reason
                    </h5>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm leading-relaxed text-gray-700 h-full">
                    {details?.rejectReasonDescription ||
                      "No specific remarks provided by the inspector."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition shadow-sm hover:shadow active:scale-95"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewRejectionModal;
