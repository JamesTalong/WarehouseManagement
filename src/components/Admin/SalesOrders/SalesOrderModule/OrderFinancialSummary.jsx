import React from "react";

const OrderFinancialSummary = ({
  subtotal,
  shippingCost,
  hasVat,
  hasEwt,
  vatAmount,
  ewtAmount,
  vatableAmount,
  totalAmount,
  onUpdate, // Callback to update parent state
  currency = "PHP",
}) => {
  const formatMoney = (val) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: currency,
    }).format(val);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-6">
      <div className="flex flex-col md:flex-row gap-8 justify-between">
        {/* LEFT SIDE: Toggles & Inputs */}
        <div className="flex-1 space-y-6 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
            Tax & Logistics
          </h4>

          <div className="flex flex-col gap-4">
            {/* VAT Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    hasVat ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  Apply VAT (12%)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVat}
                  onChange={(e) => onUpdate("hasVat", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* EWT Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    hasEwt ? "bg-indigo-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  Apply EWT (1%)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEwt}
                  onChange={(e) => onUpdate("hasEwt", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Shipping Input */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm font-medium text-gray-700">
                Shipping Cost
              </span>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  {currency}
                </span>
                <input
                  type="number"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => onUpdate("shippingCost", e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 text-right text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Calculation Breakdown */}
        <div className="flex-1 space-y-3 pt-2">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 text-right">
            Order Summary
          </h4>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatMoney(subtotal)}
            </span>
          </div>

          {hasVat && (
            <>
              <div className="flex justify-between text-xs text-gray-500 pl-4 border-l-2 border-gray-200">
                <span>Vatable Sales</span>
                <span>{formatMoney(vatableAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pl-4 border-l-2 border-gray-200">
                <span>VAT Amount (12%)</span>
                <span>{formatMoney(vatAmount)}</span>
              </div>
            </>
          )}

          {hasEwt && (
            <div className="flex justify-between text-sm text-indigo-600 font-medium">
              <span>Less: Withholding Tax (1%)</span>
              <span>- {formatMoney(ewtAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>{formatMoney(shippingCost)}</span>
          </div>

          <div className="border-t-2 border-gray-900 border-dashed my-4 pt-4">
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-gray-800">
                Grand Total
              </span>
              <span className="text-2xl font-extrabold text-indigo-600">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFinancialSummary;
