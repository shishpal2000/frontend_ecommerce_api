"use client";
import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import "react-toastify/dist/ReactToastify.css";
import LayoutComponents from "../layoutComponents";
interface ApiResponse {
  message: string;
  error_status: boolean;
  status: number;
  data: Record<string, never>;
}

interface PlacementLocation {
  placement_location_id: number;
  name: string;
}

function PlacementLocationPage() {
  const { getApi, postApi } = useGeneralApiCall();
  const [placements, setPlacements] = useState<PlacementLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchPlacements = useCallback(async () => {
    try {
      const response: {
        data: { placement_location: PlacementLocation[] };
        error_status: boolean;
        message: string;
      } = await getApi("placement-location/list/");
      if (
        !response.error_status &&
        Array.isArray(response.data.placement_location)
      ) {
        setPlacements(response.data.placement_location);
      } else {
        setFeedback({
          type: "error",
          message: response.message || "Failed to fetch placement locations",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching placement locations",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getApi]);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const [openPlacementDialog, setOpenPlacementDialog] = useState(false);
  const [newPlacement, setNewPlacement] = useState("");
  const [editMode, setEditMode] = useState<{ id: number | null }>({
    id: null,
  });

  // Placement Location handlers
  const handleAddPlacement = async () => {
    try {
      if (!newPlacement.trim()) {
        setFeedback({
          type: "error",
          message: "Placement location name cannot be empty",
        });
        return;
      }

      if (editMode.id !== null) {
        // Handle edit case
        const response = await postApi<ApiResponse>(
          `placement-location/update/${editMode.id}/`,
          {
            name: newPlacement,
          }
        );
        if (response?.status === 200 && !response.error_status) {
          fetchPlacements();
          setFeedback({
            type: "success",
            message:
              response.message || "Placement location updated successfully",
          });
        }
        setEditMode({ id: null });
      } else {
        // Handle add case
        const response = await postApi<ApiResponse>(
          "placement-location/create/",
          {
            name: newPlacement,
          }
        );

        if (response?.status === 201 && !response.error_status) {
          // Add the new placement location to the list
          setPlacements([
            ...placements,
            {
              placement_location_id: placements.length + 1,
              name: newPlacement,
            },
          ]);
          setFeedback({ type: "success", message: response.message });
        } else {
          setFeedback({
            type: "error",
            message: response.message || "Failed to create placement location",
          });
          return;
        }
      }
      setNewPlacement("");
      setOpenPlacementDialog(false);
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

  const handleEditPlacement = (placement: PlacementLocation) => {
    setNewPlacement(placement.name);
    setEditMode({ id: placement.placement_location_id });
    setOpenPlacementDialog(true);
  };

  return (
    <div className="p-8 pt-16  flex-col justify-center items-center">
      {/* Feedback Message */}
      {feedback && (
        <button
          className={`mb-6 px-4 py-3 rounded w-full text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
              : "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
          }`}
          onClick={() => setFeedback(null)}
        >
          <span>{feedback.message}</span>
          <span className="ml-4 text-xs underline">Dismiss</span>
        </button>
      )}
      {/* Placement Locations Table */}
      <div className="mb-8 w-full mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Placement Locations</h2>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-lg"
            onClick={() => {
              setEditMode({ id: null });
              setNewPlacement("");
              setOpenPlacementDialog(true);
            }}
          >
            Add Placement Location
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-[15px] font-medium text-gray-500 uppercase tracking-wider">
                  Placement Location
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
                    Loading placement locations...
                  </td>
                </tr>
              ) : placements.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-8 py-5 text-center">
                    No placement locations found
                  </td>
                </tr>
              ) : (
                placements.map((placement) => (
                  <tr
                    key={placement.placement_location_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-8 py-5 whitespace-nowrap text-mx text-gray-900">
                      {placement.name}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 px-2 py-1 rounded-2xl hover:text-blue-900 bg-amber-200 mr-4"
                        onClick={() => handleEditPlacement(placement)}
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

      {/* Placement Location Modal */}
      <Dialog
        open={openPlacementDialog}
        onClose={() => setOpenPlacementDialog(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xl w-full rounded-lg bg-white p-8 shadow-xl">
            <Dialog.Title className="text-2xl font-semibold mb-6">
              {editMode.id !== null ? "Edit" : "Add"} Placement Location
            </Dialog.Title>
            <div className="mb-4">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter placement location name"
                value={newPlacement}
                onChange={(e) => setNewPlacement(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setOpenPlacementDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleAddPlacement}
              >
                {editMode.id !== null ? "Save" : "Add"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default LayoutComponents(PlacementLocationPage);
