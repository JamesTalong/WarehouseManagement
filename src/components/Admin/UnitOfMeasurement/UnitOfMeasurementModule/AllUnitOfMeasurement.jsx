import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Ruler,
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  BarChart2,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddUnitOfMeasurement from "./AddUnitOfMeasurement";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// --- Mobile Card Component ---
const UnitCard = ({ unit, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Ruler size={18} />
        </div>
        <div>
          <span className="font-bold text-slate-800 text-lg block">
            {unit.unitName}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            <Tag size={10} /> {unit.code}
          </span>
        </div>
      </div>
    </div>
    <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
      <button
        onClick={() => onEdit(unit)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Edit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(unit.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  </div>
);

const AllUnitOfMeasurements = () => {
  // --- State ---
  const [unitData, setUnitData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState(null);

  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [unitsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/UnitOfMeasurements`;
    try {
      setLoading(true);
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setUnitData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch units of measurement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filter Logic ---
  useEffect(() => {
    const searchLower = searchTerm.toLowerCase();
    const results = unitData.filter(
      (unit) =>
        unit.unitName.toLowerCase().includes(searchLower) ||
        unit.code.toLowerCase().includes(searchLower)
    );
    setFilteredUnits(results);
    setCurrentPage(1);
  }, [searchTerm, unitData]);

  // --- Actions ---
  const deleteUnit = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this unit of measurement?"
      )
    ) {
      return;
    }

    const apiUrl = `${domain}/api/UnitOfMeasurements/${id}`;
    try {
      await axios.delete(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Unit of Measurement Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error("Failed to delete unit of measurement.");
    }
  };

  const openModal = (unit = null) => {
    setUnitToEdit(unit);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setUnitToEdit(null);
    fetchData();
  };

  // --- Pagination Logic ---
  const indexOfLastUnit = currentPage * unitsPerPage;
  const indexOfFirstUnit = indexOfLastUnit - unitsPerPage;
  const currentUnits = filteredUnits.slice(indexOfFirstUnit, indexOfLastUnit);

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
                <Ruler className="text-indigo-600" /> Unit of Measurement
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage measurement units and codes.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Unit
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
              <p className="text-sm text-slate-500">Total Units</p>
              <p className="text-2xl font-bold text-slate-800">
                {unitData.length}
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
              placeholder="Search by Code or Unit Name..."
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
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Unit Name</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUnits.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.unitName}
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
                            onClick={() => deleteUnit(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentUnits.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No units of measurement found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentUnits.map((item) => (
                <UnitCard
                  key={item.id}
                  unit={item}
                  onEdit={openModal}
                  onDelete={deleteUnit}
                />
              ))}
              {currentUnits.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No units found.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                itemsPerPage={unitsPerPage}
                totalItems={filteredUnits.length}
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
            <AddUnitOfMeasurement
              onClose={closeModal}
              refreshData={fetchData}
              unitToEdit={unitToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUnitOfMeasurements;
