export const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  // Adjust to make Monday the first day (day === 0 means Sunday, treat as 7th day for this logic)
  const diffToMonday = d.getDate() - (day === 0 ? 6 : day - 1);
  const startDate = new Date(d.setDate(diffToMonday));
  startDate.setHours(0, 0, 0, 0); // Start of the day

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999); // End of the day
  return { startDate, endDate };
};

/**
 * Formats a date for display in the report header.
 * @param {Date} date - The date to format.
 * @param {'daily' | 'weekly' | 'monthly' | 'yearly'} reportType - The type of report.
 * @returns {string} Formatted date string.
 */
export const formatReportDateDisplay = (date, reportType) => {
  const d = new Date(date);
  if (!d || isNaN(d.getTime())) return "Invalid Date";

  if (reportType === "daily") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (reportType === "weekly") {
    const { startDate, endDate } = getWeekRange(d);
    return `Week of ${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }
  if (reportType === "monthly") {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }
  if (reportType === "yearly") {
    return d.toLocaleDateString("en-US", { year: "numeric" });
  }
  return "";
};
