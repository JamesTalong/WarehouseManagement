import React from "react";

const PrintReceipt = React.forwardRef(({ transaction }, ref) => {
  // 1. Safety Check: If data isn't loaded yet, do not render
  if (!transaction) return null;

  const itemsPerPage = 8;
  const purchasedProducts = transaction.purchasedProducts || []; // Safety fallback
  const totalItems = purchasedProducts.length;

  // Split into pages
  const pages = [];
  for (let i = 0; i < totalItems; i += itemsPerPage) {
    const slicedPage = purchasedProducts.slice(i, i + itemsPerPage);
    if (slicedPage.length > 0) pages.push(slicedPage);
  }

  // Handle case with 0 items (push one empty page so header prints)
  if (pages.length === 0) pages.push([]);

  // Helper to safely format currency
  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  return (
    <div
      ref={ref}
      className="w-full text-black"
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "serif",
        fontSize: "12px",
      }}
    >
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="page-break pt-[7.6rem] p-6 ml-1">
          {/* Header */}
          <div className="">
            <p className="text-right pr-32 font-bold text-[24px]">
              {transaction.id}
            </p>

            {/* Customer Info - Added ?. to prevent crash if customer is null */}
            <div className="grid grid-cols-2 gap-4 font-bold">
              <div className="ml-9 text-[16px]">
                <p>
                  {transaction.customer?.customerName || "Walk-In Customer"}
                </p>
                <div className="ml-4">
                  <p>{transaction.customer?.address || ""}</p>
                </div>
              </div>
              <div className="text-right text-[16px]">
                <p className="pr-24">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
                <p className="pr-4 text-[14px]">
                  {transaction.customer?.mobileNumber || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Products Table */}
          <div className="mt-8 pr-2">
            <table className="w-full text-xs table-fixed font-bold">
              <tbody>
                {page.map((product, idx) => {
                  return (
                    <tr key={product.id || idx} className="p-0 m-0">
                      <td className="text-center w-[5%] p-0">
                        {product.quantity}
                      </td>
                      <td className="text-center w-[10%] p-0">
                        {product.quantity === 1 ? "pc." : "pcs."}
                      </td>
                      <td className="pl-4 w-[50%] p-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-bold">
                            {/* FIX: Removed .pricelist here */}
                            {product.productName || "Unknown Item"}
                          </span>
                          {product.serialNumbers &&
                            product.serialNumbers.length > 0 && (
                              <span className="break-words whitespace-normal font-normal">
                                (
                                {product.serialNumbers
                                  .map((sn) => sn.serialName)
                                  .join(", ")}
                                )
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="text-left w-[10%] p-0">
                        ₱{formatMoney(product.price)}
                      </td>
                      <td className="text-left pr-6 w-[10%] p-0">
                        ₱{formatMoney(product.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Amount - Only on the last page */}
          {pageIndex === pages.length - 1 && (
            <p className="fixed top-[27rem] right-12 text-right font-bold text-[16px]">
              ₱{formatMoney(transaction.totalAmount)}
            </p>
          )}

          <div className="fixed top-[30rem] left-60 transform translate-x-[-51%] flex w-full justify-center space-x-20 font-bold">
            <div className="w-48 text-center text-[16px]">
              {transaction.preparedBy || ""}
            </div>
            <div className="w-48 text-center text-[16px]">
              {transaction.checkedBy || ""}
            </div>
          </div>

          {/* Page Break for Printing */}
          {pageIndex < pages.length - 1 && <div className="page-break"></div>}
        </div>
      ))}
    </div>
  );
});

export default PrintReceipt;
