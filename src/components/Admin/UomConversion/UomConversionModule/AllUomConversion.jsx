import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Scale,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  BarChart2,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddUomConversion from "./AddUomConversion";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// --- Mobile Card Component ---
const ConversionCard = ({ conversion, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Scale size={18} />
        </div>
        <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
          <span>{conversion.fromUom?.code || "?"}</span>
          <ArrowRight size={16} className="text-slate-400" />
          <span>{conversion.toUom?.code || "?"}</span>
        </div>
      </div>
    </div>

    <div className="bg-slate-50 p-3 rounded-md mb-4 text-center">
      <span className="text-xs text-slate-500 uppercase font-semibold">
        Conversion Rate
      </span>
      <p className="text-xl font-mono font-bold text-indigo-600">
        {conversion.conversionRate}
      </p>
    </div>

    <div className="flex gap-2 pt-3 border-t border-slate-100">
      <button
        onClick={() => onEdit(conversion)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(conversion.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllUomConversions = () => {
  // --- State ---
  const [conversionData, setConversionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [conversionToEdit, setConversionToEdit] = useState(null);

  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversions, setFilteredConversions] = useState([]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const apiUrl = `${domain}/api/UomConversions`;
    try {
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setConversionData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch UOM conversions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filter Logic ---
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = conversionData.filter(
      (conv) =>
        (conv.fromUom?.code || "")
          .toLowerCase()
          .includes(lowercasedSearchTerm) ||
        (conv.toUom?.code || "").toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredConversions(results);
    setCurrentPage(1);
  }, [searchTerm, conversionData]);

  // --- Actions ---
  const deleteConversion = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this UOM conversion?")
    ) {
      return;
    }
    const apiUrl = `${domain}/api/UomConversions/${id}`;
    try {
      await axios.delete(apiUrl);
      toast.success("UOM Conversion Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting conversion:", error);
      toast.error("Failed to delete UOM conversion.");
    }
  };

  const openModal = (conversion = null) => {
    setConversionToEdit(conversion);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setConversionToEdit(null);
    fetchData();
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConversions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12 ">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Sticky Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Scale className="text-indigo-600" /> UOM Conversions
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage unit conversion rules and factors.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Conversion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats Card --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Rules</p>
              <p className="text-2xl font-bold text-slate-800">
                {conversionData.length}
              </p>
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by From/To Unit Code..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">From Unit</th>
                    <th className="px-6 py-4">To Unit</th>
                    <th className="px-6 py-4">Conversion Rate</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.fromUom?.code || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.toUom?.code || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.conversionRate}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteConversion(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No conversion rules found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentItems.map((item) => (
                <ConversionCard
                  key={item.id}
                  conversion={item}
                  onEdit={openModal}
                  onDelete={deleteConversion}
                />
              ))}
              {currentItems.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No conversion rules found.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredConversions.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <AddUomConversion
              onClose={closeModal}
              refreshData={fetchData}
              conversionToEdit={conversionToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUomConversions;
