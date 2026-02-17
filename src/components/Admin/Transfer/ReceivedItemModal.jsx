import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { selectFullName } from "../../../redux/IchthusSlice";
import { domain } from "../../../security";

const ReceivedItemModal = ({ transfer, onClose, onConfirmReceive }) => {
  const currentUser = useSelector(selectFullName);
  const [itemsToReceive, setItemsToReceive] = useState([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);
  const [itemWithMismatch, setItemWithMismatch] = useState(null);

  useEffect(() => {
    const initializeItems = async () => {
      if (transfer && transfer.items) {
        setLoadingNames(true);

        const idsToLookup = transfer.items.flatMap(
          (item) => item.serialNumberIds || []
        );

        let serialNameMap = {};

        if (idsToLookup.length > 0) {
          try {
            // FIX: Use the full API Domain here
            const response = await axios.post(
              `${domain}/api/SerialNumbers/lookup-names`,
              idsToLookup
            );

            const data = response.data;

            if (data && Array.isArray(data)) {
              data.forEach((sn) => {
                const id = sn.id || sn.Id;
                const name = sn.serialName || sn.SerialName;
                serialNameMap[id] = name;
              });
            }
          } catch (error) {
            console.error("Error fetching serial names:", error);
          }
        }

        const initialItems = transfer.items.map((item) => {
          const isStrictlySerialized = item.hasSerial === true;
          let fullSerialList = [];

          if (
            item.serialNumberIds &&
            Array.isArray(item.serialNumberIds) &&
            item.serialNumberIds.length > 0
          ) {
            fullSerialList = item.serialNumberIds.map((id) => {
              const mappedName = serialNameMap[id];
              return {
                id: id,
                serialName: mappedName ? mappedName : `Ref #${id}`,
              };
            });
          } else if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
            fullSerialList = item.serialNumbers;
          }

          return {
            ...item,
            receivedQuantity: isStrictlySerialized
              ? fullSerialList.length
              : item.quantity,
            hasSerial: isStrictlySerialized,
            receivedSerialNumbers: fullSerialList.map((sn) => ({ ...sn })),
            hiddenAvailableSerials: fullSerialList.map((sn) => ({ ...sn })),
            serialsToMarkAsMissingIds: [],
          };
        });

        setItemsToReceive(initialItems);
        setLoadingNames(false);
      }
    };

    initializeItems();
  }, [transfer]);

  // ... (Rest of the handlers: handleReceivedQuantityChange, handleToggleSerialNumberStatus, checkAndDelete) ...
  // Paste previous handlers here (no changes needed for logic below this point)

  const handleReceivedQuantityChange = (itemId, newQuantityStr) => {
    const newQuantity = Math.max(0, parseInt(newQuantityStr, 10) || 0);
    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const clampedQuantity = Math.min(newQuantity, item.quantity);
          return { ...item, receivedQuantity: clampedQuantity };
        }
        return item;
      })
    );
  };

  const handleToggleSerialNumberStatus = (
    itemId,
    serialId,
    isCurrentlyMissing
  ) => {
    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId && item.hasSerial) {
          let updatedMissingIds = [...item.serialsToMarkAsMissingIds];
          if (isCurrentlyMissing) {
            updatedMissingIds = updatedMissingIds.filter(
              (id) => id !== serialId
            );
          } else {
            updatedMissingIds.push(serialId);
          }
          const newQty =
            item.receivedSerialNumbers.length - updatedMissingIds.length;
          return {
            ...item,
            receivedQuantity: newQty,
            serialsToMarkAsMissingIds: updatedMissingIds,
          };
        }
        return item;
      })
    );
  };

  const checkAndDelete = () => {
    let mismatch = null;
    for (const item of itemsToReceive) {
      if (item.receivedQuantity < item.quantity) {
        mismatch = { ...item, effectivelyReceivedQty: item.receivedQuantity };
        break;
      }
    }
    if (mismatch) {
      setItemWithMismatch(mismatch);
      setShowConfirmWarning(true);
    } else {
      prepareAndSend();
    }
  };

  const prepareAndSend = () => {
    const itemsPayload = itemsToReceive.map((item) => {
      let processedSerials = [];
      if (item.hasSerial) {
        processedSerials = item.receivedSerialNumbers.map((sn) => ({
          serialNumberId: sn.id,
          serialName: sn.serialName,
          status: item.serialsToMarkAsMissingIds.includes(sn.id)
            ? "Missing"
            : "Received",
        }));
      } else {
        if (item.hiddenAvailableSerials?.length > 0) {
          processedSerials = item.hiddenAvailableSerials.map((sn, index) => {
            const isReceived = index < item.receivedQuantity;
            return {
              serialNumberId: sn.id,
              serialName: sn.serialName,
              status: isReceived ? "Received" : "Missing",
            };
          });
        }
      }
      return {
        productId: item.productId,
        itemCode: item.productCode || item.itemCode,
        productName: item.productName,
        quantity: item.receivedQuantity,
        serialNumbers: processedSerials,
      };
    });

    const payload = {
      transferId: transfer.id,
      fromLocationId: transfer.fromLocationId,
      toLocationId: transfer.toLocationId,
      fromLocationName: transfer.fromLocationName,
      toLocationName: transfer.toLocationName,
      status: "Received",
      releaseBy: transfer.releaseBy,
      receiveBy: currentUser || "Admin",
      transferredDate: transfer.transferredDate,
      recievedDate: new Date().toISOString(),
      items: itemsPayload,
    };

    onConfirmReceive(transfer, payload);
    setShowConfirmWarning(false);
  };

  if (!transfer) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Receive Transfer #{transfer.id}
            </h3>
            <p className="text-xs text-gray-500">
              {transfer.fromLocationName} ➔ {transfer.toLocationName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1 bg-gray-50">
          {loadingNames ? (
            <div className="flex justify-center items-center h-20">
              <span className="text-gray-500">Loading details...</span>
            </div>
          ) : (
            itemsToReceive.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item.itemCode} {item.hasSerial ? "(Serialized)" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Received:</span>
                    {item.hasSerial ? (
                      <span
                        className={`font-bold ${
                          item.receivedQuantity < item.quantity
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.receivedQuantity} / {item.quantity}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            handleReceivedQuantityChange(
                              item.id,
                              e.target.value
                            )
                          }
                          className="w-20 border border-gray-300 rounded text-center font-bold p-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <span className="text-gray-400 text-sm">
                          / {item.quantity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {item.hasSerial && (
                  <div className="mt-3 border-t pt-2">
                    <div className="grid gap-2">
                      {item.receivedSerialNumbers.map((sn) => {
                        const isMissing =
                          item.serialsToMarkAsMissingIds.includes(sn.id);
                        return (
                          <div
                            key={sn.id}
                            className={`flex justify-between items-center p-2 rounded text-sm border ${
                              isMissing
                                ? "bg-red-50 border-red-100"
                                : "bg-green-50 border-green-100"
                            }`}
                          >
                            <span
                              className={`font-mono ${
                                isMissing
                                  ? "text-red-500 line-through"
                                  : "text-green-700"
                              }`}
                            >
                              {sn.serialName}
                            </span>
                            <button
                              onClick={() =>
                                handleToggleSerialNumberStatus(
                                  item.id,
                                  sn.id,
                                  isMissing
                                )
                              }
                              className={`text-xs px-2 py-1 rounded border transition-colors ${
                                isMissing
                                  ? "bg-white text-gray-600 border-gray-300"
                                  : "bg-red-100 text-red-600 border-red-200"
                              }`}
                            >
                              {isMissing ? "Restore" : "Mark Missing"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={checkAndDelete}
            disabled={loadingNames}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md"
          >
            Confirm Receipt
          </button>
        </div>
        {showConfirmWarning && itemWithMismatch && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center border-t-4 border-red-500">
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                Shortage Detected
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                You are receiving{" "}
                <b>{itemWithMismatch.effectivelyReceivedQty}</b> out of{" "}
                <b>{itemWithMismatch.quantity}</b> expected items.
                <br />
                The remaining items will be marked as <b>MISSING/LOST</b>.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirmWarning(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Go Back
                </button>
                <button
                  onClick={prepareAndSend}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                >
                  Confirm Shortage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReceivedItemModal;
