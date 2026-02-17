// src/components/YourModule/PurchaseOrderModule/POApprovalActions.jsx

import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Send,
  Clock,
  Edit,
  Trash2,
  AlertTriangle,
  Bug,
} from "lucide-react";
import { domain } from "../../../../security";

const POApprovalActions = ({
  po,
  currentUserId,
  refreshData,
  onEdit,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);

  // --- DEBUGGING LOGIC ---
  if (po.status === "Pending") {
    // We expect currentUserId (from Redux) to match po.approverUserId (from API)
    console.group(`PO Approval Debug: PO #${po.poNumber}`);
    console.log("Logged In User ID:", currentUserId);
    console.log("Approver User ID:", po.approverUserId); // <--- UPDATED
    console.log(
      "Match?",
      parseInt(currentUserId) === parseInt(po.approverUserId),
    );
    console.groupEnd();
  }
  // -----------------------

  const handleRequestApproval = async () => {
    if (
      !window.confirm(
        "Submit this PO for Approval? You cannot edit it while pending.",
      )
    )
      return;
    setLoading(true);
    try {
      await axios.put(
        `${domain}/api/PurchaseOrderStaging/${po.id}/request-approval`,
      );
      toast.info("Request submitted successfully.");
      refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndPost = async () => {
    if (
      !window.confirm("Approve this PO? It will be posted to LIVE immediately.")
    )
      return;
    setLoading(true);
    try {
      await axios.post(
        `${domain}/api/PurchaseOrderStaging/${po.id}/approve-and-post`,
      );
      toast.success("PO Approved and Posted to Live!");
      refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Please enter the reason for rejection:");
    if (!reason) return;
    setLoading(true);
    try {
      await axios.put(`${domain}/api/PurchaseOrderStaging/${po.id}/reject`, {
        reason,
      });
      toast.warning("PO Rejected and returned to requester.");
      refreshData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject.");
    } finally {
      setLoading(false);
    }
  };

  if (!po.isStaging) return null;

  // SCENARIO 1: Draft or Rejected
  if (po.status === "Draft" || po.status === "Rejected") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRequestApproval();
          }}
          disabled={loading}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded shadow-sm transition-colors font-medium disabled:opacity-50"
        >
          <Send size={14} /> Request Approval
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(po);
          }}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(po.id);
          }}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
        >
          <Trash2 size={18} />
        </button>
        {po.status === "Rejected" && po.rejectionReason && (
          <div className="group relative ml-1">
            <AlertTriangle size={18} className="text-red-500 cursor-help" />
            <span className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-red-800 text-white text-xs rounded p-2 z-50 shadow-lg">
              <strong>Rejection Reason:</strong>
              <br />
              {po.rejectionReason}
            </span>
          </div>
        )}
      </div>
    );
  }

  // SCENARIO 2: Pending Approval
  if (po.status === "Pending") {
    // UPDATED COMPARISON LOGIC
    const isApprover = parseInt(currentUserId) === parseInt(po.approverUserId);

    return (
      <div className="flex flex-col gap-1 items-end md:items-center">
        {/* --- VISUAL DEBUGGER (Remove after testing) --- */}

        {isApprover ? (
          // IF USER IS THE APPROVER
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApproveAndPost();
              }}
              disabled={loading}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded shadow-sm font-medium disabled:opacity-50"
            >
              <CheckCircle size={14} /> Approve
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReject();
              }}
              disabled={loading}
              className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 text-xs px-3 py-1.5 rounded shadow-sm font-medium disabled:opacity-50"
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        ) : (
          // IF USER IS NOT THE APPROVER (REQUESTER)
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 cursor-default">
              <Clock size={14} /> Waiting for Approval
            </span>
            {/* Show disabled icons to indicate locking */}
            <span title="Locked while pending" className="text-slate-300">
              <Edit size={18} />
            </span>
            <span title="Locked while pending" className="text-slate-300">
              <Trash2 size={18} />
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default POApprovalActions;
