import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../../security";
import {
  X,
  RefreshCw,
  Gift,
  Search,
  FileText,
  PackageCheck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import InventorySearchFilter from "./InventorySearchFilter";

const ExchangeModal = ({
  isOpen,
  onClose,
  mode,
  originalItem,
  deliveryOrder,
  onSuccess,
  currentUserId,
}) => {
  const [loading, setLoading] = useState(false);
  const [productsMaster, setProductsMaster] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [returnCondition, setReturnCondition] = useState("GOOD");
  const [qtyToProcess, setQtyToProcess] = useState(1);
  const [reason, setReason] = useState("");

  const isReplace = mode === "REPLACE";

  useEffect(() => {
    if (isOpen && deliveryOrder?.locationId) {
      loadInventory(deliveryOrder.locationId);
    }
    setSelectedProduct(null);
    setReason("");
    setQtyToProcess(1);
  }, [isOpen, deliveryOrder]);

  const loadInventory = async (locationId) => {
    try {
      setLoading(true);
      const [prodRes, stockRes] = await Promise.all([
        axios.get(`${domain}/api/Products`),
        axios.get(`${domain}/api/Products/stock-by-location/${locationId}`),
      ]);
      setProductsMaster(prodRes.data);

      const map = {};
      stockRes.data.forEach((item) => {
        map[item.productId] = { qty: item.stockCount, uom: item.uomName };
      });
      setInventoryMap(map);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load warehouse inventory");
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return toast.error("Please select a product.");
    if (!reason) return toast.error("Reason is required.");

    setLoading(true);
    try {
      let serialIds = [];
      if (selectedProduct.hasSerial) {
        const serialRes = await axios.get(
          `${domain}/api/SerialNumbers/available/${selectedProduct.id}?locationName=${deliveryOrder.locationName}`,
        );
        const available = serialRes.data;
        if (available.length < qtyToProcess)
          throw new Error("Not enough serial numbers available.");
        serialIds = available.slice(0, qtyToProcess).map((s) => s.id);
      }

      if (isReplace) {
        const payload = {
          deliveryOrderId: deliveryOrder.id,
          originalProductId: originalItem.productId,
          quantity: qtyToProcess,
          returnCondition: returnCondition,
          replacementProductId: selectedProduct.id,
          newSerialNumberIds: serialIds,
          reason: reason,
          doneBy: String(currentUserId),
        };
        await axios.post(`${domain}/api/DeliveryOrders/replace-item`, payload);
        toast.success("Item Replaced Successfully");
      } else {
        const payload = {
          deliveryOrderId: deliveryOrder.id,
          productId: selectedProduct.id,
          quantity: qtyToProcess,
          serialNumberIds: serialIds,
          reason: reason,
          doneBy: String(currentUserId),
        };
        await axios.post(
          `${domain}/api/DeliveryOrders/add-complimentary`,
          payload,
        );
        toast.success("Complimentary Item Added");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Operation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isReplace ? "bg-indigo-100 text-indigo-600" : "bg-purple-100 text-purple-600"}`}
            >
              {isReplace ? <RefreshCw size={20} /> : <Gift size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isReplace
                  ? "Replacement Workflow"
                  : "Complimentary Item Workflow"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Order: {deliveryOrder?.deliveryOrderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Side Step Progress - This fills the height beautifully */}
          <div className="w-64 bg-slate-50 border-r p-6 flex flex-col gap-8 hidden md:flex">
            <StepIcon
              icon={<PackageCheck size={18} />}
              label="Item Source"
              active={isReplace}
              completed={!isReplace}
            />
            <StepIcon
              icon={<Search size={18} />}
              label="Selection"
              active={true}
            />
            <StepIcon
              icon={<ClipboardList size={18} />}
              label="Documentation"
              active={false}
            />

            <div className="mt-auto p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Location
              </p>
              <p className="text-xs font-bold text-slate-700 truncate">
                {deliveryOrder?.locationName}
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-xl mx-auto space-y-10">
              {/* Section 1: Return Details (If Replace) */}
              {isReplace && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <div className="h-px flex-1 bg-indigo-100"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Step 1: Return Info
                    </span>
                    <div className="h-px flex-1 bg-indigo-100"></div>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
                    <p className="text-sm font-bold text-slate-800 mb-4">
                      {originalItem?.productName}
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Qty to Swap
                        </label>
                        <input
                          type="number"
                          max={originalItem?.quantityReceived}
                          value={qtyToProcess}
                          onChange={(e) =>
                            setQtyToProcess(parseInt(e.target.value))
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Condition
                        </label>
                        <select
                          value={returnCondition}
                          onChange={(e) => setReturnCondition(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                          <option value="GOOD">Good (Resellable)</option>
                          <option value="BAD">Bad (Damaged)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Section 2: Search & Selection */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Step {isReplace ? "2" : "1"}: New Selection
                  </span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <InventorySearchFilter
                  data={productsMaster}
                  inventoryMap={inventoryMap}
                  onSelect={handleProductSelect}
                  isLoading={loading && productsMaster.length === 0}
                  placeholder="Search warehouse stock..."
                />

                {selectedProduct && (
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full">
                        <PackageCheck size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">
                          Ready to Issue
                        </p>
                        <p className="text-sm font-bold text-emerald-900">
                          {selectedProduct.productName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline px-2"
                    >
                      Change
                    </button>
                  </div>
                )}

                {!isReplace && selectedProduct && (
                  <div className="w-1/3 animate-in zoom-in-95">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block tracking-wide">
                      Qty to Give
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={qtyToProcess}
                      onChange={(e) =>
                        setQtyToProcess(parseInt(e.target.value))
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    />
                  </div>
                )}
              </section>

              {/* Section 3: Reason */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Final Step: Reason
                  </span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm h-32 resize-none focus:ring-2 focus:ring-slate-300 outline-none transition-all"
                  placeholder="Type the internal reason for this transaction here..."
                ></textarea>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-slate-50 flex justify-end items-center gap-4 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 ${
              isReplace
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-purple-600 hover:bg-purple-700"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Processing..." : "Complete Transaction"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for the Sidebar Steps
const StepIcon = ({ icon, label, active, completed }) => (
  <div
    className={`flex items-center gap-4 ${active ? "opacity-100" : "opacity-40"}`}
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        active
          ? "bg-white shadow-md text-indigo-600 ring-1 ring-slate-200"
          : "bg-slate-200 text-slate-500"
      } ${completed ? "bg-emerald-500 text-white" : ""}`}
    >
      {completed ? <FileText size={18} /> : icon}
    </div>
    <span
      className={`text-xs font-bold tracking-tight ${active ? "text-slate-800" : "text-slate-500"}`}
    >
      {label}
    </span>
  </div>
);

export default ExchangeModal;
