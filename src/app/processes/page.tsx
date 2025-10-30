/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import "react-toastify/dist/ReactToastify.css";
import LayoutComponents from "../layoutComponents";

interface ApiField {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  units: string[];
}

interface ApiProcess {
  process_id: string;
  process_name: string;
  fields: ApiField[];
}

interface ApiResponse {
  message: string;
  error_status: boolean;
  status: number;
  data: {
    permissions: {
      can_add_new_process: boolean;
      can_edit_process: boolean;
      can_delete_process: boolean;
    };
    processes: ApiProcess[];
  };
}

// Field type options
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
];
type Field = {
  name: string;
  type: string;
  required: boolean;
  units: string[];
};

type Process = {
  id: string; // This will store process_id from API
  name: string;
  fields: Field[]; // Not provided by API but needed for UI
  createdAt: Date; // Not provided by API but needed for UI
};

function ProcessesPage() {
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
  const router = useRouter();
  const [editFieldUnits, setEditFieldUnits] = useState<string[]>([]);
  const [processPermissions, setProcessPermissions] = useState<{
    can_add_new_process: boolean;
    can_edit_process: boolean;
    can_delete_process: boolean;
  }>({
    can_add_new_process: false,
    can_edit_process: false,
    can_delete_process: false,
  });
  const [processes, setProcesses] = useState<Process[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [newField, setNewField] = useState<Field>({
    name: "",
    type: "text",
    required: false,
    units: [],
  });
  const { getApi, postApi } = useGeneralApiCall();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleEditUnitToggle = (unit: string) => {
    setEditFieldUnits((prev) => {
      if (prev.includes(unit)) {
        return prev.filter((u) => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };
  const fetchData = async () => {
    try {
      // Fetch fields
      const fieldsResponse = (await getApi(
        "process/process-field-list/"
      )) as ApiResponse;

      if (
        fieldsResponse &&
        !fieldsResponse.error_status &&
        Array.isArray(fieldsResponse.data.processes)
      ) {
        setProcessPermissions(fieldsResponse.data.permissions);

        setProcesses(
          fieldsResponse.data.processes.map((process: ApiProcess) => ({
            id: process.process_id,
            name: process.process_name,
            fields: process.fields.map((field: ApiField) => ({
              id: field.field_id,
              name: field.field_name,
              type: field.data_type,
              required: field.is_required,
              units: field.units,
            })),
            createdAt: new Date(),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load data. Please try again.",
      });
    }
  };
  // Load processes from API on component mount
  useEffect(() => {
    fetchData();
  }, [getApi]);

  const handleAddProcess = async () => {
    if (
      newProcessName.trim() &&
      !processes.some(
        (p) => p.name.toLowerCase() === newProcessName.trim().toLowerCase()
      )
    ) {
      try {
        const response = await postApi("/process/create/", {
          name: newProcessName.trim(),
        });

        if (response && typeof response === "object") {
          // Create new process with fallback ID if response doesn't contain one
          fetchData();
          setNewProcessName("");
          setShowAddForm(false);
          setFeedback({
            type: "success",
            message: response.message || "Process created successfully!",
          });
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error: any) {
        console.error("Error creating process:", error);
        setFeedback({
          type: "error",
          message:
            error.message || "Failed to create process. Please try again.",
        });
      }
    } else if (
      processes.some(
        (p) => p.name.toLowerCase() === newProcessName.trim().toLowerCase()
      )
    ) {
      setFeedback({
        type: "error",
        message: "A process with this name already exists!",
      });
    } else {
      setFeedback({
        type: "error",
        message: "Please enter a valid process name!",
      });
    }
  };

  return (
    <div className="w-full mx-auto px-4 py-6">
      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mb-6 px-4 py-3 rounded ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          } flex items-center justify-between`}
        >
          <span>{feedback.message}</span>
          <button
            className="ml-4 text-xs underline"
            onClick={() => setFeedback(null)}
          >
            Dismiss
          </button>
        </div>
      )}
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
          <h1 className="font-bold text-lg">Process Management</h1>
        </div>
        <button
          onClick={() => router.push("/fields")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          View All Fields
        </button>
      </div>

      {/* Add Process Section */}
      {processPermissions.can_add_new_process && (
        <div className="bg-white border  p-6 mb-6">
          {
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Add New Process
              </h2>
              {
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2  transition-colors"
                >
                  {showAddForm ? "Cancel" : "+ Add Process"}
                </button>
              }
            </div>
          }

          {/* Add Process Form */}
          {showAddForm && (
            <div className="border-t pt-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Process Name
                  </label>
                  <input
                    type="text"
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    placeholder="Enter process name (e.g., Heat Setting, Washing)"
                    className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    onKeyPress={(e) => e.key === "Enter" && handleAddProcess()}
                  />
                </div>
                <button
                  onClick={handleAddProcess}
                  disabled={!newProcessName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processes List */}
      <div className="bg-white border  p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Processes</h2>
        </div>

        {/* Empty State */}
        {processes.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300  bg-gray-50">
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
              No processes found. Add a process to get started.
            </div>
          </div>
        )}

        {/* Processes Table */}
        {processes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse ">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-black-700 border border-black-300">
                    Process Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-black-700 border border-black-300">
                    Field Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-black-700 border border-black-300">
                    Field Data Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-black-700 border border-black-300">
                    Field Units
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-black-700 border border-black-300">
                    Requied
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-black-700 border border-black-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => {
                  if (
                    !Array.isArray(process.fields) ||
                    process.fields.length === 0
                  ) {
                    return (
                      <>
                        <tr
                          key={`${process.id}-empty`}
                          className="hover:bg-black-50"
                        >
                          <td className="py-3 px-4 border border-black-300">
                            <div className="font-medium text-black-900">
                              {process.name}
                            </div>
                          </td>
                          <td
                            colSpan={4}
                            className="py-3 px-4 border border-black-300"
                          >
                            <div className="text-black-500 text-sm italic">
                              No fields configured - Click to add fields
                            </div>
                          </td>
                          <td className="py-3 px-4 border border-black-300 text-center">
                            <div className="flex justify-center gap-2">
                              {processPermissions.can_edit_process ? (
                                <button
                                  onClick={() =>
                                    router.push(`/processes/${process.id}`)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2 py-1 rounded transition-colors"
                                >
                                  Edit
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs">
                                  NO Permission
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={6} className="py-9  bg-white-50"></td>
                        </tr>
                      </>
                    );
                  }

                  return (
                    <>
                      {process.fields.map((field: any, index: number) => (
                        <tr
                          key={`${process.id}-${field.id || index}`}
                          className="hover:bg-black-50"
                        >
                          {index === 0 ? (
                            <td
                              rowSpan={process.fields.length}
                              className="py-3 px-4 border border-black-300 font-medium text-black-900"
                            >
                              {process.name}
                            </td>
                          ) : null}
                          <td className="py-3 px-4 border border-black-300">
                            {field.name}
                          </td>
                          <td className="py-3 px-4 border border-black-300">
                            {field.type || field.data_type}
                          </td>
                          <td className="py-3 px-4 border border-black-300">
                            {field.units?.length > 0
                              ? field.units.join(", ")
                              : "No units"}
                          </td>
                          <td className="py-3 px-4 border border-black-300">
                            {field.required ? "Yes" : "No"}
                          </td>
                          {index === 0 ? (
                            <td
                              rowSpan={process.fields.length}
                              className="py-3 px-4 border border-black-300 text-center"
                            >
                              <div className="flex justify-center gap-2">
                                {processPermissions.can_edit_process ? (
                                  <button
                                    onClick={() =>
                                      router.push(`/processes/${process.id}`)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2 py-1 rounded transition-colors"
                                  >
                                    Edit
                                  </button>
                                ) : (
                                  <span className="text-gray-500 text-xs">
                                    NO Permission
                                  </span>
                                )}
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      ))}

                      {/* empty row after full process */}
                      <tr>
                        <td colSpan={6} className="py-9  bg-white-50"></td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Field Modal */}
      {showFieldModal && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black-900">
                Add Field to {selectedProcess.name}
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
                  value={newField.type}
                  onChange={(e) =>
                    setNewField((prev) => ({ ...prev, type: e.target.value }))
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newField.required}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="required" className="text-sm text-gray-700">
                  Required field
                </label>
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
    </div>
  );

  async function handleAddField() {
    if (!selectedProcess || !newField.name.trim()) return;

    try {
      // Add the field
      const response = await postApi(`/process/create-field/`, {
        name: newField.name.trim(),
        data_type: newField.type,
        units: editFieldUnits,
        process_id: selectedProcess.id,
      });

      if (!response.error_status) {
        // Fetch updated field list
        const fieldsResponse = (await getApi(
          "/process/process-field-list/"
        )) as ApiResponse;
        if (
          fieldsResponse &&
          !fieldsResponse.error_status &&
          Array.isArray(fieldsResponse.data)
        ) {
          console.log(fieldsResponse);
          const allFields = fieldsResponse.data.flatMap((process: ApiProcess) =>
            process.fields.map(
              (field: ApiField) =>
                ({
                  name: field.field_name,
                  type: field.data_type,
                  required: field.is_required,
                  units: field.units,
                } as Field)
            )
          );
          setFields(allFields);
          // Update processes with their fields
          setProcesses((prev) =>
            prev.map((process) => {
              const processData = fieldsResponse.data.processes.find(
                (p: ApiProcess) => p.process_id === process.id
              );
              return {
                ...process,
                fields:
                  processData?.fields.map((field: ApiField) => ({
                    id: field.field_id,
                    name: field.field_name,
                    type: field.data_type,
                    required: field.is_required,
                    units: field.units,
                  })) || [],
              };
            })
          );
        }

        setFeedback({ type: "success", message: "Field added successfully!" });
        setShowFieldModal(false);
        setNewField({
          name: "",
          type: "text",
          required: false,
          units: [],
        });
        setEditFieldUnits([]);
      } else {
        setFeedback({
          type: "error",
          message: response.message || "Failed to add field",
        });
      }
    } catch (error: any) {
      console.error("Error adding field:", error);
      setFeedback({
        type: "error",
        message: error.message || "Failed to add field. Please try again.",
      });
    }
  }
}

export default LayoutComponents(ProcessesPage);
