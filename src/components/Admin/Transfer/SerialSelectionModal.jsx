import React, { useState, useMemo } from "react";
import { FaTimes, FaSearch, FaBarcode, FaCheck, FaMagic } from "react-icons/fa";

const SerialSelectionModal = ({
  product,
  availableSerials,
  previouslySelectedIds,
  onClose,
  onSave,
}) => {
  // --- STATE ---

  // 🆕 FIXED: We moved the Auto-Select logic INSIDE useState.
  // This runs exactly once when the modal opens, solving the ESLint warning
  // and preventing the need for useEffect.
  const [selectedIds, setSelectedIds] = useState(() => {
    // 1. Convert previous IDs to strings for safety
    const prev = previouslySelectedIds || [];

    // 2. If we already have specific IDs selected, use them.
    if (prev.length > 0) {
      return new Set(prev.map(String));
    }

    // 3. If no IDs selected, but we have a required Quantity...
    const parentQuantity = product?.quantity || 0;

    // 4. ...and we have serials available:
    if (parentQuantity > 0 && availableSerials && availableSerials.length > 0) {
      // Automatically grab the first N serials
      const autoPicked = availableSerials.slice(0, parentQuantity);
      return new Set(autoPicked.map((s) => String(s.id || s.Id)));
    }

    // 5. Otherwise, start empty
    return new Set();
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [autoQty, setAutoQty] = useState("");

  // --- FILTERS ---
  const filteredSerials = useMemo(() => {
    if (!availableSerials) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return availableSerials;

    return availableSerials.filter(
      (serial) =>
        (serial.serialName || "").toLowerCase().includes(term) ||
        (serial.batchName || "").toLowerCase().includes(term)
    );
  }, [availableSerials, searchTerm]);

  // --- HANDLERS ---
  const handleToggle = (rawId) => {
    const id = String(rawId);
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    const newSet = new Set(selectedIds);
    filteredSerials.forEach((s) => {
      if (s.id || s.Id) newSet.add(String(s.id || s.Id));
    });
    setSelectedIds(newSet);
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // --- AUTO PICK BUTTON LOGIC ---
  const handleAutoSelect = () => {
    const qty = parseInt(autoQty);
    if (!qty || qty <= 0) return;

    const unselected = filteredSerials.filter(
      (s) => !selectedIds.has(String(s.id || s.Id))
    );
    const toAdd = unselected.slice(0, qty);

    const newSet = new Set(selectedIds);
    toAdd.forEach((s) => {
      if (s.id || s.Id) newSet.add(String(s.id || s.Id));
    });

    setSelectedIds(newSet);
    setAutoQty("");
  };

  const handleAutoQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAutoSelect();
    }
  };

  // --- SAVE ---
  const handleSave = () => {
    // Convert back to numbers if needed (assuming your IDs are numbers)
    const results = Array.from(selectedIds).map((id) => Number(id));
    onSave(results);
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[1100] p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-white">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaBarcode className="text-orange-500" />
              Serial Selection
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Product:{" "}
              <span className="font-semibold text-gray-700">
                {product.productName}
              </span>
            </p>
            {/* Show user the target quantity */}
            <p className="text-xs text-orange-600 font-medium mt-1">
              Required Quantity: {product.quantity || 0}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-gray-500"
          >
            <FaTimes />
          </button>
        </div>

        {/* TOOLS */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Scan or search serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none shadow-sm"
              autoFocus
            />
            <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  type="number"
                  placeholder="Qty"
                  value={autoQty}
                  onChange={(e) => setAutoQty(e.target.value)}
                  onKeyDown={handleAutoQtyKeyDown}
                  className="w-20 pl-3 pr-2 py-1.5 text-sm border border-gray-300 rounded-l-md focus:ring-orange-500 outline-none"
                  min="1"
                />
                <button
                  onClick={handleAutoSelect}
                  className="bg-gray-800 text-white px-3 py-1.5 text-sm font-medium rounded-r-md hover:bg-gray-700 flex items-center gap-2 transition-colors active:bg-gray-900"
                >
                  <FaMagic className="text-yellow-400" />
                  Auto Pick
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md"
              >
                Select All
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Available Serials ({filteredSerials.length})
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                selectedIds.size === product.quantity
                  ? "text-green-600"
                  : "text-orange-600"
              }`}
            >
              Selected: {selectedIds.size} / {product.quantity}
            </span>
          </div>

          {filteredSerials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p>No serials found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredSerials.map((serial) => {
                const sId = serial.id || serial.Id;
                const sName =
                  serial.serialName || serial.SerialName || "Unknown";
                if (!sId) return null;

                const isSelected = selectedIds.has(String(sId));

                return (
                  <div
                    key={sId}
                    onClick={() => handleToggle(sId)}
                    className={`
                      cursor-pointer rounded-lg border px-3 py-2.5 flex items-center justify-between transition-all duration-200 select-none
                      ${
                        isSelected
                          ? "bg-orange-50 border-orange-500 shadow-sm ring-1 ring-orange-500"
                          : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`
                        w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                        ${
                          isSelected
                            ? "bg-orange-500 border-orange-500"
                            : "bg-white border-gray-300"
                        }
                      `}
                      >
                        {isSelected && (
                          <FaCheck className="text-white text-[10px]" />
                        )}
                      </div>
                      <span
                        className={`text-sm truncate font-medium ${
                          isSelected ? "text-orange-900" : "text-gray-700"
                        }`}
                      >
                        {sName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Total Selected:{" "}
            <span className="font-bold text-gray-800">{selectedIds.size}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg shadow-md hover:bg-orange-700 flex items-center gap-2"
            >
              <FaCheck /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialSelectionModal;
