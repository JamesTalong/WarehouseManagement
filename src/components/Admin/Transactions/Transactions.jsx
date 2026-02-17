import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
  Search,
  FileText,
  RotateCcw,
  Receipt,
  Filter,
  Download,
  Calendar,
  MapPin,
  Ban,
} from "lucide-react";

// Redux & Security
import { useSelector } from "react-redux";
import { selectUserID, selectUserName } from "../../../redux/IchthusSlice";
import { domain } from "../../../security";

// Components
import Loader from "../../loader/Loader";
import Pagination from "../Pagination";

// Modals & Print Components
import CustomerModal from "./Modals/CustomerModal";
import ReportModal from "./Modals/ReportModal";
import RevertTransactionModal from "./Modals/RevertTransactionModal";
import TransactionDetailsModal from "./TransactionDetailsModal";
import PrintReceipt from "./TransactionsModule/PrintTransaction/PrintReceipt";
import PrintThermal from "./TransactionsModule/PrintTransaction/PrintThermal";
import SalesReportPDFComponent from "./SalesReportPDFComponent/SalesReportPDFComponent";

import "react-datepicker/dist/react-datepicker.css";

const Transactions = () => {
  // --- STATES ---
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Print States
  const [ReceiptData, setReceiptData] = useState(null);
  const [receiptThermal, setReceiptThermal] = useState(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [mySelectedLocation, setMySelectedLocation] = useState("");

  // Default set to "my"
  const [transactionView, setTransactionView] = useState("my");

  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "descending",
  });

  // Report States
  const [reportType, setReportType] = useState("daily");
  const [selectedReportDate, setSelectedReportDate] = useState(new Date());
  const [reportPayload, setReportPayload] = useState(null);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
  const [reportLocationName, setReportLocationName] = useState("");

  // Revert Modal
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [revertTargetId, setRevertTargetId] = useState(null);

  // Redux
  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectUserName);

  // Refs for Printing
  const printReceiptRef = useRef();
  const printThermalRef = useRef();
  const salesReportRef = useRef();

  // --- DATA FETCHING ---
  const fetchLocations = useCallback(async () => {
    try {
      const res = await axios.get(`${domain}/api/Locations`);
      setLocations(res.data);
    } catch (error) {
      toast.error("Failed to fetch locations.");
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let apiUrl;

    if (transactionView === "my") {
      if (userID) {
        apiUrl = `${domain}/api/Transactions/UserId/${userID}`;
      } else {
        setLoading(false);
        setTransactionData([]);
        return;
      }
    } else {
      apiUrl = selectedLocationId
        ? `${domain}/api/Transactions/ByLocation/${selectedLocationId}`
        : `${domain}/api/Transactions`;
    }

    try {
      const response = await axios.get(apiUrl);
      setTransactionData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId, transactionView, userID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // --- HANDLERS ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const openRevertModal = (e, id) => {
    e.stopPropagation();
    setRevertTargetId(id);
    setIsRevertModalOpen(true);
  };

  const handleRevertConfirm = async (id, condition) => {
    try {
      await axios.post(
        `${domain}/api/Transactions/revert/${id}`,
        {
          voidBy: fullName,
          returnCondition: condition,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success(
        `Successfully Reverted as ${condition === "GOOD" ? "Good" : "Bad"}!`
      );
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to revert transaction."
      );
    }
  };

  const handlePrintReceipt = useReactToPrint({
    content: () => printReceiptRef.current,
    documentTitle: "Receipt",
  });
  const handlePrintThermal = useReactToPrint({
    content: () => printThermalRef.current,
    documentTitle: "Thermal Receipt",
  });
  const handlePrintSalesReport = useReactToPrint({
    content: () => salesReportRef.current,
    documentTitle: "Sales Report",
    onAfterPrint: () => setReportPayload(null),
  });

  const triggerPrint = (e, type, transaction) => {
    e.stopPropagation();
    if (type === "thermal") {
      setReceiptThermal(transaction);
      setTimeout(handlePrintThermal, 300);
    } else if (type === "receipt") {
      setReceiptData(transaction);
      setTimeout(handlePrintReceipt, 300);
    }
  };

  const myLocationsOptions = useMemo(() => {
    if (transactionView === "my" && transactionData.length > 0) {
      const uniqueLocations = new Map();
      transactionData.forEach((t) => {
        if (t.locationId && t.location)
          uniqueLocations.set(t.locationId, t.location);
      });
      return Array.from(uniqueLocations, ([id, name]) => ({
        id: id.toString(),
        name,
      }));
    }
    return [];
  }, [transactionData, transactionView]);

  const sortedAndFilteredTransactions = useMemo(() => {
    let data = [...transactionData];
    if (sortConfig !== null) {
      data.sort((a, b) => {
        if (sortConfig.key === "date") {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sortConfig.direction === "ascending"
            ? dateA - dateB
            : dateB - dateA;
        } else if (sortConfig.key === "id") {
          return sortConfig.direction === "ascending"
            ? a.id - b.id
            : b.id - a.id;
        } else {
          const valA = a[sortConfig.key] || "";
          const valB = b[sortConfig.key] || "";
          if (typeof valA === "string") {
            return sortConfig.direction === "ascending"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          }
          return sortConfig.direction === "ascending"
            ? valA - valB
            : valB - valA;
        }
      });
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(
        (t) =>
          t.customer?.customerName?.toLowerCase().includes(lowerTerm) ||
          t.id.toString().includes(lowerTerm) ||
          t.fullName?.toLowerCase().includes(lowerTerm)
      );
    }

    return data;
  }, [transactionData, sortConfig, searchTerm]);

  const currentItems = sortedAndFilteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    let name = "All Locations";
    const findName = (id, list, key) =>
      list.find((l) => l.id.toString() === id.toString())?.[key];
    if (transactionView === "all" && selectedLocationId) {
      name =
        findName(selectedLocationId, locations, "locationName") ||
        "All Locations";
    } else if (transactionView === "my" && mySelectedLocation) {
      name =
        findName(mySelectedLocation, myLocationsOptions, "name") ||
        "All Locations";
    }
    setReportLocationName(name);
  }, [
    selectedLocationId,
    mySelectedLocation,
    locations,
    myLocationsOptions,
    transactionView,
  ]);

  const VoidIndicator = () => (
    <div className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase mt-1">
      <Ban size={14} strokeWidth={3} />
      <span>Void</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Sticky Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                {transactionView === "all"
                  ? "All Transactions"
                  : "My Transactions"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Overview of sales, payments, and inventory movement.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {/* --- CHANGED HERE: "My" button is now FIRST --- */}
                <button
                  onClick={() => setTransactionView("my")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    transactionView === "my"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  My
                </button>
                <button
                  onClick={() => setTransactionView("all")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    transactionView === "all"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  All
                </button>
              </div>

              <button
                onClick={() => setIsSalesReportModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Sales Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-600 bg-white"
              value={
                transactionView === "all"
                  ? selectedLocationId
                  : mySelectedLocation
              }
              onChange={(e) =>
                transactionView === "all"
                  ? setSelectedLocationId(e.target.value)
                  : setMySelectedLocation(e.target.value)
              }
            >
              {(transactionView === "all" ? locations : myLocationsOptions).map(
                (loc) => (
                  <option key={loc.id} value={loc.id}>
                    {transactionView === "all" ? loc.locationName : loc.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Customer Name, or Staff..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Transaction ID / Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Summary</th>
                    <th className="px-6 py-4">Location / Staff</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedTransaction(item)}
                      className={`cursor-pointer transition hover:bg-indigo-50/40 ${
                        item.isVoid ? "bg-red-500/40" : ""
                      }`}
                    >
                      <td className="px-6 py-4 align-middle">
                        <span className="font-bold text-slate-800 text-lg block">
                          #{item.id}
                        </span>
                        {item.isVoid && <VoidIndicator />}
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar size={12} />{" "}
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <span className="font-bold text-indigo-700 block text-base">
                          {item.customer?.customerName || "N/A"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.customer?.customerType || "Walk-In"}
                        </span>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between w-40 text-xs">
                            <span className="text-slate-500">Items:</span>
                            <span className="font-semibold">
                              {item.totalItems}
                            </span>
                          </div>
                          <div className="flex justify-between w-40">
                            <span className="font-bold text-slate-800 text-lg">
                              ₱{item.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 italic">
                            {item.paymentType}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-xs">
                        <div className="flex items-center gap-1 mb-1 font-medium text-slate-700">
                          <MapPin size={14} className="text-indigo-500" />{" "}
                          {item.location}
                        </div>
                        <div className="text-slate-500">
                          By: {item.fullName}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Print Buttons */}
                          <div className="flex bg-slate-100 rounded-lg p-1">
                            <button
                              onClick={(e) => triggerPrint(e, "thermal", item)}
                              title="Print Thermal"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors shadow-sm"
                            >
                              <Receipt size={16} />
                            </button>
                            <button
                              onClick={(e) => triggerPrint(e, "receipt", item)}
                              title="Print Full Receipt"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors shadow-sm"
                            >
                              <FileText size={16} />
                            </button>
                          </div>

                          <div className="w-px h-6 bg-slate-200 mx-1"></div>

                          {/* Void Button (Text + Icon) */}
                          {!item.isVoid && (
                            <button
                              onClick={(e) => openRevertModal(e, item.id)}
                              title="Void Transaction"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors border border-red-100"
                            >
                              <RotateCcw size={14} />
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedTransaction(item)}
                  className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform ${
                    item.isVoid ? "border-l-4 border-l-red-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-lg text-slate-800">
                        #{item.id}
                      </span>
                      {item.isVoid && (
                        <span className="text-red-600 text-xs font-bold uppercase ml-2">
                          VOID
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-indigo-600">
                      ₱{item.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 mb-1">
                    {item.customer?.customerName || "Walk-In"}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span>{item.totalItems} Items</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={sortedAndFilteredTransactions.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Hidden Components for Printing --- */}
      <div className="hidden">
        <PrintReceipt ref={printReceiptRef} transaction={ReceiptData} />
        <PrintThermal ref={printThermalRef} transaction={receiptThermal} />
        {reportPayload && (
          <SalesReportPDFComponent
            ref={salesReportRef}
            reportPayload={reportPayload}
          />
        )}
      </div>

      {/* --- Modals --- */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* THE NEW COMPONENT */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <RevertTransactionModal
        isOpen={isRevertModalOpen}
        transactionId={revertTargetId}
        onClose={() => setIsRevertModalOpen(false)}
        onConfirm={handleRevertConfirm}
      />

      <ReportModal
        isSalesReportModalOpen={isSalesReportModalOpen}
        setIsSalesReportModalOpen={setIsSalesReportModalOpen}
        transactionData={sortedAndFilteredTransactions}
        reportType={reportType}
        setReportType={setReportType}
        selectedReportDate={selectedReportDate}
        setSelectedReportDate={setSelectedReportDate}
        handlePrintSalesReport={handlePrintSalesReport}
        setReportPayload={setReportPayload}
        selectedLocationName={reportLocationName}
      />
    </div>
  );
};

export default Transactions;
