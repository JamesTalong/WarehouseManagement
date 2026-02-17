import React, { useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PrintManual = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    referenceNumber: "",
    timestamp: new Date(),
    region: "",
    province: "",
    city: "",
    barangay: "",
    address: "",
    fullName: "",
    products: [{ name: "", quantity: "", price: "" }],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleProductChange = (e, index) => {
    const { id, value } = e.target;
    const newProducts = formData.products.slice();
    newProducts[index][id] = value;
    setFormData({ ...formData, products: newProducts });
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { name: "", quantity: "", price: "" }],
    });
  };

  const removeProduct = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: newProducts });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      setIsLoading(false);
      toast.success("Manual print initiated successfully");
      onSubmit(formData); // Call the onSubmit prop with the form data
    } catch (error) {
      setIsLoading(false);
      toast.error("Error initiating manual print: " + error.message);
    }
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, timestamp: date });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
      <div className="bg-white p-8 rounded-lg max-h-screen overflow-y-auto w-full sm:w-3/4 md:w-1/2 relative">
        {isLoading && <Loader />}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
          disabled={isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Print Manual</h2>
        <form onSubmit={handleFormSubmit} className="flex flex-col">
          <div className="mb-4">
            <label
              htmlFor="Customer Name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter Customer Name"
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          {formData.products.map((product, index) => (
            <div key={index} className="mt-5">
              {index > 0 && <hr className="border-t-2 border-gray-200 my-4" />}
              <div className="mb-4">
                <label
                  htmlFor={`name-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter product name"
                  className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
                  value={product.name}
                  onChange={(e) => handleProductChange(e, index)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label
                    htmlFor={`quantity-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="text"
                    placeholder="Enter quantity"
                    className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(e, index)}
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor={`price-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price
                  </label>
                  <input
                    id="price"
                    type="text"
                    placeholder="Enter price"
                    className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
                    value={product.price}
                    onChange={(e) => handleProductChange(e, index)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="bg-red-600 text-white text-sm font-bodyFont px-4 py-2 hover:bg-red-700 duration-300 font-semibold rounded-md"
                disabled={isLoading}
              >
                Remove Product
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addProduct}
            className="bg-orange-600 text-white text-sm font-bodyFont px-4 py-2 hover:bg-orange-700 duration-300 font-semibold rounded-md mt-2"
            disabled={isLoading}
          >
            Add Product
          </button>
          <div className="mb-4 mt-4">
            <label
              htmlFor="timestamp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Order Date
            </label>
            <DatePicker
              selected={formData.timestamp}
              onChange={handleDateChange}
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              dateFormat="MMMM d, yyyy"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="referenceNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reference Number
            </label>
            <input
              id="referenceNumber"
              type="text"
              placeholder="Enter reference number"
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Region
            </label>
            <input
              id="region"
              type="text"
              placeholder="Enter region"
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.region}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="province"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Province
            </label>
            <input
              id="province"
              type="text"
              placeholder="Enter province"
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.province}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City
            </label>
            <input
              id="city"
              type="text"
              placeholder="Enter city"
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.city}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="barangay"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Barangay
            </label>
            <input
              id="barangay"
              type="text"
              placeholder="Enter barangay"
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.barangay}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Street No.
            </label>
            <input
              id="address"
              type="text"
              placeholder="Enter Street No."
              className="bg-gray-100 text-gray-800 border-0 rounded-md p-2 w-full focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={formData.address}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="bg-gray-600 text-white text-sm font-bodyFont px-4 py-2 hover:bg-gray-700 duration-300 font-semibold rounded-md"
            disabled={isLoading}
          >
            Print Receipt
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrintManual;
