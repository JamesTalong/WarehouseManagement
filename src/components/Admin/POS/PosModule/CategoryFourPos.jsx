import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleCategoryFour } from "../../../../redux/IchthusSlice";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../../security";

const CategoryFourPos = () => {
  const [categoryFourData, setCategoryFourData] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const checkedCategoriesFour = useSelector(
    (state) => state.orebiReducer.checkedCategoriesFour
  );
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/CategoriesFour`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setCategoryFourData(response.data);
    } catch (error) {
      console.error("Error fetching categories four:", error);
      toast.error("Failed to fetch categories four.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleCategoryFour = (categoryFour) => {
    dispatch(toggleCategoryFour(categoryFour));
  };

  const handleRemoveCategoryFour = (categoryFour) => {
    dispatch(toggleCategoryFour(categoryFour));
  };

  const filteredCategoriesFour = categoryFourData.filter((item) =>
    item.categoryFourName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-start mb-4">
        <h2 className="text-sm font-bold mr-4">Category Four</h2>
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search categories four..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
            className="w-3/4 p-1 text-sm border border-gray-300 rounded global-search-input"
          />
          {isSearchActive && filteredCategoriesFour.length > 0 && (
            <div className="absolute z-10 mt-2 w-3/4 bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {filteredCategoriesFour.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    onMouseDown={() => handleToggleCategoryFour(item)}
                  >
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={checkedCategoriesFour.some(
                        (b) => b.id === item.id
                      )}
                      readOnly
                      className="w-4 h-4"
                    />
                    <label htmlFor={item.id} className="cursor-pointer">
                      {item.categoryFourName}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        {checkedCategoriesFour.map((item) => (
          <div key={item.id} className="inline-block mr-2 mb-2">
            <span className="inline-flex items-center bg-gray-200 border border-gray-300 rounded-full px-2 py-1 text-xs">
              {item.categoryFourName}
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => handleRemoveCategoryFour(item)}
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

export default CategoryFourPos;
