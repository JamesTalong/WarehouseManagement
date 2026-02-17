// src/components/AllPos/ProductPos.js

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  resetPos,
  increasePosQuantity,
  decreasePosQuantity,
  deleteItemPos,
  updateDiscount,
  updateQuantity,
  selectLastModifiedProduct,
  setSelectedCustomer,
  triggerRefresh,
  selectUserID,
  selectFullName,
} from "../../../../redux/IchthusSlice";
import TotalPos from "./TotalPos";
import { useReactToPrint } from "react-to-print";
import SelectedSerialModal from "./SelectedSerialModal";
import FormInputs from "./FormInputs";
import ProductTable from "./ProductTable";
import axios from "axios";
import CustomerDisplay from "./CustomerDisplay";
import PrintReceipt from "../../Transactions/TransactionsModule/PrintTransaction/PrintReceipt";
import SalesQuotationPrint from "../SalesQuotationPrint";
import { domain } from "../../../../security";
import {
  ArrowLeft,
  CreditCard,
  X,
  ShoppingBag,
  UserCircle,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Printer,
  FileText,
} from "lucide-react";

const ProductPos = ({ isCheckoutView, onBackToProducts }) => {
  const dispatch = useDispatch();

  // --- Redux Data ---
  const posProducts = useSelector((state) => state.orebiReducer.posProducts);
  const existingLocation = useSelector(
    (state) => state.orebiReducer.existingLocation,
  );
  const selectedCustomer = useSelector(
    (state) => state.orebiReducer.selectedCustomer,
  );
  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectFullName);
  const lastModifiedProduct = useSelector(selectLastModifiedProduct);

  // --- UI State ---
  const [viewMode, setViewMode] = useState("cart");
  const pageSize = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Form Data ---
  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    date: new Date().toISOString().split("T")[0],
    tinNumber: "",
    mobileNumber: "",
    preparedBy: "",
    checkedBy: "",
    businessStyle: "",
    rfid: "",
    terms: "",
    isActive: true,
    payment: 0,
    paymentType: "",
  });

  // --- Logic State ---
  const [hasVat, setHasVat] = useState(false);
  const [hasEwt, setHasEwt] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchasedSerials, setPurchasedSerials] = useState({});
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [refreshCustomerData, setRefreshCustomerData] = useState(
    () => () => {},
  );

  // --- SALES QUOTATION STATE ---
  const [quotePrintData, setQuotePrintData] = useState(null);

  // --- HELPERS ---
  const getExcludedSerials = (currentProductUniqueId) => {
    let usedIds = [];
    Object.keys(purchasedSerials).forEach((key) => {
      if (key !== String(currentProductUniqueId)) {
        const ids = purchasedSerials[key];
        if (Array.isArray(ids)) {
          usedIds = [...usedIds, ...ids];
        }
      }
    });
    return usedIds;
  };

  useEffect(() => {
    if (posProducts.length > 0) {
      setHasVat(posProducts[0].vatType === "vatInc");
    } else {
      setHasVat(false);
    }
  }, [posProducts]);

  useEffect(() => {
    setHasEwt(selectedCustomer?.ewt === true);
  }, [selectedCustomer]);

  const deleteSerialTempsByProductId = useCallback(async (productId) => {
    try {
      setPurchasedSerials((prev) => {
        const { [productId]: _, ...remaining } = prev;
        return remaining;
      });
    } catch (error) {
      console.error("Error deleting serialTemps", error);
    }
  }, []);

  useEffect(() => {
    if (lastModifiedProduct?.id) {
      deleteSerialTempsByProductId(lastModifiedProduct.id);
    }
  }, [lastModifiedProduct, deleteSerialTempsByProductId]);

  const handleCustomerSelect = (customer) => {
    const customerData = {
      customerId: customer?.id,
      customerName: customer?.customerName,
      address: customer?.address,
      businessStyle: customer?.businessStyle,
      customerType: customer?.customerType,
      mobileNumber: customer?.mobileNumber,
      rfid: customer?.rfid,
      tinNumber: customer?.tinNumber,
      ewt: customer?.ewt,
    };
    dispatch(setSelectedCustomer(customerData));
  };

  const toggleFormModal = () => setIsFormModalOpen(!isFormModalOpen);

  const handleSaveForm = async () => {
    if (!selectedCustomer?.customerId) {
      alert("No customer selected.");
      return;
    }
    try {
      await axios.delete(`${domain}/api/CustomerTemps/delete-all`, {
        headers: { "Content-Type": "application/json" },
      });
      const response = await axios.post(
        `${domain}/api/CustomerTemps`,
        selectedCustomer,
        { headers: { "Content-Type": "application/json" } },
      );
      if (response.status === 200) {
        refreshCustomerData();
        alert("Customer saved!");
        toggleFormModal();
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer.");
    }
  };

  // --- Calculations ---
  const totalAmount = posProducts.reduce(
    (total, product) =>
      total + product.price * product.quantity - (product.discount || 0),
    0,
  );
  const totalQuantity = posProducts.reduce(
    (total, product) => total + product.quantity,
    0,
  );
  const discountAmount =
    discountType === "percentage"
      ? ((parseFloat(discountValue) || 0) / 100) * totalAmount
      : parseFloat(discountValue) || 0;
  const adjustedTotalAmount = totalAmount - discountAmount;
  const netOfVat = adjustedTotalAmount / 1.12;
  const vatAmountValue = netOfVat * 0.12;
  const ewtAmountValue = netOfVat * 0.01;
  const change = (parseFloat(formData.payment) || 0) - adjustedTotalAmount;

  // --- Actions ---
  const handleDiscountTypeChange = (value) => setDiscountType(value);
  const handleDiscountValueChange = (value) => setDiscountValue(value);

  const openSerialModal = (product) => {
    setSelectedProduct(product);
    setIsSerialModalOpen(true);
  };
  const closeSerialModal = () => {
    setIsSerialModalOpen(false);
    setSelectedProduct(null);
  };
  const handleSaveSerials = (productId, selectedSerials) => {
    setPurchasedSerials((prev) => ({ ...prev, [productId]: selectedSerials }));
    closeSerialModal();
  };

  // Table Logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = posProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(posProducts.length / pageSize);

  const handleIncreaseQuantity = (id) => {
    deleteSerialTempsByProductId(id);
    dispatch(increasePosQuantity({ id }));
  };
  const handleDecreaseQuantity = (id) => {
    deleteSerialTempsByProductId(id);
    dispatch(decreasePosQuantity({ id }));
  };
  const handleDeleteItem = (id) => {
    deleteSerialTempsByProductId(id);
    dispatch(deleteItemPos(id));
  };
  const handleQuantityChange = (id, quantity) => {
    deleteSerialTempsByProductId(id);
    dispatch(updateQuantity({ id, quantity }));
  };
  const handleDiscountChange = (id, discount) => {
    dispatch(updateDiscount({ id, discount: parseFloat(discount) || 0 }));
  };

  const handleResetPos = async () => {
    if (window.confirm("Are you sure you want to clear the entire cart?")) {
      try {
        dispatch(resetPos());
        setPurchasedSerials({});
        setHasVat(false);
        setHasEwt(false);
        setViewMode("cart");
      } catch (error) {
        console.error("Error deleting serials:", error);
        dispatch(resetPos());
      }
    }
  };

  // --- PRINT REFS ---
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "POS Receipt",
  });

  const quotePrintRef = useRef();
  const handlePrintQuote = useReactToPrint({
    content: () => quotePrintRef.current,
    documentTitle: "Sales Quotation",
  });

  // --- NEW: FETCH FULL QUOTATION FOR PRINTING ---
  const fetchQuotationData = async (id) => {
    try {
      // We fetch via GET because the POST response doesn't include the joined Customer/Location data
      const response = await axios.get(`${domain}/api/SalesQuotations/${id}`);
      setQuotePrintData(response.data);
      // Wait a moment for state to update and barcode to render
      setTimeout(() => {
        handlePrintQuote();
      }, 500);
    } catch (error) {
      console.error("Error fetching quotation details:", error);
      alert("Quotation saved, but failed to load print preview.");
    }
  };

  const handleSalesQuotation = async (shouldPrint) => {
    if (posProducts.length === 0) {
      alert("Cart is empty.");
      return;
    }

    const payload = {
      customerId: selectedCustomer?.customerId || null,
      locationId: existingLocation?.id,
      userId: userID,
      fullName: fullName,
      preparedBy: formData.preparedBy,
      checkedBy: formData.checkedBy,
      totalAmount: adjustedTotalAmount,
      totalQuantity: totalQuantity,
      quotationProducts: posProducts.map((p) => ({
        productId: p.productId,
        productName: p.name,
        itemCode: p.itemCode || "N/A",
        quantity: p.quantity,
        price: p.price,
        subtotal: p.quantity * p.price - (p.discount || 0),
        uomId: p.uomId,
        uom: p.uom,
        conversionRate: p.conversionRate,
        priceType: p.vatType,
      })),
    };

    try {
      const response = await axios.post(
        `${domain}/api/SalesQuotations`,
        payload,
      );

      if (response.status === 200) {
        alert("Sales Quotation Saved Successfully!");

        if (shouldPrint) {
          // Use the ID from the response to fetch full details
          await fetchQuotationData(response.data.id);
        }
      }
    } catch (error) {
      console.error("Quotation Error", error);
      alert("Failed to save quotation.");
    }
  };
  // --- Save Logic (Transactions - UNCHANGED) ---
  const createCustomerTransactionData = () => {
    if (!selectedCustomer) return { customerData: null, transactionData: null };

    const transactionData = {
      customerId: selectedCustomer.customerId,
      date: formData.date,
      payment: parseFloat(formData.payment) || 0,
      paymentType: formData.paymentType,
      terms: formData.terms,
      preparedBy: formData.preparedBy,
      checkedBy: formData.checkedBy,
      totalItems: totalQuantity,
      totalAmount: adjustedTotalAmount,
      discountType: discountType,
      discountAmount: discountAmount,
      change: change,
      locationId: existingLocation.id,
      location: existingLocation.location,
      userId: userID,
      fullName: fullName,
      vatAmount: hasVat ? vatAmountValue : null,
      ewtAmount: hasEwt ? ewtAmountValue : null,
    };
    return {
      customerData: { customerId: selectedCustomer.customerId },
      transactionData,
    };
  };

  const saveCustomerAndTransaction = async (isPrint = false) => {
    const { customerData, transactionData } = createCustomerTransactionData();

    if (!customerData) {
      alert("Please select a customer.");
      return;
    }
    if (
      !transactionData.paymentType ||
      transactionData.paymentType === "Others:"
    ) {
      alert("Please select a payment method.");
      return;
    }

    if ((parseFloat(formData.payment) || 0) < adjustedTotalAmount) {
      alert(
        "Insufficient Payment! The payment cannot be less than the total balance.",
      );
      return;
    }

    if (posProducts.length === 0) {
      alert("Cart is empty.");
      return;
    }

    const missingSerialProduct = posProducts.find(
      (p) =>
        p.hasSerial &&
        (!purchasedSerials[p.id] || purchasedSerials[p.id].length === 0),
    );
    if (missingSerialProduct) {
      alert(`Missing serials for: ${missingSerialProduct.name}`);
      return;
    }

    try {
      const preparedProducts = [];
      const globalUsedSerialIds = new Set();
      Object.values(purchasedSerials).forEach((ids) => {
        if (Array.isArray(ids))
          ids.forEach((id) => globalUsedSerialIds.add(id));
      });

      for (const product of posProducts) {
        if (purchasedSerials[product.id]) {
          preparedProducts.push({
            ...product,
            finalSerialIds: purchasedSerials[product.id],
          });
          continue;
        }
        if (!product.hasSerial) {
          try {
            const conv = product.conversionRate || 1;
            const req = Math.round(product.quantity * conv);
            const locParam = existingLocation?.id
              ? `?locationId=${existingLocation.id}`
              : "";
            const res = await axios.get(
              `${domain}/api/SerialNumbers/available/${product.productId}${locParam}`,
            );

            const valid = res.data.filter(
              (s) => !globalUsedSerialIds.has(s.id),
            );
            const selected = valid.slice(0, req).map((s) => s.id);
            selected.forEach((id) => globalUsedSerialIds.add(id));
            preparedProducts.push({ ...product, finalSerialIds: selected });
          } catch (err) {
            console.error("Auto-fetch error", err);
            preparedProducts.push({ ...product, finalSerialIds: [] });
          }
        } else {
          preparedProducts.push({ ...product, finalSerialIds: [] });
        }
      }

      const payload = {
        ...transactionData,
        purchasedProducts: preparedProducts.map((p) => ({
          selectedProduct: p.id,
          productId: p.productId,
          quantity: p.quantity,
          price: p.price,
          subtotal: p.quantity * p.price - (p.discount || 0),
          vatType: p.vatType,
          discountValue: p.discount || 0,
          uomId: p.uomId, // Saved in Redux
          uom: p.uom, // Saved in Redux
          conversionRate: p.conversionRate, // Saved in Redux
          serialNumbers:
            p.finalSerialIds.length > 0
              ? [{ productId: p.productId, serialNumbers: p.finalSerialIds }]
              : [],
        })),
      };

      const response = await axios.post(`${domain}/api/Transactions`, payload);

      await axios.delete(`${domain}/api/SerialTemps/delete-all`);
      setPurchasedSerials({});
      dispatch(resetPos());
      dispatch(triggerRefresh());
      setHasVat(false);
      setHasEwt(false);
      setViewMode("cart");
      alert("Success!");

      if (isPrint) await fetchTransactionData(response.data.id);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save.");
    }
  };

  const fetchTransactionData = async (tid) => {
    try {
      const res = await axios.get(`${domain}/api/Transactions/${tid}`);
      setPrintData(res.data);
      setTimeout(() => handlePrint(), 500);
    } catch (e) {
      alert("Saved, but print data failed.");
    }
  };

  // --- RENDER ---
  const formatMoney = (val) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-gray-50 w-full h-[90vh] sm:max-w-6xl rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/50">
        {/* === HEADER === */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                viewMode === "cart"
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-green-50 text-green-600"
              } transition-colors`}
            >
              {viewMode === "cart" ? (
                <ShoppingBag size={24} />
              ) : (
                <CreditCard size={24} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
                {viewMode === "cart" ? "Review Cart" : "Secure Checkout"}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {viewMode === "cart"
                  ? `${totalQuantity} items selected`
                  : "Finalize customer & payment"}
              </p>
            </div>
          </div>
          <button
            onClick={onBackToProducts}
            className="group p-2 rounded-full hover:bg-gray-100 transition-all text-gray-400 hover:text-red-500"
          >
            <X
              size={24}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
          </button>
        </div>

        {/* === MAIN CONTENT AREA === */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === "cart" && (
            <div className="h-full flex flex-col animate-slideRight">
              <div className="flex-1 overflow-y-auto p-6">
                {posProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                      <ShoppingBag size={48} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-700">
                        Your bag is empty
                      </h3>
                      <p className="text-gray-500">
                        Add products to start a transaction.
                      </p>
                    </div>
                    <button
                      onClick={onBackToProducts}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Back to Catalog
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <ProductTable
                      allProducts={posProducts}
                      paginatedProducts={paginatedProducts}
                      totalPages={totalPages}
                      currentPage={currentPage}
                      onIncreaseQuantity={handleIncreaseQuantity}
                      onDecreaseQuantity={handleDecreaseQuantity}
                      onDeleteItem={handleDeleteItem}
                      onChangePage={setCurrentPage}
                      onOpenSerialModal={openSerialModal}
                      onUpdateDiscount={handleDiscountChange}
                      onUpdateQuantity={handleQuantityChange}
                      purchasedSerials={purchasedSerials}
                    />
                  </div>
                )}
              </div>

              {posProducts.length > 0 && (
                <div className="bg-white border-t border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div
                    className="flex items-center gap-2 text-gray-500 hover:text-red-600 cursor-pointer transition-colors"
                    onClick={handleResetPos}
                  >
                    <Trash2 size={18} />
                    <span className="text-sm font-semibold">Clear Items</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                        Estimated Total
                      </p>
                      <p className="text-2xl font-black text-gray-900">
                        {formatMoney(totalAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode("checkout")}
                      className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-gray-300 hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
                    >
                      Proceed <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === "checkout" && (
            <div className="h-full flex flex-col lg:flex-row animate-slideLeft">
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <UserCircle size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          Customer Info
                        </h3>
                      </div>
                      <button
                        onClick={toggleFormModal}
                        className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        {selectedCustomer ? "Change" : "Select Customer"}
                      </button>
                    </div>

                    <CustomerDisplay
                      onRefresh={(refreshFunc) =>
                        setRefreshCustomerData(() => refreshFunc)
                      }
                    />
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CreditCard size={24} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        Payment & Terms
                      </h3>
                    </div>

                    <TotalPos
                      posProducts={posProducts}
                      payment={formData.payment}
                      paymentType={formData.paymentType}
                      totalQuantity={totalQuantity}
                      totalAmount={totalAmount}
                      discountType={discountType}
                      discountValue={discountValue}
                      discountAmount={discountAmount}
                      change={change}
                      adjustedTotalAmount={adjustedTotalAmount}
                      onDiscountTypeChange={handleDiscountTypeChange}
                      onDiscountValueChange={handleDiscountValueChange}
                      onPaymentChange={(val) =>
                        setFormData((prev) => ({ ...prev, payment: val }))
                      }
                      onPaymentTypeChange={(val) =>
                        setFormData((prev) => ({ ...prev, paymentType: val }))
                      }
                      preparedBy={formData.preparedBy}
                      checkedBy={formData.checkedBy}
                      terms={formData.terms}
                      date={formData.date}
                      onDateChange={(val) =>
                        setFormData((prev) => ({ ...prev, date: val }))
                      }
                      onPreparedByChange={(val) =>
                        setFormData((prev) => ({ ...prev, preparedBy: val }))
                      }
                      onCheckedByChange={(val) =>
                        setFormData((prev) => ({ ...prev, checkedBy: val }))
                      }
                      onTermsChange={(val) =>
                        setFormData((prev) => ({ ...prev, terms: val }))
                      }
                      hasVat={hasVat}
                      onHasVatChange={setHasVat}
                      hasEwt={hasEwt}
                      onHasEwtChange={setHasEwt}
                      vatAmount={vatAmountValue}
                      ewtAmount={ewtAmountValue}
                      netOfVat={netOfVat}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[400px] bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-20">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-800">Order Summary</h3>
                    <button
                      onClick={() => setViewMode("cart")}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Edit Items
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{totalQuantity} Items</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {posProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-4"
                    >
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatMoney(item.price)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-700">
                        {formatMoney(
                          item.price * item.quantity - (item.discount || 0),
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatMoney(totalAmount)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatMoney(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="font-bold text-gray-800 text-lg">
                        Total Due
                      </span>
                      <span className="font-black text-gray-900 text-2xl">
                        {formatMoney(adjustedTotalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSalesQuotation(false)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 rounded-xl transition-colors flex flex-col items-center justify-center text-xs"
                      >
                        <FileText size={18} className="mb-1" />
                        Save Quote
                      </button>
                      <button
                        onClick={() => handleSalesQuotation(true)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 rounded-xl transition-colors flex flex-col items-center justify-center text-xs"
                      >
                        <Printer size={18} className="mb-1" />
                        Quote & Print
                      </button>
                    </div>

                    <button
                      onClick={() => saveCustomerAndTransaction(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 hover:shadow-green-300 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 size={20} /> Confirm & Pay
                    </button>
                    <button
                      onClick={() => saveCustomerAndTransaction(false)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Save Only
                    </button>
                    <button
                      onClick={() => setViewMode("cart")}
                      className="text-center text-sm font-semibold text-gray-500 hover:text-gray-800 mt-2"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <ArrowLeft size={14} /> Back to Cart
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isFormModalOpen && (
          <FormInputs
            onCustomerSelect={handleCustomerSelect}
            onSave={handleSaveForm}
            onCancel={toggleFormModal}
          />
        )}

        {isSerialModalOpen && selectedProduct && (
          <SelectedSerialModal
            product={selectedProduct}
            excludedSerialIds={getExcludedSerials(selectedProduct.id)}
            onClose={closeSerialModal}
            onSave={handleSaveSerials}
          />
        )}

        <div style={{ display: "none" }}>
          <PrintReceipt ref={componentRef} transaction={printData} />
        </div>

        <div style={{ display: "none" }}>
          <SalesQuotationPrint ref={quotePrintRef} data={quotePrintData} />
        </div>
      </div>
    </div>
  );
};

export default ProductPos;
