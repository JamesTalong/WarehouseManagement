import React from "react";
import {
  X,
  User,
  MapPin,
  Box,
  Hash,
  Calendar,
  CreditCard,
  Receipt,
  Scale,
} from "lucide-react";

const TransactionDetailsModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const { customer, purchasedProducts } = transaction;

  // Helper to format currency safely
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(val || 0));

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 transition-all">
      {/* Modal Container */}
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-fadeIn border border-slate-200">
        {/* --- Header --- */}
        <div className="bg-white px-6 py-5 border-b border-slate-200 flex justify-between items-start sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Receipt size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  Transaction #{transaction.id}
                  {transaction.isVoid ? (
                    <span className="bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full border border-red-200 font-bold uppercase tracking-wide">
                      Voided
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold uppercase tracking-wide">
                      Completed
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(transaction.date).toLocaleString()}
                  </span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span>
                    Processed by:{" "}
                    <span className="font-semibold text-slate-700">
                      {transaction.fullName}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 border border-transparent hover:border-red-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- Scrollable Body --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* 1. Info Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Details Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Customer
                Information
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500 text-sm">Customer Name</span>
                  <span className="font-semibold text-slate-800 text-base">
                    {customer?.customerName || "Walk-In Customer"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="Address" value={customer?.address} />
                  <InfoItem label="TIN" value={customer?.tinNumber} />
                  <InfoItem
                    label="Business Style"
                    value={customer?.businessStyle}
                  />
                  <InfoItem
                    label="Customer Type"
                    value={customer?.customerType}
                    isBadge
                    color="blue"
                  />
                </div>
              </div>
            </div>

            {/* Payment & Logistics Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-purple-500" /> Payment &
                Logistics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <InfoItem
                  label="Location"
                  value={transaction.location}
                  icon={<MapPin size={12} />}
                />
                <InfoItem
                  label="Checked By"
                  value={transaction.checkedBy || "System"}
                />
                <InfoItem
                  label="Payment Method"
                  value={transaction.paymentType}
                  isBadge
                  color="purple"
                />
                <InfoItem label="Terms" value={transaction.terms || "Cash"} />

                <div className="col-span-1 sm:col-span-2 bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between items-center mt-1">
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Discount Applied
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-2">
                      {transaction.discountType}
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(transaction.discountAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Products Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                <Box size={16} className="text-slate-500" /> Purchased Items
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-2">
                  {transaction.totalItems} items
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold w-[40%]">
                      Product Description
                    </th>
                    <th className="px-5 py-3 font-semibold w-[15%]">Codes</th>
                    <th className="px-5 py-3 font-semibold text-center w-[10%]">
                      Qty / UOM
                    </th>
                    <th className="px-5 py-3 font-semibold text-right w-[15%]">
                      Price
                    </th>
                    <th className="px-5 py-3 font-semibold text-right w-[20%]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {purchasedProducts?.map((item, idx) => {
                    // Filter serials to ensure we only have ones with actual names
                    const validSerials = item.serialNumbers?.filter(
                      (sn) => sn.serialName && sn.serialName.trim() !== ""
                    );

                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="font-bold text-slate-800 text-base mb-1">
                            {item.productName}
                          </div>

                          {/* 
                             CHECK: Only render if validSerials array has length > 0.
                             This prevents empty "Serials" boxes from appearing. 
                          */}
                          {validSerials && validSerials.length > 0 && (
                            <div className="mt-2 bg-indigo-50/50 rounded-md p-2 border border-indigo-100 inline-block max-w-full">
                              <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
                                <Hash size={10} /> Serials
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {validSerials.map((sn) => (
                                  <span
                                    key={sn.id}
                                    className="text-[10px] bg-white text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap"
                                    title={`Batch: ${sn.batchName}`}
                                  >
                                    {sn.serialName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-xs text-slate-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-mono bg-slate-100 px-1 rounded">
                              SKU
                            </span>{" "}
                            {item.itemCode}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono bg-slate-100 px-1 rounded">
                              BAR
                            </span>{" "}
                            {item.barCode}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-center">
                          <div className="flex flex-col items-center justify-start gap-1">
                            <span className="font-bold text-slate-800 text-base">
                              {item.quantity}
                            </span>
                            {item.uom && (
                              <div
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[10px] uppercase font-bold tracking-wide cursor-help"
                                title={`Conversion Rate: ${item.conversionRate}`}
                              >
                                <Scale size={10} />
                                {item.uom}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-right text-slate-600">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-5 py-4 align-top text-right font-bold text-slate-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Financial Summary */}
          <div className="flex flex-col md:flex-row justify-end items-start gap-4">
            <div className="w-full md:w-1/2"></div>
            <div className="w-full md:w-[450px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-5 space-y-3">
                <SummaryRow
                  label="Subtotal (VAT Inc.)"
                  value={formatCurrency(
                    transaction.totalAmount - transaction.vatAmount
                  )}
                />
                <SummaryRow
                  label="VAT Amount (12%)"
                  value={formatCurrency(transaction.vatAmount)}
                />
                {transaction.ewtAmount > 0 && (
                  <SummaryRow
                    label="EWT Amount"
                    value={`- ${formatCurrency(transaction.ewtAmount)}`}
                    textClass="text-red-500"
                  />
                )}
                <div className="my-4 border-t-2 border-dashed border-slate-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black text-indigo-600">
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-500">
                    Amount Paid ({transaction.paymentType})
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(transaction.payment)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">
                    Change
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(transaction.change)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-4 sm:px-8 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm active:scale-95"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Sub-components ---
const InfoItem = ({ label, value, isBadge, color = "blue", icon }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
      {icon} {label}
    </span>
    {isBadge ? (
      <span
        className={`self-start text-xs font-bold px-2.5 py-0.5 rounded border uppercase tracking-wide
         ${color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
         ${
           color === "purple"
             ? "bg-purple-50 text-purple-700 border-purple-200"
             : ""
         }
         ${!value ? "bg-slate-100 text-slate-500 border-slate-200" : ""}
       `}
      >
        {value || "N/A"}
      </span>
    ) : (
      <span
        className="text-sm font-medium text-slate-700 truncate"
        title={value}
      >
        {value || "N/A"}
      </span>
    )}
  </div>
);

const SummaryRow = ({ label, value, textClass = "text-slate-700" }) => (
  <div className="flex justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium ${textClass}`}>{value}</span>
  </div>
);

export default TransactionDetailsModal;
