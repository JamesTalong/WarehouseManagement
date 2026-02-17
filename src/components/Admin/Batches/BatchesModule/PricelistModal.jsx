import React, { useState } from "react";
import noImage from "../../../../Images/noImage.jpg"; // Path to the fallback image

const PricelistModal = ({ isVisible, pricelistData, onClose }) => {
  const [selectedImage, setSelectedImage] = useState("");

  if (!isVisible || !pricelistData) return null;

  // Function to open the image modal
  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  // Function to close the image modal
  const closeImageModal = () => {
    setSelectedImage("");
  };

  // Map the product image with the fallback logic
  const formattedImage = pricelistData.productImage
    ? pricelistData.productImage.startsWith("http")
      ? pricelistData.productImage
      : `data:image/jpeg;base64,${pricelistData.productImage}`
    : noImage; // Fallback to noImage if productImage is null or undefined

  // Extract relevant fields without IDs
  // Extract relevant fields without IDs
  const displayData = {
    "Item Code": pricelistData.itemCode,
    Barcode: pricelistData.barCode,
    Product: pricelistData.product,
    Location: pricelistData.location,
    Brand: pricelistData.brand?.brandName || "N/A",
    Category: pricelistData.category?.categoryName || "N/A",
    Color: pricelistData.color,
    "VAT Exclusive": pricelistData.vatEx,
    "VAT Inclusive": pricelistData.vatInc,
    "Reseller Price": pricelistData.reseller,
    "Zero Rated": pricelistData.zeroRated,
  };

  // Check if category objects exist before accessing their properties
  if (pricelistData.categoryTwo && pricelistData.categoryTwo.categoryTwoName) {
    displayData["Category Two"] = pricelistData.categoryTwo.categoryTwoName;
  }
  if (
    pricelistData.categoryThree &&
    pricelistData.categoryThree.categoryThreeName
  ) {
    displayData["Category Three"] =
      pricelistData.categoryThree.categoryThreeName;
  }
  if (
    pricelistData.categoryFour &&
    pricelistData.categoryFour.categoryFourName
  ) {
    displayData["Category Four"] = pricelistData.categoryFour.categoryFourName;
  }
  if (
    pricelistData.categoryFive &&
    pricelistData.categoryFive.categoryFiveName
  ) {
    displayData["Category Five"] = pricelistData.categoryFive.categoryFiveName;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg max-h-screen overflow-y-auto w-full max-w-md">
        {/* Product Image at the Top */}
        <div className="flex justify-center mb-6">
          <img
            src={formattedImage}
            alt={pricelistData.product}
            className="w-40 h-40 object-cover rounded cursor-pointer shadow-md"
            onClick={() => openImageModal(formattedImage)} // Open image modal on click
          />
        </div>
        {/* Pricelist Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-center mb-4">
            Pricelist Details
          </h2>
          {Object.entries(displayData).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {value}
            </p>
          ))}

          {/* Display null categories */}
        </div>

        {/* Close Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-800"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-20"
          onClick={closeImageModal}
        >
          <img
            src={selectedImage}
            alt="Product"
            className="max-w-full max-h-full rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          />
        </div>
      )}
    </div>
  );
};

export default PricelistModal;
