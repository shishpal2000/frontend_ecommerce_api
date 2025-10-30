/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { useParams, useRouter } from "next/navigation";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import LayoutComponents from "@/app/layoutComponents";

interface ApiResponse {
  message: string;
  error_status: boolean;
  status: number;
  data: Material[];
}

type ApiResponseType = {
  data: Material[];
  error_status: boolean;
  message: string;
};
interface Material {
  raw_material_id: string;
  name: string;
  category: string;
}

function MaterialsPage() {
  const router = useRouter();
  const params = useParams();
  const materialTypeId = params.materialTypeId;
  // console.log("materialTypeId", materialTypeId);
  const { getApi, postApi } = useGeneralApiCall();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await getApi<any>(
        `raw-material/list-materials/${params.materialTypeId}`
      );
      if (!response.error_status && Array.isArray(response.data.materials)) {
        setMaterials(response.data.materials);
      } else {
        setFeedback({
          type: "error",
          message: response.message || "Failed to fetch materials",
        });
        setMaterials([]);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: "An error occurred while fetching materials",
      });
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  }, [getApi, materialTypeId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState("");
  const [editMode, setEditMode] = useState<{ raw_material_id: string | null }>({
    raw_material_id: null,
  });

  // Material handlers
  const handleAddMaterial = async () => {
    if (!newMaterial.trim()) {
      setFeedback({ type: "error", message: "Material name cannot be empty" });
      return;
    }

    try {
      if (editMode.raw_material_id !== null) {
        // Make API call to update existing material
        const response = await postApi(
          `/raw-material/update-material/${editMode.raw_material_id}/`,
          {
            name: newMaterial,
          }
        );
        if (response.error_status) {
          setFeedback({
            type: "error",
            message: response.message || "Failed to update material",
          });
          return;
        } else {
          setFeedback({
            type: "success",
            message: "Material updated successfully",
          });
          // Refresh the materials list
          await fetchMaterials();
          setEditMode({ raw_material_id: null });
        }
      } else {
        // Make API call to create new material
        const response = await postApi<ApiResponseType>(
          "raw-material/create-material/",
          {
            raw_material_category_id: params.materialTypeId,
            name: newMaterial,
          }
        );

        if (!response.error_status) {
          setFeedback({
            type: "success",
            message: response.message || "Material added successfully",
          });
          // Refresh the materials list
          await fetchMaterials();
        } else {
          setFeedback({
            type: "error",
            message: response.message || "Failed to add material",
          });
          return;
        }
      }
      setNewMaterial("");
      setOpenMaterialDialog(false);
    } catch (error) {
      setFeedback({
        type: "error",
        message: "An error occurred while adding the material",
      });
    }
  };

  const handleEditMaterial = (material: Material) => {
    setNewMaterial(material.name);
    setEditMode({ raw_material_id: material.raw_material_id });
    setOpenMaterialDialog(true);
  };

  return (
    <div className="p-8 pt-16  ">
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

      {/* Materials Table */}
      <div className="mb-8 w-full  mt-8 flex justify-center">
        <div className="mb-8 w-full  mt-8">
          {/* Header with back button */}
          <div className="mb-8 flex items-center">
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
              Back to Material Categories
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Materials</h2>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-lg"
              onClick={() => {
                setEditMode({ raw_material_id: null });
                setNewMaterial("");
                setOpenMaterialDialog(true);
              }}
            >
              Add Material
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-[15px] font-medium text-gray-500 uppercase tracking-wider">
                    Material Name
                  </th>
                  <th className="px-8 py-4 text-right text-[15px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="px-8 py-5 text-center">
                      Loading materials...
                    </td>
                  </tr>
                ) : materials.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-8 py-5 text-center">
                      No materials found
                    </td>
                  </tr>
                ) : (
                  materials.map((material) => (
                    <tr
                      key={material.raw_material_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-8 py-5 whitespace-nowrap text-mx text-gray-900">
                        {material.name}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={() => handleEditMaterial(material)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Material Modal */}
        <Dialog
          open={openMaterialDialog}
          onClose={() => setOpenMaterialDialog(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-xl w-full rounded-lg bg-white p-8 shadow-xl">
              <Dialog.Title className="text-2xl font-semibold mb-6">
                {editMode.raw_material_id !== null ? "Edit" : "Add"} Material
              </Dialog.Title>
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Enter material name"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setOpenMaterialDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleAddMaterial}
                >
                  {editMode.raw_material_id !== null ? "Save" : "Add"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

export default LayoutComponents(MaterialsPage);
