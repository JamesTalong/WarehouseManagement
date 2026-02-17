import React from "react";

const TransactionDetailsModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Original Transfer #{data.id}
            </h3>
            <p className="text-xs text-gray-500">
              Sent on: {new Date(data.transferredDate).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="p-3 bg-blue-50 rounded border border-blue-100">
              <span className="block text-gray-500 text-xs uppercase font-bold">
                From
              </span>
              <span className="font-semibold text-gray-800">
                {data.fromLocationName}
              </span>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-100">
              <span className="block text-gray-500 text-xs uppercase font-bold">
                To
              </span>
              <span className="font-semibold text-gray-800">
                {data.toLocationName}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase font-bold">
                Release By
              </span>
              <span className="text-gray-700">{data.releaseBy}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase font-bold">
                Status
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">
                {data.status}
              </span>
            </div>
          </div>

          <h4 className="font-bold text-gray-700 mb-2 pb-1 border-b">
            Items Sent
          </h4>
          <div className="space-y-3">
            {data.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start bg-gray-50 p-3 rounded"
              >
                <div>
                  <div className="font-bold text-gray-800">
                    {item.productName}
                  </div>
                  <div className="text-xs text-gray-500">{item.itemCode}</div>
                  {item.notes && (
                    <div className="text-xs text-gray-500 italic mt-1">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    Qty: {item.quantity}
                  </div>
                  {item.hasSerial && (
                    <div className="text-xs text-gray-400 mt-1">Serialized</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.notes && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-100">
              <strong>Transfer Notes:</strong> {data.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded shadow text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
