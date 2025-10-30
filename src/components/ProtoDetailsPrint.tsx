"use client";

import { GetProtoDetailsResponse } from "@/types/Proto-Details";
import React, { useState } from "react";

interface ProtoDetailsPrintProps {
  protoData: GetProtoDetailsResponse;
  setShowPrintView: React.Dispatch<React.SetStateAction<boolean>>;
}

// Format time helper function
const formatTime12Hour = (timeString: string) => {
  if (!timeString) return "";

  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  } catch {
    return timeString;
  }
};

const ProtoDetailsPrint: React.FC<ProtoDetailsPrintProps> = ({
  protoData,
  setShowPrintView,
}) => {
  // Add state for orientation toggle
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    "landscape"
  );

  const merchantDetails = protoData?.proto?.merchant_section_data;
  const masterJiDetails = protoData?.proto?.master_ji_section_data;

  // Format data for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`mx-4 print ${
        orientation === "landscape"
          ? "print:landscape-mode"
          : "print:portrait-mode"
      }`}
    >
      {/* Print controls - only visible on screen, hidden when printing */}
      <div className="print-hidden mb-8">
        <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
          <button
            onClick={() => setShowPrintView(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
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
            Back
          </button>
          <h2 className="text-xl font-bold">Proto Details Print View</h2>
          <div className="flex items-center space-x-4">
            {/* Orientation toggle */}
            <div className="flex items-center mr-4">
              <span className="mr-2">Orientation:</span>
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => setOrientation("landscape")}
                  className={`px-3 py-1 text-sm ${
                    orientation === "landscape"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Landscape
                </button>
                <button
                  onClick={() => setOrientation("portrait")}
                  className={`px-3 py-1 text-sm ${
                    orientation === "portrait"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Portrait
                </button>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Print Now
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm">
            <strong>Note:</strong> This print layout is optimized for{" "}
            {orientation} orientation.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="w-full flex items-center justify-center mb-4 my-2 border-2 p-2">
        <h2 className="text-center">
          Proto Details Print View - {protoData?.collection?.collection_name}{" "}
          (Proto #{protoData?.proto?.proto_number})
        </h2>
      </div>

      {/* Style Details Section */}
      <div className="mt-4 pt-1 border-2 print-avoid-break">
        <h3 className="text-lg font-semibold text-gray-700 text-center border-b-2 py-2 mb-0">
          Style Details
        </h3>

        <div className="w-full border-t-0 p-3">
          <div
            className={`${
              orientation === "landscape" ? "flex gap-4" : "space-y-4"
            } w-full`}
          >
            <div
              className={`${
                orientation === "landscape" ? "w-[70%]" : "w-full"
              } h-max flex flex-col gap-3`}
            >
              <table className="w-full border-2">
                <tbody>
                  <tr className="border-b">
                    <td className="border-r p-2 w-1/4">
                      <p className="text-gray-600 text-sm font-bold">
                        DATE STARTED
                      </p>
                    </td>
                    <td className="p-2 w-1/4">
                      <p className="text-gray-800">
                        {merchantDetails?.date_started
                          ? formatDate(merchantDetails.date_started)
                          : ""}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="border-r p-2 w-1/4">
                      <p className="text-gray-600 text-sm font-bold">
                        TIME START
                      </p>
                    </td>
                    <td className="p-2 w-1/4">
                      <p className="text-gray-800">
                        {merchantDetails?.time_start
                          ? formatTime12Hour(merchantDetails.time_start)
                          : ""}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="border-r p-2 w-1/4">
                      <p className="text-gray-600 text-sm font-bold">
                        PATTERN MASTER
                      </p>
                    </td>
                    <td className="p-2 w-1/4">
                      <p className="text-gray-800">
                        {merchantDetails?.pattern_master_name || ""}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="border-r p-2 w-1/4">
                      <p className="text-gray-600 text-sm font-bold">
                        CUT MASTER
                      </p>
                    </td>
                    <td className="p-2 w-1/4">
                      <p className="text-gray-800">
                        {merchantDetails?.cutting_master_name || ""}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="border-r p-2">
                      <p className="text-gray-600 text-sm font-bold">
                        DATE END
                      </p>
                    </td>
                    <td className="p-2">
                      <p className="text-gray-800">
                        {merchantDetails?.date_end
                          ? formatDate(merchantDetails.date_end)
                          : ""}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="border-r p-2">
                      <p className="text-gray-600 text-sm font-bold">
                        TIME END
                      </p>
                    </td>
                    <td className="p-2">
                      <p className="text-gray-800">
                        {merchantDetails?.time_end
                          ? formatTime12Hour(merchantDetails.time_end)
                          : ""}
                      </p>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="border-r p-2">
                      <p className="text-gray-600 text-sm font-bold">TAILOR</p>
                    </td>
                    <td>
                      <p className="text-gray-800 p-2">
                        {merchantDetails?.tailor || ""}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r p-2">
                      <p className="text-gray-600 text-sm font-bold">
                        PATTERN PARTS TOTAL
                      </p>
                    </td>
                    <td className="p-2">
                      <p className="text-gray-800">
                        {merchantDetails?.pattern_parts_total || ""}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                className={`${
                  orientation === "landscape" ? "flex" : "hidden"
                } flex-col justify-center items-end`}
              >
                {protoData?.proto?.qr_image ? (
                  <>
                    <img
                      src={protoData.proto.qr_image}
                      alt="QR Code"
                      className="h-[200px] object-cover border border-dashed border-gray-500"
                    />
                  </>
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    No QR Image
                  </div>
                )}
              </div>
            </div>

            {/* Proto Image */}
            <div
              className={`flex gap-4 items-end ${
                orientation === "landscape" ? "w-[30%]" : "w-full"
              }`}
            >
              <div
                className={`${
                  orientation === "landscape"
                    ? "w-[100%] flex-1"
                    : "w-[30%] print:w-[40%]"
                } border-2 flex items-center justify-center p-2`}
                style={{
                  aspectRatio: "9/16",
                  minHeight: "200px",
                }}
              >
                {protoData?.proto?.image ? (
                  <img
                    src={protoData.proto.image}
                    alt="Proto Image"
                    className={`${
                      orientation === "portrait" && "max-h-auto"
                    } object-contain`}
                  />
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No Image Available</p>
                  </div>
                )}
              </div>
              <div
                className={`${
                  orientation === "portrait" ? "flex" : "hidden"
                } flex-col justify-center items-end`}
              >
                {protoData?.proto?.qr_image ? (
                  <>
                    <img
                      src={protoData.proto.qr_image}
                      alt="QR Code"
                      className="h-[200px] object-cover border border-dashed border-gray-500"
                    />
                  </>
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    No QR Image
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master Ji Section */}
      <div
        className={`mt-8 pt-1 border-2 print-avoid-break ${
          orientation === "portrait" ? "print-page-break" : ""
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-700 text-center border-b-2 py-2 mb-0">
          Master Ji Details
        </h3>

        <div className="w-full border-t-0 p-3">
          <div
            // className={`${
            //   orientation === "landscape" ? "grid grid-cols-2" : "space-y-4"
            // } gap-4`}
            className="grid grid-cols-2 gap-4"
          >
            {/* Left Side / Top in Portrait */}
            <div className="space-y-4">
              {/* Production Details */}
              <div className="border-2">
                <h4 className="text-md font-semibold text-center border-b-2 p-2">
                  <p className="text-red-500">Production Details</p>
                </h4>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="border-b border-r p-2 w-1/2">
                        <p className="text-gray-600 text-sm font-bold">
                          STITCH TIME:
                        </p>
                      </td>
                      <td className="p-2 w-1/2">
                        <p className="text-gray-800">
                          {masterJiDetails?.stitch_time
                            ? formatTime12Hour(masterJiDetails.stitch_time)
                            : "N/A"}
                        </p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="border-r p-2 w-1/2">
                        <p className="text-gray-600 text-sm font-bold">
                          STITCH COST:
                        </p>
                      </td>
                      <td className="p-2 w-1/2">
                        <p className="text-gray-800">
                          {masterJiDetails?.stitch_cost || "N/A"}
                        </p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="border-r p-2">
                        <p className="text-gray-600 text-sm font-bold">
                          CUT COST:
                        </p>
                      </td>
                      <td className="p-2 w-1/2">
                        <p className="text-gray-800">
                          {masterJiDetails?.cut_cost || "N/A"}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r p-2">
                        <p className="text-gray-600 text-sm font-bold">
                          GROSS WEIGHT:
                        </p>
                      </td>
                      <td className="p-2">
                        <p className="text-gray-800">
                          {masterJiDetails?.gross_weight
                            ? `${masterJiDetails.gross_weight} ${
                                masterJiDetails.gross_weight_unit || ""
                              }`
                            : "N/A"}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Needle Type */}
              {masterJiDetails?.extra_data?.needle_type &&
                masterJiDetails.extra_data.needle_type.length > 0 && (
                  <div className="border-2">
                    <h4 className="text-md font-semibold text-center border-b-2 p-2">
                      <p className="text-red-500">Needle Type</p>
                    </h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border-b border-r p-2 text-left">
                            Fabric Type
                          </th>
                          <th className="border-b p-2 text-left">
                            Needle Type
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterJiDetails.extra_data.needle_type.map(
                          (needle, index) => (
                            <tr
                              key={index}
                              className={`${
                                index ===
                                masterJiDetails.extra_data.needle_type.length -
                                  1
                                  ? ""
                                  : "border-b"
                              }`}
                            >
                              <td className="border-r p-2">
                                {needle.fabric_type || "N/A"}
                              </td>
                              <td className="p-2">
                                {needle.needle_type || "N/A"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            {/* Right Side / Bottom in Portrait */}
            <div className="space-y-4">
              {/* Overlock Type */}
              {masterJiDetails?.extra_data?.overlock_type &&
                masterJiDetails.extra_data.overlock_type.length > 0 && (
                  <div className="border-2">
                    <h4 className="text-md font-semibold text-center border-b-2 p-2">
                      <p className="text-red-500">Overlock Type</p>
                    </h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border-b border-r p-2 text-left">
                            Type
                          </th>
                          <th className="border-b p-2 text-left">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterJiDetails.extra_data.overlock_type.map(
                          (overlock, index) => (
                            <tr
                              key={index}
                              className={`${
                                index ===
                                masterJiDetails.extra_data.overlock_type
                                  .length -
                                  1
                                  ? ""
                                  : "border-b"
                              }`}
                            >
                              <td className="border-r p-2">
                                {overlock.overlock_type || "N/A"}
                              </td>
                              <td className="p-2">{overlock.value || "N/A"}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Efficiency Type */}
              {masterJiDetails?.extra_data?.efficiency_type &&
                masterJiDetails.extra_data.efficiency_type.length > 0 && (
                  <div className="border-2 print-avoid-break">
                    <h4 className="text-md font-semibold text-center border-b-2 p-2">
                      <p className="text-red-500">Efficiency</p>
                    </h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border-b border-r p-2 text-left">
                            Type
                          </th>
                          <th className="border-b p-2 text-left">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterJiDetails.extra_data.efficiency_type.map(
                          (efficiency, index) => (
                            <tr
                              key={index}
                              className={`${
                                index ===
                                masterJiDetails.extra_data.efficiency_type
                                  .length -
                                  1
                                  ? ""
                                  : "border-b"
                              }`}
                            >
                              <td className="border-r p-2">
                                {efficiency.efficiency_type || "N/A"}
                              </td>
                              <td className="p-2">
                                {efficiency.value !== null
                                  ? `${efficiency.value}%`
                                  : "N/A"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>

          {/* Flat Lock - Full Width */}
          {masterJiDetails?.extra_data?.flat_lock &&
            masterJiDetails.extra_data.flat_lock.length > 0 && (
              <div className="border-2 mt-4 print-avoid-break">
                <h4 className="text-md font-semibold text-center border-b-2 p-2">
                  <p className="text-red-500">Flat Lock</p>
                </h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-r p-2 text-left">
                        Placement
                      </th>
                      <th className="border-b border-r p-2 text-left">Type</th>
                      <th className="border-b border-r p-2 text-left">
                        No of Threads
                      </th>
                      <th className="border-b p-2 text-left">Folder Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterJiDetails.extra_data.flat_lock.map((lock, index) => (
                      <tr
                        key={index}
                        className={`${
                          index ===
                          masterJiDetails.extra_data.flat_lock.length - 1
                            ? ""
                            : "border-b"
                        }`}
                      >
                        <td className="border-r p-2">
                          {lock.placement || "N/A"}
                        </td>
                        <td className="border-r p-2">{lock.type || "N/A"}</td>
                        <td className="border-r p-2">
                          {lock.no_of_threads || "N/A"}
                        </td>
                        <td className="p-2">
                          {lock.type === "without-folder"
                            ? "N/A"
                            : lock.folder_size || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* Tuka File */}
          {masterJiDetails?.tuka_file && (
            <div className="border-2 mt-4 p-4">
              <p className="text-gray-600 text-sm font-bold">Tuka File:</p>
              <p className="text-gray-800">
                Available (File: {masterJiDetails.tuka_file.split("/").pop()})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          /* Hide print controls when printing */
          .print-hidden {
            display: none !important;
          }

          /* Set orientation based on state */
          @page {
            size: ${orientation};
            margin: 10mm;
          }

          /* Ensure sections don't break across pages */
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Force page break between sections if needed */
          .print-page-break {
            page-break-before: always;
            break-before: page;
          }

          body {
            margin: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Screen-only styles for preview */
        @media screen {
          .landscape-mode {
            width: 11in;
            max-width: 100%;
            margin: 0 auto;
          }

          .portrait-mode {
            width: 8.5in;
            max-width: 100%;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ProtoDetailsPrint;
