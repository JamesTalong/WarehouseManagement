// components/modals/SearchItemModal.jsx
import React, { useState, useEffect } from "react"; // Add useEffect
import axios from "axios";
import { domain } from "../../../../security";
import { toast } from "react-toastify"; // Good practice for error messages

const SearchItemModal = ({ onSelectProduct, onClose }) => {
  // Remove 'products' prop
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]); // New state for fetched products
  const [loading, setLoading] = useState(true); // New loading state
  const [error, setError] = useState(null); // New error state

  // Fetch all products when the modal mounts
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true); // Start loading
        const response = await axios.get(`${domain}/api/Products`);
        console.log("Fetched Products:", response.data); // Debugging log

        if (response.data) {
          const uniqueProducts = [];
          const seenItemCodes = new Set();
          response.data.forEach((pricelist) => {
            if (pricelist.itemCode && !seenItemCodes.has(pricelist.itemCode)) {
              uniqueProducts.push({
                itemCode: pricelist.itemCode,
                product: pricelist.product || "Unnamed Product", // Adjust this if there's another field for product name
                id: pricelist.id,
              });
              seenItemCodes.add(pricelist.itemCode);
            }
          });
          setAllProducts(uniqueProducts);
        }
      } catch (err) {
        console.error("Error fetching all products for search:", err);
        toast.error("Failed to load products for search.");
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false); // End loading
      }
    };
    fetchAllProducts();
  }, []); // Empty dependency array means it runs once on mount

  const filteredProducts = allProducts.filter(
    // Use allProducts from state
    (p) =>
      p.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  console.log("Filtered Products:", filteredProducts); // Debugging log

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-[60]">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <h4 className="text-lg font-bold mb-4 text-gray-800">
          Search Product by Item Code or Name
        </h4>

        {loading ? (
          <p className="text-center text-blue-600 mb-4">Loading products...</p>
        ) : error ? (
          <p className="text-center text-red-600 mb-4">{error}</p>
        ) : (
          <>
            <input
              type="text"
              placeholder="Search by product name or item code..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex-grow overflow-y-auto mb-4 border border-gray-200 rounded-md">
              {filteredProducts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredProducts.map((p) => (
                    <li
                      key={p.id}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                      onClick={() => onSelectProduct(p)}
                    >
                      <div>
                        <p className="font-medium text-gray-800">{p.product}</p>
                        <p className="text-sm text-gray-500">
                          Item Code: {p.itemCode}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                      >
                        Select
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 text-center text-gray-500">
                  No products found.
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchItemModal;
