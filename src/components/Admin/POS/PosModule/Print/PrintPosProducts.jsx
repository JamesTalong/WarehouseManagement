import React from "react";

const PrintPosProducts = React.forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;
  const itemsPerPage = 5;
  const totalItems = transaction.purchasedProducts.length;

  // Split into pages
  const pages = [];
  for (let i = 0; i < totalItems; i += itemsPerPage) {
    const slicedPage = transaction.purchasedProducts.slice(i, i + itemsPerPage);
    if (slicedPage.length > 0) pages.push(slicedPage); // Prevent blank pages
  }

  return (
    <div
      ref={ref}
      className="p-6 w-full text-black text-xs font-mono relative"
      style={{ whiteSpace: "pre-wrap", fontFamily: "Courier, monospace" }}
    >
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="page-break">
          {/* Header */}
          <div className="pt-3">
            <p className="absolute top-[8rem] right-40 font-bold">
              {transaction.id}
            </p>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mt-[7.4rem]">
              <div className="ml-9">
                <p>{transaction.customer.customerName}</p>
                <div className="ml-4">
                  <p>{transaction.customer.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="pr-20">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
                <p className="text-[0.6rem]">
                  {transaction.customer.mobileNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Products Table */}
          <div className="mt-10 pl-2">
            <table className="w-full text-xs ml-2 table-fixed">
              <tbody>
                {page.map((product) => {
                  return (
                    <tr key={product.id} className="border-b">
                      <td className="text-center w-[5%]">{product.quantity}</td>
                      <td className="text-center w-[10%]">
                        {product.quantity === 1 ? "pc." : "pcs."}
                      </td>
                      <td className="pl-4 w-[40%]">
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {product.pricelist.productName}
                          </span>
                          {product.serialNumbers.length > 0 ? (
                            <span className="text-[7px] break-words whitespace-normal block max-w-full leading-none mt-0">
                              {product.serialNumbers
                                .map((sn) => sn.serialName)
                                .join(", ")}
                            </span>
                          ) : (
                            <span className="text-[10px] leading-none mt-0">
                              N/A
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right w-[20%]">
                        ₱{product.price.toFixed(2)}
                      </td>
                      <td className="text-right pr-6 w-[20%]">
                        ₱{product.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Amount - Only on the last page */}
          {pageIndex === pages.length - 1 && (
            <p className="fixed top-[26rem] right-6 text-right font-bold">
              ₱
              {transaction.totalAmount.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
          )}

          <div className="fixed top-[30rem] left-60 transform -translate-x-1/2 flex w-full justify-center space-x-36">
            <div className="w-28 text-center">{transaction.preparedBy}</div>
            <div className="w-48 text-center">{transaction.checkedBy}</div>
          </div>

          {/* Page Break for Printing */}
          {pageIndex < pages.length - 1 && <div className="page-break"></div>}
        </div>
      ))}
    </div>
  );
});

export default PrintPosProducts;
