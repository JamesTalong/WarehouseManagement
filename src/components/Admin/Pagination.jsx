import React from "react";

const Pagination = ({ itemsPerPage, totalItems, currentPage, paginate }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 3;

  let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
  let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  if (startPage > 1) {
    pageNumbers.push(
      <button
        key={1}
        onClick={() => paginate(1)}
        className={`inline-flex items-center justify-center w-8 h-8 text-sm border rounded shadow-md ${
          currentPage === 1
            ? "bg-blue-500 text-white"
            : "dark:bg-gray-900 dark:border-gray-800"
        }`}
      >
        1
      </button>
    );
    if (startPage > 2) {
      pageNumbers.push(
        <span key="start-ellipsis" className="mx-1">
          ...
        </span>
      );
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(
      <button
        key={i}
        onClick={() => paginate(i)}
        className={`inline-flex items-center justify-center w-8 h-8 text-sm border rounded shadow-md ${
          currentPage === i
            ? "bg-blue-500 text-white"
            : "dark:bg-gray-900 dark:border-gray-800"
        }`}
      >
        {i}
      </button>
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push(
        <span key="end-ellipsis" className="mx-1">
          ...
        </span>
      );
    }
    pageNumbers.push(
      <button
        key={totalPages}
        onClick={() => paginate(totalPages)}
        className={`inline-flex items-center justify-center w-8 h-8 text-sm border rounded shadow-md ${
          currentPage === totalPages
            ? "bg-blue-500 text-white"
            : "dark:bg-gray-900 dark:border-gray-800"
        }`}
      >
        {totalPages}
      </button>
    );
  }

  return (
    <nav className="flex justify-center space-x-1 dark:text-gray-100 m-5">
      <ul className="pagination flex items-center">
        <li className="page-item">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            title="previous"
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 py-0 border rounded-md shadow-md dark:bg-gray-900 dark:border-gray-800"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M15.535 21.364L7.11 12.937l8.425-8.425 1.414 1.414-7.012 7.011 7.012 7.011z"></path>
            </svg>
          </button>
        </li>
        {pageNumbers}
        <li className="page-item">
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="next"
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 py-0 border rounded-md shadow-md dark:bg-gray-900 dark:border-gray-800"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M8.465 21.364L7.051 19.95l7.012-7.011-7.012-7.011L8.465 4.514l8.425 8.425z"></path>
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
