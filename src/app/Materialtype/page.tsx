/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LayoutComponents from "../layoutComponents";
interface ApiResponse {
  message: string;
  error_status: boolean;
  status: number;
  data: Record<string, never>;
}

interface MaterialType {
  raw_material_category_id: number;
  name: string;
}

interface GetMaterialListResponse {
  permission: {
    can_create_raw_material_category: boolean;
  };
  raw_material_categories: MaterialType[];
}

function MaterialTypePage() {
  const { getApi, postApi } = useGeneralApiCall();
  const router = useRouter();

  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchMaterialTypes = useCallback(async () => {
    try {
      const response: any = await getApi("raw-material/list-categories/");
      if (!response.error_status) {
        setMaterialTypes(response.data.raw_material_categories);
      } else {
        setFeedback({
          type: "error",
          message: response.message || "Failed to fetch material types",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching material types",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getApi]);

  useEffect(() => {
    fetchMaterialTypes();
  }, [fetchMaterialTypes]);

  const [openMaterialTypeDialog, setOpenMaterialTypeDialog] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState("");
  const [editMode, setEditMode] = useState<{ id: number | null }>({
    id: null,
  });

  // Material Type handlers
  const handleAddMaterialType = async () => {
    try {
      if (!newMaterialType.trim()) {
        setFeedback({
          type: "error",
          message: "Material type name cannot be empty",
        });
        return;
      }

      if (editMode.id !== null) {
        // Handle edit case
        const response = await postApi<ApiResponse>(
          `raw-material/update-category/${editMode.id}/`,
          {
            name: newMaterialType,
          }
        );
        if (response?.status === 200 || response.error_status) {
          setFeedback({ type: "success", message: response.message });
          fetchMaterialTypes();
          setEditMode({ id: null });
        }
      } else {
        // Handle add case
        const response = await postApi<ApiResponse>(
          "raw-material/create-category/",
          {
            name: newMaterialType,
          }
        );

        if (response?.status === 201 && !response.error_status) {
          // Add the new material type to the list
          fetchMaterialTypes();
          setFeedback({ type: "success", message: response.message });
        } else {
          setFeedback({
            type: "error",
            message: response.message || "Failed to create material type",
          });
          return;
        }
      }
      setNewMaterialType("");
      setOpenMaterialTypeDialog(false);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while processing your request",
      });
    }
  };

  const handleEditMaterialType = (materialType: MaterialType) => {
    setNewMaterialType(materialType.name);
    setEditMode({ id: materialType.raw_material_category_id });
    setOpenMaterialTypeDialog(true);
  };

  return (
    <div className="p-8 pt-16 ">
      <button
        onClick={() => router.back()}
        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors flex items-center gap-2"
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
      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mb-6 px-4 py-3 mt-4 rounded ${
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
      {/* Material Types Table */}
      <div className="flex flex-col items-center">
        <div className="mb-8 w-full mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Material Categories</h2>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-lg"
              onClick={() => {
                console.log("Opening modal...");
                setEditMode({ id: null });
                setNewMaterialType("");
                setOpenMaterialTypeDialog(true);
                console.log("State updated, modal should open");
              }}
            >
              Add Material Categories
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-[15px] font-medium text-gray-500 uppercase tracking-wider">
                    Material Categories
                  </th>
                  <th className="px-8 py-4 text-right text-[15px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialTypes?.map((type) => (
                  <tr
                    key={type.raw_material_category_id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-8 py-5 whitespace-nowrap text-mx text-gray-900">
                      {type.name}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="bg-gray-100 hover:bg-blue-100 text-blue-600 hover:text-blue-900 mr-4 px-3 py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/materials/${type.raw_material_category_id}`
                          );
                        }}
                      >
                        Manage Materials
                      </button>
                      <button
                        className="bg-gray-100 hover:bg-yellow-100 text-blue-600 hover:text-blue-900 mr-4 px-3 py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMaterialType(type);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Material Type Modal */}
        <Dialog
          open={openMaterialTypeDialog}
          onClose={() => setOpenMaterialTypeDialog(false)}
          className="relative z-50"
        >
          {/* The backdrop, rendered as a fixed sibling to the panel container */}
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          {/* Full-screen container to center the panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-xl w-full rounded-lg bg-white p-8 shadow-xl">
              <Dialog.Title className="text-2xl font-semibold mb-6">
                {editMode.id !== null ? "Edit" : "Add"} Material Type
              </Dialog.Title>
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter material type name"
                  value={newMaterialType}
                  onChange={(e) => setNewMaterialType(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setOpenMaterialTypeDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleAddMaterialType}
                >
                  {editMode.id !== null ? "Save" : "Add"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

export default LayoutComponents(MaterialTypePage);
