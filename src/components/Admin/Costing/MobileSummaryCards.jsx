import React from "react";
import {
  formatPrice,
  ValueIcon,
  ProductIcon,
  LocationIcon,
  OutOfStockIcon,
} from "./Constant";

const formatForMobile = (value) => {
  if (value >= 1_000_000_000_000)
    return (value / 1_000_000_000_000).toFixed(1) + "T";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
  return value.toString();
};

const formatCurrencyForMobile = (value) => {
  if (value >= 1_000_000_000_000)
    return (value / 1_000_000_000_000).toFixed(1) + "T";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
  return value.toFixed(2);
};

const MobileSummaryCards = ({
  totalInventoryValue,
  totalUniqueProducts,
  activeLocationsCount,
  itemsOutOfStock,
  priceType,
}) => {
  const summaryData = [
    {
      title: "Total Value",
      value: formatCurrencyForMobile(totalInventoryValue),
      icon: <ValueIcon />,
    },
    {
      title: "Products",
      value: formatForMobile(totalUniqueProducts),
      icon: <ProductIcon />,
    },
    {
      title: "Locations",
      value: formatForMobile(activeLocationsCount),
      icon: <LocationIcon />,
    },
    {
      title: "Out of Stock",
      value: formatForMobile(itemsOutOfStock),
      icon: <OutOfStockIcon />,
      isAlert: itemsOutOfStock > 0,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800  rounded-xl p-4">
      <div className="grid grid-cols-2 gap-4">
        {summaryData.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Icon */}
            <div
              className={`p-2 rounded-full flex-shrink-0 ${
                item.isAlert
                  ? "bg-red-100 dark:bg-red-900"
                  : "bg-slate-100 dark:bg-slate-700"
              }`}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {item.title}
              </p>
              <p
                className={`text-sm font-semibold ${
                  item.isAlert
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileSummaryCards;
