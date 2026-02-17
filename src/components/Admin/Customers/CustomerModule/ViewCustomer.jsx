import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, ExternalLink, Download } from "lucide-react";
import { domain } from "../../../../security";
import Loader from "../../../loader/Loader";

const ViewCustomer = ({ customerId, onClose }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${domain}/api/Customers/${customerId}`
        );
        setCustomer(response.data);
      } catch (error) {
        console.error("Error fetching customer details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const openImage = (base64String) => {
    const imageSource = `data:image/png;base64,${base64String}`;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<body style="margin:0; display:flex; justify-content:center; align-items:center; background-color:#1a1a1a;">
           <img src="${imageSource}" style="max-width:100%; height:auto;" alt="COR Full View" />
         </body>`
      );
    }
  };

  const DetailRow = ({ label, value, isBadge = false, isBoolean = false }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-base text-gray-900 font-medium">
        {isBoolean ? (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === true
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {value ? "Yes" : "No"}
          </span>
        ) : isBadge ? (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === "Client"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {value}
          </span>
        ) : (
          value || <span className="text-gray-400 italic">N/A</span>
        )}
      </dd>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Customer Details
            </h2>
            <p className="text-sm text-gray-500">
              Viewing information for {customer?.customerName || "..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : !customer ? (
            <div className="text-center text-red-500">
              Error loading customer data.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="col-span-1">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b pb-1">
                    General Info
                  </h3>
                  <dl>
                    <DetailRow
                      label="Customer Name"
                      value={customer.customerName}
                    />
                    <DetailRow
                      label="Customer Type"
                      value={customer.customerType}
                      isBadge
                    />
                    <DetailRow
                      label="Company Name"
                      value={customer.businessStyle}
                    />
                    <DetailRow label="RFID Tag" value={customer.rfid} />
                  </dl>
                </div>

                <div className="col-span-1">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b pb-1">
                    Contact Info
                  </h3>
                  <dl>
                    {/* Contact Person Removed */}
                    <DetailRow label="Email" value={customer.email} />
                    <DetailRow
                      label="Mobile Number"
                      value={customer.mobileNumber}
                    />
                  </dl>
                </div>

                <div className="col-span-1 md:col-span-2 mt-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b pb-1">
                    Tax & Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <dl>
                      <DetailRow label="TIN" value={customer.tinNumber} />
                      <DetailRow
                        label="Expanded Withholding Tax (EWT)"
                        value={customer.ewt}
                        isBoolean
                      />
                    </dl>
                    <dl>
                      <DetailRow
                        label="Business Address"
                        value={customer.address}
                      />
                    </dl>
                  </div>
                </div>
              </div>

              {/* COR Image Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Certificate of Registration (COR)
                </h3>
                {customer.cor || customer.COR ? (
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                    <div
                      className="relative h-64 w-full md:w-3/4 rounded-lg overflow-hidden shadow-sm cursor-pointer group bg-white"
                      onClick={() => openImage(customer.cor || customer.COR)}
                    >
                      <img
                        src={`data:image/png;base64,${
                          customer.cor || customer.COR
                        }`}
                        alt="COR Document"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-3 py-2 rounded-full flex items-center gap-2">
                          <ExternalLink size={14} /> View Full Size
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-lg border border-gray-200 border-dashed text-gray-400">
                    <Download size={24} className="mb-2 opacity-50" />
                    <span className="text-sm">No Document Uploaded</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomer;
