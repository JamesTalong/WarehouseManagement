// Get current time in the Manila timezone (Asia/Manila)
const manilaDate = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
);

// Get the date components (year, month, day, hours, minutes, seconds)
const year = manilaDate.getFullYear();
const month = String(manilaDate.getMonth() + 1).padStart(2, "0");
const day = String(manilaDate.getDate()).padStart(2, "0");
const hours = String(manilaDate.getHours()).padStart(2, "0");
const minutes = String(manilaDate.getMinutes()).padStart(2, "0");
const seconds = String(manilaDate.getSeconds()).padStart(2, "0");

// Manually calculate the timezone offset (in minutes)
const timezoneOffset = manilaDate.getTimezoneOffset(); // This gives the offset from UTC in minutes

// Convert timezone offset to hours and minutes
const offsetHours = Math.abs(timezoneOffset) / 60;
const offsetMinutes = Math.abs(timezoneOffset) % 60;
const offsetSign = timezoneOffset > 0 ? "-" : "+";

// Format the timezone offset (e.g., +08:00 or -08:00)
const formattedOffset = `${offsetSign}${String(offsetHours).padStart(
  2,
  "0"
)}:${String(offsetMinutes).padStart(2, "0")}`;

// Create the ISO string manually
export const manilaISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
