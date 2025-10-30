import { Row } from "@/types/Specs";
import React, { Suspense } from "react";

interface SpecsConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rows: Row[];
  submitting?: boolean;
}

const SpecsConfirmationModal: React.FC<SpecsConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  rows,
  submitting,
}) => {
  if (!isOpen) return null;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full h- p-6">
          <h2 className="text-xl font-bold mb-4 text-center">
            Confirm Spec Changes
          </h2>
          <div className="overflow-x-auto overflow-y-auto max-h-96 mb-4 border border-gray-300 rounded">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-xs">
                    Header
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">
                    Type
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">
                    Location
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">
                    Left Value
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">
                    Right Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.collection_spec_id || idx}>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {row.header}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {row.measurement_name}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {row.location}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {row.left_value}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {row.right_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default SpecsConfirmationModal;
