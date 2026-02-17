// src/components/help/FAQItem.js

import React from "react";

// Add id, isOpen, and onToggle props
const FAQItem = ({
  id,
  icon,
  title,
  question,
  answer,
  tip,
  isOpen,
  onToggle,
}) => {
  return (
    // Add id to the div for scrolling
    <div
      id={id ? `faq-item-${id}` : undefined}
      className="bg-white p-6 rounded-lg shadow-2xl mb-6 border-l-4 border-orange-500 cursor-pointer" // Add cursor-pointer
      onClick={onToggle} // Add onClick to toggle the FAQ
    >
      {/* Title */}
      <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        {title}
      </h3>

      {/* Question */}
      <div className="mb-2">
        <p className="font-semibold text-gray-700">Q: {question}</p>
      </div>

      {/* Answer - Conditionally rendered */}
      {isOpen && (
        <>
          <div className="text-gray-600">
            <p>
              <span className="font-bold mr-1">📌</span>
              {answer}
            </p>
          </div>

          {/* Optional Tip - Conditionally rendered */}
          {tip && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-bold">❗ Tip:</span> {tip}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FAQItem;
