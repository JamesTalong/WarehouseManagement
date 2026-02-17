import React, { useState } from "react";
import {
  Package,
  MapPin,
  Tag,
  Palette,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import noImage from "../../../../Images/noImage.jpg";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

const PricelistCard = ({ pricelist, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const imageSrc = pricelist.productImage?.trim()
    ? pricelist.productImage
    : noImage;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden w-full max-w-sm mx-auto">
      {/* Image Section */}
      <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        <img
          src={imageSrc}
          alt={pricelist.product}
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = noImage;
          }}
        />
      </div>

      {/* Content Section */}
      <div className="p-4 relative">
        <div className="flex justify-between items-start mb-2">
          {/* Product Info */}
          <div>
            <p className="text-sm font-semibold text-indigo-700 mb-1">
              {pricelist.brand?.brandName || "Generic"}
            </p>
            <h3 className="font-bold text-slate-800 text-lg leading-tight pr-8">
              {pricelist.product || "N/A"}
            </h3>
            <p className="text-xl font-extrabold text-gray-900 mt-2">
              {formatCurrency(pricelist.vatInc)}
            </p>
          </div>

          {/* Mobile Menu Button */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-slate-500 hover:text-slate-700 p-1 -mr-1"
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg z-20 w-32 text-sm">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-600 flex items-center gap-2"
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-700 mt-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            <span>
              <strong className="font-medium">Location:</strong>{" "}
              {pricelist.location || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-slate-500" />
            <span>
              <strong className="font-medium">Color:</strong>{" "}
              {pricelist.color || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-slate-500" />
            <span>
              <strong className="font-medium">Reseller:</strong>{" "}
              {formatCurrency(pricelist.reseller)}
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Package size={16} className="text-slate-500" />
            <span>
              <strong className="font-medium">Quantity:</strong>{" "}
              {pricelist.quantity || 0}
            </span>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex justify-end mt-5 pt-4 border-t border-slate-100 gap-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 text-sm text-indigo-700 font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition-colors duration-200"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 text-sm text-red-700 font-semibold px-4 py-2 rounded-md hover:bg-red-50 transition-colors duration-200"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricelistCard;
