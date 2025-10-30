"use client";

import React from "react";

function ScreenLayout({ arrayData }: any) {
  const styleName = "SAMPLE DEV FORM";

  return (
    <div className="container mx-auto my-12 p-4">
      <div className="w-full flex items-center mb-4 relative  my-2 border-2 p-4">
        <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-semibold text-gray-700">
          FROM 99 Print View - {styleName}
        </h2>
      </div>

      {arrayData?.order_detail && arrayData?.order_detail?.data?.length > 0 && (
        <div className="mt-4 pt-4 border-2">
          <h3 className="text-lg font-semibold text-gray-700 text-center border-b-2 py-2 mb-0">
            Order Information
          </h3>

          <div className="w-full border-t-0 p-3">
            <div className="flex gap-4 w-[full] pr-3">
              <div className="w-[50%]">
                {arrayData?.order_detail &&
                  arrayData?.order_detail?.data?.length > 0 && (
                    <div className="mb-4 border-t-4 border-l-4 border-r-4">
                      <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                        <p className="text-red-500">
                          {arrayData?.order_detail?.title}
                        </p>
                      </h4>
                      {Array.isArray(arrayData?.order_detail?.data) &&
                        arrayData?.order_detail?.data?.length > 0 &&
                        arrayData?.order_detail?.data?.map(
                          (dataItem: any, dataIndex: number) => (
                            <div
                              key={dataIndex}
                              className="flex gap-2  items-baseline  border-b-4"
                            >
                              <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                {dataItem.name}
                              </p>
                              <p className="text-gray-800  text-[15px]   w-[50%] border-l-4 p-2">
                                {dataItem.value || "N/A"}
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
                          className="w-full h-auto  shadow-md border border-gray-200"
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

              <div className="border-2  p-2 mb-4 w-[50%]">
                {arrayData?.master_detail &&
                  arrayData?.master_detail?.data?.length > 0 && (
                    <div className="mb-4 border-4 ">
                      <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                        <p className="text-red-500">
                          {arrayData?.master_detail?.title}
                        </p>
                      </h4>

                      {Array.isArray(arrayData?.master_detail?.data) &&
                        arrayData?.master_detail?.data?.length > 0 &&
                        arrayData?.master_detail?.data?.map(
                          (dataItem: any, dataIndex: number) => (
                            <div
                              key={dataIndex}
                              className="flex gap-2  items-baseline  border-b-2"
                            >
                              <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                {dataItem?.name}
                              </p>
                              <p className="text-gray-800  text-[15px]  border-l-2 p-2">
                                {dataItem?.value || "N/A"}
                              </p>
                            </div>
                          )
                        )}

                      {arrayData?.master_detail?.overlock_type?.data?.length >
                        0 && (
                        <div className="mb-4 border-t-4 border-l-4 border-r-4 my-4 mx-4">
                          <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                            <p className="text-red-500">
                              {arrayData?.master_detail?.overlock_type?.title}
                            </p>
                          </h4>
                          {Array.isArray(
                            arrayData?.master_detail?.overlock_type?.data
                          ) &&
                            arrayData?.master_detail?.overlock_type?.data
                              ?.length > 0 &&
                            arrayData?.master_detail?.overlock_type?.data.map(
                              (dataItem: any, dataIndex: number) => (
                                <div
                                  key={dataIndex}
                                  className="flex gap-2  items-baseline  border-b-4"
                                >
                                  <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                    {dataItem?.name}
                                  </p>
                                  <p className="text-gray-800  text-[15px]   w-[50%] border-l-4 p-2">
                                    {dataItem?.value || "N/A"}
                                  </p>
                                </div>
                              )
                            )}
                        </div>
                      )}

                      {arrayData?.master_detail?.tuka_efficiency?.data?.length >
                        0 && (
                        <div className="mb-4 border-t-4 border-l-4 border-r-4  my-4 mx-4">
                          <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                            <p className="text-red-500">
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
                            arrayData?.master_detail?.tuka_efficiency?.data.map(
                              (dataItem: any, dataIndex: number) => (
                                <div
                                  key={dataIndex}
                                  className="flex gap-2  items-baseline  border-b-4"
                                >
                                  <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                    {dataItem?.name}
                                  </p>
                                  <p className="text-gray-800  text-[15px]   w-[50%] border-l-4 p-2">
                                    {dataItem?.value || "N/A"}
                                  </p>
                                </div>
                              )
                            )}
                        </div>
                      )}

                      {arrayData?.master_detail?.needle_type?.data.length >
                        0 && (
                        <div className="mb-4 border-t-4 border-l-4 border-r-4  my-4 mx-4">
                          <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                            <p className="text-red-500">
                              {arrayData?.master_detail?.needle_type?.title}
                            </p>
                          </h4>
                          {Array.isArray(
                            arrayData?.master_detail?.needle_type?.data
                          ) &&
                            arrayData?.master_detail?.needle_type?.data.length >
                              0 &&
                            arrayData?.master_detail?.needle_type?.data.map(
                              (dataItem: any, dataIndex: number) => (
                                <div
                                  key={dataIndex}
                                  className="flex gap-2  items-baseline  border-b-4"
                                >
                                  <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                    {dataItem?.name}
                                  </p>
                                  <p className="text-gray-800  text-[15px]   w-[50%] border-l-4 p-2">
                                    {dataItem?.value || "N/A"}
                                  </p>
                                </div>
                              )
                            )}
                        </div>
                      )}

                      {/* <div className="mb-4 border-t-4 border-l-4 border-r-4  my-4 mx-4">
                      <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                        <p className="text-red-500">
                          {arrayData?.master_detail?.flatLock?.title}
                        </p>
                      </h4>
                      {Array.isArray(
                        arrayData?.orderInformation?.marterDetail?.flatLock
                          ?.data
                      ) &&
                        arrayData?.orderInformation?.marterDetail?.flatLock
                          ?.data.length > 0 &&
                        arrayData?.orderInformation?.marterDetail?.flatLock?.data.map(
                          (dataItem: any, dataIndex: number) => (
                            <div
                              key={dataIndex}
                              className="flex gap-2  items-baseline  border-b-4"
                            >
                              <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                {dataItem?.name}
                              </p>
                              <p className="text-gray-800  text-[15px]   w-[50%] border-l-4 p-2">
                                {dataItem?.value || "N/A"}
                              </p>
                            </div>
                          )
                        )}
                    </div> */}
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
          <div className="mt-8 border-2 px-4">
            <h3 className="text-lg font-bold text-center border-2 py-2 my-4">
              Merchant Information
            </h3>

            {Array.isArray(arrayData?.composition_detail) &&
              arrayData?.composition_detail?.length > 0 &&
              arrayData?.composition_detail?.map(
                (merchant: any, merchantIndex: number) => (
                  <div
                    key={merchantIndex}
                    className="bg-gray-50 border-2 mb-4 flex w-full"
                  >
                    <div className="w-[70%] p-3">
                      <div className="mb-4 border-t-4 border-l-4 border-r-4 ">
                        <h4 className="text-[25px] font-semibold text-center border-b-4 p-4">
                          <p className="text-red-500">
                            {" "}
                            S. No: {merchantIndex + 1}
                          </p>
                        </h4>

                        <div className="flex w-full border-b-4">
                          <div className="w-[50%] border-r-2">
                            <div className="flex gap-2  items-baseline  border-b-2">
                              <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                Date
                              </p>
                              <p className="text-gray-800  text-[15px]   w-[50%] border-l-2 p-2">
                                {merchant?.date?.slice(0, 10) || "N/A"}
                              </p>
                            </div>
                            <div className="flex gap-2  items-baseline  border-b-2">
                              <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                Name of FAB/TRIM
                              </p>
                              <p className="text-gray-800  text-[15px]   w-[50%] border-l-2 p-2">
                                {merchant?.name}
                              </p>
                            </div>
                            <div className="flex gap-2  items-baseline  border-b-2">
                              <p className="text-gray-600 text-[15px]  font-bold whitespace-nowrap w-[50%] p-2">
                                Placement
                              </p>
                              <p className="text-gray-800  text-[15px]   w-[50%] border-l-2 p-2">
                                {merchant?.placement}
                              </p>
                            </div>
                          </div>
                          <div className="w-[50%] pl-4 flex">
                            <div className="p-4 mx-auto">
                              <div className="w-full h-[500px] object-cover shadow-md" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-l-2 p-3 w-[30%]">
                      {Array.isArray(merchant.child_information) &&
                        merchant?.child_information?.length > 0 &&
                        merchant?.child_information?.map(
                          (child: any, childIndex: number) => (
                            <div
                              key={childIndex}
                              className="mb-4 border-t-2 border-l-2 border-r-2"
                            >
                              <h4 className="text-[25px] font-semibold text-center border-b-2 p-4">
                                <p className="text-red-500">{child?.header}</p>
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
                )
              )}
          </div>
        )}

      {/* Specs Section */}

      {Array.isArray(arrayData?.specs_information) &&
        arrayData?.specs_information?.length > 0 && (
          <div className="mt-8 border-2 px-4">
            <h3 className="text-lg font-bold text-center border-2 py-2 my-4">
              SPECS INFORMATION
            </h3>
            {Array.isArray(arrayData?.specs_information) &&
              arrayData?.specs_information?.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-2 ">
                    <thead>
                      <tr>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-16">
                          S.No
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-50">
                          Headers
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-50">
                          Mesurement
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-50">
                          Location
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-50">
                          Left Value
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-50">
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
                            <td className="border-2  px-4 py-4 text-center text-base font-semibold ">
                              {specIndex + 1}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {spec?.header}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {spec?.measurement_name}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {spec?.location}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {spec?.left_value}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
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
          <div className="mt-8 border-2 px-4">
            <h3 className="text-lg font-bold text-center border-2 py-2 my-4">
              COMMENT INFORMATION
            </h3>

            {Array.isArray(arrayData?.comments_information) &&
              arrayData?.comments_information?.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-2 ">
                    <thead>
                      <tr>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-16">
                          S.No
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  ">
                          Comment By
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  w-50">
                          Actual Comment
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  ">
                          Interpreted Comment
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  ">
                          Image
                        </th>
                        <th className="border-2  px-4 py-3 text-center text-lg font-bold  ">
                          Video
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
                            <td className="border-2  px-4 py-4 text-center text-base font-semibold ">
                              {commentIndex + 1}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {comment?.comment_by}
                            </td>
                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {comment?.actual_comment}
                            </td>

                            <td className="border-2  px-4 py-4 text-center text-base font-bold text-gray-800">
                              {comment?.interpreted_comment}
                            </td>
                            <td className="border-2 py-2 text-center">
                              <div className="flex justify-center">
                                <div className="w-[100px] h-auto">
                                  {comment?.image ? (
                                    <img
                                      src={comment?.image}
                                      alt={`Comment Image Not Present`}
                                      className="w-full h-full object-cover "
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                      No Image
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="border-2 py-2 text-center">
                              <div className="flex justify-center">
                                <div className="w-[100px] h-auto">
                                  {comment?.Video ? (
                                    <p className="p-4 text-gray-400">
                                      Go to the video website check Video
                                    </p>
                                  ) : (
                                    <p className="p-4 text-gray-400">
                                      No Video
                                    </p>
                                  )}
                                </div>
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
    </div>
  );
}

export default ScreenLayout;
