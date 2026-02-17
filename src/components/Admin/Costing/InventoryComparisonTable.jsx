import React from "react";

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
};

const ProfitBadge = ({ profit, margin }) => {
  const isPositive = profit > 0;
  const isNeutral = profit === 0;

  let colorClass = isNeutral
    ? "bg-gray-100 text-gray-600"
    : isPositive
    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
    : "bg-red-50 text-red-600 border border-red-200";

  return (
    <div
      className={`flex flex-col items-end px-3 py-1 rounded-lg ${colorClass}`}
    >
      <span className="font-bold text-sm">{formatCurrency(profit)}</span>
      <span className="text-[10px] opacity-80">
        {isNeutral ? "0%" : `${margin.toFixed(1)}% Margin`}
      </span>
    </div>
  );
};

const InventoryComparisonTable = ({ groupedData, priceType }) => {
  return (
    <div className="overflow-x-auto rounded-xl shadow-sm border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
          <tr>
            <th className="p-4 border-b border-slate-200">Product Details</th>
            <th className="p-4 border-b border-slate-200 text-center">Stock</th>
            <th className="p-4 border-b border-slate-200 text-right">
              Cost (Base)
            </th>
            <th className="p-4 border-b border-slate-200 text-right">
              Selling Price
            </th>
            <th className="p-4 border-b border-slate-200 text-right">
              Profit & Margin
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groupedData.map((group) => {
            const { mainInfo, variants } = group;

            return (
              <React.Fragment key={group.key}>
                {/* Group Header Row (Product + Location) */}
                <tr className="bg-slate-50/50">
                  <td
                    colSpan="5"
                    className="px-4 py-2 border-l-4 border-blue-500"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 text-sm">
                        {mainInfo.productName}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {mainInfo.locationName}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {mainInfo.brandName || "No Brand"}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Variant Rows (UOMs) */}
                {variants.map((item) => {
                  // Determine Selling Price based on selected Price Type
                  // Map database keys: vatInc, vatEx, reseller
                  let sellingPrice = 0;
                  if (priceType === "vatEx") sellingPrice = item.vatEx;
                  else if (priceType === "reseller")
                    sellingPrice = item.reseller;
                  else sellingPrice = item.vatInc; // Default

                  // Recalculate profit visually based on the toggle if needed,
                  // or use the backend provided 'profit' if priceType is standard.
                  // Ideally, calculate on fly to match the toggle:
                  const calculatedProfit = sellingPrice - item.purchaseCost;

                  // Calculate Margin %: (Profit / Selling) * 100
                  const marginPercentage =
                    sellingPrice > 0
                      ? (calculatedProfit / sellingPrice) * 100
                      : 0;

                  return (
                    <tr
                      key={item.uniqueId}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">
                            {item.uomName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Code: {item.itemCode}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            item.stockCount > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.stockCount}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="text-sm text-slate-500">
                          {formatCurrency(item.purchaseCost)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Purchase Price
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="text-sm font-bold text-slate-800">
                          {formatCurrency(sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {priceType}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end">
                          <ProfitBadge
                            profit={calculatedProfit}
                            margin={marginPercentage}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryComparisonTable;
