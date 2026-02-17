import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../../loader/Loader";
import { v4 as uuidv4 } from "uuid";

const AddSerialNumberModal = ({ product, onClose, onSave }) => {
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initialSerialNumbers = Array(product.quantity)
      .fill("")
      .map(() => ({
        id: uuidv4(),
        value: "",
      }));
    setSerialNumbers(initialSerialNumbers);
  }, [product.quantity]);

  const handleSerialNumberChange = (id, value) => {
    const newSerialNumbers = serialNumbers.map((serialNumber) =>
      serialNumber.id === id ? { ...serialNumber, value } : serialNumber
    );
    setSerialNumbers(newSerialNumbers);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const serialNumbersArray = serialNumbers.map((serial) => serial.value);
      await onSave(
        product.id,
        serialNumbersArray,
        product.userId,
        product.referenceNumber
      ); // Pass the reference number
      toast.success("Serial numbers added successfully!");
      onClose();
    } catch (error) {
      toast.error("Error adding serial number: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-40">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
          <h2 className="text-2xl font-semibold mb-4">Add Serial Number</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Product Name
            </label>
            <p className="text-gray-900">{product.name}</p>
            <label className="block text-gray-700 text-sm font-bold my-2">
              Product ID
            </label>
            <p className="text-gray-900">{product.id}</p>
          </div>
          {serialNumbers.map((serialNumber, index) => (
            <div className="mb-4" key={serialNumber.id}>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Serial Number {index + 1}
              </label>
              <input
                type="text"
                value={serialNumber.value}
                onChange={(e) =>
                  handleSerialNumberChange(serialNumber.id, e.target.value)
                }
                className="w-full p-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-green-700 transition duration-200"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddSerialNumberModal;
