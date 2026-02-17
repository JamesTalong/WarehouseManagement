// src/components/AllPos/ProductTable.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Trash2, Tag, X, Percent } from "lucide-react";

const ProductTable = ({
  allProducts,
  paginatedProducts,
  totalPages,
  currentPage,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onDeleteItem,
  onChangePage,
  onOpenSerialModal,
  onUpdateDiscount,
  onUpdateQuantity,
  purchasedSerials,
}) => {
  // State to toggle the visibility of the ENTIRE discount column
  const [isDiscountColumnVisible, setIsDiscountColumnVisible] = useState(false);

  // Check if any product has a discount to auto-show column if needed (optional, but good UX)
  useEffect(() => {
    const hasActiveDiscounts = allProducts.some((p) => p.discount > 0);
    if (hasActiveDiscounts) {
      setIsDiscountColumnVisible(true);
    }
  }, [allProducts]);

  const handleShowDiscount = () => {
    setIsDiscountColumnVisible(true);
  };

  const handleHideDiscountColumn = () => {
    setIsDiscountColumnVisible(false);
  };

  const calculateSubtotal = (product) => {
    const subtotal = product.quantity * product.price - (product.discount || 0);
    return subtotal < 0
      ? { value: subtotal, warning: true }
      : { value: subtotal, warning: false };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(value) || 0);
  };

  const getMaxQuantity = (currentItem) => {
    const currentRate = currentItem.conversionRate || 1;
    const totalStockInBase = currentItem.maxQuantity * currentRate;
    const usedByOthersInBase = allProducts
      .filter(
        (p) => p.productId === currentItem.productId && p.id !== currentItem.id
      )
      .reduce((sum, p) => sum + p.quantity * (p.conversionRate || 1), 0);
    const remainingBaseForThisItem = totalStockInBase - usedByOthersInBase;
    const maxAllowed = Math.floor(remainingBaseForThisItem / currentRate);
    return Math.max(0, maxAllowed);
  };

  return (
    <div className="mb-10">
      {/* DESKTOP VIEW */}
      <div className="hidden md:block overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr className="bg-gray-100">
              <th className="w-[30%] px-3 py-3 text-left font-medium text-gray-700">
                Name
              </th>
              <th className="w-[15%] px-3 py-3 text-left font-medium text-gray-700">
                Price
              </th>
              <th className="w-[20%] px-3 py-3 text-left font-medium text-gray-700">
                Quantity
              </th>

              {isDiscountColumnVisible && (
                <th className="w-[15%] px-3 py-3 text-center font-medium text-gray-700">
                  <div className="flex items-center justify-center gap-1">
                    Discount
                    <button
                      onClick={handleHideDiscountColumn}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Hide Column"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </th>
              )}

              <th className="w-[15%] px-3 py-3 text-left font-medium text-gray-700">
                Subtotal
              </th>
              <th className="w-[10%] px-3 py-3 text-left font-medium text-gray-700">
                Serial
              </th>
              <th className="w-[5%] px-3 py-3 text-center font-medium text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => {
              // -------------------------------------------------
              // CONSOLE LOG ADDED HERE
              console.log("Current Product:", product);
              // -------------------------------------------------

              const { value: subtotal, warning } = calculateSubtotal(product);
              const maxAllowed = getMaxQuantity(product);
              const isMaxReached = product.quantity >= maxAllowed;

              return (
                <tr
                  key={product.id}
                  className={`border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-600 ${
                    warning ? "bg-red-100 dark:bg-red-900/20" : ""
                  }`}
                >
                  {/* Name */}
                  <td className="px-3 py-3 text-sm font-medium">
                    {product.name}
                    <span className="block text-xs text-gray-400">
                      {product.uom}
                    </span>
                  </td>

                  {/* Price + Trigger Icon */}
                  <td className="px-3 py-3 text-sm">
                    <div className="flex items-center gap-2 group">
                      <span>{formatCurrency(product.price)}</span>

                      {!isDiscountColumnVisible && (
                        <button
                          onClick={handleShowDiscount}
                          className="text-gray-300 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                          title="Add Discount"
                        >
                          <Tag size={14} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onDecreaseQuantity(product.id)}
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        disabled={product.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={product.quantity || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val <= maxAllowed) {
                            onUpdateQuantity(product.id, val);
                          }
                        }}
                        className="w-14 text-center bg-gray-100 border rounded-md px-2 py-1 global-search-input dark:bg-gray-700 dark:border-gray-600"
                        min={1}
                        max={maxAllowed}
                      />
                      <button
                        onClick={() => onIncreaseQuantity(product.id)}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          isMaxReached
                            ? "bg-red-100 text-red-400 cursor-not-allowed"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        disabled={isMaxReached}
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* CONDITIONAL DISCOUNT CELL */}
                  {isDiscountColumnVisible && (
                    <td className="px-3 py-3 text-center animate-fadeIn">
                      <input
                        type="number"
                        value={product.discount || 0}
                        onChange={(e) =>
                          onUpdateDiscount(product.id, Number(e.target.value))
                        }
                        className="w-full text-center bg-white border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                        placeholder="0"
                        autoFocus={product.discount === 0}
                      />
                    </td>
                  )}

                  {/* Subtotal */}
                  <td className="px-3 py-3 text-sm font-semibold">
                    {formatCurrency(subtotal)}
                    {warning && (
                      <span className="text-red-500 text-xs ml-2">
                        Negative!
                      </span>
                    )}
                  </td>

                  {/* Serial */}
                  <td className="px-3 py-2 text-center">
                    {product.hasSerial && (
                      <button
                        onClick={() => onOpenSerialModal(product)}
                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600"
                      >
                        {purchasedSerials[product.id] ? "Update" : "Serial"}
                      </button>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onDeleteItem(product.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-3">
        {paginatedProducts.map((product) => {
          const { value: subtotal, warning } = calculateSubtotal(product);
          const maxAllowed = getMaxQuantity(product);
          const isMaxReached = product.quantity >= maxAllowed;

          const showInputMobile =
            isDiscountColumnVisible || product.discount > 0;

          return (
            <div
              key={product.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border ${
                warning
                  ? "border-red-500 bg-red-50"
                  : "border-gray-100 dark:border-gray-700"
              }`}
            >
              {/* Header: Name + Delete */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                    {product.name}
                  </h3>
                  <span className="text-xs text-gray-400">{product.uom}</span>
                </div>
                <button
                  onClick={() => onDeleteItem(product.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Row: Price, Discount Trigger, Quantity */}
              <div className="flex flex-wrap items-center justify-between gap-y-3">
                {/* Price Section */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">
                      {formatCurrency(product.price)}
                    </span>

                    {/* Mobile Trigger Icon */}
                    {!showInputMobile && (
                      <button
                        onClick={handleShowDiscount}
                        className="text-gray-300 hover:text-blue-500"
                      >
                        <Tag size={16} />
                      </button>
                    )}
                  </div>

                  {/* Mobile Discount Input */}
                  {showInputMobile && (
                    <div className="mt-1 flex items-center gap-2 animate-fadeIn">
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        Disc:
                      </span>
                      <input
                        type="number"
                        value={product.discount || 0}
                        onChange={(e) =>
                          onUpdateDiscount(product.id, Number(e.target.value))
                        }
                        className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Quantity Control */}
                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                  <button
                    onClick={() => onDecreaseQuantity(product.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md transition shadow-sm disabled:opacity-50"
                    disabled={product.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={product.quantity || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= maxAllowed) {
                        onUpdateQuantity(product.id, val);
                      }
                    }}
                    className="w-10 text-center bg-transparent text-sm font-semibold outline-none"
                    min={0}
                    max={maxAllowed}
                  />
                  <button
                    onClick={() => onIncreaseQuantity(product.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition shadow-sm font-bold ${
                      isMaxReached
                        ? "text-red-400 cursor-not-allowed bg-red-50"
                        : "text-gray-600 hover:bg-white"
                    }`}
                    disabled={isMaxReached}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Footer: Subtotal + Serial */}
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase font-bold">
                    Total
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      warning ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {product.hasSerial && (
                  <button
                    onClick={() => onOpenSerialModal(product)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      purchasedSerials[product.id]
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {purchasedSerials[product.id] ? "SN Added" : "+ Serial"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center my-6 gap-2">
          {[...Array(totalPages).keys()].map((index) => (
            <button
              key={index}
              onClick={() => onChangePage(index + 1)}
              className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                currentPage === index + 1
                  ? "bg-blue-600 text-white shadow-md transform scale-105"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

ProductTable.propTypes = {
  allProducts: PropTypes.array.isRequired,
  paginatedProducts: PropTypes.array.isRequired,
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onIncreaseQuantity: PropTypes.func.isRequired,
  onDecreaseQuantity: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onChangePage: PropTypes.func.isRequired,
  onOpenSerialModal: PropTypes.func.isRequired,
  onUpdateDiscount: PropTypes.func.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  purchasedSerials: PropTypes.object.isRequired,
};

export default ProductTable;
