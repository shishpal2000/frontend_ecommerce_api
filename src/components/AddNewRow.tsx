import { Row } from "@/types/Specs";
import React, { Suspense, useState } from "react";

interface AddNewRowProps {
  onAddRow: (rows: Row[]) => void;
}

const emptyRow = {
  header: "",
  measurement_name: "",
  location: "",
  left_value: "",
  right_value: "",
  _isNewRow: true,
};

const AddNewRow: React.FC<AddNewRowProps> = ({ onAddRow }) => {
  const [newRows, setNewRows] = useState<Row[]>([{ ...emptyRow }]);

  // Handle input change for a row
  const handleInputChange = (idx: number, field: keyof Row, value: string) => {
    // Apply validation for left_value and right_value fields
    if (field === "left_value" || field === "right_value") {
      // Only allow numbers and decimal points
      if (
        !(
          value === "" ||
          /^[^a-zA-Z]*$/.test(value)


        )
      ) {
        return; // Reject non-numeric inputs
      }
    }

    const updatedRows = newRows.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setNewRows(updatedRows);

    // If editing the last row and any field is filled, add a new empty row
    if (
      idx === newRows.length - 1 &&
      Object.values(updatedRows[idx]).some(
        (v, i) => i < 5 && typeof v === "string" && v.trim() !== ""
      )
    ) {
      setNewRows([...updatedRows, { ...emptyRow }]);
    }
  };

  // Remove a row
  const handleRemoveRow = (idx: number) => {
    setNewRows(newRows.filter((_, i) => i !== idx));
  };

  // Add all filled rows to parent and reset
  const handleAddAllRows = () => {
    const filledRows = newRows.filter(
      (row) =>
        (row.header.trim() ||
          row.measurement_name.trim() ||
          row.location.trim()) &&
        (row.left_value.trim() || row.right_value.trim())
    );
    if (filledRows.length > 0) {
      onAddRow(filledRows);
      setNewRows([{ ...emptyRow }]);
    }
  };

  // Only enable Add All if at least one row has data
  const canAddAll = newRows.some(
    (row) =>
      (row.header.trim() ||
        row.measurement_name.trim() ||
        row.location.trim()) &&
      (row.left_value.trim() || row.right_value.trim())
  );

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="border-t border-gray-200 bg-blue-50 p-4">
        <div className="text-xs font-medium text-blue-800 mb-2">
          Add New Rows
        </div>
        {newRows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_1fr_0.5fr_0.5fr_0.25fr] gap-2 mb-2 items-center"
          >
            <input
              type="text"
              value={row.header}
              onChange={(e) => handleInputChange(idx, "header", e.target.value)}
              placeholder="Header"
              className="w-full px-2 py-2 border border-blue-300 text-xs"
            />
            <input
              type="text"
              value={row.measurement_name}
              onChange={(e) =>
                handleInputChange(idx, "measurement_name", e.target.value)
              }
              placeholder="Measurement Type"
              className="w-full px-2 py-2 border border-blue-300 text-xs"
            />
            <input
              type="text"
              value={row.location}
              onChange={(e) =>
                handleInputChange(idx, "location", e.target.value)
              }
              placeholder="Location"
              className="w-full px-2 py-2 border border-blue-300 text-xs"
            />
            <textarea
              value={row.left_value}
              onChange={(e) =>
                handleInputChange(idx, "left_value", e.target.value)
              }
              placeholder="Left Value"
              className="w-full px-2 py-2 border border-blue-300 text-xs"
            />
            <textarea
              value={row.right_value}
              onChange={(e) =>
                handleInputChange(idx, "right_value", e.target.value)
              }
              placeholder="Right Value"
              className="w-full px-2 py-2 border border-blue-300 text-xs"
            />
            <input
              type="text"
              value={row.right_value}
              onChange={(e) =>
                handleInputChange(idx, "right_value", e.target.value)
              }
              placeholder="Right Value"
              className="w-full px-2 py-2 border border-blue-300 text-xs"
            />
            {newRows.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveRow(idx)}
                className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddAllRows}
            disabled={!canAddAll}
            className="px-3 py-2 bg-green-600 text-white text-xs hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded"
          >
            Add All Rows
          </button>
        </div>
      </div>
    </Suspense>
  );
};

export default AddNewRow;
