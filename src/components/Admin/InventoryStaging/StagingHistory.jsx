// StagingHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { domain } from "../../../security";
import axios from "axios";
import { X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const StagingHistory = ({ onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${domain}/api/BatchStagingsHistory/short`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch staging history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setCurrentPage(1);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setCurrentPage(1);
  };

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history;

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.id.toString().includes(lowerSearch) ||
          (item.productName &&
            item.productName.toLowerCase().includes(lowerSearch)) ||
          (item.location &&
            item.location.toLowerCase().includes(lowerSearch)) ||
          (item.userName && item.userName.toLowerCase().includes(lowerSearch))
      );
    }

    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.batchDate);
        return (
          (!startDate || itemDate >= startDate) &&
          (!endDate || itemDate <= endDate)
        );
      });
    }

    return filtered.sort(
      (a, b) => new Date(b.batchDate) - new Date(a.batchDate)
    );
  }, [history, searchTerm, startDate, endDate]);

  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);

  const paginatedHistory = filteredAndSortedHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
          <p className="text-center text-lg font-semibold text-gray-700">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-6xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          Batch Staging History
        </h2>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search batch ID, product, location, user..."
            className="border border-gray-300 rounded-xl px-4 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-black focus:outline-none transition"
            value={searchTerm}
            onChange={handleSearch}
          />

          <div className="flex gap-3">
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              placeholderText="Start Date"
              className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition"
              dateFormat="yyyy-MM-dd"
              isClearable
            />
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              placeholderText="End Date"
              className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none transition"
              dateFormat="yyyy-MM-dd"
              isClearable
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Batch ID</th>
                <th className="px-6 py-3">Batch Date</th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">User Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedHistory.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{item.id}</td>
                  <td className="px-6 py-4">
                    {new Date(item.batchDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{item.productName}</td>
                  <td className="px-6 py-4">{item.location}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4">{item.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {"<"}
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === index + 1
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              } transition`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StagingHistory;
