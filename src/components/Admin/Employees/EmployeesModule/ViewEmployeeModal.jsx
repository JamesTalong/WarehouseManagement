import React from "react";
import profile from "../../../../Images/profile.jpg"; // Default profile image

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// A small component for displaying each piece of data
const DetailItem = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <dt className="text-sm font-medium leading-6 text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm leading-6 text-gray-800 sm:col-span-2 sm:mt-0">
      {value || "N/A"}
    </dd>
  </div>
);

const ViewEmployeeModal = ({ employee, onClose }) => {
  if (!employee) return null;

  // This line will now work correctly as `employee.employeeImage` will have data
  const employeeImageSrc = employee.employeeImage
    ? `data:image/jpeg;base64,${employee.employeeImage}`
    : profile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* --- MODAL HEADER --- */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Employee Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* --- MODAL CONTENT --- */}
        <div className="p-6 flex-grow overflow-y-auto">
          {/* --- Basic Info Section --- */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
            <img
              src={employeeImageSrc}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 flex-shrink-0"
              onError={(e) => (e.target.src = profile)}
            />
            <div className="w-full">
              <h3 className="text-2xl font-bold text-gray-900">
                {`${employee.firstName} ${employee.middleName || ""} ${
                  employee.lastName
                }`}
              </h3>
              <p className="text-md text-blue-600 font-semibold">
                {employee.position}
              </p>
              <p className="text-sm text-gray-500">{employee.department}</p>
              <p className=""> Employee ID:{employee.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                Personal Information
              </h4>
              <dl className="divide-y divide-gray-100">
                <DetailItem
                  label="Date of Birth"
                  value={formatDate(employee.dateOfBirth)}
                />
                <DetailItem label="Sex" value={employee.sex} />
                <DetailItem label="Civil Status" value={employee.civilStatus} />
                <DetailItem label="Nationality" value={employee.nationality} />
                <DetailItem
                  label="Mobile Number"
                  value={employee.mobileNumber}
                />
                <DetailItem
                  label="Current Address"
                  value={employee.currentAddress}
                />
                <DetailItem
                  label="Permanent Address"
                  value={employee.permanentAddress}
                />
              </dl>
            </div>

            {/* Employment Details */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                Employment Details
              </h4>
              <dl className="divide-y divide-gray-100">
                <DetailItem
                  label="Employment Type"
                  value={employee.employmentType}
                />
                <DetailItem
                  label="Employment Status"
                  value={employee.employmentStatus}
                />
                <DetailItem
                  label="Date Hired"
                  value={formatDate(employee.dateHired)}
                />
                <DetailItem
                  label="Date Regularized"
                  value={formatDate(employee.dateRegularized)}
                />
                <DetailItem
                  label="Work Schedule"
                  value={employee.workSchedule}
                />
                <DetailItem
                  label="Location / Branch"
                  value={employee.location}
                />
              </dl>
            </div>
          </div>
        </div>

        {/* --- MODAL FOOTER --- */}
        <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeModal;
