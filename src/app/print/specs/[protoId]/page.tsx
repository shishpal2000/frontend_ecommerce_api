"use client";

import LayoutComponents from "@/app/layoutComponents";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { ProtoSpecsResponse } from "@/types/Specs";

const SpecsPrintView = () => {
  const [printOrientation, setPrintOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  // Column pagination controls
  const [printMode, setPrintMode] = useState<"current" | "all">("current");

  // Row pagination controls
  const [rowsPerPage, setRowsPerPage] = useState(12); // Max rows per page
  const [currentRowPage, setCurrentRowPage] = useState(1);
  const [totalRowPages, setTotalRowPages] = useState(1);
  const [totalCombinedPages, setTotalCombinedPages] = useState(1);

  // API data state
  const [specsData, setSpecsData] = useState<ProtoSpecsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qrImageLoaded, setQrImageLoaded] = useState(false);
  const [printTriggered, setPrintTriggered] = useState(false);

  const params = useParams();
  const protoId = params.protoId;
  const { getApi } = useGeneralApiCall();

  // Fetch specs data from API
  useEffect(() => {
    const fetchSpecsData = async () => {
      try {
        setLoading(true);
        const response = await getApi<ProtoSpecsResponse>(
          `/tech-spec/${protoId}/get-specs/`
        );
        setSpecsData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching specs:", err);
        setError("Failed to load specs data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (protoId) {
      fetchSpecsData();
    }
  }, [protoId, getApi]);

  // Calculate total pages needed based on both rows and columns
  useEffect(() => {
    if (specsData?.rows && specsData.rows.length > 0) {
      // For this data structure, we're not paginating by columns,
      // just by rows since we have a fixed 5-column structure
      const totalRows = specsData.rows.length;
      const rowPages = Math.ceil(totalRows / rowsPerPage);
      setTotalRowPages(rowPages);
      setTotalCombinedPages(rowPages);
    }
  }, [specsData, rowsPerPage]);

  // Adjust rows/cols per page based on orientation
  useEffect(() => {
    if (printOrientation === "landscape") {
      setRowsPerPage(8);
    } else {
      setRowsPerPage(12);
    }
  }, [printOrientation]);

  useEffect(() => {
    const preventDefaultPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPrintOptions(true);
      }
    };

    window.addEventListener("keydown", preventDefaultPrint);

    return () => {
      window.removeEventListener("keydown", preventDefaultPrint);
    };
  }, []);

  // Get current page rows
  const getCurrentPageData = () => {
    if (!specsData?.rows) return { startRow: 0, endRow: 0, visibleRows: [] };

    // Calculate row range
    const startRow = (currentRowPage - 1) * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, specsData.rows.length);

    // Get visible specs for current page
    const visibleRows = specsData.rows.slice(startRow, endRow);

    return { startRow, endRow, visibleRows };
  };

  // Calculate current global page number
  const getCurrentGlobalPage = () => {
    return currentRowPage;
  };

  // Handle print all pages
  const handlePrintAll = () => {
    setPrintMode("all");
    setPrintTriggered(true);
    setQrImageLoaded(false); // Reset the image loaded state
  };

  const handlePrint = () => {
    setPrintMode("current");
    setPrintTriggered(true);
    setQrImageLoaded(false); // Reset the image loaded state
  };

  useEffect(() => {
    if (printTriggered) {
      if (!specsData?.qr_image || qrImageLoaded) {
        // Print only if there's no QR image or if it's loaded
        window.print();
        setPrintTriggered(false);
      }
    }
  }, [printTriggered, qrImageLoaded, specsData?.qr_image]);

  // Reset image loaded state when specs data changes
  useEffect(() => {
    setQrImageLoaded(false);
  }, [specsData]);

  // Navigate between pages
  const goToPrevPage = () => {
    if (currentRowPage > 1) {
      setCurrentRowPage(currentRowPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentRowPage < totalRowPages) {
      setCurrentRowPage(currentRowPage + 1);
    }
  };

  // Get current view data
  const { startRow, endRow, visibleRows } = getCurrentPageData();
  const currentGlobalPage = getCurrentGlobalPage();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading specs data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 print:my-0 print:mx-0 print:w-full">
      {/* Print Controls - visible only on screen */}
      <div className="print-controls mb-8 print:hidden">
        <div className="bg-white shadow-md rounded-lg p-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Print Settings</h2>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
                  />
                </svg>
                Print Current Page
              </button>
              <button
                onClick={handlePrintAll}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium flex items-center"
              >
                Print All Pages
              </button>
            </div>
          </div>

          <div className="flex gap-6 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Orientation
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="orientation"
                    value="portrait"
                    checked={printOrientation === "portrait"}
                    onChange={() => setPrintOrientation("portrait")}
                  />
                  <span className="ml-2">Portrait</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="orientation"
                    value="landscape"
                    checked={printOrientation === "landscape"}
                    onChange={() => setPrintOrientation("landscape")}
                  />
                  <span className="ml-2">Landscape</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Rows per page
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="border border-gray-300 px-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t pt-4 mt-4">
            <div className="text-sm text-gray-600">
              Showing rows {startRow + 1}-{endRow} of{" "}
              {specsData?.rows.length || 0}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={currentRowPage === 1}
                className="px-3 py-1 border rounded bg-gray-100 disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="px-3 py-1 border rounded bg-gray-100">
                Page {currentGlobalPage} of {totalCombinedPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentRowPage === totalRowPages}
                className="px-3 py-1 border rounded bg-gray-100 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render multiple tables in "all" mode for printing */}
      {printMode === "all" ? (
        <>
          {Array.from({ length: totalRowPages }).map((_, rowPageIdx) => {
            const rowStart = rowPageIdx * rowsPerPage;
            const rowEnd = Math.min(
              rowStart + rowsPerPage,
              specsData?.rows.length || 0
            );
            const pageRows = specsData?.rows.slice(rowStart, rowEnd) || [];

            const isFirstPage = rowPageIdx === 0;

            return (
              <div
                key={`page-${rowPageIdx}`}
                className={isFirstPage ? "" : "page-break-before"}
              >
                <div className="mt-8 flex flex-col gap-4 px-4 print:px-0 print:mx-auto">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-center">
                      {specsData?.collection_name || "Specifications"}
                    </h1>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span>Proto #{specsData?.proto_number || ""}</span>
                        <span>
                          Merchant: {specsData?.sampling_merchant || ""}
                        </span>

                        {/* Development Cycles */}
                        {/* {specsData?.development_cycles &&
                        specsData.development_cycles.length > 0 && (
                          <div className="flex gap-3 items-center print:my-2">
                            <h4 className="font-semibold">
                              Development Cycles:
                            </h4>
                            <div className="flex gap-2">
                              {specsData.development_cycles.map((cycle) => (
                                <span key={cycle.development_cycle_id}>
                                  {cycle.development_cycle_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )} */}
                      </div>
                      {specsData?.qr_image && (
                        <div
                          style={{
                            width: "1in",
                            height: "1in",
                          }}
                          className="overflow-hidden flex justify-start items-start border bg-white qr-print-box"
                        >
                          <img
                            src={specsData.qr_image}
                            alt="QR Code"
                            style={{
                              height: "1in",
                              width: "auto",
                              objectFit: "cover",
                              objectPosition: "left top",
                              display: "block",
                            }}
                            onLoad={() => setQrImageLoaded(true)}
                            onError={() => setQrImageLoaded(true)}
                          />
                        </div>
                      )}
                      <div className="text-right flex flex-col">
                        <span>Version: v1.0</span>
                        <span>Date: {new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {/* <h3 className="text-lg font-bold text-center border-2 py-2 my-4 print:text-xl">
                    SPECS INFORMATION - Page {rowPageIdx + 1} of{" "}
                    {totalCombinedPages}
                  </h3> */}
                  <div className="overflow-x-auto mb-4 print:overflow-visible print:mx-auto">
                    <table className="w-full border-2 print:border-collapse print:mx-auto">
                      <thead>
                        <tr className="print:break-inside-avoid">
                          <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-sno-col">
                            S.No
                          </th>
                          <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-header-col">
                            Header
                          </th>
                          <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-type-col">
                            Type
                          </th>
                          <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-location-col">
                            Location
                          </th>
                          <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-value-col">
                            Left Value
                          </th>
                          <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-value-col">
                            Right Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row, rowIndex) => (
                          <tr
                            key={row.collection_spec_id}
                            className={`print:border-b ${
                              rowIndex % 2 === 0
                                ? "bg-white hover:bg-gray-50 print:bg-white"
                                : "bg-gray-50 hover:bg-gray-100 print:bg-white"
                            }`}
                          >
                            <td className="border-2 px-2 py-4 text-center text-base font-semibold print:border print:font-semibold print:text-black print-sno-col">
                              {rowStart + rowIndex + 1}
                            </td>
                            <td className="border-2 px-2 py-4 text-center text-base font-bold text-gray-800 print:border print:font-bold print:text-black print-header-col">
                              {row.header}
                            </td>
                            <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-type-col">
                              {row.measurement_name}
                            </td>
                            <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-location-col">
                              {row.location}
                            </td>
                            <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-value-col">
                              {row.left_value !== null ? row.left_value : ""}
                            </td>
                            <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-value-col">
                              {row.right_value !== null ? row.right_value : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        /* Render current page only */
        <div
          className={`mt-8 px-4 flex flex-col gap-4 print:px-0 print:mx-auto ${
            printOrientation === "landscape"
              ? "print:landscape"
              : "print:portrait"
          }`}
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-center">
              {specsData?.collection_name || "Specifications"}
            </h1>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span>Proto #{specsData?.proto_number || ""}</span>
                <span>Merchant: {specsData?.sampling_merchant || ""}</span>

                {/* Development Cycles */}
                {/* {specsData?.development_cycles &&
                specsData.development_cycles.length > 0 && (
                  <div className="flex gap-3 items-center print:my-2">
                    <h4 className="font-semibold">Development Cycles:</h4>
                    <div className="flex gap-2">
                      {specsData.development_cycles.map((cycle) => (
                        <span key={cycle.development_cycle_id}>
                          {cycle.development_cycle_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
              {specsData?.qr_image && (
                <div
                  style={{
                    width: "1in",
                    height: "1in",
                  }}
                  className="overflow-hidden flex justify-start items-start border bg-white qr-print-box"
                >
                  <img
                    src={specsData?.qr_image}
                    alt="QR Code"
                    style={{
                      height: "1in",
                      width: "auto",
                      objectFit: "cover",
                      objectPosition: "left top",
                      display: "block",
                    }}
                    onLoad={() => setQrImageLoaded(true)}
                    onError={() => setQrImageLoaded(true)}
                  />
                </div>
              )}
              <div className="text-right flex flex-col">
                <span>Version: v1.0</span>
                <span>Date: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* <h3 className="text-lg font-bold text-center border-2 py-2 my-4 print:text-xl">
            SPECS INFORMATION - Page {currentGlobalPage} of {totalCombinedPages}
          </h3> */}
          <div className="overflow-x-auto mb-4 print:overflow-visible print:mx-auto">
            <table className="w-full border-2 print:border-collapse print:mx-auto">
              <thead>
                <tr className="print:break-inside-avoid">
                  <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-sno-col">
                    S.No
                  </th>
                  <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-header-col">
                    Header
                  </th>
                  <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-type-col">
                    Type
                  </th>
                  <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-location-col">
                    Location
                  </th>
                  <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-value-col">
                    Left Value
                  </th>
                  <th className="border-2 px-2 py-3 text-center text-lg font-bold print:font-semibold print:text-black print-value-col">
                    Right Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, rowIndex) => (
                  <tr
                    key={row.collection_spec_id}
                    className={`print:border-b ${
                      rowIndex % 2 === 0
                        ? "bg-white hover:bg-gray-50 print:bg-white"
                        : "bg-gray-50 hover:bg-gray-100 print:bg-white"
                    }`}
                  >
                    <td className="border-2 px-2 py-4 text-center text-base font-semibold print:border print:font-semibold print:text-black print-sno-col">
                      {startRow + rowIndex + 1}
                    </td>
                    <td className="border-2 px-2 py-4 text-center text-base font-bold text-gray-800 print:border print:font-bold print:text-black print-header-col">
                      {row.header}
                    </td>
                    <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-type-col">
                      {row.measurement_name}
                    </td>
                    <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-location-col">
                      {row.location}
                    </td>
                    <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-value-col">
                      {row.left_value !== null ? row.left_value : ""}
                    </td>
                    <td className="border-2 px-2 py-4 text-center text-gray-900 print:border print:text-black print-value-col">
                      {row.right_value !== null ? row.right_value : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Modal Dialog */}
      {showPrintOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Print Options</h3>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Orientation
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="orientationModal"
                    value="portrait"
                    checked={printOrientation === "portrait"}
                    onChange={() => setPrintOrientation("portrait")}
                  />
                  <span className="ml-2">Portrait</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="orientationModal"
                    value="landscape"
                    checked={printOrientation === "landscape"}
                    onChange={() => setPrintOrientation("landscape")}
                  />
                  <span className="ml-2">Landscape</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Content to Print
              </label>
              <div className="flex flex-col space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="printContent"
                    value="current"
                    checked={printMode === "current"}
                    onChange={() => setPrintMode("current")}
                  />
                  <span className="ml-2">
                    Current Page ({currentGlobalPage} of {totalCombinedPages})
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="printContent"
                    value="all"
                    checked={printMode === "all"}
                    onChange={() => setPrintMode("all")}
                  />
                  <span className="ml-2">
                    All Pages ({totalCombinedPages} pages total)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPrintOptions(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPrintOptions(false);
                  printMode === "all" ? handlePrintAll() : handlePrint();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: 2cm; /* Equal margins on all sides */
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important; /* Reset body margins */
          }

          .print-controls {
            display: none !important;
          }

          /* Center the content */
          .container {
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          table {
            width: 100%;
            page-break-inside: auto;
            table-layout: fixed !important; /* Ensure fixed layout */
            margin: 0 auto !important; /* Center the table */
          }

          /* Other print styles remain the same... */
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-row-group;
          }

          table,
          th,
          td {
            border-color: #000 !important;
          }

          th {
            background-color: #f3f4f6 !important;
          }

          /* Ensure white background for printing */
          * {
            background-color: white !important;
            color: black !important;
          }

          /* Fix for border color in print */
          .border-2,
          .border {
            border-color: #000 !important;
          }

          /* Page break for all-pages print mode */
          .page-break-before {
            page-break-before: always;
            break-before: page;
            margin-top: 1cm;
          }

          /* Column width controls */
          .print-sno-col {
            width: 7% !important;
            max-width: 7% !important;
          }

          .print-header-col {
            width: 22% !important;
            max-width: 22% !important;
          }

          .print-type-col {
            width: 22% !important;
            max-width: 22% !important;
          }

          .print-location-col {
            width: 18% !important;
            max-width: 18% !important;
          }

          .print-value-col {
            width: 13% !important;
            max-width: 15% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LayoutComponents(SpecsPrintView);
