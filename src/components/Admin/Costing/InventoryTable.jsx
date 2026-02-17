import React, { useState } from "react";
import { formatPrice, PRICE_TYPES } from "./Constant";

const InventoryTable = ({ groupedData, priceType, onRowClick }) => {
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedMobilePrice, setSelectedMobilePrice] = useState(priceType);

  const [selectedUoms, setSelectedUoms] = useState({});

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

  // --- Mobile Card ---
  const MobileCard = ({ group }) => {
    const activeItem = getActiveItem(group);
    const currentPrice = parseFloat(activeItem[selectedMobilePrice]) || 0;
    const totalValue = currentPrice * activeItem.unsoldCount;
    const isOutOfStock = activeItem.unsoldCount === 0;

    return (
      <div
        onClick={() => onRowClick && onRowClick(activeItem)} // Ensure this is working
        className={`bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 cursor-pointer ${
          isOutOfStock
            ? "border-l-red-500 bg-red-50"
            : "border-l-blue-500 border-gray-200"
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-gray-900 truncate">
              {activeItem.product}
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
            {activeItem.location}
          </span>
          <span className="mx-1">•</span>
          {getCategoryDisplay(activeItem)}
        </p>

        {/* UOM Selector Logic */}
        <div className="mb-3">
          {group.variants.length > 1 ? (
            <div onClick={(e) => e.stopPropagation()}>
              <select
                value={activeItem.uomId}
                onChange={(e) => handleUomChange(group.key, e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5"
              >
                {group.variants.map((v) => (
                  <option key={v.uniqueId || v.uomId} value={v.uomId}>
                    {v.uomName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Static text if only 1 unit
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 inline-block">
              Unit:{" "}
              <span className="font-medium text-gray-700">
                {activeItem.uomName}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 my-2"></div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-500">
              Price ({PRICE_TYPES[selectedMobilePrice]?.label})
            </p>
            <div className="font-medium text-blue-700 text-lg">
              {formatPrice(currentPrice)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Available</p>
            <div
              className={`text-lg font-bold ${
                isOutOfStock ? "text-red-600" : "text-green-600"
              }`}
            >
              {isOutOfStock ? "0" : activeItem.unsoldCount}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {activeItem.uomName}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Val: {formatPrice(totalValue)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Render ---
  return (
    <>
      {/* Mobile Price Switcher */}
      <div className="block md:hidden mb-4">
        <div className="relative">
          <button
            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left shadow-sm flex justify-between items-center"
          >
            <span className="font-medium text-gray-700">
              Price:{" "}
              <span className="text-blue-600">
                {PRICE_TYPES[selectedMobilePrice]?.label}
              </span>
            </span>
            <span className="text-xs">▼</span>
          </button>
          {showPriceDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
              {Object.values(PRICE_TYPES).map((pt) => (
                <button
                  key={pt.key}
                  onClick={() => {
                    setSelectedMobilePrice(pt.key);
                    setShowPriceDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm border-b last:border-0 hover:bg-gray-50"
                >
                  {pt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Grid */}
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
              <th className="py-3 px-4 w-1/5">Item Details</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 w-40 text-center">Unit Selection</th>
              {Object.values(PRICE_TYPES).map((pt) => (
                <th
                  key={pt.key}
                  className={`py-3 px-4 text-center whitespace-nowrap ${
                    priceType === pt.key ? "bg-blue-100 text-blue-800" : ""
                  }`}
                >
                  {pt.label}
                </th>
              ))}
              <th className="py-3 px-4 text-center">Stock</th>
              <th className="py-3 px-4 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedData.map((group) => {
              const activeItem = getActiveItem(group);
              const currentPrice = parseFloat(activeItem[priceType]) || 0;
              const totalValue = currentPrice * activeItem.unsoldCount;
              const isOutOfStock = activeItem.unsoldCount === 0;

              return (
                <tr
                  key={group.key}
                  className={`hover:bg-gray-50 transition-colors ${
                    isOutOfStock ? "bg-red-50/50" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(activeItem)}
                >
                  {/* Details */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-800">
                      {activeItem.product}
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
                      {activeItem.location}
                    </span>
                  </td>

                  {/* UNIT DROPDOWN / STATIC BADGE */}
                  <td className="py-3 px-4 text-center">
                    {group.variants.length > 1 ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={activeItem.uomId}
                          onChange={(e) =>
                            handleUomChange(group.key, e.target.value)
                          }
                          className="block w-full py-1.5 pl-3 pr-8 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm bg-white cursor-pointer"
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

                  {/* Prices */}
                  {Object.values(PRICE_TYPES).map((pt) => (
                    <td
                      key={pt.key}
                      className={`py-3 px-4 text-center whitespace-nowrap ${
                        priceType === pt.key
                          ? "font-bold text-blue-700 bg-blue-50/50"
                          : "text-gray-600"
                      }`}
                    >
                      {formatPrice(activeItem[pt.key])}
                    </td>
                  ))}

                  {/* Stock */}
                  <td className="py-3 px-4 text-center">
                    {isOutOfStock ? (
                      <span className="text-xs font-bold text-red-500 uppercase">
                        Out of Stock
                      </span>
                    ) : (
                      <div className="font-bold text-gray-800">
                        {activeItem.unsoldCount}
                      </div>
                    )}
                  </td>

                  {/* Value */}
                  <td className="py-3 px-4 text-right font-medium text-gray-700">
                    {formatPrice(totalValue)}
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

export default InventoryTable;
