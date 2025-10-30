import { ProtoSpecsResponse, Row } from "@/types/Specs";
import React, { Suspense } from "react";

interface SpecsTableProps {
  title?: string;
  rows: Row[];
  specsData: ProtoSpecsResponse;
  prevRows?: Row[];
  current_proto: number;
  onEdit?: () => void;
}

const SpecsTable: React.FC<SpecsTableProps> = ({
  title,
  rows,
  specsData,
  prevRows,
  current_proto,
  onEdit,
}) => {
  // const getCellStyle = (row: Row, cellType: "left" | "right") => {
  //   if (
  //     row._isNewRow ||
  //     (cellType === "left" &&
  //       (row._leftValueChanged || row._leftValueDeleted)) ||
  //     (cellType === "right" &&
  //       (row._rightValueChanged || row._rightValueDeleted))
  //   ) {
  //     return "bg-yellow-100";
  //   }
  //   return "";
  // };

  const getPrevRow = (spec_id?: string) =>
    prevRows?.find((r) => r.collection_spec_id === spec_id);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="mb-8 flex-shrink-0 w-[47.5%] flex-1">
        {title && (
          <div className="bg-blue-50 flex justify-between gap-4 px-4 py-6">
            <div className="flex justify-between items-center w-full gap-2">
              <div>
                <div className="font-bold text-lg">{title}</div>
              </div>
              <div>
                <p className="text-xs opacity-90">
                  Last updated by: {specsData.last_edited_by ?? "Unknown"}
                </p>
                <p className="text-xs opacity-90 text-wrap">
                  Last updated at:{" "}
                  {new Date(specsData.last_edited_at).toLocaleString()}
                </p>
              </div>
            </div>
            {current_proto === specsData.proto_number &&
              specsData.permission.can_edit && (
                <div className="w-[20%] flex justify-end border-l border-gray-400">
                  <button
                    className="flex items-center gap-2 bg-blue-500 px-4 py-2 text-white cursor-pointer"
                    onClick={() => onEdit && onEdit()}
                  >
                    Edit
                  </button>
                </div>
              )}
          </div>
        )}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
            <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-4 text-base font-bold text-gray-600 uppercase tracking-wider">
              <div>S. No</div>
              <div>HEADER</div>
              <div>TYPE</div>
              <div>LOCATION</div>
              <div className="text-center">LEFT</div>
              <div className="text-center">RIGHT</div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {rows.map((row, idx) => {
              const prevRow = getPrevRow(row.collection_spec_id);

              // Only compare if row exists in both protos
              const isCommonRow = !!prevRow;

              // Yellow if value changed (for common rows)
              const leftChanged =
                isCommonRow && row.left_value !== prevRow.left_value;

              const rightChanged =
                isCommonRow && row.right_value !== prevRow.right_value;

              // Light red if both left and right are empty (for common rows)
              const bothEmpty =
                isCommonRow && row.left_value === "" && row.right_value === "";

              return (
                <div
                  key={row.collection_spec_id || idx}
                  className={`px-4 py-4`}
                >
                  <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-4 text-base">
                    <div className="font-medium text-gray-900 py-2">
                      {idx + 1}
                    </div>
                    <div className="font-medium text-gray-900 py-2">
                      {row.header}
                    </div>
                    <div className="text-gray-700 py-2">
                      {row.measurement_name}
                    </div>
                    <div className="text-gray-700 py-2">{row.location}</div>
                    <div
                      className={`font-mono text-center text-gray-900 py-2 ${
                        bothEmpty
                          ? "bg-red-100"
                          : leftChanged
                          ? "bg-yellow-100"
                          : ""
                      }`}
                    >
                      {row.left_value}
                    </div>
                    <div
                      className={`font-mono text-center text-gray-900 py-2 ${
                        bothEmpty
                          ? "bg-red-100"
                          : rightChanged
                          ? "bg-yellow-100"
                          : ""
                      }`}
                    >
                      {row.right_value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default SpecsTable;
