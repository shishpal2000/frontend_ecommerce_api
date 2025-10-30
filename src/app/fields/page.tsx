/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGeneralApiCall } from "../../services/useGeneralApiCall";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LayoutComponents from "../layoutComponents";

// API Response Types
interface ApiResponse<T> {
  message: string;
  error_status: boolean;
  status: number;
  data: T;
}

interface FieldTypeData {
  key: string;
  value: string;
}

// Field Related Types
interface Field {
  field_id: string;
  name: string;
  isrequired: boolean;
  data_type: string;
  units: string[];
  process_id: string;
  process_name?: string;
}

interface FieldType {
  value: string;
  label: string;
}

interface NewField {
  name: string;
  isrequired: boolean;
  data_type: string;
  units: string[];
}

// Unit Option Type
type UnitOption = string;

function FieldsPage() {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [showFieldModal, setShowFieldModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editFieldUnits, setEditFieldUnits] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newField, setNewField] = useState<NewField>({
    name: "",
    data_type: "text",
    isrequired: false,
    units: [],
  });
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const { getApi, postApi } = useGeneralApiCall();

  // Fetch field types from API
  useEffect(() => {
    const fetchFieldTypes = async () => {
      try {
        const response = await getApi<ApiResponse<FieldTypeData[]>>(
          "/process/data-type-list/"
        );
        if (
          response &&
          !response.error_status &&
          Array.isArray(response.data)
        ) {
          const formattedTypes: FieldType[] = response.data.map((type) => ({
            value: type.key,
            label: type.value,
          }));
          setFieldTypes(formattedTypes);
          // Set default data_type to first available type if no type is selected
          if (newField.data_type === "text" && formattedTypes.length > 0) {
            setNewField((prev) => ({
              ...prev,
              data_type: formattedTypes[0].value,
            }));
          }
        } else {
          throw new Error(response?.message || "Failed to fetch field types");
        }
      } catch (error: any) {
        console.error("Error fetching field types:", error);
        toast.error("Failed to load field types. Please try again.");
      }
    };

    fetchFieldTypes();
  }, [getApi, newField.data_type]);

  // Define all available units
  const unitOptions = [
    // Currency
    "$",
    "€",
    "£",
    "₹",
    // Length/Dimension
    "mm",
    "cm",
    "m",
    "inch",
    "ft",
    // Weight
    "g",
    "kg",
    "lb",
    "oz",
    // Quantity
    "pcs",
    "units",
    "pairs",
    "dozen",
    // Temperature
    "°C",
    "°F",
    "K",
    // Time
    "sec",
    "min",
    "hr",
    "days",
    // Other
    "%",
    "rpm",
    "gsm",
  ];

  const handleEditUnitToggle = (unit: string): void => {
    setEditFieldUnits((prev) => {
      if (prev.includes(unit)) {
        return prev.filter((u) => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };

  // Load fields from API on component mount
  useEffect(() => {
    const fetchFields = async (): Promise<void> => {
      try {
        const response = await getApi<ApiResponse<Field[]>>(
          "/process/list-field/"
        );
        if (
          response &&
          !response.error_status &&
          Array.isArray(response.data)
        ) {
          setFields(response.data);
        } else {
          throw new Error(response?.message || "Invalid response format");
        }
      } catch (error: unknown) {
        console.error("Error fetching fields:", error);
        toast.error("Failed to load fields. Please try again.");
      }
    };

    fetchFields();
  }, [getApi]);

  const handleAddField = async (): Promise<void> => {
    if (!newField.name.trim()) return;

    try {
      const response = await postApi<ApiResponse<Field>>(
        `/process/create-field/`,
        {
          name: newField.name.trim(),
          data_type: newField.data_type,
          units: editFieldUnits,
        }
      );

      if (!response.error_status) {
        // Refresh the field list
        const fieldsResponse = await getApi<ApiResponse<Field[]>>(
          "/process/list-field/"
        );
        if (
          fieldsResponse &&
          !fieldsResponse.error_status &&
          Array.isArray(fieldsResponse.data)
        ) {
          setFields(fieldsResponse.data);
        }

        toast.success("Field added successfully!");
        setShowFieldModal(false);
        setNewField({
          name: "",
          data_type: "text",
          units: [],
          isrequired: false,
        });
        setEditFieldUnits([]);
      } else {
        throw new Error(response.message || "Failed to add field");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add field. Please try again.";
      console.error("Error adding field:", error);
      toast.error(errorMessage);
    }
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setEditFieldUnits(field.units || []);
    setShowEditModal(true);
  };

  const handleUpdateField = async (): Promise<void> => {
    if (!editingField) return;

    try {
      const response = await postApi<ApiResponse<Field>>(
        `/process/update-field/${editingField.field_id}/`,
        {
          field_id: editingField.field_id,
          name: editingField.name.trim(),
          data_type: editingField.data_type,
          units: editFieldUnits,
        }
      );

      if (!response.error_status) {
        // Update the fields list with the updated field
        setFields((prev) =>
          prev.map((field) =>
            field.field_id === editingField.field_id
              ? {
                  ...field,
                  name: editingField.name,
                  data_type: editingField.data_type,
                  units: editFieldUnits,
                }
              : field
          )
        );

        toast.success("Field updated successfully!");
        setShowEditModal(false);
        setEditingField(null);
        setEditFieldUnits([]);
      } else {
        throw new Error(response.message || "Failed to update field");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update field. Please try again.";
      console.error("Error updating field:", error);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full mx-auto px-4 py-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
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
          <h1 className="font-bold text-lg">Fields Management</h1>
        </div>
        <button
          onClick={() => setShowFieldModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Field
        </button>
      </div>

      {/* Fields List */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Fields</h2>
          <span className="text-sm text-gray-500">
            {fields.length} field{fields.length !== 1 ? "s" : ""} total
          </span>
        </div>

        {/* Empty State */}
        {fields.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-gray-600 text-sm">
              <svg
                className="mx-auto w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              No fields found. Add a field to get started.
            </div>
          </div>
        )}

        {/* Fields Table */}
        {fields.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 border border-gray-300">
                    Field Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 border border-gray-300">
                    Data Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 border border-gray-300">
                    Units
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 border border-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.field_id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">
                      <div className="font-medium text-gray-900">
                        {field.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <div className="text-gray-700 capitalize">
                        {field.data_type}
                      </div>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {field.units?.map((unit, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {unit}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditField(field)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2 py-1 rounded transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Field
              </h3>
              <button
                onClick={() => setShowFieldModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) =>
                    setNewField((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter field name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={newField.data_type}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      data_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {unitOptions.map((unit) => (
                    <label key={unit} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFieldUnits.includes(unit)}
                        onChange={() => handleEditUnitToggle(unit)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{unit}</span>
                    </label>
                  ))}
                </div>

                {/* Display selected units as chips */}
                {editFieldUnits.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Selected units:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {editFieldUnits.map((unit) => (
                        <span
                          key={unit}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  disabled={!newField.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {showEditModal && editingField && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Field
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingField(null);
                  setEditFieldUnits([]);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={editingField.name}
                  onChange={(e) =>
                    setEditingField((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter field name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={editingField.data_type}
                  onChange={(e) =>
                    setEditingField((prev) =>
                      prev ? { ...prev, data_type: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {unitOptions.map((unit) => (
                    <label key={unit} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFieldUnits.includes(unit)}
                        onChange={() => handleEditUnitToggle(unit)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{unit}</span>
                    </label>
                  ))}
                </div>

                {/* Display selected units as chips */}
                {editFieldUnits.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Selected units:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {editFieldUnits.map((unit) => (
                        <span
                          key={unit}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {unit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingField(null);
                    setEditFieldUnits([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateField}
                  disabled={!editingField.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  Update Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayoutComponents(FieldsPage);
