import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MdClose, MdPerson } from "react-icons/md";
// 1. ADDED: import setSelectedCustomer
import {
  clearSelectedCustomer,
  setSelectedCustomer,
} from "../../../../redux/IchthusSlice";
import { useDispatch } from "react-redux";
import { domain } from "../../../../security";

const CustomerNames = ({ onRefresh }) => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const dispatch = useDispatch();

  const fetchCustomerData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/CustomerTemps`, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (data.length > 0) {
        const promises = data.map(async (customer) => {
          const detailsResponse = await axios.get(
            `${domain}/api/Customers/${customer.customerId}`,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          return {
            ...customer,
            details: detailsResponse.data,
          };
        });

        const detailedCustomerData = await Promise.all(promises);
        setCustomerData(detailedCustomerData);

        // -----------------------------------------------------------
        // 2. ADDED: SYNC TO REDUX
        // If we found a customer in the Temp table, update Redux immediately
        // so ProductPos.js knows about it for calculations/saving.
        // -----------------------------------------------------------
        if (detailedCustomerData.length > 0) {
          const activeCustomer = detailedCustomerData[0];

          const reduxPayload = {
            customerId: activeCustomer.customerId,
            customerName: activeCustomer.customerName,
            // Map details to the structure expected by ProductPos
            address: activeCustomer.details?.address || "",
            businessStyle: activeCustomer.details?.businessStyle || "",
            customerType: activeCustomer.details?.customerType || "",
            mobileNumber: activeCustomer.details?.mobileNumber || "",
            rfid: activeCustomer.details?.rfid || "",
            tinNumber: activeCustomer.details?.tinNumber || "",
            ewt: activeCustomer.details?.ewt || false,
          };

          dispatch(setSelectedCustomer(reduxPayload));
        }
        // -----------------------------------------------------------
      } else {
        setCustomerData(data);
        // If API is empty, ensure Redux is cleared too
        dispatch(clearSelectedCustomer());
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (onRefresh) onRefresh(fetchCustomerData);
  }, [onRefresh, fetchCustomerData]);

  const deleteCustomer = async (customerId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this customer?"
    );
    if (!confirmDelete) {
      return;
    }
    try {
      await axios.delete(
        `${domain}/api/CustomerTemps/by-customer/${customerId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setCustomerData((prev) =>
        prev.filter((c) => c.customerId !== customerId)
      );
      dispatch(clearSelectedCustomer());
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const closePopup = () => {
    setPopupVisible(false);
    setCustomerDetails(null);
  };

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const selectedCustomer = customerData[0];

  return (
    <div className="flex items-center justify-between w-full">
      {/* Customer Display - Direct, no dropdown */}
      <div className="flex items-center gap-3 min-h-[44px] flex-1">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        ) : selectedCustomer ? (
          <>
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <MdPerson className="text-indigo-600 text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 text-sm">
                {selectedCustomer?.customerName || "Unnamed Customer"}
              </span>
              <span className="text-xs text-gray-500">
                {selectedCustomer.details?.customerType || "Walk-In"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <MdPerson className="text-gray-400 text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 text-sm">
                Select a customer
              </span>
              <span className="text-xs text-gray-400">
                No customer selected
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Close/Delete Button - Only show if customer exists */}
      {selectedCustomer && (
        <button
          onClick={() => deleteCustomer(selectedCustomer.customerId)}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-2"
          title="Remove customer"
        >
          <MdClose size={18} />
        </button>
      )}

      {/* Customer Details Popup */}
      {popupVisible && customerDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Customer Details
              </h2>
              <button
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <MdClose size={28} />
              </button>
            </div>

            {/* Customer Overview */}
            <div className="flex items-center gap-x-4 mb-4">
              <MdPerson size={36} className="text-blue-500" />
              <div>
                <h6 className="text-lg font-semibold text-gray-800">
                  {customerDetails.customerName}
                </h6>
                <p className="text-sm text-gray-600">
                  {customerDetails.customerType || "No customer type available"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Customer Details */}
            <div className="space-y-3">
              <p className="text-gray-700 text-sm">
                <strong className="font-medium">Address:</strong>{" "}
                {customerDetails.address}
              </p>
              <p className="text-gray-700 text-sm">
                <strong className="font-medium">TIN Number:</strong>{" "}
                {customerDetails.tinNumber}
              </p>
              <p className="text-gray-700 text-sm">
                <strong className="font-medium">Mobile Number:</strong>{" "}
                {customerDetails.mobileNumber}
              </p>
              <p className="text-gray-700 text-sm">
                <strong className="font-medium">Business Style:</strong>{" "}
                {customerDetails.businessStyle}
              </p>
              <p className="text-gray-700 text-sm">
                <strong className="font-medium">RFID:</strong>{" "}
                {customerDetails.rfid}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerNames;
