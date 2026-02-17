import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom"; // <-- Import createPortal
import { FiChevronDown, FiSearch } from "react-icons/fi"; // Added FiSearch for style

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  labelKey,
  valueKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null); // Ref for the button
  const menuRef = useRef(null); // Ref for the dropdown menu

  // Calculate menu position when it opens
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 240; // max-h-60
      const newStyle = {
        left: rect.left,
        width: rect.width,
      };

      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        // Position on top
        newStyle.bottom = window.innerHeight - rect.top + 8; // 8px margin
      } else {
        // Position on bottom
        newStyle.top = rect.bottom + 8; // 8px margin
      }
      setMenuStyle(newStyle);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((option) =>
    option[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((option) => option[valueKey] === value);

  // The Dropdown Menu JSX, to be used in the portal
  const DropdownMenu = (
    <div
      ref={menuRef}
      style={menuStyle}
      className={`fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col max-h-60
        transform transition-all duration-150 ease-out
        ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }
      `}
    >
      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <ul className="py-1 overflow-y-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <li
              key={option[valueKey]}
              onClick={() => handleSelect(option[valueKey])}
              className={`px-4 py-2 text-gray-800 cursor-pointer transition-colors duration-150 flex justify-between items-center
                ${
                  option[valueKey] === value
                    ? "bg-orange-100 text-orange-700 font-semibold"
                    : "hover:bg-orange-50"
                }
              `}
            >
              {option[labelKey]}
              {option[valueKey] === value && (
                <span className="text-xs text-orange-600">Selected</span>
              )}
            </li>
          ))
        ) : (
          <li className="px-4 py-3 text-center text-gray-500">
            No results found
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="mt-1 w-full text-left bg-white border border-gray-300 rounded-lg py-2.5 px-4 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-150 ease-in-out hover:border-gray-400"
      >
        <span className="truncate">
          {selectedOption ? (
            selectedOption[labelKey]
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <FiChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Render the dropdown menu into the body using a portal */}
      {createPortal(DropdownMenu, document.body)}
    </>
  );
};

export default SearchableDropdown;
