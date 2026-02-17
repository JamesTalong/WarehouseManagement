import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../security";
import noImage from "../../../Images/noImage.jpg";
import moment from "moment"; // Import the moment library
import Pagination from "../Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import { selectUserName, selectUserID } from "../../../redux/IchthusSlice";

const AddInventoryStaging = ({ onClose, onInventoryAdded }) => {
  // const [noSerialData, setNoSerialData] = useState([]);
  // const [serialData, setSerialData] = useState([]);
  const [displayedData, setDisplayedData] = useState(null);
  const [hasSerialFlag, setHasSerialFlag] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // Change to show more/less per page
  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectUserName);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await axios.get(`${domain}/api/Locations`);
      setLocations(res.data);
    } catch (error) {
      toast.error("Failed to fetch locations.");
      console.error(error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    const apiUrl = `${domain}/api/Pricelists`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const formattedData = response.data.map((item) => ({
        ...item,
        productImage: item.productImage
          ? item.productImage.startsWith("http")
            ? item.productImage
            : `data:image/jpeg;base64,${item.productImage}`
          : noImage,
        product: item.product, // make sure this is the product name string
      }));

      setProducts(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Products.");
    }
  }, []);

  // ** Reference Data Fetching (Component 2 & 3 Logic) **
  useEffect(() => {
    fetchLocations();
    fetchProducts();
  }, [fetchLocations, fetchProducts]);

  const formatDateForSubmission = (dateString) => {
    const parsedDate = moment(dateString, "MM/DD/YYYY");
    if (parsedDate.isValid()) {
      return parsedDate.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    }
    return null;
  };

  const handleFileUpload = (event, hasSerial) => {
    setDisplayedData(null);
    setUploadError("");
    setValidationErrors([]);
    setHasSerialFlag(hasSerial);
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData && jsonData.length > 0) {
          const dataRows = jsonData
            .slice(1)
            .filter((row) =>
              row.some(
                (cell) => cell !== null && cell !== undefined && cell !== ""
              )
            );

          let formattedData = [];
          let errors = [];

          if (hasSerial) {
            // Expected columns: Batch Date, Location Name, Product Name, Serial, Is Sold?
            if (jsonData[0].length !== 5) {
              setUploadError(
                "Incorrect number of columns for serial data upload. Expected: Batch Date, Location Name, Product Name, Serial, Is Sold?"
              );
              return;
            }
            formattedData = dataRows.map((row, index) => {
              const batchDate = row[0]?.toString();
              const locationName = row[1];
              const productName = row[2];
              const serial = row[3];
              const isSold =
                row[4] === "Yes" || row[4] === "yes" || row[4] === true;

              console.log("🔍 Searching for location...");
              console.log("Input locationName:", locationName);
              console.log("Available locations:", locations);

              const locationMatch = locations.find(
                (loc) =>
                  loc.locationName.toLowerCase() === locationName?.toLowerCase()
              );

              console.log("✅ Matched location:", locationMatch);

              console.log("🔍 Searching for product...");
              console.log("Input productName:", productName);
              console.log("Input hasSerialFlag:", hasSerial);
              console.log("Available products:", products);

              const productMatches = products.filter(
                (prod) =>
                  prod.product?.toLowerCase() === productName?.toLowerCase()
              );

              const productMatch = productMatches.find(
                (prod) =>
                  prod.locationId === locationMatch?.id &&
                  prod.hasSerial === hasSerial
              );

              const rowErrors = {};

              if (
                batchDate &&
                !moment(batchDate, "MM/DD/YYYY", true).isValid()
              ) {
                rowErrors.batchDate = `Invalid date format. Use MM/dd/yyyy and set the cell to Text format for row ${
                  index + 2
                }`;
              }
              if (!locationMatch) {
                rowErrors.location = `Location "${locationName}" not found in reference data`;
              }
              if (!productMatch) {
                rowErrors.product = `Product "${productName}" at location "${locationName}" not found in reference data or has serial flag mismatch "${hasSerial}" `;
              }
              if (!serial) {
                rowErrors.serial = `Serial number is required for row ${
                  index + 2
                }`;
              }

              if (Object.keys(rowErrors).length > 0) {
                errors.push({ row: index + 2, errors: rowErrors });
              }

              return {
                batchDate,
                location: locationMatch?.id,
                product: productMatch?.id,
                serial,
                isSold,
                _originalLocation: locationName,
                _originalProduct: productName,
                _hasErrors: Object.keys(rowErrors).length > 0,
                _errors: rowErrors,
              };
            });
            // setSerialData(formattedData.filter((item) => !item._hasErrors));
          } else {
            // Expected columns: Batch Date, Location Name, Product Name, NumberOfItems
            if (jsonData[0].length !== 4) {
              setUploadError(
                "Incorrect number of columns for non-serial data upload. Expected: Batch Date, Location Name, Product Name, NumberOfItems"
              );
              return;
            }
            formattedData = dataRows.map((row, index) => {
              const batchDate = row[0]?.toString();
              const locationName = row[1];
              const productName = row[2];
              const numberOfItems = parseInt(row[3]);

              const locationMatch = locations.find(
                (loc) =>
                  loc.locationName.toLowerCase() === locationName?.toLowerCase()
              );
              // Find the product that matches both productName AND locationId
              const productMatches = products.filter(
                (prod) =>
                  prod.product?.toLowerCase() === productName?.toLowerCase()
              );

              const productMatch = productMatches.find(
                (prod) =>
                  prod.locationId === locationMatch?.id &&
                  prod.hasSerial === hasSerial
              );

              const rowErrors = {};

              if (
                batchDate &&
                !moment(batchDate, "MM/DD/YYYY", true).isValid()
              ) {
                rowErrors.batchDate = `Invalid date format. Please use MM/DD/YYYY for row ${
                  index + 2
                }`;
              }
              if (!locationMatch) {
                rowErrors.location = `Location "${locationName}" not found in reference data`;
              }

              if (!productMatch) {
                rowErrors.product = `Product "${productName}" at location "${locationName}" not found in reference data or has serial flag mismatch`;
              }
              if (isNaN(numberOfItems)) {
                rowErrors.numberOfItems = "Number of items must be a number";
              }

              if (Object.keys(rowErrors).length > 0) {
                errors.push({ row: index + 2, errors: rowErrors });
              }

              return {
                batchDate,
                location: locationMatch?.id,
                product: productMatch?.id,
                numberOfItems,
                _originalLocation: locationName,
                _originalProduct: productName,
                _hasErrors: Object.keys(rowErrors).length > 0,
                _errors: rowErrors,
              };
            });
            // setNoSerialData(formattedData.filter((item) => !item._hasErrors));
          }

          setDisplayedData(formattedData);
          setValidationErrors(errors);
        } else {
          setUploadError("No data found in the uploaded file.");
        }
      };
      reader.onerror = () => {
        setUploadError("Error reading the uploaded file.");
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleSave = async () => {
    if (displayedData && displayedData.some((item) => !item._hasErrors)) {
      let formData = [];

      if (hasSerialFlag) {
        const validSerialData = displayedData.filter(
          (item) => !item._hasErrors
        );
        formData = Object.values(
          validSerialData.reduce((acc, item) => {
            console.log(item);
            const formattedBatchDate = formatDateForSubmission(item.batchDate);
            if (!formattedBatchDate) {
              toast.error("Invalid date format in uploaded data.");
              return acc;
            }
            const key = `${formattedBatchDate}-${item.location}-${item.product}`;
            if (!acc[key]) {
              acc[key] = {
                batchDate: formattedBatchDate,
                pricelistId: item.product, // Assuming 'product' in your formatted data is the PricelistId
                locationId: item.location, // Assuming 'location' in your formatted data is the LocationId
                hasSerial: true,
                numberOfItems: 0,
                serialStagings: [],
                userId: userID,
                userName: fullName,
              };
            }
            acc[key].serialStagings.push({
              serialName: String(item.serial),
              isSold: item.isSold,
            });
            acc[key].numberOfItems = acc[key].serialStagings.length;
            return acc;
          }, {})
        ).map((group) => ({
          ...group,
          locationId: parseInt(group.locationId),
          pricelistId: parseInt(group.pricelistId),
        }));
      } else {
        const validNoSerialData = displayedData.filter(
          (item) => !item._hasErrors
        );
        formData = validNoSerialData.map((item) => ({
          batchDate: formatDateForSubmission(item.batchDate),
          pricelistId: parseInt(item.product), // Assuming 'product' is the PricelistId
          locationId: parseInt(item.location), // Assuming 'location' is the LocationId
          numberOfItems: item.numberOfItems,
          hasSerial: false,
          serialStagings: [],
          userId: userID,
          userName: fullName,
        }));
      }

      console.log("Data to send:", formData);
      console.log(Array.isArray(formData)); // should be true
      try {
        const apiUrl = domain + "/api/BatchStagings/bulk";
        await axios.post(apiUrl, formData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        clearData();
        onInventoryAdded(); // Call the callback to refetch in InventoryStaging
        onClose(); // Close the modal after successful save and refetch
      } catch (error) {
        console.error("Error saving data:", error);
        toast.error("Failed to add batch stagings");
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.error(error.response.data.message);
        }
      }
    } else {
      alert("Please fix the validation errors before saving.");
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = displayedData
    ? displayedData.slice(indexOfFirstRow, indexOfLastRow)
    : [];

  const clearData = () => {
    // setNoSerialData([]);
    // setSerialData([]);
    setDisplayedData(null);
    setUploadError("");
    setValidationErrors([]);
    setHasSerialFlag(false); // Reset serial flag
  };

  const hasErrors = validationErrors.length > 0;
  const groupedErrors = validationErrors.reduce((acc, error) => {
    Object.entries(error.errors).forEach(([field, message]) => {
      const errorPart = message.split(" for row ")[0];
      const rowNumberMatch = message.match(/row (\d+)/);
      const rowNumber = rowNumberMatch ? parseInt(rowNumberMatch[1]) : null;

      if (!acc[field]) {
        acc[field] = {
          message: errorPart + " for row number:",
          rows: [],
        };
      }
      if (rowNumber && !acc[field].rows.includes(rowNumber)) {
        acc[field].rows.push(rowNumber);
      }
    });
    return acc;
  }, {});

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Inventory Staging
        </h2>

        {/* Upload Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <label
            htmlFor="uploadNoSerial"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer text-center transition duration-200"
          >
            Upload Excel (No Serial)
          </label>
          <input
            id="uploadNoSerial"
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, false)}
            accept=".xlsx, .csv"
          />

          <label
            htmlFor="uploadSerial"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer text-center transition duration-200"
          >
            Upload Excel (With Serial)
          </label>
          <input
            id="uploadSerial"
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, true)}
            accept=".xlsx, .csv"
          />
        </div>

        {/* Error Message */}
        {uploadError && (
          <p className="text-red-500 font-medium mb-4">{uploadError}</p>
        )}

        {/* Grouped Validation Errors */}
        {Object.keys(groupedErrors).length > 0 && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <h3 className="font-bold mb-2">Validation Errors:</h3>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(groupedErrors).map(([field, errorInfo]) => (
                <li key={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}:{" "}
                  {errorInfo.message} (
                  {errorInfo.rows.sort((a, b) => a - b).join(", ")})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Displayed Data Table */}
        {displayedData && displayedData.length > 0 && (
          <div className="overflow-x-auto shadow rounded-lg border border-gray-200 mb-4">
            <table className="min-w-full text-sm text-left text-gray-800">
              <thead className="bg-gray-100 text-xs uppercase font-medium">
                <tr>
                  {Object.keys(displayedData[0])
                    .filter((key) => !key.startsWith("_"))
                    .map((key) => (
                      <th key={key} className="py-3 px-4 border-b">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                  <th className="py-3 px-4 border-b">Errors</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((item, index) => (
                  <tr
                    key={index}
                    className={`${
                      item._hasErrors ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {Object.entries(item)
                      .filter(([key]) => !key.startsWith("_"))
                      .map(([key, value]) => (
                        <td key={key} className="py-2 px-4 border-b">
                          {(key === "location" &&
                            locations.find((loc) => loc.id === value)
                              ?.locationName) ||
                            (key === "product" &&
                              products.find((prod) => prod.id === value)
                                ?.product) ||
                            (key === "batchDate" && value
                              ? moment(value, "MM/DD/YYYY").format("MM/DD/YY")
                              : "") ||
                            (value !== null && value !== undefined
                              ? value.toString()
                              : "")}
                        </td>
                      ))}
                    <td className="py-2 px-4 border-b text-sm text-red-500">
                      {item._hasErrors && (
                        <ul className="space-y-1">
                          {Object.entries(item._errors).map(
                            ([field, message]) => (
                              <li key={field}>{message}</li>
                            )
                          )}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {displayedData?.length > 0 && (
          <div className="mb-4">
            <Pagination
              itemsPerPage={rowsPerPage}
              totalItems={displayedData.length}
              currentPage={currentPage}
              paginate={paginate}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-4 mt-4">
          <button
            onClick={clearData}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
          >
            Clear
          </button>

          {displayedData && displayedData.length > 0 && !hasErrors && (
            <button
              onClick={handleSave}
              className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold transition"
            >
              Save Data
            </button>
          )}

          {hasErrors && displayedData?.length > 0 && (
            <p className="text-yellow-600 font-medium">
              Please fix the errors before saving.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddInventoryStaging;
