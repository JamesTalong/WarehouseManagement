import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  Zap,
  Loader as LoaderIcon,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddSellingPrice from "./AddSellingPrice.jsx";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const AllSellingPriceHistories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [productUomsMap, setProductUomsMap] = useState({});
  const [modalConfig, setModalConfig] = useState({
    itemToEdit: null,
    prefillData: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/SellingPriceHistories`);
      setData(response.data);
      const distinctLocations = [
        ...new Set(
          response.data.map((item) => item.locationName).filter(Boolean)
        ),
      ];
      distinctLocations.sort();
      setLocations([...distinctLocations, "All"]);
      setSelectedLocation((prev) =>
        prev && prev !== "All" && distinctLocations.includes(prev)
          ? prev
          : distinctLocations.length > 0
          ? distinctLocations[0]
          : "All"
      );
    } catch (error) {
      toast.error("Failed to fetch selling prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedData = useMemo(() => {
    const groups = {};
    data.forEach((item) => {
      const key = `${item.productId}-${item.locationId}`;
      if (!groups[key]) {
        groups[key] = {
          uniqueKey: key,
          productId: item.productId,
          productName: item.productName,
          locationId: item.locationId,
          locationName: item.locationName,
          notes: item.notes,
          standardPrices: {},
          promos: [],
        };
      }
      if (item.endDate) groups[key].promos.push(item);
      else groups[key].standardPrices[item.uom] = item;
    });
    return Object.values(groups);
  }, [data]);

  const filteredGroups = groupedData.filter((group) => {
    const matchesLocation =
      selectedLocation === "All" || group.locationName === selectedLocation;
    return (
      (group.productName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) && matchesLocation
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredGroups.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );

  useEffect(() => {
    const fetchUoms = async () => {
      const visibleIds = [
        ...new Set(currentItems.map((item) => item.productId)),
      ].filter((id) => !productUomsMap[id]);
      if (visibleIds.length === 0) return;
      const results = await Promise.all(
        visibleIds.map(async (id) => {
          try {
            const res = await axios.get(
              `${domain}/api/Products/${id}/pricing-uoms`
            );
            return { id, uoms: res.data };
          } catch {
            return { id, uoms: [] };
          }
        })
      );
      setProductUomsMap((prev) => ({
        ...prev,
        ...Object.fromEntries(results.map((r) => [r.id, r.uoms])),
      }));
    };
    if (currentItems.length > 0) fetchUoms();
  }, [currentItems, productUomsMap]);

  const openEdit = (item) => {
    setModalConfig({ itemToEdit: item, prefillData: null });
    setIsModalVisible(true);
  };
  const openAdd = (productId, locationId, uomCode, isSpecial = false) => {
    const prefillData = productId
      ? { productId, locationId, prefillUom: uomCode, isSpecial }
      : null;
    setModalConfig({ itemToEdit: null, prefillData });
    setIsModalVisible(true);
  };
  const deleteItem = async (id) => {
    if (window.confirm("Delete this price?")) {
      try {
        await axios.delete(`${domain}/api/SellingPriceHistories/${id}`);
        toast.success("Deleted");
        fetchData();
      } catch {
        toast.error("Failed to delete.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Reference-Style Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Zap className="text-indigo-600" /> Selling Price Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage standard pricing and promotional offers per branch.
              </p>
            </div>
            <button
              onClick={() => openAdd(null, null, null)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all active:scale-95"
            >
              <Plus size={18} /> Add New Price
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Filters (Minimal Adjustment) --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product Name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm appearance-none bg-white font-medium text-slate-700"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "All" ? "All Locations" : loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Table Area --- */}
        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-1/4">Product & Location</th>
                  <th className="px-6 py-4 w-3/4">Pricing Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((group) => {
                    const allowedUomObjects =
                      productUomsMap[group.productId] || [];
                    allowedUomObjects.sort((a, b) =>
                      (a.code || "").localeCompare(b.code || "")
                    );
                    return (
                      <tr
                        key={group.uniqueKey}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <td className="px-6 py-6 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-lg">
                              {group.productName}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                              <MapPin size={12} /> {group.locationName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase w-16">
                                Standard:
                              </span>
                              {allowedUomObjects.map((uomObj) => {
                                const priceItem =
                                  group.standardPrices[uomObj.code];
                                return priceItem ? (
                                  <div
                                    key={uomObj.code}
                                    className="relative group"
                                  >
                                    <button
                                      onClick={() => openEdit(priceItem)}
                                      className="flex flex-col items-center min-w-[100px] p-2 bg-white border-2 border-indigo-50 hover:border-indigo-500 rounded-lg shadow-sm transition-all"
                                    >
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                                        {uomObj.name || uomObj.code}
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        ₱{priceItem.vatInc.toLocaleString()}
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => deleteItem(priceItem.id)}
                                      className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    key={uomObj.code}
                                    onClick={() =>
                                      openAdd(
                                        group.productId,
                                        group.locationId,
                                        uomObj.code
                                      )
                                    }
                                    className="flex flex-col items-center justify-center min-w-[100px] h-[54px] border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all gap-1"
                                  >
                                    <Plus size={14} />
                                    <span className="text-[9px] font-bold uppercase">
                                      Add {uomObj.code}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-orange-400 uppercase w-16 flex items-center gap-1">
                                <Zap size={10} /> Promos:
                              </span>
                              {group.promos.map((promo) => (
                                <div key={promo.id} className="relative group">
                                  <button
                                    onClick={() => openEdit(promo)}
                                    className="flex flex-col px-3 py-2 bg-orange-50/50 border border-orange-200 hover:border-orange-400 rounded-lg transition-all"
                                  >
                                    <div className="flex justify-between gap-4">
                                      <span className="text-[9px] font-bold text-orange-600 uppercase">
                                        {promo.uom}
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        ₱{promo.vatInc.toLocaleString()}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-0.5 font-medium">
                                      Ends:{" "}
                                      {new Date(
                                        promo.endDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => deleteItem(promo.id)}
                                    className="absolute -top-2 -right-2 bg-white border border-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() =>
                                  openAdd(
                                    group.productId,
                                    group.locationId,
                                    "SPECIAL",
                                    true
                                  )
                                }
                                className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold text-orange-600 border border-orange-200 border-dashed rounded-lg hover:bg-orange-50 transition-all"
                              >
                                <Plus size={10} /> Add Promo
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="2"
                      className="text-center py-10 text-slate-400"
                    >
                      No selling prices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-slate-100">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredGroups.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <AddSellingPrice
              onClose={() => setIsModalVisible(false)}
              refreshData={fetchData}
              itemToEdit={modalConfig.itemToEdit}
              prefillData={modalConfig.prefillData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSellingPriceHistories;
