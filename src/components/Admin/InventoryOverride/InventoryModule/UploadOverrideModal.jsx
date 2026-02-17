import React, { useState, useRef, useEffect } from "react";
import XLSX from "xlsx-js-style";
import {
  X,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Save,
  FileWarning,
  Calendar,
  Type,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Package,
  MapPin,
  TrendingUp,
  AlertOctagon,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import { useSelector } from "react-redux";
import { selectUserID, selectFullName } from "../../../../redux/IchthusSlice";

const UploadOverrideModal = ({ isOpen, onClose, onUploadSuccess }) => {
  // --- States ---
  const [fileData, setFileData] = useState([]);
  const [systemData, setSystemData] = useState([]);
  const [isSystemDataLoading, setIsSystemDataLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);

  // UPDATED: Initialize with current local Date AND Time (Format: YYYY-MM-DDTHH:mm)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [note, setNote] = useState("");

  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectFullName);

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      fetchSystemData();
      setStep(1);
      setFileData([]);
      setValidationErrors([]);
      setNote("");
      // Reset time on open
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setSelectedDate(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const fetchSystemData = async () => {
    setIsSystemDataLoading(true);
    try {
      const response = await axios.get(
        `${domain}/api/Products/physical-inventory-base`
      );
      setSystemData(response.data);
    } catch (error) {
      console.error("Failed to fetch current inventory", error);
      toast.warning("Could not fetch system data.");
    } finally {
      setIsSystemDataLoading(false);
    }
  };

  if (!isOpen) return null;

  // --- Logic ---
  const parseSerialString = (str) => {
    if (!str) return [];
    return str
      .toString()
      .split(",")
      .map((s) => s.trim()) // Trim spaces
      .filter(Boolean);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // FIX PART 1: Force everything to be read as TEXT (preserves "00123")
        const rawExcelData = XLSX.utils.sheet_to_json(ws, { raw: false });

        if (rawExcelData.length === 0) {
          toast.error("The uploaded file is empty.");
          return;
        }
        processAndValidate(rawExcelData);
      } catch (error) {
        console.error("Parse Error:", error);
        toast.error("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const processAndValidate = (rawData) => {
    const errors = [];

    const formattedData = rawData.map((row, index) => {
      const rowNum = index + 2;

      // FIX PART 2: Because we used { raw: false }, the IDs are now Strings ("123").
      // We must Convert them back to Integers so they match the System Data (123).
      const pId = parseInt(row["SYS_PID"]);
      const lId = parseInt(row["SYS_LID"]);

      if (!pId || !lId) {
        errors.push(`Row ${rowNum}: Missing 'SYS_PID' or 'SYS_LID'.`);
      }

      // Convert quantities to Integers (cleaning potential strings)
      const newGood = parseInt(row["Good Qty"] || 0);
      const newSold = parseInt(row["Sold Qty"] || 0);
      const newBad = parseInt(row["Bad Qty"] || 0);

      const isSerialized = row["Serialized?"] === "Yes";

      const goodSerials = parseSerialString(row["Good Serials"]);
      const soldSerials = parseSerialString(row["Sold Serials"]);
      const badSerials = parseSerialString(row["Bad Serials"]);

      // Now this matching will work because pId is a Number again
      const oldRecord = systemData.find(
        (sys) => sys.productId === pId && sys.locationId === lId
      );

      const oldGood = oldRecord ? oldRecord.unsoldCount : 0;
      const oldSold = oldRecord ? oldRecord.soldCount : 0;
      const oldBad = oldRecord ? oldRecord.badStock : 0;

      if (isSerialized) {
        if (goodSerials.length !== newGood) {
          errors.push(
            `Row ${rowNum} Error: You entered Qty ${newGood}, but listed ${goodSerials.length} Serial Numbers.`
          );
        }
        if (soldSerials.length !== newSold) {
          errors.push(
            `Row ${rowNum} Error: You entered Qty ${newSold}, but listed ${soldSerials.length} Sold Serial Numbers.`
          );
        }
        if (badSerials.length !== newBad) {
          errors.push(
            `Row ${rowNum} Error: You entered Qty ${newBad}, but listed ${badSerials.length} Bad Serial Numbers.`
          );
        }

        // Optional: Check for duplicates across columns
        const allSerials = [...goodSerials, ...soldSerials, ...badSerials];
        const uniqueSet = new Set(allSerials);
        if (uniqueSet.size !== allSerials.length) {
          errors.push(
            `Row ${rowNum} Error: Contains duplicate serial numbers across Good/Sold/Bad columns.`
          );
        }
      }

      return {
        productId: pId,
        locationId: lId,
        itemCode: row["Item Code"],
        locationName: row["Location"],
        productName: row["Product Name"],
        hasSerial: isSerialized,
        unsoldCount: newGood,
        soldCount: newSold,
        badStock: newBad,
        unsoldSerials: goodSerials,
        soldSerials: soldSerials,
        badSerials: badSerials,
        oldUnsold: oldGood,
        oldSold: oldSold,
        oldBad: oldBad,
        isNewRecord: !oldRecord, // This will now be FALSE (correct) for existing items
        updatedBy: fullName,
        userId: userID,
      };
    });

    setValidationErrors(errors);
    setFileData(formattedData);
    setStep(2);
  };

  const handleFinalSave = async () => {
    if (!selectedDate) return toast.error("Please select a date and time.");
    if (!note.trim()) return toast.error("Please add a note.");

    setIsProcessing(true);
    try {
      const payload = {
        Items: fileData,
        SelectedDate: selectedDate,
        Note: note,
      };

      await axios.post(`${domain}/api/Products/BulkOverride`, payload);
      toast.success("Inventory updated successfully!");

      // 1. Notify Parent to Refresh
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // 2. Close the modal
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFileData([]);
    setStep(1);
    onClose();
  };

  const DiffCell = ({ oldVal, newVal, type }) => {
    const isChanged = oldVal !== newVal;
    const colors = {
      good: "text-emerald-700 bg-emerald-50 border-emerald-100",
      sold: "text-blue-700 bg-blue-50 border-blue-100",
      bad: "text-amber-700 bg-amber-50 border-amber-100",
    };
    const theme = colors[type] || "text-gray-700 bg-gray-50 border-gray-200";

    if (!isChanged) {
      return <span className="text-gray-300 font-mono text-xs">{newVal}</span>;
    }

    return (
      <div
        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border ${theme} shadow-sm`}
      >
        <span className="text-xs font-mono opacity-60 line-through mr-1">
          {oldVal}
        </span>
        <ArrowRight size={10} className="opacity-50" />
        <span className="text-sm font-bold font-mono">{newVal}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 font-sans">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-20">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                step === 1
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {step === 1 ? <Upload size={20} /> : <CheckCircle size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Physical Inventory
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    step >= 1 ? "bg-indigo-500" : "bg-slate-300"
                  }`}
                ></span>
                <span>Upload</span>
                <span className="text-slate-300">/</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    step >= 2 ? "bg-indigo-500" : "bg-slate-300"
                  }`}
                ></span>
                <span>Review</span>
                <span className="text-slate-300">/</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    step >= 3 ? "bg-indigo-500" : "bg-slate-300"
                  }`}
                ></span>
                <span>Confirm</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden bg-slate-50/50">
          {step === 1 && (
            <div className="absolute inset-0 flex items-center justify-center p-8 animate-in fade-in zoom-in-95">
              <div
                className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white
                  ${
                    isSystemDataLoading
                      ? "border-slate-200 bg-slate-50"
                      : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/20 shadow-sm hover:shadow-md"
                  }
                `}
                onClick={() =>
                  !isSystemDataLoading && fileInputRef.current?.click()
                }
              >
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isSystemDataLoading}
                />

                <div
                  className={`p-6 rounded-full mb-6 transition-all duration-500 ${
                    isSystemDataLoading ? "bg-slate-100" : "bg-indigo-50"
                  }`}
                >
                  {isSystemDataLoading ? (
                    <RefreshCw
                      className="animate-spin text-slate-400"
                      size={40}
                    />
                  ) : (
                    <FileSpreadsheet className="text-indigo-600" size={40} />
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  {isSystemDataLoading
                    ? "Syncing System Data..."
                    : "Upload Inventory File"}
                </h2>
                <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
                  {isSystemDataLoading
                    ? "We are fetching the latest inventory counts to compare against your upload."
                    : "Drag and drop your Excel file here to begin the bulk adjustment process."}
                </p>

                <button
                  disabled={isSystemDataLoading}
                  className="px-8 py-3 bg-indigo-600 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200/50 transition-all transform active:scale-95"
                >
                  Select Excel File
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="absolute inset-0 flex flex-col animate-in slide-in-from-right-8 duration-300">
              {validationErrors.length > 0 && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 shadow-sm shrink-0">
                  <FileWarning
                    className="text-red-600 mt-0.5 shrink-0"
                    size={18}
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-red-900 text-sm">
                      Action Required
                    </h4>
                    <ul className="list-disc list-inside text-xs text-red-700 mt-1 max-h-16 overflow-y-auto">
                      {validationErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th className="p-4 w-[350px] text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 sticky left-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                            Product Details
                          </th>
                          <th className="p-4 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider border-b border-slate-200 bg-emerald-50/50">
                            <div className="flex items-center justify-center gap-1">
                              <Package size={14} /> Good Stock
                            </div>
                          </th>
                          <th className="p-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-slate-200 bg-blue-50/50">
                            <div className="flex items-center justify-center gap-1">
                              <TrendingUp size={14} /> Sold
                            </div>
                          </th>
                          <th className="p-4 text-center text-xs font-bold text-amber-700 uppercase tracking-wider border-b border-slate-200 bg-amber-50/50">
                            <div className="flex items-center justify-center gap-1">
                              <AlertOctagon size={14} /> Bad Stock
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fileData.map((row, i) => {
                          const hasChanged =
                            row.unsoldCount !== row.oldUnsold ||
                            row.soldCount !== row.oldSold ||
                            row.badStock !== row.oldBad;

                          return (
                            <tr
                              key={i}
                              className={`group transition-colors ${
                                hasChanged
                                  ? "bg-white hover:bg-slate-50"
                                  : "bg-slate-50/30 grayscale-[0.5] hover:grayscale-0"
                              }`}
                            >
                              <td className="p-4 border-r border-slate-100 sticky left-0 z-10 bg-inherit shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] group-hover:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] transition-shadow">
                                <div className="flex flex-col gap-1">
                                  <span
                                    className={`font-semibold text-sm truncate w-64 ${
                                      hasChanged
                                        ? "text-slate-800"
                                        : "text-slate-500"
                                    }`}
                                    title={row.productName}
                                  >
                                    {row.productName}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                      {row.itemCode}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <MapPin size={10} /> {row.locationName}
                                    </span>
                                    {row.isNewRecord && (
                                      <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 text-center border-r border-slate-50">
                                <DiffCell
                                  oldVal={row.oldUnsold}
                                  newVal={row.unsoldCount}
                                  type="good"
                                />
                              </td>

                              <td className="p-3 text-center border-r border-slate-50">
                                <DiffCell
                                  oldVal={row.oldSold}
                                  newVal={row.soldCount}
                                  type="sold"
                                />
                              </td>

                              <td className="p-3 text-center">
                                <DiffCell
                                  oldVal={row.oldBad}
                                  newVal={row.badStock}
                                  type="bad"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 px-6">
                    <span>
                      Total Items: <strong>{fileData.length}</strong>
                    </span>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                        Unsold
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>{" "}
                        Sold
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>{" "}
                        Bad
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center z-20">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Re-upload
                </button>
                <button
                  onClick={() => validationErrors.length === 0 && setStep(3)}
                  disabled={validationErrors.length > 0}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                >
                  Next: Finalize <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div
              className={`absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 transition-transform duration-500 ease-in-out z-30 ${
                step === 3 ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-white text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-50">
                    <Save size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Confirm Updates
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm">
                    You are about to overwrite inventory for{" "}
                    <strong>{fileData.length} items</strong>. <br />
                    This action cannot be undone immediately.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* UPDATED DATE & TIME PICKER */}
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                      Reference Date & Time
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-4 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="datetime-local" // Changed from 'date'
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex justify-between items-end mb-2 ml-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Audit Note
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          note.length === 30 ? "text-red-500" : "text-slate-400"
                        }`}
                      >
                        {note.length}/30
                      </span>
                    </div>
                    <div className="relative">
                      <Type
                        className="absolute left-4 top-3 text-slate-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={note}
                        onChange={(e) =>
                          e.target.value.length <= 30 && setNote(e.target.value)
                        }
                        placeholder="e.g. Q4 Audit Adjustment"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                  <button
                    onClick={handleFinalSave}
                    disabled={isProcessing}
                    className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <RefreshCw className="animate-spin" size={20} />
                    ) : (
                      <Check size={20} />
                    )}
                    {isProcessing ? "Processing..." : "Confirm & Save Changes"}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={isProcessing}
                    className="w-full py-3 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors"
                  >
                    Back to Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadOverrideModal;
