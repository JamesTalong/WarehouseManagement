import React, { useState } from "react";

const ManualItem = ({ icon, title, overview, steps }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="bg-white p-6 rounded-lg shadow-2xl mb-6 border-l-4 border-green-600">
      {/* Clickable Header */}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleOpen}
      >
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="text-3xl mr-4">{icon}</span>
          {title}
        </h3>
        <span className="text-2xl text-gray-500 transform transition-transform duration-300">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-6 space-y-6 text-gray-700">
          {/* Overview Section */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="font-bold text-lg mb-2">📌 Overview</p>
            <p className="text-sm">{overview}</p>
          </div>

          {/* Steps Section */}
          {steps.map((step, index) => (
            <div key={index} className="p-4 border-t border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                🔧 STEP {index + 1}: {step.title}
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-semibold">📍 Location:</span>{" "}
                {step.location}
              </p>
              {step.required && (
                <div className="mb-3">
                  <p className="font-semibold text-sm text-green-800">
                    ✅ Required Before You Begin:
                  </p>
                  <div className="text-sm text-green-700 ml-4">
                    {step.required}
                  </div>
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-blue-800">
                  🔄 Actions:
                </p>
                <div className="text-sm text-blue-700 ml-4">{step.actions}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManualItem;
