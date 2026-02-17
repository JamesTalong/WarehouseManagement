// AllPricelists.js
import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Search, MapPin, Package, PlusCircle } from "lucide-react";
import noImage from "../../../../Images/noImage.jpg";

// Components
import Loader from "../../../loader/Loader";
import AddPricelists from "./AddPricelists";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";
import PricelistCard from "./PricelistCard";

const AllPricelists = () => {
  const [pricelists, setPricelists] = useState([]);
  const [filteredPricelists, setFilteredPricelists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pricelistToEdit, setPricelistToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locations, setLocations] = useState([]);

  // Fetch all pricelists
  const fetchPricelists = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${domain}/api/Pricelists`);
      const formattedPricelists = response.data.map((item) => ({
        ...item,
        productImage: item.productImage
          ? item.productImage.startsWith("http")
            ? item.productImage
            : `data:image/jpeg;base64,${item.productImage}`
          : "https://via.placeholder.com/150?text=No+Image",
      }));

      setPricelists(formattedPricelists);
      const uniqueLocations = [
        "All",
        ...new Set(formattedPricelists.map((item) => item.location)),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      toast.error("Failed to fetch pricelists.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricelists();
  }, []);

  // Combined filter logic
  useEffect(() => {
    let filtered = pricelists;

    if (selectedLocation !== "All") {
      filtered = filtered.filter(
        (pricelist) => pricelist.location === selectedLocation
      );
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((pricelist) => {
        const productMatch = (pricelist.product || "")
          .toLowerCase()
          .includes(lowercasedQuery);
        const locationMatch = (pricelist.location || "")
          .toLowerCase()
          .includes(lowercasedQuery);
        const brandMatch = (pricelist.brand?.brandName || "")
          .toLowerCase()
          .includes(lowercasedQuery);
        return productMatch || locationMatch || brandMatch;
      });
    }
    setFilteredPricelists(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, pricelists]);

  // Pagination logic
  const currentData = filteredPricelists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Modal handlers
  const openModal = (pricelist = null) => {
    setPricelistToEdit(pricelist);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setPricelistToEdit(null);
    setIsModalOpen(false);
  };

  // Delete pricelist
  const deletePricelist = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pricelist?"))
      return;

    try {
      await axios.delete(`${domain}/api/Pricelists/${id}`);
      toast.success("Pricelist deleted successfully");
      fetchPricelists(); // Refresh data
    } catch (error) {
      toast.error("Error deleting pricelist");
    }
  };

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: pricelists.length,
      locations: locations.length - 1, // Subtract 'All'
      uniqueProducts: new Set(pricelists.map((p) => p.product)).size,
    }),
    [pricelists, locations]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="max-w-7xl mx-auto">
        {/* --- Header & Title --- */}
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Pricelist Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and manage all product pricelists.
        </p>

        {/* --- Stats Section (Responsive) --- */}
        <div className="mt-6">
          <div
            className="
            flex items-center justify-around p-3 bg-slate-100 rounded-lg text-center
            sm:grid sm:grid-cols-2 sm:gap-4 sm:p-0 sm:bg-transparent sm:text-left
            lg:grid-cols-3
          "
          >
            {/* Stat 1: Total Items */}
            <div className="sm:bg-blue-100 sm:text-blue-800 sm:rounded-xl sm:p-4 sm:flex sm:items-start sm:gap-4">
              <div className="hidden sm:block bg-blue-200 p-2 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 sm:text-blue-800">
                  Total Items
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800 sm:text-blue-800">
                  {stats.total}
                </p>
              </div>
            </div>

            {/* Stat 2: Unique Products */}
            <div className="sm:bg-purple-100 sm:text-purple-800 sm:rounded-xl sm:p-4 sm:flex sm:items-start sm:gap-4">
              <div className="hidden sm:block bg-purple-200 p-2 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 sm:text-purple-800">
                  Unique Products
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800 sm:text-purple-800">
                  {stats.uniqueProducts}
                </p>
              </div>
            </div>

            {/* Stat 3: Locations */}
            <div className="sm:bg-teal-100 sm:text-teal-800 sm:rounded-xl sm:p-4 sm:flex sm:items-start sm:gap-4">
              <div className="hidden sm:block bg-teal-200 p-2 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 sm:text-teal-800">
                  Locations
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800 sm:text-teal-800">
                  {stats.locations}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Controls: Search, Filter, Add --- */}
        <div className="mt-6 grid md:grid-cols-5 gap-4 items-center p-4 bg-white rounded-xl shadow-sm ring-1 ring-slate-200/50">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product, Brand..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative md:col-span-2">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => openModal()}
            className="md:col-span-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle size={18} />
            <span>Add New</span>
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className="mt-6">
          {isLoading ? (
            <Loader />
          ) : (
            <>
              {/* --- DESKTOP VIEW: TABLE --- */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3">Color</th>
                      <th className="px-6 py-3">VatInc</th>
                      <th className="px-6 py-3">Reseller</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-white border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt={item.product}
                            className="w-10 h-10 object-cover rounded-md"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = noImage;
                            }}
                          />
                          <span>{item.product}</span>
                        </td>
                        <td className="px-6 py-4">{item.location}</td>
                        <td className="px-6 py-4">{item.color}</td>
                        <td className="px-6 py-4 font-mono">{item.vatInc}</td>
                        <td className="px-6 py-4 font-mono">{item.reseller}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deletePricelist(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- MOBILE VIEW: CARDS --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:hidden">
                {currentData.map((item) => (
                  <PricelistCard
                    key={item.id}
                    pricelist={item}
                    onEdit={() => openModal(item)}
                    onDelete={() => deletePricelist(item.id)}
                  />
                ))}
              </div>

              {/* --- Pagination --- */}
              {filteredPricelists.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredPricelists.length}
                    currentPage={currentPage}
                    paginate={paginate}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-2xl">
            <AddPricelists
              onClose={closeModal}
              refreshData={fetchPricelists}
              pricelistToEdit={pricelistToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPricelists;
