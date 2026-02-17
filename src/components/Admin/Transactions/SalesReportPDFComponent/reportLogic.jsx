// reportLogic.js
import { getWeekRange, formatReportDateDisplay } from "./dateHelpers"; // Adjust path

/**
 * Generates data for the sales report.
 * @param {Array} transactions - Array of transaction objects from your API.
 * @param {'daily' | 'weekly' | 'monthly' | 'yearly'} reportType - The type of report.
 * @param {Date} selectedDateInput - The primary date selected by the user.
 * @param {string} locationName - The name of the location.
 * @returns {{reportTableData: Array, summaryData: Object, chartData: Array, reportTitle: String}}
 */
export const generateReportData = (
  transactions,
  reportType,
  selectedDateInput,
  locationName
) => {
  const defaultSummary = {
    grossTotalSales: 0,
    totalItemDiscounts: 0,
    totalTransactionDiscounts: 0,
    netSales: 0,
    lessNonCashPayments: 0,
    grandTotal: 0,
    totalQuantity: 0,
    reportDateString: formatReportDateDisplay(
      new Date(selectedDateInput),
      reportType
    ),
    locationName: locationName,
  };

  if (!transactions || transactions.length === 0) {
    return {
      reportTableData: [],
      summaryData: defaultSummary,
      chartData: [],
      reportTitle: `${reportType.toUpperCase()} SALES`,
    };
  }

  const inputDate = new Date(selectedDateInput);
  let filteredTransactions = [];

  switch (reportType) {
    case "daily":
      filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === inputDate.toDateString();
      });
      break;
    case "weekly":
      const { startDate: weekStart, endDate: weekEnd } =
        getWeekRange(inputDate);
      filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
      break;
    case "monthly":
      filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() === inputDate.getFullYear() &&
          transactionDate.getMonth() === inputDate.getMonth()
        );
      });
      break;
    case "yearly":
      filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === inputDate.getFullYear();
      });
      break;
    default:
      filteredTransactions = [];
  }

  // If no transactions after filtering, return early
  if (filteredTransactions.length === 0) {
    return {
      reportTableData: [],
      summaryData: defaultSummary,
      chartData: [],
      reportTitle: `${reportType.toUpperCase()} SALES`,
    };
  }

  const reportItems = [];
  let grossTotalSales = 0;
  let totalItemDiscounts = 0;
  let totalTransactionDiscounts = 0;
  let lessNonCashPayments = 0;
  let totalQuantity = 0;

  // Process all transactions to build report items and calculate totals
  filteredTransactions.forEach((t) => {
    const transactionDateTime = new Date(t.date);
    const transactionTime = transactionDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Process only non-voided transactions for summary calculations
    if (!t.isVoid) {
      totalTransactionDiscounts += t.discountAmount || 0;

      if (
        t.paymentType &&
        t.paymentType.toLowerCase() !== "cash" &&
        t.paymentType !== ""
      ) {
        // The amount for non-cash payment is the final amount of that transaction
        lessNonCashPayments += t.totalAmount;
      }
    }

    (t.purchasedProducts || []).forEach((p) => {
      // Calculate item-level sales and discounts
      const itemSubtotal = p.subtotal || 0;
      const itemDiscount = p.discountValue || 0;
      const itemNetSales = itemSubtotal - itemDiscount;

      if (!t.isVoid) {
        grossTotalSales += itemSubtotal;
        totalItemDiscounts += itemDiscount;
        totalQuantity += p.quantity || 0;
      }

      reportItems.push({
        time: transactionTime,
        salesRep: t.fullName || "N/A",
        id: t.id,
        vatType: p.vatType || "N/A",
        product: p.pricelist?.productName || p.productName || "Unknown Product",
        quantity: t.isVoid ? 0 : p.quantity || 0,
        unitPrice: p.price || 0,
        itemDiscount: t.isVoid ? 0 : itemDiscount, // Pass item discount
        totalSales: t.isVoid ? 0 : itemNetSales, // Use corrected net sales for the item
        datetime: transactionDateTime,
        paymentType: t.paymentType,
        location: t.location || "N/A",
        isVoid: t.isVoid || false,
        voidBy: t.voidBy || null,
      });
    });
  });

  reportItems.sort((a, b) => a.datetime - b.datetime);

  // Final summary calculations
  const netSales =
    grossTotalSales - totalItemDiscounts - totalTransactionDiscounts;
  const grandTotal = netSales - lessNonCashPayments; // This is now the total cash sales

  const summaryData = {
    totalQuantity: totalQuantity,
    grossTotalSales: grossTotalSales,
    totalItemDiscounts: totalItemDiscounts,
    totalTransactionDiscounts: totalTransactionDiscounts,
    netSales: netSales,
    lessNonCashPayments: lessNonCashPayments,
    grandTotal: grandTotal,
    reportDateString: formatReportDateDisplay(inputDate, reportType),
    locationName: locationName,
  };

  // Chart data calculation (remains the same, but uses corrected totalSales)
  const salesByRep = reportItems.reduce((acc, item) => {
    if (!item.isVoid) {
      // item.totalSales is now net of item-level discount
      acc[item.salesRep] = (acc[item.salesRep] || 0) + item.totalSales;
    }
    return acc;
  }, {});

  // Note: Chart won't reflect transaction-level discounts. This is usually acceptable.
  const chartData = Object.keys(salesByRep)
    .map((repName) => ({
      name: repName,
      TotalSales: parseFloat(salesByRep[repName].toFixed(2)),
    }))
    .filter((rep) => rep.TotalSales > 0)
    .sort((a, b) => b.TotalSales - a.TotalSales);

  const reportTitle = `${reportType.toUpperCase()} SALES`;

  return { reportTableData: reportItems, summaryData, chartData, reportTitle };
};
