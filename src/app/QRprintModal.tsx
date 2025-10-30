/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";


const qrPerRow = 1;

const QrPrintModal: React.FC<{ imageurl: string }> = ({ imageurl }) => {
  const router = useRouter();

  const [imageURLs, setImageURLs] = useState<string>(imageurl);
  const [totalSelected, setTotalSelected] = useState<number>(0);

  const printRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalRows = 1;

  // You may need to pass state via searchParams or context instead of location.state in Next.js




  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Sheet</title>
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 0; font-family: sans-serif; }
            .page {
              width: 3.93701in;
              height: 1.9685in;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            .row {
              display: flex;
              flex-direction: row;
            }
            .cell {
              width: 3.93701in;
              height: 1.9685in;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .cell img {
              padding: 0px;
              width: 99%;
              height: 100%;
            }
          </style>
        </head>
        <body onload="window.__triggerPrint && window.__triggerPrint()">
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    (printWindow as any).__triggerPrint = () => {
      const images = printWindow.document.images;
      if (images.length === 0) {
        printWindow.print();
        printWindow.close();
      } else {
        let loaded = 0;
        for (let img of Array.from(images)) {
          if (img.complete) {
            loaded++;
          } else {
            img.onload = img.onerror = () => {
              loaded++;
              if (loaded === images.length) {
                printWindow.print();
                printWindow.close();
              }
            };
          }
        }
        if (loaded === images.length) {
          printWindow.print();
          printWindow.close();
        }
      }
    };
  };


  return (
    <div className="p-6">
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-lg shadow-lg w-[100%] max-w-4xl max-h-[80vh] flex flex-col">
                  <div className="no-print" style={{ margin: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => router.back()}
            style={{
              marginRight: "10px",
              padding: "8px 16px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>


        <button
          onClick={handlePrint}
          style={{
            padding: "10px 20px",
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
          disabled={imageURLs.length === 0}
        >
          Print QR Sheet  QR codes
        </button>
      </div>

      <div className="page" ref={printRef}>
        {Array.from({ length: totalRows }).map((_, rowIdx) => (
          <div className="row" key={rowIdx}>
            {Array.from({ length: qrPerRow }).map((_, colIdx) => {
              const idx = rowIdx * qrPerRow + colIdx;
              return (
                <React.Fragment key={`cell-${rowIdx}-${colIdx}`}>
                  <div className="cell">
                      <img src={imageURLs} alt={`QR ${idx + 1}`} />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
        </div>
      </div>
    </div>
  );

};

export default QrPrintModal;