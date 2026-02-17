import React, { useState } from "react";

const InventoryStockTable = ({ groupedData, onRowClick }) => {
  const [selectedUoms, setSelectedUoms] = useState({});

  // Helper: Find the specific variant based on selected UOM
  const getActiveItem = (group) => {
    const selectedId = selectedUoms[group.key];
    if (selectedId) {
      const found = group.variants.find(
        (v) => v.uomId === parseInt(selectedId)
      );
      if (found) return found;
    }
    return group.variants[0];
  };

  const handleUomChange = (groupKey, newUomId) => {
    setSelectedUoms((prev) => ({
      ...prev,
      [groupKey]: parseInt(newUomId),
    }));
  };

  const getCategoryDisplay = (item) => {
    const categories = [
      item.brand?.brandName || item.brand,
      item.category?.categoryName || item.categoryName,
      item.categoryTwo?.categoryTwoName || item.categoryTwoName,
    ].filter(Boolean);
    return categories.join(", ");
  };

  // --- Mobile Card for Stock View ---
  const MobileCard = ({ group }) => {
    const activeItem = getActiveItem(group);
    const isOutOfStock = activeItem.unsoldCount === 0;

    return (
      <div
        onClick={() => onRowClick && onRowClick(activeItem)}
        className={`bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 cursor-pointer ${
          isOutOfStock
            ? "border-l-red-500 bg-red-50"
            : "border-l-teal-500 border-gray-200"
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-gray-900 truncate">
              {activeItem.product || activeItem.productName}
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              {activeItem.itemCode}
            </p>
          </div>
          {isOutOfStock && (
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              No Stock
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-2 truncate">
          <span className="bg-gray-100 px-1 rounded text-gray-700">
            {activeItem.location || activeItem.locationName}
          </span>
          <span className="mx-1">•</span>
          {getCategoryDisplay(activeItem)}
        </p>

        {/* UOM Selector */}
        <div className="mb-3">
          {group.variants.length > 1 ? (
            <div onClick={(e) => e.stopPropagation()}>
              <select
                value={activeItem.uomId}
                onChange={(e) => handleUomChange(group.key, e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 py-1.5"
              >
                {group.variants.map((v) => (
                  <option key={v.uniqueId || v.uomId} value={v.uomId}>
                    {v.uomName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 inline-block">
              Unit:{" "}
              <span className="font-medium text-gray-700">
                {activeItem.uomName}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 my-2"></div>

        {/* Stock Details Grid - 4 Columns */}
        <div className="grid grid-cols-4 gap-1 text-center">
          {/* Unsold */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">
              Unsold
            </p>
            <p
              className={`text-lg font-bold ${
                activeItem.unsoldCount > 0 ? "text-teal-600" : "text-red-600"
              }`}
            >
              {activeItem.unsoldCount}
            </p>
          </div>

          {/* Sold */}
          <div className="border-l border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase font-bold">
              Sold
            </p>
            <p className="text-lg font-bold text-blue-600">
              {activeItem.soldCount || 0}
            </p>
          </div>

          {/* Bad Stock */}
          <div className="border-l border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Bad</p>
            <p className="text-lg font-bold text-orange-600">
              {activeItem.badStock || 0}
            </p>
          </div>

          {/* Total */}
          <div className="border-l border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase font-bold">
              Total
            </p>
            <p className="text-lg font-bold text-gray-700">
              {activeItem.totalCount ||
                activeItem.unsoldCount +
                  (activeItem.soldCount || 0) +
                  (activeItem.badStock || 0)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // --- Render ---
  return (
    <>
      {/* Mobile List */}
      <div className="block md:hidden">
        {groupedData.map((group) => (
          <MobileCard key={group.key} group={group} />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 w-1/4">Item Details</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 w-40 text-center">Unit Selection</th>
              {/* Stock Specific Columns */}
              <th className="py-3 px-4 text-center bg-teal-50 text-teal-800 border-l border-gray-200">
                Good Stock
              </th>
              <th className="py-3 px-4 text-center text-blue-800">Sold</th>
              <th className="py-3 px-4 text-center text-orange-800">
                Bad Stock
              </th>
              <th className="py-3 px-4 text-center text-gray-800 font-bold">
                Total Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedData.map((group) => {
              const activeItem = getActiveItem(group);
              const isOutOfStock = activeItem.unsoldCount === 0;

              return (
                <tr
                  key={group.key}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                    isOutOfStock ? "bg-red-50/30" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(activeItem)}
                >
                  {/* Details */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-800">
                      {activeItem.product || activeItem.productName}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {activeItem.itemCode}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 italic truncate max-w-xs">
                      {getCategoryDisplay(activeItem)}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4">
                    <span className="inline-block bg-gray-100 rounded px-2 py-1 text-xs font-medium border text-gray-600">
                      {activeItem.location || activeItem.locationName}
                    </span>
                  </td>

                  {/* UNIT DROPDOWN */}
                  <td className="py-3 px-4 text-center">
                    {group.variants.length > 1 ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={activeItem.uomId}
                          onChange={(e) =>
                            handleUomChange(group.key, e.target.value)
                          }
                          className="block w-full py-1.5 pl-3 pr-8 text-xs border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md shadow-sm bg-white cursor-pointer"
                        >
                          {group.variants.map((v) => (
                            <option key={v.uniqueId || v.uomId} value={v.uomId}>
                              {v.uomName}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="inline-block bg-gray-50 text-gray-600 border border-gray-200 rounded px-3 py-1 text-xs font-medium">
                        {activeItem.uomName}
                      </span>
                    )}
                  </td>

                  {/* Unsold / Available (Good Stock) */}
                  <td className="py-3 px-4 text-center border-l border-gray-100 bg-teal-50/30">
                    <span
                      className={`font-bold text-lg ${
                        isOutOfStock ? "text-red-500" : "text-teal-700"
                      }`}
                    >
                      {activeItem.unsoldCount}
                    </span>
                  </td>

                  {/* Sold */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium text-blue-700">
                      {activeItem.soldCount || 0}
                    </span>
                  </td>

                  {/* Bad Stock */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium text-orange-700">
                      {activeItem.badStock || 0}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-gray-800">
                      {activeItem.totalCount ||
                        activeItem.unsoldCount +
                          (activeItem.soldCount || 0) +
                          (activeItem.badStock || 0)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InventoryStockTable;
