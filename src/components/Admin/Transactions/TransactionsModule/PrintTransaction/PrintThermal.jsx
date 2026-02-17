import React from "react";

const PrintThermal = React.forwardRef(({ transaction }, ref) => {
  // 1. Safety Check
  if (!transaction) return null;

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;

  // Safe access to customer object
  const customer = transaction.customer || {};

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        maxWidth: "300px",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        color: "#000",
        backgroundColor: "#fff",
        padding: "5px 0",
        lineHeight: "1.2",
      }}
    >
      {/* --- HEADER --- */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <strong style={{ fontSize: "14px", display: "block" }}>
          ICHTHUS TECHNOLOGY
        </strong>
        <span style={{ fontSize: "10px" }}>
          Malvar Batangas / Malabon
          <br />
          (043) 341-9524 / 0968-5729481
        </span>
        <br />
        <br />
        <strong
          style={{ borderBottom: "1px solid #000", paddingBottom: "2px" }}
        >
          OFFICIAL RECEIPT
        </strong>
      </div>

      {/* --- META DETAILS --- */}
      <div style={{ fontSize: "10px", marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Trans #:</span>
          <strong>{transaction.id}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Date:</span>
          <span>
            {new Date(transaction.date).toLocaleDateString()}{" "}
            {new Date(transaction.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Cashier:</span>
          <span>{transaction.fullName || "System"}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }} />

      {/* --- CUSTOMER --- */}
      <div style={{ marginBottom: "8px", fontSize: "11px" }}>
        <strong>Customer Details:</strong>
        <div style={{ paddingLeft: "5px" }}>
          <div>{customer.customerName || "Walk-In Customer"}</div>
          {customer.address && <div>{customer.address}</div>}
          {customer.tinNumber && <div>TIN: {customer.tinNumber}</div>}
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }} />

      {/* --- ITEMS TABLE --- */}
      {transaction.purchasedProducts?.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          {transaction.purchasedProducts.map((product, index) => (
            <div key={index} style={{ marginBottom: "6px" }}>
              {/* FIX: Ensure productName is accessed directly */}
              <div style={{ fontWeight: "bold" }}>
                {product.productName || "Unknown Product"}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {product.quantity} x {formatCurrency(product.price)}
                </span>
                <span style={{ fontWeight: "bold" }}>
                  {formatCurrency(product.subtotal)}
                </span>
              </div>

              {/* Serials */}
              {product.serialNumbers?.length > 0 && (
                <div
                  style={{
                    fontSize: "9px",
                    color: "#333",
                    marginLeft: "10px",
                    marginTop: "2px",
                  }}
                >
                  S/N:{" "}
                  {product.serialNumbers.map((s) => s.serialName).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: "1px solid #000", margin: "8px 0" }} />

      {/* --- TOTALS --- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>VAT Amount:</span>
          <span>{formatCurrency(transaction.vatAmount)}</span>
        </div>

        {Number(transaction.discountAmount) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount ({transaction.discountType}):</span>
            <span>-{formatCurrency(transaction.discountAmount)}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "14px",
            marginTop: "4px",
          }}
        >
          <span>TOTAL:</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* --- PAYMENT --- */}
      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Payment Type:</span>
          <span style={{ textTransform: "uppercase" }}>
            {transaction.paymentType}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Cash/Amount:</span>
          <span>{formatCurrency(transaction.payment)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            marginTop: "2px",
          }}
        >
          <span>CHANGE:</span>
          <span>{formatCurrency(transaction.change)}</span>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div style={{ textAlign: "center", marginTop: "15px", fontSize: "10px" }}>
        Item(s): {transaction.purchasedProducts?.length || 0}
        <br />
        <br />
        <strong>THANK YOU FOR BUYING!</strong>
        <br />
        Please keep this receipt for warranty purposes.
        <br />
        Software by: Ichthus Tech
      </div>
    </div>
  );
});

export default PrintThermal;
