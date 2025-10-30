"use client";

import LayoutComponents from "@/app/layoutComponents";
import { useApiCall } from "@/hooks/useApiCall";
import { Comment, GetCommentsResponse } from "@/types/Comments";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const CommentsPrintPage = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [fullData, setFullData] = useState<GetCommentsResponse | null>(null);
  const [printOrientation, setPrintOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage, setCommentsPerPage] = useState(10); // Adjustable comments per page
  const [totalPages, setTotalPages] = useState(1);
  const [printMode, setPrintMode] = useState<"current" | "all">("current");

  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  const [totalImagesToLoad, setTotalImagesToLoad] = useState(0);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  const [imageHeight, setImageHeight] = useState(300);

  useEffect(() => {
    if (totalImagesToLoad >= 0 && imagesLoadedCount === totalImagesToLoad) {
      setAllImagesLoaded(true);
    }
  }, [imagesLoadedCount, totalImagesToLoad]);

  const { get } = useApiCall();
  const params = useParams();
  const proto_id = params.protoId;

  // Prevent default print behavior
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

  // Adjust comments per page based on orientation

  useEffect(() => {
    if (printOrientation === "landscape") {
      setCommentsPerPage(Math.min(comments.length, 1)); // Show 1 per page for landscape print
      setImageHeight(400);
    } else {
      // For portrait mode, show all comments in view but limit for print
      setCommentsPerPage(Math.min(comments.length, 10)); // Show up to 10 comments per page
      setImageHeight(300);
    }
  }, [printOrientation, comments.length]);

  useEffect(() => {
    // Simulate fetching comments from an API
    const fetchComments = async () => {
      try {
        const response = await get<GetCommentsResponse>(
          `/comment/${proto_id}/list-collection-comments/`
        );

        setFullData(response.data);
        setComments(response.data.comments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [get, proto_id]);

  useEffect(() => {
    // Count comments with images plus 1 for the QR code
    const imageCount =
      comments.filter((c) => c.image).length +
      (fullData?.proto?.qr_image ? 1 : 0);

    setTotalImagesToLoad(imageCount);

    // Reset the counter when comments change
    setImagesLoadedCount(0);
    setAllImagesLoaded(false);
  }, [comments, fullData?.proto?.qr_image]);

  // Get current page comments
  const getCurrentPageComments = () => {
    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    return comments?.slice(startIndex, endIndex);
  };

  useEffect(() => {
    setImagesLoadedCount(0);
    setAllImagesLoaded(false);
  }, [printMode]);

  const handlePrintAll = () => {
    setPrintMode("all");
  };

  useEffect(() => {
    // Only used for PrintAll
    if (printMode === "all") {
      // Give a reasonable delay to allow browsers to paint the DOM
      const timer = setTimeout(() => {
        window.print();
        setPrintMode("current");
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [printMode]);

  useEffect(() => {
    setTotalPages(Math.ceil(comments.length / commentsPerPage));
  }, [commentsPerPage, comments]);

  // Navigation between pages
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Current page comments
  const currentComments = getCurrentPageComments();

  return (
    <div className="container mx-auto my-8 print:my-0 print:mx-0 print:w-full">
      {/* Print Controls - visible only on screen */}
      <div className="print-controls mb-8 print:hidden">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Print Settings</h2>
            <div className="flex space-x-3">
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
                  value={commentsPerPage}
                  onChange={(e) => {
                    setCommentsPerPage(Number(e.target.value));
                    setTotalPages(Math.ceil(comments.length / commentsPerPage));
                  }}
                  className="border border-gray-300 px-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Image Height (px)
              </label>
              <input
                type="number"
                min="150"
                max="800"
                value={imageHeight}
                onChange={(e) => setImageHeight(Number(e.target.value))}
                className="border border-gray-300 px-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <div className="text-sm text-gray-600">
                Showing comments {(currentPage - 1) * commentsPerPage + 1}-
                {Math.min(currentPage * commentsPerPage, comments.length)} of{" "}
                {comments.length}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded bg-gray-100 disabled:opacity-50"
                >
                  ← Previous
                </button>
                <span className="px-3 py-1 border rounded bg-gray-100">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded bg-gray-100 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm">
            <p>
              <strong>Tip:</strong> Choose landscape orientation for comments
              with images.
            </p>
            <p className="mt-1">
              {`For a complete printout of all comments, use "Print All Pages"
              button.`}
            </p>
          </div>
        </div>
      </div>

      {/* Render all pages for "all" mode printing */}
      {printMode === "all" ? (
        <>
          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const startIndex = pageIdx * commentsPerPage;
            const endIndex = Math.min(
              startIndex + commentsPerPage,
              comments.length
            );
            const pageComments = comments.slice(startIndex, endIndex);

            return (
              <div
                key={pageIdx}
                className={pageIdx > 0 ? "page-break-before" : ""}
              >
                <div className="mt-8 px-4 print:px-0 print:mx-auto">
                  {/* Header section */}
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-center capitalize">
                      {fullData?.collection?.name}
                    </h1>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        {/* <span>Proto #{fullData?.proto.number}</span> */}
                        <span className="capitalize">
                          Merchant: {fullData?.collection.sampling_merchant}
                        </span>
                      </div>

                      <div className="text-right flex flex-col">
                        <span>Version: v1.0</span>
                        <span>
                          JC Number: {fullData?.collection?.jc_number}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-center border-2 py-2 my-4 print:text-xl">
                    COMMENTS INFORMATION - Page {pageIdx + 1} of {totalPages}
                  </h3>

                  {/* Comments table */}
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="print:break-inside-avoid">
                      <tr>
                        <th className="border border-gray-300 px-2 py-3 text-center print:font-bold print:text-black print-sno-col">
                          S.No
                        </th>
                        <th className="border border-gray-300 text-wrap px-2 py-3 text-center print:font-bold print:text-black print-sno-col">
                          Pro. No
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-person-col">
                          Comment By
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-actual-comment-col">
                          Actual Comment
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-interpreted-comment-col">
                          Interpreted Comment
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-photo-col">
                          Comment Photo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageComments.map((comment, index) => (
                        <tr
                          key={comment.comment_id || index}
                          className="print:break-inside-avoid"
                        >
                          <td className="border border-gray-300 px-2 py-3 text-center print:border print:font-semibold print:text-black print-sno-col">
                            {startIndex + index + 1}
                          </td>
                          <td className="border border-gray-300 px-2 py-3 text-center print:border print:font-semibold print:text-black print-sno-col">
                            {comment.proto_number}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 print:border print:text-black print-person-col">
                            {comment.comment_by}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 print:border print:text-black print-actual-comment-col">
                            {comment.actual_comment}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 print:border print:text-black print-interpreted-comment-col">
                            {comment.interpreted_comment}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center print:border print:text-black print-photo-col">
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: `${imageHeight}px`, // Fixed height for all cells
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f3f4f6",
                              }}
                            >
                              {comment.image ? (
                                <img
                                  src={comment.image}
                                  alt="Comment Photo"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                    aspectRatio: "9/16",
                                  }}
                                  onLoad={() =>
                                    setImagesLoadedCount((count) => count + 1)
                                  }
                                  onError={() =>
                                    setImagesLoadedCount((count) => count + 1)
                                  }
                                />
                              ) : (
                                <span className="text-gray-500">No Image</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        /* Render current page only */
        <div
          className={`mt-8 px-4 print:px-0 print:mx-auto ${
            printOrientation === "landscape"
              ? "print:landscape"
              : "print:portrait"
          }`}
        >
          {/* Header section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-center capitalize">
              {fullData?.collection?.name}
            </h1>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                {/* <span>Proto #{fullData?.proto.number}</span> */}
                <span className="capitalize">
                  Merchant: {fullData?.collection.sampling_merchant}
                </span>
              </div>
              {fullData?.proto?.qr_image && (
                <div
                  style={{
                    width: "1in",
                    height: "1in",
                  }}
                  className="overflow-hidden flex justify-start items-start border bg-white qr-print-box"
                >
                  <img
                    src={fullData.proto.qr_image}
                    alt="QR Code"
                    style={{
                      height: "1in",
                      width: "auto",
                      objectFit: "cover",
                      objectPosition: "left top",
                      display: "block",
                    }}
                  />
                </div>
              )}
              <div className="text-right flex flex-col">
                <span>Version: v1.0</span>
                <span>JC Number: {fullData?.collection?.jc_number}</span>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-center border-2 py-2 my-4 print:text-xl">
            COMMENTS INFORMATION{" "}
            {totalPages > 1 ? `- Page ${currentPage} of ${totalPages}` : ""}
          </h3>

          {/* Comments table */}
          <table className="w-full border-collapse border border-gray-300">
            <thead className="print:break-inside-avoid">
              <tr>
                <th className="border border-gray-300 px-2 py-3 text-center print:font-bold print:text-black print-sno-col">
                  S.No
                </th>
                <th className="border border-gray-300 text-wrap px-2 py-3 text-center print:font-bold print:text-black print-proto-col">
                  Proto No
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-person-col">
                  Comment By
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-actual-comment-col">
                  Actual Comment
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-interpreted-comment-col">
                  Interpreted Comment
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center print:font-bold print:text-black print-photo-col">
                  Comment Photo
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Use all comments instead of currentComments to show all rows */}
              {currentComments?.map((comment, index) => {
                // Calculate the correct serial number based on page and mode
                const serialNumber =
                  (currentPage - 1) * commentsPerPage + index + 1;

                return (
                  <tr
                    key={comment.comment_id}
                    className="print:break-inside-avoid"
                  >
                    <td className="border border-gray-300 px-2 py-3 text-center print:border print:font-semibold print:text-black print-sno-col">
                      {serialNumber}
                    </td>
                    <td className="border border-gray-300 px-2 py-3 text-center print:border print:text-black print-proto-col">
                      {comment.proto_number}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:border print:text-black print-person-col">
                      {comment.comment_by}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:border print:text-black print-actual-comment-col">
                      {comment.actual_comment}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:border print:text-black print-interpreted-comment-col">
                      {comment.interpreted_comment}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center print:border print:text-black print-photo-col">
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: `${imageHeight}px`, // Fixed height for all cells
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f3f4f6",
                        }}
                      >
                        {comment.image ? (
                          <img
                            src={comment.image}
                            alt="Comment Photo"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              height: "100%",
                              objectFit: "contain",
                              aspectRatio: "9/16",
                              background: "#fff",
                            }}
                            onLoad={() =>
                              setImagesLoadedCount((count) => count + 1)
                            }
                            onError={() =>
                              setImagesLoadedCount((count) => count + 1)
                            }
                          />
                        ) : (
                          <span className="text-gray-500">No Image</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: auto;
            min-height: ${imageHeight + 20}px;
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

          .print-person-col {
            width: 15% !important;
            max-width: 15% !important;
          }

          .print-actual-comment-col {
            width: 26% !important;
            max-width: 26% !important;
          }

          .print-interpreted-comment-col {
            width: 26% !important;
            max-width: 26% !important;
          }

          .print-photo-col {
            width: 40% !important;
            max-width: 40% !important;
          }

          .print-photo-col > div {
            position: relative !important;
            width: 100% !important;
            height: ${imageHeight}px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            // background: #f3f4f6 !important;
          }

          .print-photo-col img {
            max-width: 100% !important;
            max-height: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            margin: 0 auto !important;
          }

          /* Make sure images print properly */
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          .qr-print-box {
            width: 1in !important;
            height: 1in !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            border: 1px solid #ccc !important;
            background: #fff !important;
          }
          .qr-print-box img {
            height: 1in !important;
            width: auto !important;
            object-fit: cover !important;
            object-position: left top !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LayoutComponents(CommentsPrintPage);
