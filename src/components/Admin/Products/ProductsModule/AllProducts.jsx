import React, { useCallback, useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
  Loader,
  Printer,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Package,
  Barcode,
  Tags,
  Filter,
  FileText,
} from "lucide-react";

import AddProducts from "./AddProducts";
import Pagination from "../../Pagination";
import PrintBarcodeComponent from "./PrintBarcodeComponent";
import PrintSelectionModal from "./PrintSelectionModal";
import { domain } from "../../../../security";
import noImage from "../../../../Images/noImage.jpg";

// --- Mobile Card Component (Adapted from SerialCard) ---
const ProductCard = ({ product, onEdit, onDelete, onPrint }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-slate-800">{product.productName}</span>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          product.hasSerial
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {product.hasSerial ? "Has Serial Number" : "No Serial Number"}
      </span>
    </div>

    <div className="text-sm text-slate-600 space-y-2 my-3">
      <div className="grid grid-cols-2 gap-2">
        <p className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-1 rounded">
          <span className="text-slate-400">Code:</span> {product.itemCode}
        </p>
        <p className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-1 rounded">
          <Barcode size={12} /> {product.barCode || "N/A"}
        </p>
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Tags size={12} /> {product.brandName || "-"} /{" "}
        {product.categoryName || "Uncategorized"}
      </p>
    </div>

    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
      <button
        onClick={() => onEdit(product)}
        className="flex-1 py-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-xs font-medium flex justify-center items-center gap-1"
      >
        <Edit size={14} /> Edit
      </button>
      <button
        onClick={() => onPrint(product)}
        className="flex-1 py-2 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 text-xs font-medium flex justify-center items-center gap-1"
      >
        <Printer size={14} /> Print
      </button>
      <button
        onClick={() => onDelete(product.id)}
        className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-xs font-medium flex justify-center items-center gap-1"
      >
        <Trash2 size={14} /> Del
      </button>
    </div>
  </div>
);

const AllProducts = () => {
  // --- STATE MANAGEMENT ---
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productToEdit, setProductToEdit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // UI States
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // Simplified filter example
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Printing States
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedProductsForPrint, setSelectedProductsForPrint] = useState([]);
  const [barcodeToPrint, setBarcodeToPrint] = useState(null);

  const printBarcodeRef = useRef();

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${domain}/api/Products`);
      const formattedData = response.data.map((item) => ({
        ...item,
        productImage: noImage,
      }));
      setProductData(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- SEARCH FILTERING ---
  useEffect(() => {
    let results = productData.filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (product.productName?.toLowerCase() || "").includes(searchLower) ||
        (product.itemCode?.toLowerCase() || "").includes(searchLower) ||
        (product.barCode?.toLowerCase() || "").includes(searchLower)
      );
    });

    // Example of secondary filtering logic similar to Component 1
    if (filterCategory) {
      results = results.filter(
        (item) =>
          (item.categoryName?.toLowerCase() || "").includes(
            filterCategory.toLowerCase()
          ) ||
          (item.brandName?.toLowerCase() || "").includes(
            filterCategory.toLowerCase()
          )
      );
    }

    setFilteredProducts(results);
    setCurrentPage(1);
  }, [searchTerm, filterCategory, productData]);

  // --- ACTIONS ---
  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await axios.delete(`${domain}/api/Products/${id}`);
      toast.success("Product successfully deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    }
  };

  const openModal = (product = null) => {
    setProductToEdit(product);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setProductToEdit(null);
    setIsModalVisible(false);
  };

  // --- PRINT LOGIC ---
  const handlePrint = (product) => {
    if (product?.barCode?.length !== 13 || !/^\d{13}$/.test(product.barCode)) {
      toast.error("Barcode must be a 13-digit EAN-13 format to print.");
      return;
    }
    setBarcodeToPrint(product);
    setTimeout(handlePrintBarcode, 500);
  };

  const handlePrintBarcode = useReactToPrint({
    content: () => printBarcodeRef.current,
    documentTitle: "Product-Barcode",
  });

  const handlePrintAll = () => {
    const printableProducts = filteredProducts.filter(
      (p) => p.barCode && p.barCode.length === 13 && /^\d{13}$/.test(p.barCode)
    );
    if (printableProducts.length === 0) {
      toast.info("No products with valid EAN-13 barcodes to print.");
      return;
    }
    setSelectedProductsForPrint(printableProducts);
    setPrintModalVisible(true);
  };

  const handlePrintSelected = () => {
    const printData = selectedProductsForPrint.map((p) => ({
      barCode: p.barCode,
      productName: p.productName,
    }));
    setBarcodeToPrint(printData);
    setTimeout(handlePrintBarcode, 500);
    setPrintModalVisible(false);
  };

  // --- PAGINATION ---
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Stats Calculation
  const totalProducts = productData.length;
  const totalSerialized = productData.filter((p) => p.hasSerial).length;
  const totalWithBarcode = productData.filter((p) => p.barCode).length;

  return (
    <div className="min-h-screen pb-12 ">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Product Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage inventory items, barcodes, and configurations.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Print All</span>
              </button>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalProducts}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Barcode />
            </div>
            <div>
              <p className="text-sm text-slate-500">With Barcode</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalWithBarcode}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-500 rounded-lg">
              <Tags />
            </div>
            <div>
              <p className="text-sm text-slate-500">Serialized Items</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalSerialized}
              </p>
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, Item Code, or Barcode..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter Brand or Category..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
          </div>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Product </th>
                    <th className="px-6 py-4">Codes</th>
                    <th className="px-6 py-4">Classification</th>
                    <th className="px-6 py-4 text-center">Details</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">
                            {item.productName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded w-fit text-slate-700">
                            {item.itemCode}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {item.barCode || "No Barcode"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="font-medium">
                          {item.brandName || "-"}
                        </div>
                        <div className="text-slate-400">
                          {item.categoryName || "Uncategorized"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.description && item.description.length > 0 ? (
                          <button
                            onClick={() =>
                              setSelectedDescription(item.description)
                            }
                            className="text-slate-400 hover:text-indigo-600 transition"
                            title="View Description"
                          >
                            <FileText size={18} />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.hasSerial
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.hasSerial ? "Serialized" : "Standard"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePrint(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Print Barcode"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => openModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteProduct(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onEdit={openModal}
                  onDelete={deleteProduct}
                  onPrint={handlePrint}
                />
              ))}
              {currentProducts.length === 0 && (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200">
                  No products found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredProducts.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modals and Hidden Components --- */}

      {/* Hidden Print Component */}
      <div style={{ display: "none" }}>
        <PrintBarcodeComponent ref={printBarcodeRef} barcode={barcodeToPrint} />
      </div>

      {/* Edit/Add Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          {/* Passed as prop to child or wrapped here. Assuming AddProducts handles its own internal layout style, 
                 but keeping the wrapper consistent with Component 1 */}
          {/* Note: The AddProducts component itself might need styling tweaks to match, but here we just wrap it */}
          <AddProducts
            onClose={closeModal}
            refreshData={fetchData}
            productToEdit={productToEdit}
          />
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage("")}
        >
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition">
            <X size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Description Modal */}
      {selectedDescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Product Description</h3>
              <button
                onClick={() => setSelectedDescription("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                {selectedDescription}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDescription("")}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Print Modal */}
      <PrintSelectionModal
        visible={printModalVisible}
        products={filteredProducts}
        selectedProducts={selectedProductsForPrint}
        onClose={() => setPrintModalVisible(false)}
        onPrint={handlePrintSelected}
        onCheckboxChange={(selection) => setSelectedProductsForPrint(selection)}
      />
    </div>
  );
};

export default AllProducts;
