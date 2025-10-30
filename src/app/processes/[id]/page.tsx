"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import { useGeneralApiCall } from "../../../services/useGeneralApiCall";
import LayoutComponents from "@/app/layoutComponents";

type Field = {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  units: string[];
};

type Process = {
  processes: [{ process_id: string; process_name: string; fields: Field[] }];
};

function ProcessDetailPage() {
  const router = useRouter();
  const params = useParams();
  const processId = params.id as string;

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

  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(true);
  const [editFields, setEditFields] = useState<Field[]>([]);
  const [showProcessNameModal, setShowProcessNameModal] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editFieldInput, setEditFieldInput] = useState("");
  const [editFieldType, setEditFieldType] = useState("Text");
  const [editFieldRequired, setEditFieldRequired] = useState(false);
  const [editFieldUnit, setEditFieldUnit] = useState<string[]>([]);
  const editFieldUnits = editFieldUnit;
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const { getApi, postApi, deleteApi } = useGeneralApiCall();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Function to fetch available fields from API
  const fetchAvailableFields = async () => {
    setIsLoadingFields(true);
    try {
      interface ApiField {
        field_id: string;
        name: string;
        data_type: string;
        units: string[];
      }

      const response = await getApi<{
        message: string;
        error_status: boolean;
        status: number;
        data: ApiField[];
      }>("/process/list-field/");

      if (response && !response.error_status && Array.isArray(response.data)) {
        // Map the response data to match our Field type
        const mappedFields: Field[] = response.data.map((field: ApiField) => ({
          field_id: field.field_id,
          field_name: field.name, // Map 'name' to 'field_name'
          data_type: field.data_type,
          is_required: false, // Since it's not in the response, default to false
          units: field.units,
        }));
        setAvailableFields(mappedFields);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
      // toast.error("Failed to load available fields");
    } finally {
      setIsLoadingFields(false);
    }
  };
  const fetchProcess = async () => {
    if (!processId) return;

    try {
      const response = await getApi<Process>(
        `/process/process-with-field/${processId}/`
      );
      console.log(response.data);
      if (response && !response.error_status) {
        setProcess(response.data);
        setEditFields([...response.data.processes[0].fields]);
      }
    } catch (error) {
      console.error("Error fetching process:", error);
      // toast.error("Failed to load process details");
    } finally {
      setLoading(false);
    }
  };
  // Load process data from API
  useEffect(() => {
    fetchProcess();
  }, [processId, getApi]);

const handleAddField = async () => {
    try {
      if (selectedFieldIds.length === 0) {
        // toast.warn("Please select at least one field");
        return;
      }

      // Filter out fields that are already added
      const newFields = selectedFieldIds
        .map((id) => availableFields.find((field) => field.field_id === id))
        .filter(
          (field): field is Field =>
            field !== undefined &&
            !editFields.some((ef) => ef.field_id === field.field_id)
        );

      if (newFields.length === 0) {
        // toast.warn("Selected fields are already added");
        return;
      }

      // Create the fields array with the correct format
      const fields = newFields.map((field) => ({
        field_id: field.field_id,
        is_required: false,
      }));

      const response = await postApi(
        `/process/process-add-field/${processId}/`,
        { fields }
      );

      if (response && !response.error_status) {
        // Update local state after successful API call
        setEditFields((prev) => [...prev, ...newFields]);
        setSelectedFieldIds([]);
        setShowAddModal(false);
        // toast.success(
        //   `${newFields.length} field${
        //     newFields.length > 1 ? "s" : ""
        //   } added successfully`
        // );
      } else {
        throw new Error(response?.message || "Failed to add fields");
      }
    } catch (error) {
      console.error("Error adding fields:", error);
      // toast.error(
      //   error instanceof Error ? error.message : "Failed to add fields"
      // );
    }
  };

  const handleEditUnitToggle = (unit: string) => {
    setEditFieldUnit((prev) => {
      if (prev.includes(unit)) {
        return prev.filter((u) => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };

  const handleSaveFieldEdit = () => {
    if (editingField && editFieldInput.trim()) {
      setEditFields((prev) =>
        prev.map((field) =>
          field.field_id === editingField.field_id
            ? {
                field_id: editingField.field_id,
                field_name: editFieldInput.trim(),
                data_type: editFieldType,
                is_required: editFieldRequired,
                units: editFieldUnit,
              }
            : field
        )
      );
      setShowEditModal(false);
      setEditingField(null);
      setEditFieldInput("");
      setEditFieldType("Text");
      setEditFieldRequired(false);
      setEditFieldUnit([]);
    }
  };

  const handleCancelFieldEdit = () => {
    setShowEditModal(false);
    setEditingField(null);
    setEditFieldInput("");
    setEditFieldType("Text");
    setEditFieldRequired(false);
    setEditFieldUnit([]);
  };

  const handleUpdateProcessName = async () => {
    try {
      const response = await postApi(
        `/process/update-process-name/${processId}/`,
        {
          name: newProcessName,
        }
      );

      if (response && !response.error_status) {
        fetchProcess();
        setShowProcessNameModal(false);
        setNewProcessName("");
        setFeedback({
          type: "success",
          message: "Process name updated successfully!",
        });
      } else {
        setFeedback({
          type: "error",
          message: response?.message || "Failed to update process name",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update process name",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading process details...</div>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="w-full mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
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
          <h1 className="font-bold text-lg">Process Not Found</h1>
        </div>

        <div className="bg-red-50 border border-red-200  p-6">
          <div className="text-center">
            <svg
              className="mx-auto w-12 h-12 text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Process Not Found
            </h3>
            <p className="text-red-600 mb-4">
              The requested process could not be found.
            </p>
            <button
              onClick={() => router.push("/pages/processes")}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2  transition-colors"
            >
              Go to Process List
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center gap-3 mb-6">
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
        <h1 className="font-bold text-lg">Process Details</h1>
      </div>

      {/* Process Information Card */}
      <div className="bg-white   p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[60px] uppercase font-bolder text-gray-800">
              {process.processes[0].process_name}
            </h1>
            <button
              onClick={() => {
                setNewProcessName(process.processes[0].process_name);
                setShowProcessNameModal(true);
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Name
            </button>
          </div>
        </div>

        {/* Process Name Update Modal */}
        {showProcessNameModal && (
          <div className="fixed inset-0 bg-gray-300/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Update Process Name
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="processName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Process Name *
                  </label>
                  <input
                    id="processName"
                    type="text"
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter process name"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowProcessNameModal(false);
                    setNewProcessName("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProcessName}
                  disabled={
                    !newProcessName.trim() ||
                    newProcessName === process.processes[0].process_name
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Update Name
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Process Metadata */}
      </div>

      {/* Process Fields Section */}
      <div className="bg-white border  p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Process Fields
          </h3>
        </div>

        {/* Fields Display/Edit */}
        <div className="space-y-4">
          {/* Current Fields Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Configured Fields
              </label>
              {isEditing && (
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    fetchAvailableFields();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded transition-colors"
                >
                  + Add Field
                </button>
              )}
            </div>
            {(isEditing ? editFields : process.processes[0].fields || [])
              .length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                <span className="text-gray-500 text-sm italic">
                  No fields configured
                </span>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(isEditing
                      ? editFields
                      : process.processes[0].fields || []
                    ).map((field, index) => (
                      <tr
                        key={index}
                        className={
                          isEditing ? "hover:bg-blue-50" : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {field.field_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {field.data_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {field.units && field.units.length > 0 ? (
                              field.units.map((unit, unitIndex) => (
                                <span
                                  key={unitIndex}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {unit}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                No units
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              field.is_required
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {field.is_required ? "Required" : "Optional"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}

      {/* Edit Field Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-800/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Field</h3>

            <div className="space-y-4">
              {/* Field Name */}
              <div>
                <label
                  htmlFor="editFieldName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Field Name *
                </label>
                <input
                  id="editFieldName"
                  type="text"
                  value={editFieldInput}
                  onChange={(e) => setEditFieldInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter field name"
                />
              </div>

              {/* Field Type */}
              <div>
                <label
                  htmlFor="editFieldType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Field Type *
                </label>
                <select
                  id="editFieldType"
                  value={editFieldType}
                  onChange={(e) => setEditFieldType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>
              </div>

              {/* Required Field */}
              <div className="flex items-center">
                <input
                  id="editFieldRequired"
                  type="checkbox"
                  checked={editFieldRequired}
                  onChange={(e) => setEditFieldRequired(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editFieldRequired"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Required Field
                </label>
              </div>

              {/* Units */}
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
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelFieldEdit}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFieldEdit}
                disabled={!editFieldInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                qrqereww
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-800/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Add Field to Process
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFieldIds([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
              {isLoadingFields ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    Loading available fields...
                  </div>
                </div>
              ) : availableFields.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No fields available</div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Fields <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {availableFields.map((field) => {
                      const isAlreadyAdded = editFields.some(
                        (ef) => ef.field_id === field.field_id
                      );
                      return (
                        <div
                          key={field.field_id}
                          className={`flex items-start p-4 border-b last:border-b-0 ${
                            isAlreadyAdded ? "bg-gray-50" : "hover:bg-gray-50"
                          } transition-colors`}
                        >
                          <div className="flex-shrink-0 pt-1">
                            {isAlreadyAdded ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100">
                                <svg
                                  className="w-4 h-4 text-green-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </span>
                            ) : (
                              <>
                                <div>
                                  <input
                                    type="checkbox"
                                    value={field.field_id}
                                    checked={selectedFieldIds.includes(
                                      field.field_id
                                    )}
                                    onChange={(e) => {
                                      const fieldId = e.target.value;
                                      setSelectedFieldIds((prev) =>
                                        e.target.checked
                                          ? [...prev, fieldId]
                                          : prev.filter((id) => id !== fieldId)
                                      );
                                    }}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p
                                  className={`text-sm font-medium ${
                                    isAlreadyAdded
                                      ? "text-gray-500"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {field.field_name}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Type: {field.data_type}
                                </p>
                              </div>
                              {field.is_required && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                            </div>
                            {field.units.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {field.units.map((unit, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                                  >
                                    {unit}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFieldIds([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddField}
                disabled={selectedFieldIds.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded transition-colors"
              >
                Add Selected Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default LayoutComponents(ProcessDetailPage);
