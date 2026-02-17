import React from "react";

const PrintInternal = React.forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;

  return (
    <div
      ref={ref}
      className="p-6 border border-gray-400 w-full max-w-2xl mx-auto text-black text-sm font-serif bg-white"
    >
      {/* Header Section */}
      <h2 className="text-2xl font-bold text-center mb-4 border-b pb-2">
        Transaction Receipt
      </h2>
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <p>
          <strong>Transaction ID:</strong> {transaction.id}
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {new Date(transaction.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Terms:</strong> {transaction.terms}
        </p>
        <p>
          <strong>Prepared By:</strong> {transaction.preparedBy}
        </p>
        <p>
          <strong>Checked By:</strong> {transaction.checkedBy}
        </p>
        <p>
          <strong>Payment Type:</strong> {transaction.paymentType || "N/A"}
        </p>
      </div>

      {/* Summary Section */}
      <div className="border-t pt-3 mb-4">
        <h3 className="text-lg font-semibold mb-2">Transaction Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <p>
            <strong>Payment:</strong> ₱{transaction.payment.toFixed(2)}
          </p>
          <p>
            <strong>Discount Type:</strong> {transaction.discountType}
          </p>
          <p>
            <strong>Discount Amount:</strong> ₱
            {transaction.discountAmount.toFixed(2)}
          </p>
          <p>
            <strong>Total Items:</strong> {transaction.totalItems}
          </p>
          <p>
            <strong>Total Amount:</strong> ₱{transaction.totalAmount.toFixed(2)}
          </p>
          <p>
            <strong>Change:</strong> ₱{transaction.change.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="border-t pt-3 mb-4">
        <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
        <div className="grid grid-cols-2 gap-2">
          <p>
            <strong>Name:</strong> {transaction.customer.customerName}
          </p>
          <p>
            <strong>Address:</strong> {transaction.customer.address}
          </p>
          <p>
            <strong>TIN Number:</strong> {transaction.customer.tinNumber}
          </p>
          <p>
            <strong>Mobile:</strong> {transaction.customer.mobileNumber}
          </p>
          <p>
            <strong>Business Style:</strong>{" "}
            {transaction.customer.businessStyle}
          </p>
          <p>
            <strong>RFID:</strong> {transaction.customer.rfid}
          </p>
          <p>
            <strong>Customer Type:</strong> {transaction.customer.customerType}
          </p>
        </div>
      </div>

      {/* Purchased Products Table */}
      <div className="border-t pt-3 mb-4">
        <h3 className="text-lg font-semibold mb-2">Purchased Products</h3>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Product Name</th>
              <th className="border p-2 text-center">Vat Type</th>
              <th className="border p-2 text-center">Qty</th>
              <th className="border p-2 text-right">Price</th>
              <th className="border p-2 text-right">Subtotal</th>
              <th className="border p-2 text-right">Discount</th>
              <th className="border p-2">Serial Numbers</th>
            </tr>
          </thead>
          <tbody>
            {transaction.purchasedProducts.map((product, index) => (
              <tr
                key={product.id}
                className={index % 2 === 0 ? "bg-gray-100" : ""}
              >
                <td className="border p-2">{product.pricelist.productName}</td>
                <td className="border p-2 text-center">{product.vatType}</td>
                <td className="border p-2 text-center">{product.quantity}</td>
                <td className="border p-2 text-right">
                  ₱{product.price.toFixed(2)}
                </td>
                <td className="border p-2 text-right">
                  ₱{product.subtotal.toFixed(2)}
                </td>
                <td className="border p-2 text-right">
                  ₱{product.discountValue.toFixed(2)}
                </td>
                <td className="border p-2">
                  {product.serialNumbers.length > 0 ? (
                    <ul>
                      {product.serialNumbers.map((serialObj, serialIndex) => (
                        <li key={serialIndex}>{serialObj.serialName}</li>
                      ))}
                    </ul>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Printed on {new Date().toLocaleString()}
      </p>
    </div>
  );
});

export default PrintInternal;
