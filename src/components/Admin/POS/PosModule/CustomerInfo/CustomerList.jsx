// CustomerList.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Loader from "../../../../loader/Loader";
import { domain } from "../../../../../security";

const CustomerList = ({ onCustomerSelect }) => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch customer data from CustomerTemps
  const fetchCustomerData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/CustomerTemps`, {
        headers: { "Content-Type": "application/json" },
      });

      setCustomerData(response.data);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  return (
    <div className="overflow-x-auto shadow-md mt-4 p-4 bg-white rounded-lg">
      {loading ? (
        <Loader />
      ) : customerData.length > 0 ? (
        <ul className="list-disc pl-6">
          {customerData.map((customer) => (
            <li
              key={customer.id}
              className="text-gray-800 cursor-pointer hover:underline"
              onClick={() => onCustomerSelect(customer.customerId)}
            >
              <div>{customer.customerName}</div>
              <div className="text-sm text-gray-500">
                {customer.customerType}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No customers found.</p>
      )}
    </div>
  );
};

export default CustomerList;
