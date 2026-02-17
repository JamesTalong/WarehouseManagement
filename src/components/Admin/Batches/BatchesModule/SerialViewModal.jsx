import React from "react";

const SerialViewModal = ({ isVisible, onClose, serialData }) => {
  if (!isVisible) return null;

  // DEBUG: Check what is actually coming in
  console.log("Modal received:", serialData);

  // FIX: Determine the actual list to render.
  // If serialData is the Batch Object (as per your log), we grab .serialNumbers.
  // If serialData is already an Array, we use it directly.
  const listToRender = Array.isArray(serialData)
    ? serialData
    : serialData?.serialNumbers || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-96 max-h-[80vh] overflow-hidden flex flex-col shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">
          Serial Numbers
        </h2>

        <div className="overflow-y-auto max-h-[60vh] flex-1">
          {/* FIX: Use the calculated listToRender for length check */}
          {listToRender.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No serial numbers found.
            </p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-gray-300 px-4 py-2 font-semibold text-slate-700">
                    Serial Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* FIX: Map over listToRender */}
                {listToRender.map((serial, index) => (
                  <tr key={serial.id || index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-slate-600">
                      {serial.serialName && serial.serialName.trim() !== ""
                        ? serial.serialName
                        : `Item ${index + 1}`}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          serial.isAvailable
                            ? "bg-green-100 text-green-700" // Usually Available is Green
                            : "bg-red-100 text-red-700" // Sold is Red
                        }`}
                      >
                        {/* Logic Check: Your data says isAvailable: false for SOLD items */}
                        {serial.isAvailable ? "Available" : "Sold/Unavailable"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SerialViewModal;
