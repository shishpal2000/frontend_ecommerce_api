"use client";

import LayoutComponents from "@/app/layoutComponents";
import { useEffect, useState } from "react";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";

export interface TypeItem {
  needle_id?: string;
  overlock_id?: string;
  efficiency_type_id?: string;
  name: string;
}

export interface GetNeedleTypesResponse {
  permission: {
    can_edit: boolean;
  };
  needle_types: TypeItem[];
}

export interface GetOverlockTypesResponse {
  permission: {
    can_edit: boolean;
  };
  overlock_types: TypeItem[];
}

export interface GetEfficiencyTypesResponse {
  permission: {
    can_edit: boolean;
  };
  efficiency_types: TypeItem[];
}

const TypeManagementPage = () => {
  // States for each type of data
  const [needleTypes, setNeedleTypes] = useState<TypeItem[]>([]);
  const [overlockTypes, setOverlockTypes] = useState<TypeItem[]>([]);
  const [efficiencyTypes, setEfficiencyTypes] = useState<TypeItem[]>([]);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // States for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "needle" | "overlock" | "efficiency"
  >("needle");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<TypeItem>({ name: "" });

  const [permissions, setPermissions] = useState({
    needle: false,
    overlock: false,
    efficiency: false,
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState<{
    needle: boolean;
    overlock: boolean;
    efficiency: boolean;
  }>({
    needle: false,
    overlock: false,
    efficiency: false,
  });

  const [error, setError] = useState<{
    needle: string | null;
    overlock: string | null;
    efficiency: string | null;
  }>({
    needle: null,
    overlock: null,
    efficiency: null,
  });

  const { getApi, postApi, deleteApi } = useGeneralApiCall();

  // Helper function to get the correct ID field based on type
  const getItemId = (
    item: TypeItem,
    type: "needle" | "overlock" | "efficiency"
  ): string => {
    return type === "efficiency"
      ? (item[`efficiency_type_id`] as string)
      : (item[`${type}_id`] as string);
    // return (item[`${type}_id`] as string) || "";
  };

  // Fetch all types on page load
  useEffect(() => {
    fetchNeedleTypes();
    fetchOverlockTypes();
    fetchEfficiencyTypes();
  }, []);

  // Fetch functions for each type
  const fetchNeedleTypes = async () => {
    setIsLoading((prev) => ({ ...prev, needle: true }));
    setError((prev) => ({ ...prev, needle: null }));

    try {
      const response = await getApi<GetNeedleTypesResponse>(
        "/proto/needle-type/list/"
      );
      if (response.status === 200) {
        setNeedleTypes(response.data.needle_types || []);
        setPermissions((prev) => ({
          ...prev,
          needle: response.data.permission?.can_edit || false,
        }));
      }
    } catch (error) {
      console.error("Error fetching needle types:", error);
      setError((prev) => ({
        ...prev,
        needle:
          error instanceof Error
            ? error.message
            : "Failed to load needle types",
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, needle: false }));
    }
  };

  const fetchOverlockTypes = async () => {
    setIsLoading((prev) => ({ ...prev, overlock: true }));
    setError((prev) => ({ ...prev, overlock: null }));

    try {
      const response = await getApi<GetOverlockTypesResponse>(
        "/proto/overlock-type/list/"
      );
      if (response.status === 200) {
        setOverlockTypes(response.data.overlock_types || []);
        setPermissions((prev) => ({
          ...prev,
          overlock: response.data.permission?.can_edit || false,
        }));
      }
    } catch (error) {
      console.error("Error fetching overlock types:", error);
      setError((prev) => ({
        ...prev,
        overlock:
          error instanceof Error
            ? error.message
            : "Failed to load overlock types",
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, overlock: false }));
    }
  };

  const fetchEfficiencyTypes = async () => {
    setIsLoading((prev) => ({ ...prev, efficiency: true }));
    setError((prev) => ({ ...prev, efficiency: null }));

    try {
      const response = await getApi<GetEfficiencyTypesResponse>(
        "/proto/efficiency-type/list/"
      );
      if (response.status === 200) {
        setEfficiencyTypes(response.data.efficiency_types || []);
        setPermissions((prev) => ({
          ...prev,
          efficiency: response.data.permission?.can_edit || false,
        }));
      }
    } catch (error) {
      console.error("Error fetching efficiency types:", error);
      setError((prev) => ({
        ...prev,
        efficiency:
          error instanceof Error
            ? error.message
            : "Failed to load efficiency types",
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, efficiency: false }));
    }
  };

  // Handle opening the modal for adding a new item
  const handleAddNew = (type: "needle" | "overlock" | "efficiency") => {
    setModalType(type);
    setIsEditMode(false);
    setCurrentItem({ name: "" });
    setIsModalOpen(true);
  };

  // Handle opening the modal for editing an existing item
  const handleEdit = (
    type: "needle" | "overlock" | "efficiency",
    item: TypeItem
  ) => {
    setModalType(type);
    setIsEditMode(true);
    setCurrentItem({ ...item });
    setIsModalOpen(true);
  };

  // Handle save (create or update) of an item
  const handleSave = async () => {
    if (!currentItem.name) {
      setFeedback({ type: "error", message: "Name is required" });
      return;
    }
    setModalLoading(true);
    setFeedback(null);

    try {
      let response;
      const idField = `${modalType}_id`;
      const itemId = currentItem[idField as keyof TypeItem];

      if (isEditMode && itemId) {
        // Update existing item
        response = await postApi(`/proto/${modalType}-type/update/${itemId}/`, {
          name: currentItem.name,
        });
      } else {
        // Create new item
        response = await postApi(`/proto/${modalType}-type/create/`, {
          name: currentItem.name,
        });
      }

      if (response.status === 200 || response.status === 201) {
        setFeedback({
          type: "success",
          message: `Type ${isEditMode ? "updated" : "created"} successfully!`,
        });
        // Refresh the appropriate list
        if (modalType === "needle") fetchNeedleTypes();
        else if (modalType === "overlock") fetchOverlockTypes();
        else fetchEfficiencyTypes();

        // Close the modal
        setIsModalOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: response?.message || "Failed to save item",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save item",
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Render a table for a specific type
  const renderTable = (
    type: "needle" | "overlock" | "efficiency",
    items: TypeItem[],
    isLoading: boolean,
    error: string | null
  ) => {
    const title =
      type === "needle"
        ? "Needle Types"
        : type === "overlock"
        ? "Overlock Types"
        : "Efficiency Types";

    const canEdit = permissions[type];

    return (
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
          {canEdit && (
            <button
              onClick={() => handleAddNew(type)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
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
              Create New
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-100 p-3 rounded-md text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={
                type === "needle"
                  ? fetchNeedleTypes
                  : type === "overlock"
                  ? fetchOverlockTypes
                  : fetchEfficiencyTypes
              }
              className="text-red-600 hover:text-red-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="grid grid-cols-2">
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(items) && items.length === 0 ? (
                  <tr className="grid grid-cols-2">
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center col-span-2 text-gray-500"
                    >
                      No items found
                    </td>
                  </tr>
                ) : Array.isArray(items) ? (
                  items.map((item) => (
                    <tr
                      key={getItemId(item, type)}
                      className="hover:bg-gray-50 grid grid-cols-2"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          {canEdit ? (
                            <button
                              onClick={() => handleEdit(type, item)}
                              className="text-white cursor-pointer bg-sky-600 hover:bg-sky-900 px-4 py-2 rounded"
                            >
                              Edit
                            </button>
                          ) : (
                            <div className="text-gray-500">
                              You do not have permission to edit this type
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      Invalid data format
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Modal for adding/editing items
  const renderModal = () => {
    if (!isModalOpen) return null;

    const title = `${isEditMode ? "Edit" : "Create"} ${
      modalType === "needle"
        ? "Needle Type"
        : modalType === "overlock"
        ? "Overlock Type"
        : "Efficiency Type"
    }`;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-30"></div>
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full z-10">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={currentItem.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCurrentItem({
                      ...currentItem,
                      name,
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={modalLoading}
                className="px-4 py-2 bg-blue-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-600 cursor-pointer"
              >
                {isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Type Management</h1>

      {feedback && (
        <div
          className={`mb-6 px-4 py-3 rounded ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {feedback.message}
          <button
            className="ml-4 text-xs underline"
            onClick={() => setFeedback(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {renderTable("needle", needleTypes, isLoading.needle, error.needle)}
      {renderTable(
        "overlock",
        overlockTypes,
        isLoading.overlock,
        error.overlock
      )}
      {renderTable(
        "efficiency",
        efficiencyTypes,
        isLoading.efficiency,
        error.efficiency
      )}

      {renderModal()}
    </div>
  );
};

export default LayoutComponents(TypeManagementPage);
