// --- Icon Components (Example SVGs - replace with your preferred icon library or SVGs) ---
export const ProductIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-blue-500"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 21V15.75M10.5 21H13.5M10.5 21V15.75m0 0H13.5m0 0H13.5m2.25-5.25H8.25m6.75 0a2.25 2.25 0 012.25 2.25M15 15.75a2.25 2.25 0 002.25 2.25M15 15.75V10.5m3.75 7.875c0 .621-.504 1.125-1.125 1.125H9.375c-.621 0-1.125-.504-1.125-1.125m0 0V11.25A2.25 2.25 0 019.375 9h5.25a2.25 2.25 0 012.25 2.25v4.5"
    />
  </svg>
);

export const ValueIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-green-500"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 012.25 4.5M3 6h12M3 6V6a2.25 2.25 0 00-2.25 2.25v1.5A2.25 2.25 0 003 12m12 0v9.528c0 .629-.506 1.128-1.125 1.128H4.125c-.62 0-1.125-.5-1.125-1.128V12m0 0h12m0 0a2.25 2.25 0 012.25 2.25v1.5A2.25 2.25 0 0115 18m-4.5-3v3m0 0v3m0-3h3m-3 0h-3m-2.25-3h9.75M15 12a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0015 5.25h-3A2.25 2.25 0 009.75 7.5v2.25A2.25 2.25 0 0012 12v0z"
    />
  </svg>
);

export const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-purple-500"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    />
  </svg>
);

export const OutOfStockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-red-500"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

export const PRICE_TYPES = {
  vatEx: { label: "VAT Ex", key: "vatEx" },
  vatInc: { label: "VAT Inc", key: "vatInc" },
  reseller: { label: "Reseller", key: "reseller" },
  zeroRated: { label: "Zero Rated", key: "zeroRated" },
};

// --- Helper Functions ---
export const formatPrice = (price) => {
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "N/A";

  return numPrice.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
