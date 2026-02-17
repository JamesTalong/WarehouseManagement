import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  BarChart2,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddBrands from "./AddBrands";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Simplified Mobile Card Component
const BrandCard = ({ brand, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Tag size={18} />
        </div>
        <span className="font-bold text-slate-800 text-lg">
          {brand.brandName}
        </span>
      </div>
    </div>
    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
      <button
        onClick={() => onEdit(brand)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(brand.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllBrands = () => {
  const [brandData, setBrandData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [brandsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBrands, setFilteredBrands] = useState([]);

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Brands`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setBrandData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch brands.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = brandData.filter((brand) =>
      brand.brandName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBrands(results);
    setCurrentPage(1);
  }, [searchTerm, brandData]);

  const deleteBrand = async (id) => {
    const apiUrl = `${domain}/api/Brands/${id}`;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this brand?"
    );

    if (!confirmDelete) {
      return;
    }
    try {
      await axios.delete(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand.");
    }
  };

  const openModal = (brand = null) => {
    setBrandToEdit(brand);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBrandToEdit(null);
  };

  const indexOfLastBrand = currentPage * brandsPerPage;
  const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;
  const currentBrands = filteredBrands.slice(
    indexOfFirstBrand,
    indexOfLastBrand
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12 ">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Tag className="text-indigo-600" /> Brand Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage product brands and configurations.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Brand
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats (Optional for visual consistency) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Brands</p>
              <p className="text-2xl font-bold text-slate-800">
                {brandData.length}
              </p>
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-2 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Brand Name..."
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
                    <th className="px-6 py-4">Brand Name</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBrands.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.brandName}
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
                            onClick={() => deleteBrand(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentBrands.length === 0 && (
                    <tr>
                      <td
                        colSpan="2"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No brands found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentBrands.map((item) => (
                <BrandCard
                  key={item.id}
                  brand={item}
                  onEdit={openModal}
                  onDelete={deleteBrand}
                />
              ))}
              {currentBrands.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No brands found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={brandsPerPage}
                totalItems={filteredBrands.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Assuming AddBrands has its own internal layout, we wrap it cleanly here */}
            <AddBrands
              onClose={closeModal}
              refreshData={fetchData}
              brandToEdit={brandToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBrands;
