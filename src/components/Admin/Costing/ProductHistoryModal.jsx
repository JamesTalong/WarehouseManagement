import React, { useState, useEffect, useMemo } from "react";
import Loader from "../../loader/Loader";
import Pagination from "../Pagination";
import { formatPrice } from "./Constant";
import { domain } from "../../../security";

const ProductHistoryModal = ({ isOpen, onClose, product }) => {
  // --- State ---
  const [historyData, setHistoryData] = useState({
    product: {},
    statusBreakdown: [],
    timeline: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  // --- Fetch Data ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!product?.productId) return;

      setLoading(true);
      try {
        const locId = product.locationId || 0;
        // Using the updated endpoint that returns { product, statusBreakdown, timeline }
        const response = await fetch(
          `${domain}/api/products/${product.productId}/history?locationId=${locId}`,
        );

        if (response.ok) {
          const data = await response.json();
          setHistoryData(data);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    } else {
      // Cleanup
      setHistoryData({ product: {}, statusBreakdown: [], timeline: [] });
      setSearchQuery("");
      setCurrentPage(1);
    }
  }, [isOpen, product]);

  // --- Stats Calculation Logic ---
  // Aggregates the specific InventoryStatus names into 4 main buckets
  const stats = useMemo(() => {
    const breakdown = historyData.statusBreakdown || [];

    const getSum = (keywords) =>
      breakdown
        .filter((item) =>
          keywords.some((k) => item.statusName?.toUpperCase().includes(k)),
        )
        .reduce((sum, item) => sum + item.count, 0);

    return {
      good: getSum(["GOOD", "AVAILABLE"]),
      sold: getSum(["SOLD"]),
      damaged: getSum(["BAD", "DAMAGED", "RETURNED_BAD"]),
      quarantine: getSum(["QUARANTINE", "RESERVED"]),
      totalPhysical: breakdown.reduce((sum, item) => sum + item.count, 0),
    };
  }, [historyData.statusBreakdown]);

  // --- Filter Logic ---
  const filteredTimeline = useMemo(() => {
    if (!historyData.timeline) return [];
    if (!searchQuery) return historyData.timeline;

    const lower = searchQuery.toLowerCase();
    return historyData.timeline.filter(
      (item) =>
        item.transactionNo?.toLowerCase().includes(lower) ||
        item.referenceNo?.toLowerCase().includes(lower) ||
        item.partyName?.toLowerCase().includes(lower) ||
        item.statusContext?.toLowerCase().includes(lower),
    );
  }, [historyData.timeline, searchQuery]);

  // --- Pagination ---
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredTimeline.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  useEffect(() => setCurrentPage(1), [searchQuery]);

  // --- Helper: Number Formatting ---
  const formatQty = (val) =>
    parseFloat(val).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const getImageSrc = (imgString) => {
    if (!imgString) return null;
    // If it already has the prefix or is a http link, return as is
    if (imgString.startsWith("data:image") || imgString.startsWith("http")) {
      return imgString;
    }
    // Otherwise, append the Base64 header
    return `data:image/jpeg;base64,${imgString}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-70 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-gray-50 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-200">
          {/* Header Section */}
          <div className="bg-white px-6 py-5 border-b border-gray-200 flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {/* Product Image Thumbnail */}
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                {historyData.product?.productImage ? (
                  <img
                    // USE THE HELPER FUNCTION HERE
                    src={getImageSrc(historyData.product.productImage)}
                    alt="Product"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {historyData.product?.productName || "Loading..."}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="bg-blue-100 text-blue-800 text-xs font-mono font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                    {historyData.product?.itemCode || "..."}
                  </span>
                  <span className="text-sm text-gray-500">
                    Tracking History
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 2. Status Dashboard (The "Best Logic" for Tracking) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-6 bg-white border-b border-gray-200">
            <StatusCard
              label="Good Stock"
              count={stats.good}
              icon="✅"
              bgColor="bg-green-50"
              textColor="text-green-700"
              borderColor="border-green-100"
            />
            <StatusCard
              label="Sold Items"
              count={stats.sold}
              icon="📤"
              bgColor="bg-gray-50"
              textColor="text-gray-600"
              borderColor="border-gray-100"
            />
            <StatusCard
              label="Quarantine"
              count={stats.quarantine}
              icon="🚧"
              bgColor="bg-yellow-50"
              textColor="text-yellow-700"
              borderColor="border-yellow-100"
            />
            <StatusCard
              label="Damaged / Bad"
              count={stats.damaged}
              icon="⚠️"
              bgColor="bg-red-50"
              textColor="text-red-700"
              borderColor="border-red-100"
            />
          </div>

          {/* 3. Toolbar & Search */}
          <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                placeholder="Search PO, Sales Order, Vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Timeline:{" "}
              <span className="text-gray-900">
                {filteredTimeline.length} Events
              </span>
            </div>
          </div>

          {/* 4. Timeline Table */}
          <div className="bg-white min-h-[350px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader />
                <p className="text-gray-400 text-sm animate-pulse">
                  Analyzing Inventory Movement...
                </p>
              </div>
            ) : filteredTimeline.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Movement Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Qty (Unit)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Qty (Base)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentItems.map((item, index) => {
                      const isIncoming = item.type?.includes("IN");
                      const colorClass = isIncoming ? "green" : "orange"; // Tailwind color key

                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(item.date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Movement Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800 border border-${colorClass}-200`}
                            >
                              {isIncoming ? (
                                <svg
                                  className="mr-1.5 h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="mr-1.5 h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                  />
                                </svg>
                              )}
                              {isIncoming ? "PURCHASE" : "SALES / OUT"}
                            </span>
                            {item.statusContext && (
                              <div className="text-[10px] text-gray-400 mt-1 pl-2">
                                Status: {item.statusContext}
                              </div>
                            )}
                          </td>

                          {/* Reference & Party */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center bg-${colorClass}-50 text-${colorClass}-600 font-bold text-xs mr-3 border border-${colorClass}-100`}
                              >
                                {item.partyName
                                  ? item.partyName.charAt(0)
                                  : "?"}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.transactionNo}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Ref: {item.referenceNo}
                                </div>
                                <div className="text-xs text-gray-500 italic mt-0.5 truncate max-w-[150px]">
                                  {item.partyName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Quantity (Transaction Unit) */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div
                              className={`text-sm font-bold text-${colorClass}-600`}
                            >
                              {isIncoming ? "+" : "-"}
                              {formatQty(item.quantity)}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                              {item.uomName}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {formatPrice(item.unitPrice)}/ea
                            </div>
                          </td>

                          {/* Quantity (Base Unit) */}
                          <td className="px-6 py-4 whitespace-nowrap text-right bg-gray-50/50">
                            <div className="text-sm font-mono text-gray-600">
                              {isIncoming ? "+" : ""}
                              {formatQty(item.baseQuantity)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.baseUomName}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* 5. Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            {filteredTimeline.length > 0 && (
              <div className="flex justify-center">
                <Pagination
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={filteredTimeline.length}
                  paginate={setCurrentPage}
                  currentPage={currentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const StatusCard = ({
  label,
  count,
  icon,
  bgColor,
  textColor,
  borderColor,
}) => (
  <div
    className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow`}
  >
    <div className="text-3xl mb-1">{icon}</div>
    <div className={`text-2xl font-bold ${textColor}`}>{count}</div>
    <div
      className={`text-xs uppercase font-bold tracking-wider opacity-80 ${textColor}`}
    >
      {label}
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full py-12">
    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="h-8 w-8 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900">No History Available</h3>
    <p className="text-gray-500 text-sm mt-1">
      This product has no recorded movements in this location.
    </p>
  </div>
);

export default ProductHistoryModal;
