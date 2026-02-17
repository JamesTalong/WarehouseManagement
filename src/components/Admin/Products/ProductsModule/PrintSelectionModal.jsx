import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const PrintSelectionModal = ({
  visible,
  products,
  selectedProducts,
  onClose,
  onPrint,
  onCheckboxChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [checkedPages, setCheckedPages] = useState(new Set());
  const [checkedRange, setCheckedRange] = useState({ start: null, end: null });
  const [showRangeInputs, setShowRangeInputs] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!visible) return null;

  const filteredProducts = products.filter((product) =>
    product?.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const isProductSelected = (productId) =>
    selectedProducts.some((p) => p.id === productId);

  const handleCheckboxChange = (product) => {
    const updatedSelectedProducts = [...selectedProducts];
    const index = updatedSelectedProducts.findIndex((p) => p.id === product.id);
    if (index > -1) {
      updatedSelectedProducts.splice(index, 1);
    } else {
      updatedSelectedProducts.push(product);
    }
    onCheckboxChange(updatedSelectedProducts);
  };

  const handleSelectAll = () => {
    onCheckboxChange(filteredProducts);
  };

  const handleUnselectAll = () => {
    onCheckboxChange([]);
  };

  const handlePageCheck = (pageNumber) => {
    const isChecked = checkedPages.has(pageNumber);
    const updatedCheckedPages = new Set(checkedPages);
    const updatedSelectedProducts = [...selectedProducts];

    currentProducts.forEach((product) => {
      const isAlreadySelected = selectedProducts.some(
        (p) => p.id === product.id
      );
      if (isChecked) {
        updatedCheckedPages.delete(pageNumber);
        if (isAlreadySelected) {
          const index = updatedSelectedProducts.findIndex(
            (p) => p.id === product.id
          );
          updatedSelectedProducts.splice(index, 1);
        }
      } else {
        updatedCheckedPages.add(pageNumber);
        if (!isAlreadySelected) {
          updatedSelectedProducts.push(product);
        }
      }
    });

    setCheckedPages(updatedCheckedPages);
    onCheckboxChange(updatedSelectedProducts);
  };

  const handleRangeSelection = (check) => {
    if (checkedRange.start && checkedRange.end) {
      const newCheckedPages = new Set(checkedPages);
      const updatedSelectedProducts = [...selectedProducts];

      for (
        let i = checkedRange.start;
        i <= checkedRange.end && i <= totalPages;
        i++
      ) {
        if (check) {
          newCheckedPages.add(i);
          const pageProducts = filteredProducts.slice(
            (i - 1) * productsPerPage,
            i * productsPerPage
          );
          pageProducts.forEach((product) => {
            if (!updatedSelectedProducts.some((p) => p.id === product.id)) {
              updatedSelectedProducts.push(product);
            }
          });
        } else {
          newCheckedPages.delete(i);
          const pageProducts = filteredProducts.slice(
            (i - 1) * productsPerPage,
            i * productsPerPage
          );
          pageProducts.forEach((product) => {
            const index = updatedSelectedProducts.findIndex(
              (p) => p.id === product.id
            );
            if (index > -1) updatedSelectedProducts.splice(index, 1);
          });
        }
      }

      setCheckedPages(newCheckedPages);
      onCheckboxChange(updatedSelectedProducts);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-xl overflow-y-auto max-h-[90vh] border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Select Products to Print
        </h2>

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="mb-4">
          <button
            onClick={() => setShowRangeInputs(!showRangeInputs)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 text-left flex items-center justify-between rounded-lg shadow-md transition w-full"
          >
            <span>
              {showRangeInputs
                ? "Hide Range Selection"
                : "Show Range Selection"}
            </span>
            {showRangeInputs ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showRangeInputs && (
            <div className="flex space-x-3 mt-3">
              <input
                type="number"
                placeholder="From"
                min="1"
                max={totalPages}
                value={checkedRange.start || ""}
                onChange={(e) =>
                  setCheckedRange({
                    ...checkedRange,
                    start: Number(e.target.value),
                  })
                }
                className="w-1/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="To"
                min="1"
                max={totalPages}
                value={checkedRange.end || ""}
                onChange={(e) =>
                  setCheckedRange({
                    ...checkedRange,
                    end: Number(e.target.value),
                  })
                }
                className="w-1/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleRangeSelection(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-md transition"
              >
                Select
              </button>
              <button
                onClick={() => handleRangeSelection(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg shadow-md transition"
              >
                Unselect
              </button>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mb-4">
          <button
            onClick={handleSelectAll}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg shadow-md transition"
          >
            Select All
          </button>
          <button
            onClick={handleUnselectAll}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg shadow-md transition"
          >
            Unselect All
          </button>
        </div>
        <div className="flex flex-row items-center space-x-4">
          <div className="pb-3">
            <button
              onClick={() => handlePageCheck(currentPage)}
              className={`px-3 py-1 rounded ${
                checkedPages.has(currentPage)
                  ? "bg-green-500 text-white"
                  : "bg-gray-300"
              }`}
            >
              {checkedPages.has(currentPage) ? "Uncheck Page" : "Check Page"}
            </button>
          </div>
          <p className="mb-4 mt-1 text-gray-600">
            Selected Items: {selectedProducts.length}
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {currentProducts.map((product) => (
            <label
              key={product.id}
              className="flex items-center p-2 bg-gray-100 rounded-lg shadow-sm"
            >
              <input
                type="checkbox"
                checked={isProductSelected(product.id)}
                onChange={() => handleCheckboxChange(product)}
                className="mr-3"
              />
              {product.productName}
            </label>
          ))}
        </div>
        <div className="flex  items-center justify-center ">
          <ReactPaginate
            nextLabel=""
            previousLabel=""
            pageCount={totalPages}
            onPageChange={({ selected }) => handlePageChange(selected + 1)}
            pageRangeDisplayed={3}
            marginPagesDisplayed={2}
            pageClassName="mr-2"
            pageLinkClassName="border-[1px] w-9 h-9  transition shadow-md hover:bg-gray-500 flex justify-center items-center"
            containerClassName="flex text-base font-semibold font-titleFont"
            activeClassName="bg-blue-500 text-white rounded-lg "
          />
        </div>
        <div className="flex justify-end mt-4 space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-lg shadow-md transition"
          >
            Cancel
          </button>
          <button
            onClick={onPrint}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg shadow-md transition"
          >
            Print Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintSelectionModal;
