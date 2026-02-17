// SalesReportPDFComponent.js
import React from "react";

const COMPANY_INFO = {
  name: "Ichthus Technology",
  address:
    "28.C Arellano Brgy San Agustin, Malabon City, Metro Manila, Philippines",
  phone: "0945 507 2005",
  website: "www.ichthustechnology.com",
};

const SalesReportPDFComponent = React.forwardRef(({ reportPayload }, ref) => {
  if (!reportPayload || !reportPayload.summaryData) {
    return (
      <div ref={ref} className="p-4 text-sm text-gray-700">
        Loading report data or no data available...
      </div>
    );
  }

  const { reportTableData, summaryData, reportTitle } = reportPayload;
  const locationName = summaryData.locationName;
  const showLocationColumn = locationName === "All Locations";

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div ref={ref} className="p-4 font-sans text-gray-800 text-xs">
      {/* --- HEADER --- */}
      <div className="mb-3 pb-1 border-gray-200 text-center">
        <h1 className="text-lg font-bold text-orange-600 mb-1">
          {COMPANY_INFO.name}
        </h1>
        <p className="text-xs text-gray-600 my-0.5">{COMPANY_INFO.address}</p>
        <p className="text-xs text-gray-600 my-0.5">{COMPANY_INFO.phone}</p>
        <p className="text-xs text-blue-600 hover:text-blue-700 my-0.5">
          {COMPANY_INFO.website}
        </p>
      </div>

      {/* --- REPORT TITLE BAR --- */}
      <div className="text-center text-md font-bold mb-3 py-1 border-y border-gray-200">
        {reportTitle ? reportTitle.toUpperCase() : "SALES REPORT"} FORM
      </div>

      {/* --- DATE AND LOCATION INFO --- */}
      <div className="text-right text-xs text-gray-800 mb-2">
        <p className="my-1">
          Report Date:{" "}
          <span className="font-semibold">
            {summaryData.reportDateString || "N/A"}
          </span>
        </p>
        {locationName && (
          <p className="my-1">
            Location Filter:{" "}
            <span className="font-semibold">{locationName}</span>
          </p>
        )}
      </div>

      {/* --- DETAILED SALES TABLE --- */}
      <div className="mb-4">
        <h3 className="text-center text-xs font-semibold text-orange-600 mb-2 pt-2">
          DETAILED TRANSACTIONS
        </h3>
        <table className="w-full text-xs text-gray-800 border-collapse">
          <thead>
            <tr>
              <th className="p-1 border border-gray-300 text-left font-semibold">
                Time
              </th>
              <th className="p-1 border border-gray-300 text-left font-semibold">
                Sales Rep
              </th>
              <th className="p-1 border border-gray-300 text-left font-semibold">
                ID
              </th>
              {showLocationColumn && (
                <th className="p-1 border border-gray-300 text-left font-semibold">
                  Location
                </th>
              )}
              <th className="p-1 border border-gray-300 text-left font-semibold">
                VAT Type
              </th>
              <th className="p-1 border border-gray-300 text-left font-semibold">
                Payment
              </th>
              <th className="p-1 border border-gray-300 text-left font-semibold">
                Product Sold
              </th>
              <th className="p-1 border border-gray-300 text-right font-semibold">
                Qty
              </th>
              <th className="p-1 border border-gray-300 text-right font-semibold">
                Unit Price
              </th>
              {/* NEW COLUMN */}
              <th className="p-1 border border-gray-300 text-right font-semibold">
                Discount
              </th>
              <th className="p-1 border border-gray-300 text-right font-semibold">
                Total Sales
              </th>
            </tr>
          </thead>
          <tbody>
            {(reportTableData || []).map((item, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "" : "bg-gray-50"} ${
                  item.isVoid ? "text-red-600" : ""
                }`}
              >
                <td className="p-1 border border-gray-200">{item.time}</td>
                <td className="p-1 border border-gray-200">
                  {item.isVoid
                    ? `Voided by: ${item.voidBy || "N/A"}`
                    : item.salesRep}
                </td>
                <td className="p-1 border border-gray-200">
                  {item.id}
                  {item.isVoid && (
                    <span className="font-semibold"> VOIDED</span>
                  )}
                </td>
                {showLocationColumn && (
                  <td className="p-1 border border-gray-200">
                    {item.location || "N/A"}
                  </td>
                )}
                <td className="p-1 border border-gray-200">{item.vatType}</td>
                <td className="p-1 border border-gray-200">
                  {item.paymentType || "N/A"}
                </td>
                <td className="p-1 border border-gray-200">{item.product}</td>
                <td className="p-1 border border-gray-200 text-right">
                  {item.quantity}
                </td>
                <td className="p-1 border border-gray-200 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                {/* NEW CELL */}
                <td className="p-1 border border-gray-200 text-right">
                  {formatCurrency(item.itemDiscount)}
                </td>
                <td className="p-1 border border-gray-200 text-right">
                  {formatCurrency(item.totalSales)}
                </td>
              </tr>
            ))}
            {(!reportTableData || reportTableData.length === 0) && (
              <tr>
                {/* UPDATED COLSPAN */}
                <td
                  colSpan={showLocationColumn ? 11 : 10}
                  className="p-1 border border-gray-200 text-center text-gray-500"
                >
                  No detailed sales data for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="text-center py-2 border-b">--NOTHING FOLLOWS--</p>
      </div>

      {/* --- UPDATED SUMMARY SECTION --- */}
      <div className="border-gray-200 py-1">
        <div className="text-xs text-gray-800 flex flex-row justify-end ">
          <div className="flex flex-col pr-6">
            <h3 className="text-md font-semibold mb-2 mt-5">SUMMARY</h3>
            <p className="my-1">
              Total Quantity:{" "}
              <span className="font-semibold">
                {new Intl.NumberFormat().format(summaryData.totalQuantity || 0)}
              </span>
            </p>
          </div>
          <div className="flex flex-col pr-6 text-right">
            <hr className="" />
            <p className="my-1 text-md">
              Gross Sales:{" "}
              <span className="font-semibold">
                ₱ {formatCurrency(summaryData.grossTotalSales)}
              </span>
            </p>
            {summaryData.totalItemDiscounts > 0 && (
              <p className="my-1 text-md text-red-600">
                Less (Item Discounts):{" "}
                <span className="font-semibold">
                  ₱ {formatCurrency(summaryData.totalItemDiscounts)}
                </span>
              </p>
            )}

            {/* Only show Overall Discounts if the value is greater than 0 */}
            {summaryData.totalTransactionDiscounts > 0 && (
              <p className="my-1 text-md text-red-600">
                Less (Overall Discounts):{" "}
                <span className="font-semibold">
                  ₱ {formatCurrency(summaryData.totalTransactionDiscounts)}
                </span>
              </p>
            )}
            <p className="my-1 text-md font-bold border-t pt-1 mt-1">
              Net Sales:{" "}
              <span className="font-semibold">
                ₱ {formatCurrency(summaryData.netSales)}
              </span>
            </p>
            <p className="my-1 text-md">
              Less (Non-Cash):{" "}
              <span className="font-semibold">
                ₱ {formatCurrency(summaryData.lessNonCashPayments)}
              </span>
            </p>
            <p className="my-1 text-md font-bold border-t pt-1 mt-1">
              Grand Total (Cash Sales):{" "}
              <span className="font-semibold">
                ₱ {formatCurrency(summaryData.grandTotal)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SalesReportPDFComponent;
