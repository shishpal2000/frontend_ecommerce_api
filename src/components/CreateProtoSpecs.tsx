import React, { Suspense } from "react";
import AddNewRow from "@/components/AddNewRow";
import { Row } from "@/types/Specs";

interface CreateProtoSpecsProps {
  editingData: Row[];
  setEditingData: (rows: Row[]) => void;
  removeRow: (index: number) => void;
  setPendingAction: (action: "create" | "update" | null) => void;
  setShowSpecsConfirm: (show: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  prevRows?: Row[];
  isEditingProto?: boolean;
  setIsEditingProto?: (val: boolean) => void;
  protoNumber: number;
  submitting?: boolean;
}

const CreateProtoSpecs: React.FC<CreateProtoSpecsProps> = ({
  editingData,
  setEditingData,
  removeRow,
  setPendingAction,
  setShowSpecsConfirm,
  error,
  setError,
  prevRows,
  isEditingProto,
  setIsEditingProto,
  protoNumber,
  submitting,
}) => {
  console.log("Rendering CreateProtoSpecs with editingData:", editingData);
  console.log("Previous Rows:", prevRows);
  console.log("Is Editing Proto:", isEditingProto);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="flex-shrink-0 flex-1">
        {/* CRUD Header */}
        <div className="bg-blue-50 px-4 py-[26px]">
          <div className="flex flex-col justify-center gap-2">
            <div className="flex justify-between items-center gap-2">
              <div className="font-bold text-lg">
                {isEditingProto
                  ? `Edit Proto #${protoNumber} Specs`
                  : `Create Proto ${protoNumber} Specs`}
              </div>
              {isEditingProto && (
                <button
                  className="bg-red-500 text-white px-4 py-2 cursor-pointer"
                  onClick={() => setIsEditingProto && setIsEditingProto(false)}
                >
                  Cancel
                </button>
              )}
            </div>
            {error && (
              <div className="text-red-600 relative bg-red-300 py-2 px-4 border text-lg font-medium text-center mb-3">
                {error}
                <span
                  className="absolute top-[50%] -translate-y-[50%] cursor-pointer right-0 text-white px-2 py-1 text-2xl"
                  onClick={() => setError(null)}
                >
                  X
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CRUD Content */}
        <div className="bg-white border border-gray-200 shadow-sm">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_0.5fr_0.5fr_0.25fr] gap-4 text-base font-bold text-gray-600 uppercase tracking-wider">
              <div>HEADER</div>
              <div>TYPE</div>
              <div>LOCATION</div>
              <div>LEFT</div>
              <div>RIGHT</div>
            </div>
          </div>

          {/* Editable Rows */}
          <div className="divide-y divide-gray-100">
            {editingData.map((row, idx) => {
              // Find previous version row by spec_id
              const prevRow = row.collection_spec_id
                ? prevRows?.find(
                    (r) => r.collection_spec_id === row.collection_spec_id
                  )
                : undefined;
              const leftChanged =
                prevRow && row.left_value !== prevRow.left_value;
              const rightChanged =
                prevRow && row.right_value !== prevRow.right_value;
              const isNewRow = !row.collection_spec_id;
              const bothEmpty = row.left_value === "" && row.right_value === "";

              return (
                <div
                  key={row.collection_spec_id || idx}
                  className="px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-[1fr_1fr_1fr_0.5fr_0.5fr_0.35fr] gap-4 items-center text-base">
                    <div className="font-medium text-gray-900 py-2">
                      {row.header}
                    </div>
                    <div className="font-medium text-gray-900 py-2">
                      {row.measurement_name}
                    </div>
                    <div className="font-medium text-gray-900 py-2">
                      {row.location}
                    </div>
                    <div>
                      <textarea
                        value={row.left_value}
                        onChange={(e) => {
                          // Only allow numbers and decimal points
                          const newValue = e.target.value;
                          if (
                            newValue === "" ||
                            /^[^a-zA-Z]*$/.test(newValue)
                          ) {
                            const updatedData = editingData.map((r) =>
                              r.collection_spec_id === row.collection_spec_id
                                ? { ...r, left_value: newValue }
                                : r
                            );
                            setEditingData(updatedData);
                          }
                        }}
                        className={`w-full px-2 py-2 border border-gray-300 text-xs ${
                          bothEmpty
                            ? "bg-red-100"
                            : leftChanged || isNewRow
                            ? "bg-yellow-100"
                            : ""
                        }`}
                        placeholder="Left value..."
                      />
                    </div>
                    <div>
                      <textarea
                        value={row.right_value}
                        onChange={(e) => {
                          // Only allow numbers and decimal points
                          const newValue = e.target.value;
                          if (
                            newValue === "" ||
                            /^[^a-zA-Z]*$/.test(newValue)
                          ) {
                            const updatedData = editingData.map((r) =>
                              r.collection_spec_id === row.collection_spec_id
                                ? { ...r, right_value: newValue }
                                : r
                            );
                            setEditingData(updatedData);
                          }
                        }}
                        className={`w-full px-2 py-2 border border-gray-300 text-xs ${
                          bothEmpty
                            ? "bg-red-100"
                            : rightChanged || isNewRow
                            ? "bg-yellow-100"
                            : ""
                        }`}
                        placeholder="Right value..."
                      />
                    </div>
                    <div className="text-xs col-span-1 text-gray-500 text-center mt-2">
                      {!isNewRow ? (
                        <button
                          onClick={() => {
                            // just clear the left and right values
                            const updatedData = editingData.map((r) =>
                              r.collection_spec_id === row.collection_spec_id
                                ? {
                                    ...r,
                                    left_value: "",
                                    right_value: "",
                                  }
                                : r
                            );
                            setEditingData(updatedData);
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const updatedData = editingData.filter(
                              (r, i) => i !== idx
                            );
                            setEditingData(updatedData);
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Row Section */}
          <AddNewRow
            onAddRow={(row) => setEditingData([...editingData, ...row])}
          />

          <button
            onClick={
              isEditingProto
                ? () => {
                    setPendingAction("update");
                    setShowSpecsConfirm(true);
                  }
                : () => {
                    setPendingAction("create");
                    setShowSpecsConfirm(true);
                  }
            }
            disabled={editingData.length === 0 || submitting}
            className="w-full bg-purple-600 cursor-pointer text-white py-2 px-4 text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isEditingProto
              ? "Save Changes"
              : `Submit & Create Proto ${protoNumber}`}
          </button>

          <div className="text-xs text-gray-500 text-center mt-2">
            All changes will be saved for this Proto
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default CreateProtoSpecs;
