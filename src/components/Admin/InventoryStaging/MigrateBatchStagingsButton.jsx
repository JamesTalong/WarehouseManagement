import React, { useState } from "react";
import axios from "axios";
import { domain } from "../../../security";

const MigrateBatchStagingsButton = ({ refetchData }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${domain}/api/Batches/migrate-from-stagings`
      );
      refetchData();
      alert(response.data.message);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Migration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Migrating..." : "Save"}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Confirm Migration</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will move all batch stagings into final batches and delete
              them. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleMigrate}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrateBatchStagingsButton;
