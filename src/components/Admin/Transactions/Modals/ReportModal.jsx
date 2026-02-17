import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X, FileBarChart, Calendar, ChevronDown, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { generateReportData } from "../SalesReportPDFComponent/reportLogic";

const ReportModal = ({
  isSalesReportModalOpen,
  setIsSalesReportModalOpen,
  transactionData,
  reportType,
  setReportType,
  selectedReportDate,
  setSelectedReportDate,
  handlePrintSalesReport,
  setReportPayload,
  selectedLocationName,
}) => {
  if (!isSalesReportModalOpen) return null;

  const prepareAndPrintReport = () => {
    // 1. Validation
    if (!transactionData || transactionData.length === 0) {
      toast.warn("No transaction data available to generate a report.");
      return;
    }
    if (!selectedReportDate) {
      toast.warn("Please select a date for the report.");
      return;
    }

    // 2. Generate Logic
    try {
      const payload = generateReportData(
        transactionData,
        reportType,
        selectedReportDate,
        selectedLocationName
      );
      setReportPayload(payload);

      // 3. Trigger Print (Small delay to allow state update)
      setTimeout(() => {
        handlePrintSalesReport();
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report data.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 m-4">
        {/* --- Header --- */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <FileBarChart size={20} />
            </div>
            Generate Sales Report
          </h2>
          <button
            onClick={() => setIsSalesReportModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Body --- */}
        <div className="p-6 space-y-5">
          {/* Location Context Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 flex justify-between items-center">
            <span className="font-medium">Target Location:</span>
            <span className="font-bold text-indigo-600">
              {selectedLocationName || "All Locations"}
            </span>
          </div>

          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Report Frequency
            </label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Select Period
              <span className="text-slate-400 font-normal ml-2 text-xs">
                {reportType === "weekly" && "(Select any day in the week)"}
                {reportType === "monthly" && "(Select Month & Year)"}
                {reportType === "yearly" && "(Select Year)"}
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                <Calendar size={18} />
              </div>
              <DatePicker
                selected={selectedReportDate}
                onChange={(date) => setSelectedReportDate(date)}
                dateFormat={
                  reportType === "monthly"
                    ? "MMMM yyyy"
                    : reportType === "yearly"
                    ? "yyyy"
                    : "MMMM d, yyyy"
                }
                showMonthYearPicker={reportType === "monthly"}
                showYearPicker={reportType === "yearly"}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                wrapperClassName="w-full"
                popperPlacement="bottom"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={prepareAndPrintReport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mt-2"
          >
            <Printer size={18} />
            Generate & Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
