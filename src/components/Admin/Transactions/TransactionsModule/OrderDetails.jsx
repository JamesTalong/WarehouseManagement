import React, { forwardRef } from "react";
import logo from "../../../../Images/logo.png"; // Make sure to update the path to your logo

const OrderDetails = forwardRef(({ order }, ref) => {
  const grandTotal = order.products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  // Format the date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-gray-600"
      ref={ref}
    >
      <div className="w-[28rem] rounded bg-gray-50 px-6 pt-8 shadow-lg">
        <img src={logo} alt="chippz" className="mx-auto w-16 py-4" />
        <div className="flex flex-col justify-center items-center gap-2">
          <h4 className="font-semibold">Ichthus Technology</h4>
          <p className="text-xs">20.C Arellano Brgy San Agustin Malabon City</p>
        </div>
        <div className="flex flex-col gap-3 border-b py-6 text-xs">
          <p className="flex justify-between">
            <span className="text-gray-400">Reference No.:</span>
            <span>{order.referenceNumber}</span>
          </p>
          <div className="flex justify-between">
            <span className="text-gray-400">Recipient Address:</span>
            <span className="w-48 text-right break-words">
              {order.region}, {order.province}, {order.city}, {order.barangay},{" "}
              {order.address}
            </span>
          </div>
          <p className="flex justify-between">
            <span className="text-gray-400">Order Date:</span>
            <span>{formatDate(order.timestamp)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-400">Customer:</span>
            <span>{order.fullName}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 pb-6 pt-2 text-xs">
          <ul>
            {order.products.map((product, idx) => (
              <li key={idx}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="grid grid-cols-4">
                      <th className="py-2">Product</th>
                      <th className="py-2 px-16">Price</th>
                      <th className="py-2 px-10">QTY</th>
                      <th className="py-2 px-16">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="grid grid-cols-4">
                      <td className="py-1 whitespace-pre-wrap break-words">
                        {product.name}
                      </td>
                      <td className="py-1 px-2 text-right">₱{product.price}</td>
                      <td className="py-1 px-2 text-center">
                        {product.quantity}
                      </td>
                      <td className="py-1 text-right">
                        ₱{product.price * product.quantity}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </li>
            ))}
          </ul>
          <div className="border-b border border-dashed"></div>
          <div className="flex justify-between py-1 text-sm font-semibold text-black">
            <span className="tracking-wide">Grand Total:</span>
            <span className="tracking-wide">₱{grandTotal}</span>
          </div>

          <div className="py-4 justify-center items-center flex flex-col gap-2">
            <p className="flex gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21.3 12.23h-3.48c-.98 0-1.85.54-2.29 1.42l-.84 1.66c-.2.4-.6.65-1.04.65h-3.28c-.31 0-.75-.07-1.04-.65l-.84-1.65a2.567 2.567 0 0 0-2.29-1.42H2.7c-.39 0-.7.31-.7.7v3.26C2 19.83 4.18 22 7.82 22h8.38c3.43 0 5.54-1.88 5.8-5.22v-3.85c0-.38-.31-.7-.7-.7ZM12.75 2c0-.41-.34-.75-.75-.75s-.75.34-.75.75v2h1.5V2Z"
                  fill="#000"
                ></path>
                <path
                  d="M22 9.81v1.04a2.06 2.06 0 0 0-.7-.12h-3.48c-1.55 0-2.94.86-3.63 2.24l-.75 1.48h-2.86l-.75-1.47a4.026 4.026 0 0 0-3.63-2.25H2.7c-.24 0-.48.04-.7.12V9.81C2 6.17 4.17 4 7.81 4h3.44v3.19l-.72-.72a.754.754 0 0 0-1.06 0c-.29.29-.29.77 0 1.06l2 2c.01.01.02.01.02.02a.753.753 0 0 0 .51.2c.1 0 .19-.02.28-.06.09-.03.18-.09.25-.16l2-2c.29-.29.29-.77 0-1.06a.754.754 0 0 0-1.06 0l-.72.72V4h3.44C19.83 4 22 6.17 22 9.81Z"
                  fill="#000"
                ></path>
              </svg>{" "}
              Tel:(043)-341-9524{" "}
            </p>
            <p className="flex gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fill="#000"
                  d="M11.05 14.95L9.2 16.8c-.39.39-1.01.39-1.41.01-.11-.11-.22-.21-.33-.32a28.414 28.414 0 01-2.79-3.27c-.82-1.14-1.48-2.28-1.96-3.41C2.24 8.67 2 7.58 2 6.54c0-.68.12-1.33.36-1.93.24-.61.62-1.17 1.15-1.67C4.15 2.31 4.85 2 5.59 2c.28 0 .56.06.81.18.26.12.49.3.67.56l2.32 3.27c.18.25.31.48.4.7.09.21.14.42.14.61 0 .24-.07.48-.21.71-.13.23-.32.47-.56.71l-.76.79c-.11.11-.16.24-.16.4 0 .08.01.15.03.23.03.08.06.14.08.2.18.33.49.76.93 1.28.45.52.93 1.05 1.45 1.58.1.1.21.2.31.3.4.39.41 1.03.01 1.43zM21.97 18.33a2.54 2.54 0 01-.25 1.09c-.17.36-.39.7-.68 1.02-.49.54-1.1.93-1.83 1.16-.23.07-.46.11-.7.14-.3.03-.6.04-.91.04-1.1 0-2.21-.22-3.31-.66a16.28 16.28 0 01-3.41-1.92 28.678 28.678 0 01-4.26-3.54c-1.21-1.21-2.32-2.53-3.34-3.95-.52-.69-1.02-1.41-1.5-2.14a17.31 17.31 0 01-1.76-3.12A8.956 8.956 0 013 6.28c0-.3.01-.6.04-.91.03-.24.08-.47.14-.7.23-.73.62-1.34 1.16-1.83.32-.3.66-.52 1.02-.68.35-.17.72-.25 1.09-.25h.01c.56 0 1.11.2 1.5.61l2.42 2.42c.39.39.63.9.7 1.45.07.59-.07 1.15-.41 1.6-.26.33-.52.65-.79.97-.11.13-.23.26-.34.38-.3.34-.38.78-.25 1.18.02.06.05.12.08.19.29.54.68 1.12 1.17 1.73.64.82 1.35 1.58 2.12 2.26.53.5 1.06.94 1.58 1.31.18.13.36.27.54.4.45.34 1.05.4 1.56.16.14-.07.29-.17.43-.3.3-.26.61-.53.94-.8.36-.29.78-.44 1.23-.44.54 0 1.04.21 1.43.61l2.42 2.42c.41.4.61.95.61 1.5z"
                />
              </svg>
              0917-8476266
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OrderDetails;
