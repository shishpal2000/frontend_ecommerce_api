"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function PrintLayout({ arrayData }: any) {
  const { user } = useAuth();
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  console.log("arrayData in PrintLayout:", arrayData);

  return (
    <div
      className={`container mx-auto my-5 print ${
        orientation === "landscape" ? "landscape-mode" : "portrait-mode"
      }`}
    >
      {/* Print controls - only visible on screen, hidden when printing */}

      {/* <div className="flex justify-between w-fill mt-4 mb-4">
        <p>User Name: {user?.name}</p>
        <div>
          <p>Date: {new Date().toLocaleDateString()}</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div> */}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span>User: {user?.name}</span>
            <span>Proto # {arrayData?.order_detail?.proto_number}</span>
            <span className="capitalize">
              Style Name: {arrayData?.order_detail?.style_name}
            </span>
          </div>

          <div className="text-right flex flex-col">
            <span>JC Number : {arrayData?.order_detail?.jc_number}</span>
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="print-hidden mb-8">
        <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold">Print Options</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="orientation" className="font-medium">
                Page Orientation:
              </label>
              <select
                id="orientation"
                className="border rounded px-2 py-1"
                value={orientation}
                onChange={(e) =>
                  setOrientation(e.target.value as "portrait" | "landscape")
                }
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
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
            <strong>Note:</strong> Landscape mode is optimized for wide tables
            and detailed views. Portrait is better for text-heavy content.
          </p>
        </div>
      </div>

      <div className="w-full flex items-center mb-4 relative my-2 border-2 p-4">
        <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold text-gray-700 whitespace-nowrap">
          FROM 99 Print View - {arrayData?.order_detail?.style_name}
        </h2>
      </div>

      {/* Order Details Section */}

      {arrayData?.order_detail && arrayData?.order_detail?.data?.length > 0 && (
        <div className="mt-4 pt-1 border-2 ">
          <h3 className="text-lg font-semibold text-gray-700  border-b-2 py-2 mb-0 text-center">
            Order Information
          </h3>

          <div className="w-full border-t-0 p-3 ">
            <div
              className={`flex gap-4 w-full ${
                orientation === "landscape" ? "flex-row" : ""
              }`}
            >
              <div
                className={`${
                  orientation === "landscape" ? "w-[40%]" : "w-[50%]"
                }`}
              >
                {arrayData?.order_detail &&
                  arrayData?.order_detail?.data?.length > 0 && (
                    <div className="mb-4 border-t-2 border-l-2 border-r-2">
                      <h4 className="text-md font-semibold text-left border-b-2 p-2">
                        <p className="text-red-500">
                          {arrayData?.order_detail?.title}
                        </p>
                      </h4>
                      {Array.isArray(arrayData?.order_detail?.data) &&
                        arrayData?.order_detail?.data.length > 0 &&
                        arrayData?.order_detail?.data.map(
                          (dataItem: any, dataIndex: number) => (
                            <div
                              key={dataIndex}
                              className="flex gap-2 items-baseline border-b-2"
                            >
                              <p className="text-gray-600 text-sm font-bold whitespace-nowrap w-[50%] p-1">
                                {dataItem?.name}
                              </p>
                              <p className="text-gray-800 text-sm w-[50%] border-l-2 p-1">
                                {dataItem?.value || "N/A"}
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  )}

                <div className="flex flex-col gap-4 border-t-4 mt-4 py-4 w-full">
                  {arrayData?.order_detail?.proto_sample_image && (
                    <div className="border-gray-300 pl-4 flex justify-center items-center">
                      <div>
                        <img
                          src={arrayData?.order_detail?.proto_sample_image}
                          alt="Product Image"
                          className="w-full h-[300px]  shadow-md border border-gray-200"
                        />
                      </div>
                    </div>
                  )}

                  {arrayData?.order_detail?.qr_image && (
                    <div className="flex justify-start items-end">
                      <div className=" border-2 border-gray-300  p-2 bg-white ">
                        <img
                          src={arrayData?.order_detail?.qr_image}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`border-2 p-1 mb-2 ${
                  orientation === "landscape" ? "w-[60%]" : "w-[50%]"
                }`}
              >
                {arrayData?.master_detail &&
                  arrayData?.master_detail?.data?.length > 0 && (
                    <div className="mb-1 border-2">
                      <h4 className="text-md font-semibold text-left border-b-2 p-1">
                        <p className="text-red-500 text-center">
                          {arrayData?.master_detail?.title}
                        </p>
                      </h4>

                      {Array.isArray(arrayData?.master_detail?.data) &&
                        arrayData?.master_detail?.data?.length > 0 &&
                        arrayData.master_detail.data.map(
                          (dataItem: any, dataIndex: number) => (
                            <div
                              key={dataIndex}
                              className="flex gap-2 items-baseline border-b-2"
                            >
                              <p className="text-gray-600 text-sm font-bold whitespace-nowrap w-[50%] p-1">
                                {dataItem?.name}
                              </p>
                              <p className="text-gray-800 text-sm border-l-2 p-1">
                                {dataItem?.value || "N/A"}
                              </p>
                            </div>
                          )
                        )}

                      {arrayData?.master_detail?.overlock_type?.data?.length >
                        0 && (
                        <div
                          className={`mb-2 border-t-2 border-l-2 border-r-2 my-2 mx-4 divBreak ${
                            orientation === "landscape" ? "landscape-box" : ""
                          }`}
                        >
                          <h4 className="text-md font-semibold text-left border-b-2 p-1">
                            <p className="text-red-500 text-center">
                              {arrayData?.master_detail?.overlock_type?.title}
                            </p>
                          </h4>
                          {Array.isArray(
                            arrayData?.master_detail?.overlock_type?.data
                          ) &&
                            arrayData?.master_detail?.overlock_type?.data
                              ?.length > 0 &&
                            arrayData?.master_detail?.overlock_type?.data?.map(
                              (dataItem: any, dataIndex: number) => (
                                <div
                                  key={dataIndex}
                                  className="flex gap-2 items-baseline border-b-2"
                                >
                                  <p className="text-gray-600 text-sm  w-[50%] font-bold p-1">
                                    {dataItem?.name}
                                  </p>
                                  <p className="text-gray-800 text-sm w-[50%] border-l-2 p-1">
                                    {dataItem?.value || "N/A"}
                                  </p>
                                </div>
                              )
                            )}
                        </div>
                      )}

                      {arrayData?.master_detail?.tuka_efficiency?.data?.length >
                        0 && (
                        <div
                          className={`mb-2 border-t-2 border-l-2 border-r-2 my-2 mx-4 divBreak ${
                            orientation === "landscape" ? "landscape-box" : ""
                          }`}
                        >
                          <h4 className="text-md font-semibold text-left border-b-2 p-1">
                            <p className="text-red-500 text-center">
                              {arrayData?.master_detail?.tuka_efficiency?.title
                                ? arrayData?.master_detail?.tuka_efficiency
                                    ?.title
                                : "N/A"}
                            </p>
                          </h4>
                          {Array.isArray(
                            arrayData?.master_detail?.tuka_efficiency?.data
                          ) &&
                            arrayData?.master_detail?.tuka_efficiency?.data
                              ?.length > 0 &&
                            arrayData?.master_detail?.tuka_efficiency?.data?.map(
                              (dataItem: any, dataIndex: number) => (
                                <div
                                  key={dataIndex}
                                  className="flex gap-2 items-baseline border-b-2"
                                >
                                  <p className="text-gray-600 text-sm font-bold w-[50%] p-1">
                                    {dataItem?.name}
                                  </p>
                                  <p className="text-gray-800 text-sm w-[50%] p-1 border-l-2">
                                    {dataItem?.value || "N/A"}
                                  </p>
                                </div>
                              )
                            )}
                        </div>
                      )}

                      {arrayData?.master_detail?.needle_type?.data?.length >
                        0 && (
                        <div
                          className={`mb-2 border-t-2 border-l-2 border-r-2 my-2 mx-4 divBreak ${
                            orientation === "landscape" ? "landscape-box" : ""
                          }`}
                        >
                          <h4 className="text-md font-semibold text-left border-b-2 p-1">
                            <p className="text-red-500 text-center">
                              {arrayData?.master_detail?.needle_type?.title}
                            </p>
                          </h4>
                          {Array.isArray(
                            arrayData?.master_detail?.needle_type?.data
                          ) &&
                            arrayData?.master_detail?.needle_type?.data
                              ?.length > 0 &&
                            arrayData?.master_detail?.needle_type?.data?.map(
                              (dataItem: any, dataIndex: number) => (
                                <div
                                  key={dataIndex}
                                  className="flex gap-2 items-baseline border-b-2"
                                >
                                  <p className="text-gray-600 text-sm font-bold w-[50%] p-1">
                                    {dataItem?.name}
                                  </p>
                                  <p className="text-gray-800 text-sm w-[50%] border-l-2 p-1">
                                    {dataItem?.value || "N/A"}
                                  </p>
                                </div>
                              )
                            )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/** merchant section */}
      {Array.isArray(arrayData?.composition_detail) &&
        arrayData?.composition_detail?.length > 0 && (
          <div className="print-page-break print-avoid-break">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span>User: {user?.name}</span>
                    <span>Proto # {arrayData?.order_detail?.proto_number}</span>
                    <span className="capitalize">
                      Style Name: {arrayData?.order_detail?.style_name}
                    </span>
                  </div>

                  <div className="text-right flex flex-col">
                    <span>
                      JC Number : {arrayData?.order_detail?.jc_number}
                    </span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                    <span>Time: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-700  border-2 py-2 my-3 text-center">
              Merchant Information
            </h3>

            {Array.isArray(arrayData?.composition_detail) &&
              arrayData?.composition_detail?.length > 0 &&
              arrayData?.composition_detail?.map(
                (merchant: any, merchantIndex: number) => (
                  <div
                    key={merchantIndex}
                    className={`bg-gray-50 border-2 mb-6 flex w-full divBreak ${
                      orientation === "landscape" ? "landscape-merchant" : ""
                    }`}
                  >
                    <div
                      className={`${
                        orientation === "landscape" ? "w-[40%]" : "w-[70%]"
                      } p-1`}
                    >
                      <div className="border-t-2 border-l-2 border-r-2">
                        <h4 className="text-md font-semibold text-left border-b-2 p-1">
                          <p className="text-red-500 text-center">
                            {" "}
                            S. No: {merchantIndex + 1}
                          </p>
                        </h4>

                        <div className="flex w-full border-b-2">
                          <div className="w-[50%] border-r-2">
                            <div className="flex gap-2 items-baseline border-b-2">
                              <p className="text-gray-600 text-sm font-bold whitespace-nowrap w-[50%] p-1">
                                Date
                              </p>
                              <p className="text-gray-800 text-sm w-[50%] border-l-2 p-1">
                                {merchant?.date?.slice(0, 10) || "N/A"}
                              </p>
                            </div>
                            <div className="flex gap-2 items-baseline border-b-2">
                              <p className="text-gray-600 text-sm text-wrap font-bold whitespace-wrap w-[50%] p-1">
                                Name of FAB
                              </p>
                              <p className="text-gray-800 text-sm w-[50%] border-l-2 p-1">
                                {merchant?.name}
                              </p>
                            </div>
                            <div className="flex gap-2 items-baseline border-b-2">
                              <p className="text-gray-600 text-sm font-bold whitespace-nowrap w-[50%] p-1">
                                Placement
                              </p>
                              <p className="text-gray-800 text-sm w-[50%] border-l-2 p-1">
                                {merchant?.placement}
                              </p>
                            </div>
                          </div>
                          <div className="w-[50%] pl-4 flex">
                            <div className="p-4 mx-auto">
                              <div className="w-full h-[200px] object-cover shadow-md" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`border-l-2 p-3 ${
                        orientation === "landscape" ? "w-[60%]" : "w-[50%]"
                      }`}
                    >
                      <div
                        className={`${
                          orientation === "landscape"
                            ? "grid grid-cols-2 gap-4"
                            : ""
                        }`}
                      >
                        {Array.isArray(merchant.child_information) &&
                          merchant?.child_information?.length > 0 &&
                          merchant?.child_information?.map(
                            (child: any, childIndex: number) => (
                              <div
                                key={childIndex}
                                className="mb-4 border-t-2 border-l-2 border-r-2"
                              >
                                <h4 className="text-[25px] font-semibold text-left border-b-2 p-4">
                                  <p className="text-red-500 text-center">
                                    {child?.header}
                                  </p>
                                </h4>
                                {Array.isArray(child?.data) &&
                                  child?.data?.length > 0 &&
                                  child?.data?.map(
                                    (dataItem: any, dataIndex: number) => (
                                      <div
                                        key={dataIndex}
                                        className="flex gap-2 items-baseline border-b-2"
                                      >
                                        <p className="text-gray-600 text-[15px] font-bold whitespace-nowrap w-[50%] p-2">
                                          {dataItem?.name}
                                        </p>
                                        <p className="text-gray-800 text-[15px] w-[50%] border-l-2 p-2">
                                          {dataItem?.value || "N/A"}
                                        </p>
                                      </div>
                                    )
                                  )}
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                )
              )}
          </div>
        )}

      {/* Specs Section - Perfect for landscape */}
      {Array.isArray(arrayData?.specs_information) &&
        arrayData?.specs_information?.length > 0 && (
          <div className="print-page-break print-avoid-break">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span>User: {user?.name}</span>
                  <span>Proto # {arrayData?.order_detail?.proto_number}</span>
                  <span className="capitalize">
                    Style Name: {arrayData?.order_detail?.style_name}
                  </span>
                </div>

                <div className="text-right flex flex-col">
                  <span>JC Number : {arrayData?.order_detail?.jc_number}</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                  <span>Time: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-center border-2 py-2 my-4">
              SPECS INFORMATION
            </h3>
            {Array.isArray(arrayData?.specs_information) &&
              arrayData?.specs_information?.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table
                    className={`w-full border-2 ${
                      orientation === "landscape" ? "landscape-table" : ""
                    }`}
                  >
                    <thead>
                      <tr>
                        <th className="border-2  px-4 py-3 text-left text-lg font-bold  w-16">
                          S.No
                        </th>
                        <th className="border-2  px-4 py-3 text-left text-lg font-bold  w-50">
                          Headers
                        </th>
                        <th className="border-2  px-4 py-3 text-left text-lg font-bold  w-50">
                          Mesurement
                        </th>
                        <th className="border-2  px-4 py-3 text-left text-lg font-bold  w-50">
                          Location
                        </th>
                        <th className="border-2  px-4 py-3 text-left text-lg font-bold  w-50">
                          Left Value
                        </th>
                        <th className="border-2  px-4 py-3 text-left text-lg font-bold  w-50">
                          Right Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {arrayData?.specs_information?.map(
                        (spec: any, specIndex: number) => (
                          <tr
                            key={specIndex}
                            className={
                              specIndex % 2 === 0
                                ? "bg-white hover:bg-gray-50"
                                : "bg-gray-50 hover:bg-gray-100"
                            }
                          >
                            <td className="border-2  px-4 py-4 text-left text-base font-semibold ">
                              {specIndex + 1}
                            </td>
                            <td className="border-2  px-4 py-4 text-left text-base font-bold text-gray-800">
                              {spec?.header}
                            </td>
                            <td className="border-2  px-4 py-4 text-left text-base font-bold text-gray-800">
                              {spec?.measurement_name}
                            </td>
                            <td className="border-2  px-4 py-4 text-left text-base font-bold text-gray-800">
                              {spec?.location}
                            </td>
                            <td className="border-2  px-4 py-4 text-left text-base font-bold text-gray-800">
                              {spec?.left_value}
                            </td>
                            <td className="border-2  px-4 py-4 text-left text-base font-bold text-gray-800">
                              {spec?.right_value}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

      {/** comment section */}
      {Array.isArray(arrayData?.comments_information) &&
        arrayData?.comments_information?.length > 0 && (
          <div className="print-page-break print-avoid-break">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span>User: {user?.name}</span>
                    <span>Proto # {arrayData?.order_detail?.proto_number}</span>
                    <span className="capitalize">
                      Style Name: {arrayData?.order_detail?.style_name}
                    </span>
                  </div>

                  <div className="text-right flex flex-col">
                    <span>
                      JC Number : {arrayData?.order_detail?.jc_number}
                    </span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                    <span>Time: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-center border-2 py-2 my-4">
              COMMENT INFORMATION
            </h3>

            {Array.isArray(arrayData?.comments_information) &&
              arrayData?.comments_information?.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-2">
                    <thead>
                      <tr>
                        <th className="border-2 px-2 py-3 text-left text-sm font-bold w-[10%]">
                          S.No
                        </th>
                        <th className="border-2 px-2 py-3 text-left text-sm font-bold w-[20%]">
                          Comment By
                        </th>
                        <th className="border-2 px-2 py-3 text-left text-sm font-bold w-[20%]">
                          Actual Comment
                        </th>
                        <th className="border-2 px-1 py-3 text-left text-sm font-bold w-[20%]">
                          Interpreted Comment
                        </th>
                        <th className="border-2 px-2 py-3 text-left text-sm font-bold w-[30%]">
                          Image
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {arrayData?.comments_information?.map(
                        (comment: any, commentIndex: number) => (
                          <tr
                            key={commentIndex}
                            className={
                              commentIndex % 2 === 0
                                ? "bg-white hover:bg-gray-50"
                                : "bg-gray-50 hover:bg-gray-100"
                            }
                          >
                            <td className="border-2 px-2 py-4 text-left text-base font-semibold w-[10%]">
                              {commentIndex + 1}
                            </td>
                            <td className="border-2 px-2 py-4 text-base font-bold text-gray-800 text-left w-[20%]">
                              {comment?.comment_by}
                            </td>
                            <td className="border-2 px-2 py-4 text-left text-base font-bold text-gray-800 w-[20%]">
                              {comment?.actual_comment}
                            </td>
                            <td className="border-2 px-1 py-4 text-left text-base font-bold text-gray-800 w-[20%]">
                              {comment?.interpreted_comment}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center print:border print:text-black print-photo-col">
                              <div
                                style={{
                                  position: "relative",
                                  width: "100%",
                                  height: "auto", // Fixed height for all cells
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
                                  />
                                ) : (
                                  <span className="text-gray-500">
                                    No Image
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

      <style jsx>{`
        @media print {
          /* Hide print controls when printing */
          .print-hidden {
            display: none !important;
          }

          /* Set page orientation based on state */
          @page {
            size: ${orientation};
            margin: 2mm;
          }

          /* Ensure sections never split across pages */
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Always start a new page for sections marked with better top margin */
          .print-page-break {
            page-break-before: always;
            break-before: page;
            margin-top: 20px;
            padding-top: 20px;
          }

          /* Ensure images don't break between pages */
          .divBreak {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Landscape specific styling */
          .landscape-mode .landscape-table {
            width: 100%;
            table-layout: fixed;
          }

          .landscape-mode .landscape-box {
            display: inline-block;
            width: 30%;
            vertical-align: top;
            margin-right: 1%;
          }

          .landscape-mode .landscape-merchant {
            display: flex;
            flex-direction: row;
          }

          .landscape-mode .landscape-comment-table td img {
            max-height: 200px; /* Larger images in landscape */
          }

          img {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Add margin at the top of every new page */
          body {
            margin: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Screen-only styles for the print preview */
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

          /* Simulate landscape page look in preview */
          .landscape-mode .landscape-table {
            width: 100%;
            table-layout: fixed;
          }

          .landscape-mode .landscape-box {
            display: inline-block;
            width: 30%;
            vertical-align: top;
            margin-right: 1%;
          }
        }
      `}</style>
    </div>
  );
}

export default PrintLayout;
