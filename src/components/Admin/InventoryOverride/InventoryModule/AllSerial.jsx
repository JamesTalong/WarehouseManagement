import React, { useEffect, useState } from "react";
import axios from "axios";
import { domain } from "../../../../security";

const AllSerial = ({ serialNumbers, onClose }) => {
  const [batches, setBatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = `${domain}/api/Batches`;
      try {
        const response = await axios.get(apiUrl, {
          headers: { "Content-Type": "application/json" },
        });

        const batchMapping = response.data.reduce((acc, batch) => {
          acc[batch.id] = batch.batchDate;
          return acc;
        }, {});

        setBatches(batchMapping);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching batch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const optionsDate = { year: "numeric", month: "2-digit", day: "2-digit" };
    const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
    const formattedDate = date.toLocaleDateString([], optionsDate);
    const formattedTime = date
      .toLocaleTimeString([], optionsTime)
      .replace(":00", "");

    return `${formattedDate} (${formattedTime})`;
  };

  const groupedByBatch = serialNumbers.reduce((acc, serial) => {
    if (!acc[serial.batchId]) acc[serial.batchId] = [];
    acc[serial.batchId].push(serial);
    return acc;
  }, {});

  const handleSearch = (e) => setSearchQuery(e.target.value.toLowerCase());

  const filteredSerials = Object.entries(groupedByBatch).reduce(
    (acc, [batchId, serials]) => {
      const filtered = serials.filter((serial) =>
        serial.serialName.toLowerCase().includes(searchQuery)
      );
      if (filtered.length > 0) acc[batchId] = filtered;
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
          <p className="text-lg font-bold mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Serial Numbers</h2>
        <input
          type="text"
          placeholder="Search serial name..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring focus:border-blue-300"
        />
        <div className="space-y-4">
          {Object.entries(filteredSerials).map(([batchId, serials]) => (
            <div key={batchId}>
              <h3 className="text-lg font-semibold mb-2">
                {batches[batchId]
                  ? formatDate(batches[batchId])
                  : "Unknown Date"}
              </h3>
              {serials.some((s) => s.serialName === "") ? (
                <ul className="space-y-2">
                  {serials.some((s) => s.serialName === "") && (
                    <li className="text-gray-700">
                      {serials.filter((s) => s.serialName === "").length} (No
                      Serial)
                    </li>
                  )}
                </ul>
              ) : (
                <ul className="space-y-2">
                  {serials.map((serial) => (
                    <li key={serial.id} className="text-gray-700">
                      {serial.serialName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {Object.keys(filteredSerials).length === 0 && (
            <p className="text-gray-500">No results found</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AllSerial;
