import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleCategoryFive } from "../../../../redux/IchthusSlice";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../../security";

const CategoryFivePos = () => {
  const [categoryFiveData, setCategoryFiveData] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const checkedCategoriesFive = useSelector(
    (state) => state.orebiReducer.checkedCategoriesFive
  );
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/CategoriesFive`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setCategoryFiveData(response.data);
    } catch (error) {
      console.error("Error fetching categories five:", error);
      toast.error("Failed to fetch categories five.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleCategoryFive = (categoryFive) => {
    dispatch(toggleCategoryFive(categoryFive));
  };

  const handleRemoveCategoryFive = (categoryFive) => {
    dispatch(toggleCategoryFive(categoryFive));
  };

  const filteredCategoriesFive = categoryFiveData.filter((item) =>
    item.categoryFiveName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-start mb-4">
        <h2 className="text-sm font-bold mr-4">Category Five</h2>
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search categories five..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
            className="w-3/4 p-1 text-sm border border-gray-300 rounded global-search-input"
          />
          {isSearchActive && filteredCategoriesFive.length > 0 && (
            <div className="absolute z-10 mt-2 w-3/4 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {filteredCategoriesFive.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    onMouseDown={() => handleToggleCategoryFive(item)}
                  >
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={checkedCategoriesFive.some(
                        (b) => b.id === item.id
                      )}
                      readOnly
                      className="w-4 h-4"
                    />
                    <label htmlFor={item.id} className="cursor-pointer">
                      {item.categoryFiveName}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        {checkedCategoriesFive.map((item) => (
          <div key={item.id} className="inline-block mr-2 mb-2">
            <span className="inline-flex items-center bg-gray-200 border border-gray-300 rounded-full px-2 py-1 text-xs">
              {item.categoryFiveName}
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => handleRemoveCategoryFive(item)}
              >
                &times;
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryFivePos;
