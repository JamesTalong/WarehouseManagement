import React, { useState } from "react";

// Helper for visual warnings
const StockStatusBadge = ({ current, min, max }) => {
  // Logic: 0 min/max usually means settings are not configured
  if (!min && !max) return null;

  if (min > 0 && current < min) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 ml-2">
        LOW STOCK
      </span>
    );
  }
  if (max > 0 && current > max) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 ml-2">
        OVERSTOCK
      </span>
    );
  }
  return null;
};

const ItemComparisonTable = ({ groupedData, onRowClick, onSetThreshold }) => {
  const [selectedUoms, setSelectedUoms] = useState({});

  const getActiveItem = (group) => {
    const selectedId = selectedUoms[group.key];
    if (selectedId) {
      const found = group.variants.find(
        (v) => v.uomId === parseInt(selectedId),
      );
      if (found) return found;
    }
    return group.variants[0];
  };

  const handleUomChange = (groupKey, newUomId) => {
    setSelectedUoms((prev) => ({ ...prev, [groupKey]: parseInt(newUomId) }));
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="py-3 px-4 w-1/4">Product Details</th>
            <th className="py-3 px-4 text-center">Unit</th>
            <th className="py-3 px-4 text-center bg-green-50 text-green-800 border-l border-green-100">
              Good Stock
            </th>
            <th className="py-3 px-4 text-center bg-red-50 text-red-800 border-l border-red-100">
              Other Status
            </th>
            <th className="py-3 px-4 text-center w-1/5">Health Ratio</th>
            <th className="py-3 px-4 text-center">Actions</th> {/* Renamed */}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {groupedData.map((group) => {
            const activeItem = getActiveItem(group);
            const goodStock = activeItem.unsoldCount || 0;
            const badStock = activeItem.soldCount || 0;
            const total = goodStock + badStock;
            const goodPercent = total > 0 ? (goodStock / total) * 100 : 0;

            // Thresholds from backend (mapped in useInventoryData)
            const minStock = activeItem.minStock || 0;
            const maxStock = activeItem.maxStock || 0;

            return (
              <tr
                key={group.key}
                className="hover:bg-gray-50 transition-colors"
                // Removed onClick from row to prevent misclicks on buttons
              >
                {/* Product Name & Code */}
                <td
                  className="py-3 px-4 cursor-pointer"
                  onClick={() => onRowClick && onRowClick(activeItem)}
                >
                  <div className="font-bold text-gray-800">
                    {activeItem.product}
                    {/* VISUAL WARNING INDICATOR */}
                    <StockStatusBadge
                      current={goodStock}
                      min={minStock}
                      max={maxStock}
                    />
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {activeItem.itemCode}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                      {activeItem.location}
                    </span>
                    {/* Show Threshold text if set */}
                    {(minStock > 0 || maxStock > 0) && (
                      <span className="text-[10px] text-gray-400 flex items-center">
                        Target: {minStock} - {maxStock}
                      </span>
                    )}
                  </div>
                </td>

                {/* Unit Selector */}
                <td className="py-3 px-4 text-center">
                  {group.variants.length > 1 ? (
                    <select
                      value={activeItem.uomId}
                      onChange={(e) =>
                        handleUomChange(group.key, e.target.value)
                      }
                      className="block w-full py-1 pl-2 pr-6 text-xs border-gray-300 rounded shadow-sm focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                    >
                      {group.variants.map((v) => (
                        <option key={v.uniqueId} value={v.uomId}>
                          {v.uomName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-medium">
                      {activeItem.uomName}
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-center bg-green-50/20 border-l border-green-50">
                  <span
                    className={`text-lg font-bold ${
                      minStock > 0 && goodStock < minStock
                        ? "text-red-600 animate-pulse"
                        : maxStock > 0 && goodStock > maxStock
                          ? "text-amber-600"
                          : "text-green-600"
                    }`}
                  >
                    {goodStock}
                  </span>
                </td>

                <td className="py-3 px-4 text-center bg-red-50/20 border-l border-red-50">
                  <span className="text-lg font-bold text-red-600">
                    {badStock}
                  </span>
                </td>

                <td className="py-3 px-4 align-middle">
                  {/* ... existing bar graph ... */}
                  <div className="w-full bg-red-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-green-500 h-2.5 rounded-l-full"
                      style={{ width: `${goodPercent}%` }}
                    ></div>
                  </div>
                </td>

                {/* Action Buttons */}
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col space-y-2 items-center">
                    <button
                      onClick={() => onRowClick && onRowClick(activeItem)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                    >
                      History
                    </button>

                    {/* NEW BUTTON FOR MODAL */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetThreshold(activeItem);
                      }}
                      className="text-gray-500 hover:text-gray-800 text-[10px] border border-gray-300 px-2 py-1 rounded bg-white hover:bg-gray-50 flex items-center gap-1"
                    >
                      <span>⚙️ Limit</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ItemComparisonTable;
