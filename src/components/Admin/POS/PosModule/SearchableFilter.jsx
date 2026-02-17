import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../../security";
import { Search, X } from "lucide-react";

// This is a generic, reusable filter component.
// It replaces CategoryPos, BrandPos, CategoryTwoPos, etc.
const SearchableFilter = ({
  title,
  apiEndpoint,
  dataKey,
  reduxSelector,
  toggleAction,
  placeholder,
}) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Use the selector passed via props to get the correct state
  const checkedItems = useSelector(reduxSelector);
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}${apiEndpoint}`, {
        headers: { "Content-Type": "application/json" },
      });
      setData(response.data);
    } catch (error) {
      console.error(`Error fetching ${title}:`, error);
      toast.error(`Failed to fetch ${title}.`);
    }
  }, [apiEndpoint, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use the action creator passed via props
  const handleToggleItem = (item) => {
    dispatch(toggleAction(item));
  };

  const filteredData = data.filter((item) =>
    item[dataKey].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchActive(true)}
          onBlur={() => setTimeout(() => setIsSearchActive(false), 150)} // Delay to allow click
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition global-search-input"
        />
        {isSearchActive && filteredData.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => handleToggleItem(item)} // onMouseDown fires before onBlur
                >
                  <input
                    type="checkbox"
                    id={`${dataKey}-${item.id}`}
                    checked={checkedItems.some((b) => b.id === item.id)}
                    readOnly
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${dataKey}-${item.id}`}
                    className="cursor-pointer select-none"
                  >
                    {item[dataKey]}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {checkedItems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {checkedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-medium"
            >
              <span>{item[dataKey]}</span>
              <button
                type="button"
                className="ml-2 -mr-1 p-0.5 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleToggleItem(item)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableFilter;
