import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { toast } from "react-toastify";

const PrintBarcodeComponent = React.forwardRef(({ barcode }, ref) => {
  const barcodeRefs = useRef([]); // Use an array of refs

  useEffect(() => {
    if (Array.isArray(barcode)) {
      // Handle array of barcodes
      barcode.forEach((item, index) => {
        if (barcodeRefs.current[index] && item && item.barCode) {
          try {
            JsBarcode(barcodeRefs.current[index], item.barCode, {
              format: "EAN13",
              displayValue: true,
              width: 1,
              height: 30,
              fontSize: 10,
              margin: 0,
            }).render();
          } catch (error) {
            console.error("Error rendering barcode:", error);
            toast.error(`Invalid Barcode at index ${index + 1}`);
          }
        }
      });
    } else if (barcodeRefs.current[0] && barcode && barcode.barCode) {
      // Handle single barcode
      try {
        JsBarcode(barcodeRefs.current[0], barcode.barCode, {
          format: "EAN13",
          displayValue: true,
          width: 1,
          height: 30,
          fontSize: 10,
          margin: 0,
        }).render();
      } catch (error) {
        console.error("Error rendering barcode:", error);
        toast.error("Invalid Barcode");
      }
    }
  }, [barcode]);

  const containerStyle = {
    marginLeft: "4px",
    marginRight: "4px",
    textAlign: "center",
  };

  if (!Array.isArray(barcode) || barcode.length <= 1) {
    containerStyle.marginTop = "8px";
  }

  return (
    <div ref={ref} style={containerStyle}>
      {Array.isArray(barcode) ? (
        barcode.map((item, index) => (
          <div key={index} style={{ paddingTop: "10px" }}>
            <svg
              ref={(el) => (barcodeRefs.current[index] = el)}
              style={{ display: "block" }}
            ></svg>
            {item && item.productName && (
              <div style={{ fontSize: "10px", marginBottom: "2px" }}>
                {item.productName.length > 15
                  ? item.productName.substring(0, 15) + "..."
                  : item.productName}
              </div>
            )}
          </div>
        ))
      ) : (
        <div>
          <svg
            ref={(el) => (barcodeRefs.current[0] = el)}
            style={{ display: "block" }}
          ></svg>
          {barcode && barcode?.productName && (
            <div style={{ fontSize: "10px", marginBottom: "2px" }}>
              {barcode?.productName?.length > 15
                ? barcode?.productName?.substring(0, 15) + "..."
                : barcode.productName}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default PrintBarcodeComponent;
