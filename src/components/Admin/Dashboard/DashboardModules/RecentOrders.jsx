import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  IoReceipt,
  IoChevronUp,
  IoChevronDown,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";

const RecentOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sort, setSort] = useState({ key: "date", direction: "descending" });

  const fetchData = useCallback(async () => {
    try {
      const r = await axios.get(`${domain}/api/Transactions`);
      setData(r.data);
    } catch (e) {
      console.error("E:", e);
      toast.error("Fetch failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (k) => {
    setSort((s) => ({
      key: k,
      direction:
        s.key === k && s.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const sortedData = useMemo(
    () =>
      [...data].sort((a, b) => {
        const asc = sort.direction === "ascending" ? 1 : -1;
        const vA = sort.key === "date" ? new Date(a.date) : a[sort.key];
        const vB = sort.key === "date" ? new Date(b.date) : b[sort.key];
        if (vA < vB) return -1 * asc;
        if (vA > vB) return 1 * asc;
        return 0;
      }),
    [data, sort]
  );

  const currentItems = sortedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;

  const formatAmount = (a) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(a || 0);

  const renderSortIcon = (key) => {
    if (sort.key !== key) return <div className="w-3 h-3 ml-1 inline-block" />;
    return sort.direction === "ascending" ? (
      <IoChevronUp className="inline ml-1 text-emerald-500" />
    ) : (
      <IoChevronDown className="inline ml-1 text-emerald-500" />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
      <ToastContainer />

      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
          <IoReceipt className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-tight">
            Recent Orders
          </h2>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-tight">
            Transaction History
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th
                onClick={() => handleSort("date")}
                className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                Date {renderSortIcon("date")}
              </th>
              <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Customer
              </th>
              <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Staff
              </th>
              <th className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Payment
              </th>
              <th
                onClick={() => handleSort("totalAmount")}
                className="px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-right whitespace-nowrap"
              >
                Total {renderSortIcon("totalAmount")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px]">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center">
                  <Loader />
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              currentItems.map((t) => (
                <tr
                  key={t.id}
                  className={`group hover:bg-slate-50/80 transition-colors ${
                    t.isVoid ? "bg-red-50/30" : ""
                  }`}
                >
                  {/* Date */}
                  <td className="px-2 py-2 align-top whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">
                        {new Date(t.date).toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                          year: "2-digit",
                        })}
                      </span>
                      {t.isVoid && (
                        <span className="text-[9px] text-red-600 font-bold uppercase">
                          Void
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-2 py-2 align-top">
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-slate-700 truncate max-w-[100px]"
                        title={t?.customer?.customerName}
                      >
                        {t?.customer?.customerName || "Unknown"}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {t?.customer?.customerType || "-"}
                      </span>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="px-2 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      {t?.purchasedProducts?.length > 0 ? (
                        t.purchasedProducts.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex justify-between items-center text-slate-600"
                          >
                            <span
                              className="truncate max-w-[120px] text-[10px]"
                              title={p.productName}
                            >
                              {p.productName || p?.pricelist?.productName}
                            </span>
                            <span className="ml-1 text-[9px] text-slate-400 bg-slate-100 px-1 rounded-sm">
                              x{p.quantity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* Staff */}
                  <td className="px-2 py-2 align-top text-slate-600 whitespace-nowrap">
                    <div className="flex flex-col text-[10px]">
                      {t.preparedBy ? <span>P: {t.preparedBy}</span> : null}
                      {t.checkedBy ? <span>C: {t.checkedBy}</span> : null}
                      {!t.preparedBy && !t.checkedBy && "-"}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="px-2 py-2 align-top whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-slate-600">{t.paymentType}</span>
                      {t.location && (
                        <span className="text-[9px] text-slate-400">
                          {t.location}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-2 py-2 align-top text-right whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        t.isVoid
                          ? "text-red-400 line-through"
                          : "text-emerald-600"
                      }`}
                    >
                      ₱{formatAmount(t.totalAmount)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
        <span className="text-[10px] text-slate-400 font-medium">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <IoChevronBack className="w-3 h-3" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <IoChevronForward className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
