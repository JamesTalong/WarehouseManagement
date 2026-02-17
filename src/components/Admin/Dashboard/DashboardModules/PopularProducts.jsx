import { useState, useEffect } from "react";
import axios from "axios";
import { IoBagHandle, IoChevronBack, IoChevronForward } from "react-icons/io5";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";

const PopularProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const prodsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await axios.get(`${domain}/api/Transactions/top-products`);
        const transformed = r.data.map((i) => ({
          id: i.productId,
          name: i.productName,
          sold: i.totalQuantity,
        }));
        setProducts(transformed);
      } catch (e) {
        console.error("E:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPages = Math.ceil(products.length / prodsPerPage) || 1;
  const currentProds = products.slice(
    (page - 1) * prodsPerPage,
    page * prodsPerPage
  );

  return (
    <div className="flex flex-col h-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
          <IoBagHandle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-tight">
            Popular Products
          </h2>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-tight">
            Top Selling Items
          </p>
        </div>
      </div>

      {/* Text-Focused List */}
      <div className="flex-1 w-full flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <Loader />
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            No data.
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {/* Table Header-ish row (optional, or just list) */}
            <div className="flex text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              <span className="w-8">Rank</span>
              <span className="flex-1">Product Name</span>
              <span className="text-right">Sold</span>
            </div>

            {currentProds.map((p, index) => {
              const rank = (page - 1) * prodsPerPage + index + 1;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={p.id}
                  className="flex items-center py-2 px-2 rounded hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isTop3
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      #{rank}
                    </span>
                  </div>

                  {/* Product Name */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p
                      className="text-[11px] font-medium text-slate-700 truncate"
                      title={p.name}
                    >
                      {p.name}
                    </p>
                  </div>

                  {/* Sold Count */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-bold text-slate-700">
                      {p.sold}
                    </p>
                    <p className="text-[9px] text-slate-400">Qty</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100">
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

export default PopularProducts;
