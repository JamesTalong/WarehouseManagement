import React, { useState } from "react";
import XLSX from "xlsx-js-style";
import {
  Package,
  MapPin,
  Tag,
  Eye,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  PlusCircle, // Imported PlusCircle
} from "lucide-react";
import { toast } from "react-toastify";
import UploadOverrideModal from "./UploadOverrideModal";
import SerialNumberModal from "./SerialNumberModal";
import NewItemsBulkModal from "./NewItemsModal"; // Imported NewItemsBulkModal

const InventoryOverrideTable = ({ data, allData, serialFilter, onRefresh }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewItemsModalOpen, setIsNewItemsModalOpen] = useState(false); // New State
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Logic to determine location ID for new items
  const currentLocationId =
    data && data.length > 0
      ? data[0].locationId
      : allData && allData.length > 0
      ? allData[0].locationId
      : null;

  const openSerialModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeSerialModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDownloadClick = () => {
    setIsWarningModalOpen(true);
  };

  // --- FULL EXCEL LOGIC ---
  const proceedWithDownload = () => {
    const dataToExport = allData && allData.length > 0 ? allData : data;
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    try {
      // 1. Map Data
      const exportData = dataToExport.map((item) => {
        const row = {
          SYS_PID: item.productId,
          SYS_LID: item.locationId,
          "Item Code": item.itemCode,
          "Product Name": item.productName,
          Location: item.locationName,
          UOM: item.uomName,
          "Serialized?": item.hasSerial ? "Yes" : "No",
        };

        row["Good Qty"] = item.unsoldCount;
        if (serialFilter !== "Non-Serialized") {
          row["Good Serials"] =
            item.unsoldSerials?.map((s) => s.serialName).join(", ") || "";
        }
        row["Sold Qty"] = item.soldCount;
        if (serialFilter !== "Non-Serialized") {
          row["Sold Serials"] =
            item.soldSerials?.map((s) => s.serialName).join(", ") || "";
        }
        row["Bad Qty"] = item.badStock;
        if (serialFilter !== "Non-Serialized") {
          row["Bad Serials"] =
            item.badSerials?.map((s) => s.serialName).join(", ") || "";
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);

      // 2. Define Styles
      const baseHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      const systemHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "4F46E5" } }, // Indigo
      };
      const goodHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "10B981" } }, // Emerald
      };
      const soldHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "3B82F6" } }, // Blue
      };
      const badHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "EF4444" } }, // Red
      };

      const cellStyle = {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      // 3. Set Column Widths
      ws["!cols"] = Object.keys(exportData[0]).map((key) => {
        if (key.includes("SYS_")) return { wch: 10 };
        if (key.includes("Name") || key.includes("Serials")) return { wch: 30 };
        return { wch: 15 };
      });

      // 4. Apply Styles to Cells
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[address]) continue;

          if (R === 0) {
            // Header Row Styling
            const val = ws[address].v;
            if (val.includes("Good")) ws[address].s = goodHeader;
            else if (val.includes("Sold")) ws[address].s = soldHeader;
            else if (val.includes("Bad")) ws[address].s = badHeader;
            else ws[address].s = systemHeader;
          } else {
            // Data Row Styling
            ws[address].s = cellStyle;
          }
        }
      }

      // 5. Create Book and Export
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
      XLSX.writeFile(
        wb,
        `Physical_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Excel downloaded successfully!");
      setIsWarningModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data.");
    }
  };

  // --- HANDLER FOR NEW ITEMS CLICK ---
  const handleNewItemsClick = () => {
    if (!currentLocationId) {
      toast.error(
        "Could not determine Location ID. Please ensure data is loaded for this location."
      );
      return;
    }
    setIsNewItemsModalOpen(true);
  };

  // --- RENDERING ---

  // Handle Empty State but keep buttons accessible
  if (!data || data.length === 0) {
    return (
      <>
        <UploadOverrideModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => {
            setIsUploadOpen(false);
            if (onRefresh) onRefresh();
          }}
        />

        {/* NEW MODAL (Only renders if location is known) */}
        {currentLocationId && (
          <NewItemsBulkModal
            isOpen={isNewItemsModalOpen}
            onClose={() => setIsNewItemsModalOpen(false)}
            locationId={currentLocationId}
            refreshData={onRefresh}
          />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            No Inventory Found
          </h3>

          <div className="flex justify-center gap-3 mt-4">
            {/* Added New Items Button here as well */}

            <button
              onClick={handleNewItemsClick}
              disabled={!currentLocationId}
              className={`flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !currentLocationId ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <PlusCircle size={16} /> New Items
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Upload size={16} /> Upload Adjustments
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SerialNumberModal
        isOpen={isModalOpen}
        onClose={closeSerialModal}
        item={selectedItem}
      />

      <UploadOverrideModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsUploadOpen(false);
          if (onRefresh) onRefresh();
        }}
      />

      {/* NEW MODAL COMPONENT */}
      {currentLocationId && (
        <NewItemsBulkModal
          isOpen={isNewItemsModalOpen}
          onClose={() => setIsNewItemsModalOpen(false)}
          locationId={currentLocationId}
          refreshData={onRefresh}
        />
      )}

      {/* Warning Modal (Filled with content from reference) */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Excel Editing Guide
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  The file is organized for easier editing. Please follow the
                  rules below.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                  <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    Left Side
                  </span>
                  <div className="text-indigo-800 font-bold text-sm">
                    Violet Columns
                  </div>
                  <div className="text-xs text-indigo-600 mt-1">
                    System Info & IDs
                  </div>
                  <div className="mt-2 text-[10px] bg-white border border-indigo-200 text-indigo-700 py-1 px-2 rounded-full inline-block">
                    DO NOT EDIT
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                  <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Right Side
                  </span>
                  <div className="text-emerald-800 font-bold text-sm">
                    Colored Columns
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    Counts & Serials
                  </div>
                  <div className="mt-2 text-[10px] bg-white border border-emerald-200 text-emerald-700 py-1 px-2 rounded-full inline-block">
                    EDIT THESE
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Rules
                </h4>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                  <div className="mt-0.5">
                    <Tag size={16} className="text-purple-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-slate-800 block">
                      If Serialized (Yes):
                    </span>
                    <span className="text-slate-500">
                      Edit the <strong>Serial Number columns</strong> (comma
                      separated). <br />
                      <span className="text-xs italic text-slate-400">
                        Example: SN001, SN002, SN003
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                  <div className="mt-0.5">
                    <Package size={16} className="text-slate-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-slate-800 block">
                      If Non-Serialized (No):
                    </span>
                    <span className="text-slate-500">
                      Ignore serial columns. Edit the{" "}
                      <strong>Qty/Count columns</strong> directly.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsWarningModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all active:scale-95"
              >
                <CheckCircle2 size={16} />I Understand & Download
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mb-4">
        {/* --- NEW ITEMS BUTTON --- */}
        <button
          onClick={handleNewItemsClick}
          className="flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <PlusCircle size={16} /> New Items
        </button>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Upload size={16} /> Upload Adjustments
        </button>
        <button
          onClick={handleDownloadClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Download size={16} /> Download Excel
        </button>
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-medium">
            <tr>
              <th className="px-6 py-4 w-[25%]">Product Details</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4 text-center">Unit</th>
              <th className="px-6 py-4 text-center bg-indigo-50/40 text-indigo-700">
                Total Stock
              </th>
              <th className="px-6 py-4 text-center text-teal-700">Good</th>
              <th className="px-6 py-4 text-center text-slate-600">Sold</th>
              <th className="px-6 py-4 text-center text-orange-700">Bad</th>
              <th className="px-6 py-4 text-center">Serials</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr
                key={`${item.productId}-${item.locationId}`}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-base">
                      {item.productName}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-slate-500 text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        <Tag size={10} /> {item.itemCode}
                      </div>
                      {item.hasSerial && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                          SERIALIZED
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <MapPin size={14} className="text-slate-400" />{" "}
                    {item.locationName}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md bg-white text-slate-600 text-xs font-medium border border-slate-200">
                    {item.uomName}
                  </span>
                </td>
                <td className="px-6 py-4 text-center bg-indigo-50/20">
                  <span className="text-lg font-bold text-indigo-700">
                    {item.totalCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-teal-600 font-medium">
                  {item.unsoldCount}
                </td>
                <td className="px-6 py-4 text-center text-slate-500 font-medium">
                  {item.soldCount}
                </td>
                <td className="px-6 py-4 text-center text-orange-600 font-medium">
                  {item.badStock}
                </td>
                <td className="px-6 py-4 text-center">
                  {item.hasSerial ? (
                    <button
                      onClick={() => openSerialModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-all"
                    >
                      <Eye size={14} /> View
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300 italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InventoryOverrideTable;
