import React, { useMemo } from "react";
import { FaShoppingCart } from "react-icons/fa";

const PrintPurchaseOrder = React.forwardRef(({ po }, ref) => {
  // --- 1. CALCULATE ORIGINAL TOTALS (Existing Logic) ---
  const originalTotalData = useMemo(() => {
    if (!po || !po.purchaseOrderLineItems) return { total: 0, subtotal: 0 };

    const originalSubtotal = po.purchaseOrderLineItems.reduce((acc, item) => {
      const qty = item.orderedQuantity || item.quantity || 0;
      const price = item.unitPrice || 0;
      return acc + qty * price;
    }, 0);

    let originalEwt = 0;
    if (po.ewt > 0) {
      const taxBase = po.vat > 0 ? originalSubtotal / 1.12 : originalSubtotal;
      originalEwt = taxBase * 0.01;
    }

    const total = originalSubtotal + (po.shippingCost || 0) - originalEwt;
    return { total, subtotal: originalSubtotal };
  }, [po]);

  // --- 2. HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: po?.currency || "PHP",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!po) return null;

  const hasRejections = Math.abs(originalTotalData.total - po.grandTotal) > 0.1;

  const totalRejectedValue = po.purchaseOrderLineItems.reduce(
    (acc, item) => acc + (item.rejectedQuantity || 0) * (item.unitPrice || 0),
    0,
  );

  return (
    <div
      ref={ref}
      className="bg-white p-8 w-full max-w-[210mm] mx-auto text-slate-800 text-xs font-sans leading-tight"
    >
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-slate-700 text-4xl">
            <FaShoppingCart />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-normal text-blue-600 uppercase tracking-wide">
            Purchase Order
          </h2>
          {hasRejections && (
            <div className="text-right mt-1">
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
                AMENDED (REJECTIONS APPLIED)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- INFO BLOCK --- */}
      <div className="bg-slate-100 p-4 flex justify-between border-t border-slate-300 mb-0">
        <div className="w-1/3 space-y-1.5">
          <div className="flex">
            <span className="font-bold w-24">Supplier:</span>
            <span className="font-semibold">
              {po.vendorDetails?.vendorName || po.vendor}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Address:</span>
            <span className="w-40 truncate">
              {po.vendorDetails?.address || "-"}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Contact:</span>
            <span>{po.vendorDetails?.contactPerson || "-"}</span>
          </div>
        </div>

        <div className="w-1/3 space-y-1.5 border-l border-slate-300 pl-4">
          <div className="flex">
            <span className="font-bold w-24">PO Date:</span>
            <span>{formatDate(po.creationDate)}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">PO No:</span>
            <span>{po.poNumber}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Status:</span>
            <span className="uppercase font-semibold">{po.status}</span>
          </div>
        </div>

        <div className="w-1/3 space-y-1.5 border-l border-slate-300 pl-4">
          <div className="flex">
            <span className="font-bold w-28">Payment Terms:</span>
            <span>{po.paymentTerms}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-28">Delivery Date:</span>
            <span>{formatDate(po.expectedDeliveryDate)}</span>
          </div>
        </div>
      </div>

      <div className="flex bg-blue-600 text-white font-bold py-1.5 mt-4">
        <div className="w-1/2 px-4">Bill To:</div>
        <div className="w-1/2 px-4 border-l border-blue-400">Ship To:</div>
      </div>

      {/* --- UPDATED BILL TO / SHIP TO SECTION --- */}
      <div className="flex mb-6 border-b border-l border-r border-slate-200">
        <div className="w-1/2 p-4 border-r border-slate-200">
          {/* Logic: Check if vendorDetails exists and has content */}
          {po.vendorDetails &&
          (po.vendorDetails.vendorName ||
            po.vendorDetails.address ||
            po.vendorDetails.contactPerson) ? (
            <div className="text-slate-700 text-[11px] leading-snug space-y-0.5">
              {po.vendorDetails.vendorName && (
                <p className="font-semibold text-slate-900 text-xs tracking-wide">
                  {po.vendorDetails.vendorName}
                </p>
              )}

              {po.vendorDetails.address && (
                <p className="text-slate-600 break-words">
                  {po.vendorDetails.address}
                </p>
              )}

              {po.vendorDetails.contactPerson && (
                <p className="text-slate-600">
                  <span className="font-medium text-slate-700">Attn:</span>{" "}
                  {po.vendorDetails.contactPerson}
                </p>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic text-[11px]">
              (Billing address not provided)
            </p>
          )}
        </div>
        <div className="w-1/2 p-4">
          <p className="font-bold mb-1">{po.location}</p>
        </div>
      </div>

      {/* --- ITEMS TABLE --- */}
      <div className="mb-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-2 px-2 text-center border-r border-blue-400 w-10">
                #
              </th>
              <th className="py-2 px-2 text-left border-r border-blue-400">
                Product Name
              </th>
              <th className="py-2 px-2 text-center border-r border-blue-400 w-16">
                Qty
              </th>
              <th className="py-2 px-2 text-right border-r border-blue-400 w-24">
                Rate
              </th>
              <th className="py-2 px-2 text-right border-r border-blue-400 w-28 bg-blue-700">
                Original PO
              </th>
              <th className="py-2 px-2 text-right w-28">Line Total</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {po.purchaseOrderLineItems.map((item, index) => {
              const orderedQty = item.orderedQuantity || item.quantity || 0;
              const rejectedQty = item.rejectedQuantity || 0;
              const unitPrice = item.unitPrice || 0;

              const originalAmount = orderedQty * unitPrice;
              const netAmount = (orderedQty - rejectedQty) * unitPrice;
              const isRejected = rejectedQty > 0;

              return (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-2 px-2 text-center border-r border-slate-200">
                    {index + 1}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-200">
                    <div className="font-medium text-slate-800">
                      {item.productName}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-200">
                    <div>
                      {orderedQty}{" "}
                      <span className="text-[10px] text-slate-500">
                        {item.unitOfMeasure}
                      </span>
                    </div>
                    {isRejected && (
                      <div className="text-[9px] text-red-500 font-bold">
                        -{rejectedQty} Rej
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right border-r border-slate-200">
                    {formatCurrency(unitPrice)}
                  </td>
                  <td className="py-2 px-2 text-right border-r border-slate-200 bg-slate-50 text-slate-500">
                    <span className={isRejected ? "line-through" : ""}>
                      {formatCurrency(originalAmount)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">
                    {formatCurrency(netAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- TOTALS SECTION --- */}
      <div className="flex justify-end mb-8">
        <div className="w-5/12">
          <div className="flex justify-between py-1 px-2 border-b border-slate-100">
            <span className="font-semibold text-slate-600">
              Subtotal (Net):
            </span>
            <span className="font-semibold">
              {formatCurrency(
                po.purchaseOrderLineItems.reduce((acc, item) => {
                  const qty = item.orderedQuantity || item.quantity || 0;
                  const rej = item.rejectedQuantity || 0;
                  const price = item.unitPrice || 0;
                  return acc + (qty - rej) * price;
                }, 0),
              )}
            </span>
          </div>

          <div className="flex justify-between py-1 px-2 border-b border-slate-100">
            <span className="font-semibold text-slate-600">Shipping:</span>
            <span>{formatCurrency(po.shippingCost)}</span>
          </div>
          <div className="flex justify-between py-1 px-2 border-b border-slate-100">
            <span className="font-semibold text-slate-600">VAT:</span>
            <span>+{formatCurrency(po.vat)}</span>
          </div>
          <div className="flex justify-between py-1 px-2 border-b border-slate-100">
            <span className="font-semibold text-slate-600">EWT:</span>
            <span className="text-slate-800">-{formatCurrency(po.ewt)}</span>
          </div>

          {hasRejections && (
            <div className="my-2 py-2 px-2 bg-red-50 border border-red-100 rounded">
              <div className="flex justify-between text-slate-500 text-xs mb-1">
                <span>Total Original Amount:</span>
                <span className="line-through">
                  {formatCurrency(originalTotalData.total)}
                </span>
              </div>
              <div className="flex justify-between text-red-600 text-xs font-bold">
                <span>Total Rejected Deduction:</span>
                <span>-{formatCurrency(totalRejectedValue)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between py-3 px-3 bg-blue-50 border border-blue-100 mt-1 rounded-sm">
            <span className="font-bold text-base text-blue-900">
              Grand Total:
            </span>
            <span className="font-bold text-base text-blue-900">
              {formatCurrency(po.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="flex justify-between items-end mt-auto pt-8 border-t border-slate-200">
        <div className="w-3/5 text-[10px] text-slate-600">
          <p className="font-bold mb-1 text-slate-800">Terms and conditions:</p>
          <ol className="list-decimal pl-4 space-y-0.5 leading-tight">
            <li>
              We reserve the right to cancel the purchase order anytime before
              product shipment.
            </li>
            <li>
              Invoice raised to us should contain the details of purchase order.
            </li>
            <li>Adherence to agreed product specifications is a must.</li>
            <li>
              Delivery should be strictly done by{" "}
              {formatDate(po.expectedDeliveryDate)}.
            </li>
          </ol>
          {po.internalNotes && (
            <div className="mt-2 text-slate-600 border border-slate-200 bg-slate-50 p-2 rounded">
              <span className="font-bold">Internal Note:</span>{" "}
              {po.internalNotes}
            </div>
          )}
        </div>

        <div className="w-1/3 border border-slate-300">
          <div className="bg-blue-600 text-white text-center font-bold py-1">
            Authorized Signature
          </div>
          <div className="h-16"></div>
          <div className="text-center text-slate-400 italic text-[10px] pb-2 border-t border-slate-200 mx-4 mt-2">
            Signatory
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintPurchaseOrder;
