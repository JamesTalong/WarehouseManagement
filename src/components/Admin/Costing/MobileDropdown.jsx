import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

const MobileDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  label = "",
  searchable = false,
  icon = null,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-3 text-left
          bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600
          rounded-xl shadow-sm hover:border-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-all duration-200 ease-in-out
          ${
            isOpen ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20" : ""
          }
        `}
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="text-gray-500">{icon}</div>}
          <span
            className={`truncate ${
              selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                {searchQuery
                  ? "No matching options found"
                  : "No options available"}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-150 ${
                    option.value === value
                      ? "bg-blue-50 text-blue-700 dark:bg-slate-600"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {option.icon && (
                      <div className="text-gray-500">{option.icon}</div>
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDropdown;
