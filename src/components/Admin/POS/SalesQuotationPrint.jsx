import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

// Using React.forwardRef so react-to-print can access it
export const SalesQuotationPrint = React.forwardRef(({ data }, ref) => {
  // 1. Create a ref for the SVG element
  const barcodeRef = useRef(null);

  // 2. Extract quoteNumber safely for the dependency array
  const quoteNumber = data?.quoteNumber;

  // 3. Generate Barcode when component mounts or quoteNumber changes
  useEffect(() => {
    if (quoteNumber && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, quoteNumber, {
          format: "CODE128",
          lineColor: "#000000",
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 0,
        });
      } catch (error) {
        console.error("Barcode generation failed", error);
      }
    }
  }, [quoteNumber]);

  if (!data) return null;

  const {
    customer,
    quotationProducts,
    date,
    totalAmount,
    totalQuantity,
    preparedBy,
    checkedBy,
    locationName,
    fullName, // System User
  } = data;

  // Helper for currency
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val || 0);

  return (
    <div
      ref={ref}
      className="p-8 bg-white text-black text-xs font-sans max-w-[800px] mx-auto"
    >
      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase">Ichthus Technology</h1>
        <div className="text-[10px] text-gray-600">
          <p># 3128 Sto. Rosario Street, Barangay</p>
          <p>Mapulang Lupa, Valenzuela, 1440 Metro</p>
        </div>

        {/* REAL BARCODE */}
        <div className="mt-2 flex justify-center">
          <svg ref={barcodeRef}></svg>
        </div>

        {/* Manual Text Display */}
        <p className="text-[9px] mt-1 tracking-widest">{quoteNumber}</p>
      </div>

      {/* INFO GRID */}
      <div className="flex justify-between items-start mb-6 gap-4">
        {/* Left: Customer Info */}
        <div className="w-1/2">
          <h2 className="font-bold text-sm uppercase mb-1 bg-gray-100 p-1">
            Bill To:
          </h2>
          <div className="pl-1 space-y-0.5">
            <p className="font-bold uppercase text-sm">
              {customer?.customerName || "WALK-IN CUSTOMER"}
            </p>
            <p className="uppercase w-3/4">
              {customer?.address || "No Address Provided"}
            </p>

            <div className="mt-2 text-[10px] text-gray-600">
              {customer?.tinNumber && (
                <p>
                  <span className="font-semibold">TIN:</span>{" "}
                  {customer.tinNumber}
                </p>
              )}
              {customer?.businessStyle && (
                <p>
                  <span className="font-semibold">Style:</span>{" "}
                  {customer.businessStyle}
                </p>
              )}
              {customer?.mobileNumber && (
                <p>
                  <span className="font-semibold">Mobile:</span>{" "}
                  {customer.mobileNumber}
                </p>
              )}
              {customer?.email && (
                <p>
                  <span className="font-semibold">Email:</span> {customer.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Dispatch/Quote Details */}
        <div className="w-1/2">
          <h2 className="font-bold text-lg mb-2 text-right">SALES QUOTATION</h2>

          <div className="grid grid-cols-2 gap-y-1 text-xs text-right">
            <span className="font-bold text-gray-600">Quotation No.</span>
            <span className="font-semibold">{quoteNumber}</span>

            <span className="font-bold text-gray-600">Date</span>
            <span>{new Date(date).toLocaleDateString()}</span>

            <span className="font-bold text-gray-600">Branch/Location</span>
            <span>{locationName || "Main Office"}</span>

            <span className="font-bold text-gray-600">Customer ID</span>
            <span>{customer?.id || customer?.customerId || "N/A"}</span>

            <span className="font-bold text-gray-600">Encoded By</span>
            <span>{fullName}</span>
          </div>

          <div className="mt-4 bg-gray-100 p-2 border border-gray-200">
            <div className="flex justify-between font-bold">
              <span>Total Items</span>
              <span>{totalQuantity} units</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE HEADERS */}
      <div className="mt-4 border-b-2 border-black pb-1 mb-1 bg-gray-100 flex font-bold text-xs uppercase p-1">
        <div className="w-8">#</div>
        <div className="w-24">Item Code</div>
        <div className="flex-1">Description</div>
        {/* Widened Qty column to fit UOM */}
        <div className="w-24 text-center">Qty / UOM</div>
        <div className="w-20 text-right">Price</div>
        <div className="w-24 text-right">Total</div>
      </div>

      {/* TABLE BODY */}
      <div className="min-h-[300px] font-sans tracking-tight">
        <div className="divide-y divide-gray-100 border-b border-gray-100">
          {quotationProducts.map((item, index) => (
            <div
              key={index}
              className="group flex items-center py-0.5 hover:bg-gray-50 transition-colors duration-75 text-[10px] uppercase font-bold leading-none"
            >
              {/* Index */}
              <div className="w-6 text-center text-gray-300">
                {(index + 1).toString().padStart(2, "0")}
              </div>

              {/* Item Code */}
              <div className="w-20 text-gray-400 truncate px-1">
                {item.itemCode || "-"}
              </div>

              {/* Product Name */}
              <div className="flex-1 text-gray-800 truncate px-1">
                {item.productName}
              </div>

              {/* --- COMPACT QUANTITY --- */}
              <div className="w-16 flex justify-center items-center gap-0.5 text-gray-900">
                <span>{item.quantity}</span>
                {item.uom && (
                  <span className="text-gray-400 text-[9px] scale-90">
                    {item.uom}
                  </span>
                )}

                {/* Hidden Tooltip for Technical Details to keep row thin */}
                {(item.conversionRate > 1 || item.uomId) && (
                  <div className="hidden group-hover:flex absolute right-10 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm normal-case z-10">
                    {item.conversionRate > 1 && `x${item.conversionRate}`}{" "}
                    {item.uomId && `(ID:${item.uomId})`}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="w-20 text-right text-gray-500 tabular-nums px-1">
                {formatCurrency(item.price)}
              </div>

              {/* Subtotal */}
              <div className="w-20 text-right text-gray-900 tabular-nums pl-1 pr-2">
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER TOTALS */}
      <div className="mt-4 border-t-2 border-black pt-2 flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between text-sm font-bold bg-gray-100 p-2 rounded">
            <span>Total Amount:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="mt-16 grid grid-cols-3 gap-8 text-[10px]">
        <div>
          <div className="border-b border-black mb-1"></div>
          <p className="font-bold">Prepared By:</p>
          <p className="uppercase text-gray-500">{preparedBy}</p>
        </div>

        <div>
          <div className="border-b border-black mb-1"></div>
          <p className="font-bold">Checked By:</p>
          <p className="uppercase text-gray-500">{checkedBy}</p>
        </div>

        <div>
          <div className="border-b border-black mb-1"></div>
          <p className="font-bold">Approved By / Customer Conforme:</p>
        </div>
      </div>

      <div className="mt-8 text-center text-[9px] text-gray-400">
        System Generated Quotation ({quoteNumber}) | Printed on{" "}
        {new Date().toLocaleString()}
      </div>
    </div>
  );
});

export default SalesQuotationPrint;
