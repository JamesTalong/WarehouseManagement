import { useState, useMemo } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";

const AddShippingSerialSelection = ({
  product,
  availableSerials,
  previouslySelectedIds,
  onClose,
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState([...previouslySelectedIds]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSerialToggle = (serialId) => {
    setSelectedIds((prev) =>
      prev.includes(serialId)
        ? prev.filter((id) => id !== serialId)
        : [...prev, serialId]
    );
  };

  const handleSubmit = () => {
    onSave(product.productId, selectedIds);
  };

  const filteredSerials = useMemo(() => {
    if (!searchTerm.trim()) {
      return availableSerials;
    }
    return availableSerials.filter((serial) =>
      serial.serialName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [availableSerials, searchTerm]);

  // Function to handle Enter key press in search input
  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission or default action
      if (filteredSerials.length === 1) {
        // If exactly one serial matches, select it
        const singleSerial = filteredSerials[0];
        handleSerialToggle(singleSerial.id); // Toggle the serial
        setSearchTerm(""); // Optionally clear the search after selection
      }
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-[1005] p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Select Serials for: {product.productName} ({product.itemCode})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search serials (Enter to select if unique)" // Updated placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown} // Add the onKeyDown handler
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <p className="text-sm text-gray-600 mb-1">
          Available Serials (On Hand: {availableSerials.length}, Displaying:{" "}
          {filteredSerials.length})
        </p>
        <p className="text-sm text-orange-600 mb-3">
          Selected: {selectedIds.length}
        </p>

        {availableSerials.length === 0 ? (
          <p className="text-gray-500">
            No serial numbers available for this product at the selected
            location.
          </p>
        ) : filteredSerials.length === 0 && searchTerm.trim() ? (
          <p className="text-gray-500">
            No serial numbers match your search term "{searchTerm}".
          </p>
        ) : (
          <div className="overflow-y-auto flex-grow mb-4 border rounded-md p-2 max-h-80">
            <ul className="space-y-1">
              {filteredSerials.map((serial) => (
                <li
                  key={serial.id}
                  className={`flex items-center p-2 hover:bg-gray-100 rounded ${
                    selectedIds.includes(serial.id) ? "bg-orange-50" : "" // Highlight selected serials
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`serial-${serial.id}`}
                    checked={selectedIds.includes(serial.id)}
                    onChange={() => handleSerialToggle(serial.id)}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mr-3"
                  />
                  <label
                    htmlFor={`serial-${serial.id}`}
                    className="text-sm text-gray-700 cursor-pointer flex-grow"
                  >
                    {serial.serialName}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-auto pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            disabled={
              selectedIds.length === 0 &&
              previouslySelectedIds.length === 0 &&
              availableSerials.length > 0
            }
          >
            Save Selections ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddShippingSerialSelection;
