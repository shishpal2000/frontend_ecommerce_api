"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import LayoutComponents from "../layoutComponents";
import ConfirmationModal from "@/components/ConfirmationModal";
import { TiDeleteOutline } from "react-icons/ti";
import { useRouter } from "next/navigation";
import { TemplateRow, TechSpecDetailResponse } from "@/types";

type TechSpecListResponse = {
  permission: {
    can_create_new_template: boolean;
    can_edit_template: boolean;
    can_delete_template: boolean;
  };
  templates: { template_id: string; name: string; description: string }[];
};

const SpecTemplatePage = () => {
  const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL;
  const router = useRouter();
  const { getApi, postApi } = useGeneralApiCall();

  // Add this state at the top with other state variables
  const [currentEditingRowId, setCurrentEditingRowId] = useState<string | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    header: "",
    measurementName: "",
    location: "",
  });
  const [editLoadingSpec, setEditLoadingSpec] = useState(false);

  const [postApiResponse, setPostApiResponse] = useState(false);
  const [notificationData, setNotificationData] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Debounce related state
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // WebSocket related state
  const [connectionUuid, setConnectionUuid] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const getAuthToken = () => {
    // Get token from localStorage, cookies, or your auth system
    return localStorage.getItem("access") || "";
  };

  // Debounced WebSocket message sender
  const sendDebouncedWebSocketMessage = useCallback(
    (message: any, delay: number = 2000) => {
      if (wsConnection && wsStatus === "connected") {
        setIsDebouncing(true);
        setPendingUpdate(message);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          try {
            const fullMessage = {
              ...message,
              uuid: connectionUuid,
              timestamp: new Date().toISOString(),
            };

            wsConnection.send(JSON.stringify(fullMessage));

            setWsMessages((prev) => [
              ...prev,
              {
                ...fullMessage,

                timestamp: new Date().toISOString(),
                debounced: true,
              },
            ]);

            setIsDebouncing(false);
            setPendingUpdate(null);
          } catch (error) {
            setIsDebouncing(false);
            setPendingUpdate(null);
          }
        }, delay);
      }
    },
    [wsConnection, wsStatus, connectionUuid]
  );

  const connectWebSocket = (uuid: string, token: string) => {
    try {
      setWsStatus("connecting");
      const wsUrl = `${WS_BASE_URL}/v1/tech_specs/draft-tech-template/?token=${token}&uuid=${uuid}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        setWsConnection(ws);

        // Send initial connection message
        ws.send(
          JSON.stringify({
            type: "connection_established",
            uuid: uuid,
            timestamp: new Date().toISOString(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setWsMessages((prev) => [
            ...prev,
            {
              ...data,
              timestamp: new Date().toISOString(),
            },
          ]);
        } catch (error) {}
      };

      ws.onerror = (error) => {
        setWsStatus("disconnected");
        setError("WebSocket connection error");
      };

      ws.onclose = (event) => {
        setWsStatus("disconnected");
        setWsConnection(null);
        wsRef.current = null;
      };
    } catch (error) {
      setWsStatus("disconnected");
      setError("Failed to establish WebSocket connection");
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Template creation cancelled");
      wsRef.current = null;
    }
    setWsConnection(null);
    setWsStatus("disconnected");
    setConnectionUuid(null);
    setWsMessages([]);
  };

  // Add modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger" as "danger" | "warning" | "info",
    error: null,
  });

  // Add template name validation modal
  const [templateNameModal, setTemplateNameModal] = useState({
    isOpen: false,
    title: "Template Name Required",
    message: "Please enter a template name first before adding measurements.",
    type: "warning" as "danger" | "warning" | "info",
  });

  //update one time one row modal state
  const [oneTimeEditModal, setOneTimeEditModal] = useState({
    isOpen: false,
    title: "Edit Measurement",
    message: "Please update the current measurement before adding a new one.",
    type: "warning" as "danger" | "warning" | "info",
  });

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [editingTemplateDescription, setEditingTemplateDescription] =
    useState("");

  // View state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);

  // Create mode state
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newMeasurements, setNewMeasurements] = useState<TemplateRow[]>([
    { id: uuidv4(), header: "", measurement_name: "", location: "" },
  ]);

  // API data
  const [templateData, setTemplateData] = useState<TechSpecListResponse | null>(
    null
  );
  const [tempList, setTempList] = useState<TechSpecDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial template list
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await getApi<TechSpecListResponse>(
        "/tech-spec/template/list/"
      );
      if (response.status === 200) {
        setTemplateData(response.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific template details
  const fetchTemplateDetails = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await getApi<TechSpecDetailResponse>(
        `/tech-spec/template/${templateId}/`
      );
      if (response.status === 200) {
        setTempList(response.data);
        setEditingTemplateName(response.data.name);
        setEditingTemplateDescription(response.data.description);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      fetchTemplateDetails(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  // Handle template selection
  const selectTemplate = (id: string) => {
    setIsCreatingNew(false);
    setIsEditingTemplate(false);
    setIsEditingMeasurements(false);
    setSelectedTemplateId(id);
  };

  // Start creating a new template
  const startNewTemplate = () => {
    // Generate new UUID
    const newUuid = uuidv4();
    setConnectionUuid(newUuid);
    // Connect to WebSocket
    const token = getAuthToken();
    connectWebSocket(newUuid, token);

    // Set up UI state
    setIsCreatingNew(true);
    setIsEditingTemplate(false);
    setIsEditingMeasurements(false);
    setSelectedTemplateId(null);
    setTempList(null);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewMeasurements([
      { id: uuidv4(), header: "", measurement_name: "", location: "" },
    ]);
  };

  // CREATE MODE FUNCTIONS
  const handleNewMeasurementChange = (
    index: number,
    field: keyof TemplateRow,
    value: string
  ) => {
    if (!newTemplateName.trim() && value.trim() !== "") {
      setTemplateNameModal({
        ...templateNameModal,
        isOpen: true,
      });
      return; // Don't update the measurement if no template name
    }

    const updatedMeasurements = newMeasurements.map((measurement, idx) =>
      idx === index ? { ...measurement, [field]: value } : measurement
    );
    setNewMeasurements(updatedMeasurements);

    // Send complete template data via WebSocket - UPDATED
    if (wsConnection && wsStatus === "connected") {
      sendDebouncedWebSocketMessage(
        {
          content: {
            name: newTemplateName.trim(),
            description: newTemplateDescription.trim(),
            template_schema: updatedMeasurements
              .filter(
                (m) =>
                  m.header.trim() ||
                  m.measurement_name.trim() ||
                  m.location.trim()
              )
              .map((m) => ({
                header: m.header.trim(),
                measurement_name: m.measurement_name.trim(),
                location: m.location.trim(),
              })),
            // Additional metadata for real-time tracking
            last_updated_field: field,
            last_updated_index: index,
            last_updated_value: value,
            timestamp: new Date().toISOString(),
          },
        },
        2000
      );
    }

    // Add new empty row if user is typing in the last row
    if (index === newMeasurements.length - 1 && value.trim() !== "") {
      setNewMeasurements([
        ...updatedMeasurements,
        { id: uuidv4(), header: "", measurement_name: "", location: "" },
      ]);
    }
  };

  const removeNewMeasurement = (index: number) => {
    if (newMeasurements.length > 1) {
      setNewMeasurements(newMeasurements.filter((_, idx) => idx !== index));
    }
  };

  // Create new template (with name, description, and measurements array)
  const createNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      return;
    }

    // Filter out empty measurements
    const validMeasurements = newMeasurements.filter(
      (m) => m.header.trim() || m.measurement_name.trim() || m.location.trim()
    );

    if (validMeasurements.length === 0) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        template_draft_id: connectionUuid,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim(),
        template_schema: validMeasurements.map((m) => ({
          header: m.header.trim(),
          measurement_name: m.measurement_name.trim(),
          location: m.location.trim(),
        })),
      };

      // Always use HTTP API for final template creation
      const response = await postApi("/tech-spec/template/create/", payload);

      if (response.status === 201 || response.status === 200) {
        setPostApiResponse(true);
        setNotificationData(
          response.message || "Template created successfully!"
        );

        // Refresh the template list
        await fetchInitialData();

        // Reset form and disconnect WebSocket
        setIsCreatingNew(false);
        setNewTemplateName("");
        setNewTemplateDescription("");
        setNewMeasurements([
          { id: uuidv4(), header: "", measurement_name: "", location: "" },
        ]);

        // Disconnect WebSocket after successful creation
        disconnectWebSocket();
      } else {
        setError("Failed to create template. Please try again.");
      }
    } catch (error: any) {
      setError(error.message || "Failed to create template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  // Also add WebSocket updates for template name and description changes
  const handleTemplateNameChange = (value: string) => {
    setNewTemplateName(value);

    // Send real-time template name update
    if (wsConnection && wsStatus === "connected") {
      sendDebouncedWebSocketMessage(
        {
          content: {
            name: value.trim(),
            description: newTemplateDescription.trim(),
            template_schema: newMeasurements
              .filter(
                (m) =>
                  m.header.trim() ||
                  m.measurement_name.trim() ||
                  m.location.trim()
              )
              .map((m) => ({
                header: m.header.trim(),
                measurement_name: m.measurement_name.trim(),
                location: m.location.trim(),
              })),
            timestamp: new Date().toISOString(),
          },
        },
        2000
      );
    }
  };

  const handleTemplateDescriptionChange = (value: string) => {
    setNewTemplateDescription(value);

    // Send real-time template description update
    if (wsConnection && wsStatus === "connected") {
      sendDebouncedWebSocketMessage(
        {
          content: {
            name: newTemplateName.trim(),
            description: value.trim(),
            template_schema: newMeasurements
              .filter(
                (m) =>
                  m.header.trim() ||
                  m.measurement_name.trim() ||
                  m.location.trim()
              )
              .map((m) => ({
                header: m.header.trim(),
                measurement_name: m.measurement_name.trim(),
                location: m.location.trim(),
              })),
            timestamp: new Date().toISOString(),
          },
        },
        2000
      );
    }
  };

  // EDIT MODE FUNCTIONS
  const updateTemplateInfo = async () => {
    if (!editingTemplateName.trim()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: editingTemplateName.trim(),
        description: editingTemplateDescription.trim(),
      };

      const response = await postApi(
        `/tech-spec/template/${selectedTemplateId}/update/`,
        payload
      );

      if (response.status === 200) {
        setPostApiResponse(true);
        setNotificationData(response.message);
        await fetchTemplateDetails(selectedTemplateId!); // Refresh template details
        await fetchInitialData(); // Refresh template list
        setIsEditingTemplate(false);
      }
    } catch (error: any) {
      setError(error.message || "Failed to update template information.");
    } finally {
      setLoading(false);
    }
  };

  const deleteMesurementFunction = async (measurementId: string) => {
    try {
      setLoading(true);
      const response = await postApi(
        `/tech-spec/template/measurement/${measurementId}/delete/`,
        {}
      );

      if (response.status === 200) {
        await fetchTemplateDetails(selectedTemplateId!);
        setConfirmModal({ ...confirmModal, isOpen: false, error: null });
      }
    } catch (error: any) {
      setConfirmModal({
        ...confirmModal,
        title: "Delete Draft Template",
        message:
          "Are you sure you want to delete this draft template? This action cannot be undone.",
        isOpen: true,
        error: error.message || "Failed to delete template. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete measurement
  const deleteMeasurement = async (measurementId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Measurement",
      message:
        "Are you sure you want to delete this measurement? This action cannot be undone.",
      type: "danger",
      onConfirm: () => deleteMesurementFunction(measurementId),
      error: null,
    });
  };

  // Add new measurement to existing template
  const addNewMeasurement = async (measurement: {
    header: string;
    measurement_name: string;
    location: string;
  }) => {
    try {
      setEditLoadingSpec(true);
      const payload = {
        header: measurement.header.trim(),
        measurement_name: measurement.measurement_name.trim(),
        location: measurement.location.trim(),
      };

      const response = await postApi(
        `/tech-spec/template/${selectedTemplateId}/measurement/add/`,
        payload
      );

      if (response.status === 201 || response.status === 200) {
        await fetchTemplateDetails(selectedTemplateId!);
        setPostApiResponse(true);
        setNotificationData(
          response.message || "Measurement added successfully!"
        );
      }
    } catch (error: any) {
      setError(error.message || "Failed to add measurement. Please try again.");
    } finally {
      setEditLoadingSpec(false);
    }
  };

  const deleteTemplateFunction = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await postApi(
        `/tech-spec/template/${templateId}/delete/`,
        {}
      );

      if (response.status === 200) {
        await fetchInitialData();
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId(null);

          setTempList(null);
        }
        setConfirmModal({ ...confirmModal, isOpen: false, error: null });
      }
    } catch (error: any) {
      setConfirmModal({
        ...confirmModal,
        title: "Delete Draft Template",
        message:
          "Are you sure you want to delete this draft template? This action cannot be undone.",
        isOpen: true,
        error: error.message || "Failed to delete template. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add the closeConfirmModal function
  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false, error: null });
  };

  const cancelErrorMessage = () => {
    setPostApiResponse(false);
    setConfirmModal({
      ...confirmModal,
      title: "Delete Draft Template",
      message:
        "Are you sure you want to delete this draft template? This action cannot be undone.",
      error: null,
    });
  };

  // Delete template
  const deleteTemplate = (templateId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Template",
      message:
        "Are you sure you want to delete this template? This action cannot be undone and will remove all associated measurements.",
      type: "danger",
      onConfirm: () => deleteTemplateFunction(templateId),
      error: null,
    });
  };

  // Add a new function to handle the Update button click
  const updateMeasurementRow = async (measurementId: string) => {
    try {
      // Find the current measurement data from the state
      const currentMeasurement = tempList?.measurements.find(
        (m) => m.measurement_id === measurementId
      );

      if (!currentMeasurement) {
        return;
      }

      // Check if all required fields are filled jai maa kali
      if (
        !currentMeasurement.header.trim() ||
        !currentMeasurement.measurement_name.trim() ||
        !currentMeasurement.location.trim()
      ) {
        setOneTimeEditModal({
          isOpen: true,
          title: "Validation Error",
          message: "Please fill in all required fields before updating.",
          type: "warning",
        });
        return;
      }

      // Prepare the payload with all current values
      const payload = {
        header: currentMeasurement.header.trim(),
        measurement_name: currentMeasurement.measurement_name.trim(),
        location: currentMeasurement.location.trim(),
      };

      const response = await postApi(
        `/tech-spec/template/measurement/${measurementId}/update/`,
        payload
      );

      if (response.status === 200) {
        setPostApiResponse(true);
        setNotificationData(
          response.message || "Measurement updated successfully!"
        );

        // Clear editing state after successful update
        setCurrentEditingRowId(null);
        setHasUnsavedChanges(false);

        await fetchTemplateDetails(selectedTemplateId!);
      }
    } catch (error: any) {
      setPostApiResponse(true);
      setError(
        error.message || "Failed to update measurement. Please try again."
      );
    }
  };

  // Add a function to handle input changes (without API calls)
  const handleMeasurementInputChange = (
    measurementId: string,
    field: string,
    value: string
  ) => {
    // Check if user is trying to edit a different row while another row has unsaved changes
    if (
      currentEditingRowId &&
      currentEditingRowId !== measurementId &&
      hasUnsavedChanges
    ) {
      // Show modal to restrict editing
      setOneTimeEditModal({
        isOpen: true,
        title: "Update Required",
        message:
          "Please update the current measurement before editing another row.",
        type: "warning",
      });
      return; // Don't allow the change
    }

    // If this is the first change in this row, store original data
    if (!currentEditingRowId || currentEditingRowId !== measurementId) {
      setCurrentEditingRowId(measurementId);
    }
    // Update local state only, no API call
    if (tempList) {
      const updatedMeasurements = tempList.measurements.map((m) =>
        m.measurement_id === measurementId ? { ...m, [field]: value } : m
      );
      setTempList({ ...tempList, measurements: updatedMeasurements });
      setHasUnsavedChanges(true);
    }
  };

  const cancelAlert = () => {
    setPostApiResponse(false);
    setError(null);
  };

  // Add function to close template name modal
  const closeTemplateNameModal = () => {
    setTemplateNameModal({ ...templateNameModal, isOpen: false });
  };

  const closeOneTimeEditModal = () => {
    setOneTimeEditModal({ ...oneTimeEditModal, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center w-full">
            Spec Template Manager
          </h1>
        </div>

        {postApiResponse && (
          <div
            className={`text-center border-2 ${
              error
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-green-50 border-green-200 text-green-800"
            } mb-6 relative`}
          >
            {error ? (
              <div className="p-4">
                <div className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h1 className="font-semibold text-lg">Error: {error}</h1>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h1 className="font-semibold text-lg">{notificationData}</h1>
                </div>
              </div>
            )}

            <button
              className="absolute top-2 right-2 cursor-pointer hover:bg-gray-100 p-1 transition-colors"
              onClick={cancelAlert}
            >
              <TiDeleteOutline size={24} />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Template List */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white border border-gray-200 shadow-sm  overflow-hidden">
              <div className="flex justify-between gap-2 bg-blue-50 px-4 py-3 border-b border-gray-200 text-wrap">
                <h2 className="font-semibold text-gray-800">Templates</h2>
              </div>

              <div className="flex justify-between gap-2 bg-blue-50 px-4 py-3  border-gray-200 text-wrap ">
                {templateData?.permission?.can_create_new_template && (
                  <button
                    onClick={startNewTemplate}
                    className="px-2 py-2 bg-green-600 text-white  hover:bg-green-700 transition-colors cursor-pointer text-sm w-full"
                    disabled={loading}
                  >
                    Create Template
                  </button>
                )}
              </div>
              <div className="flex justify-between gap-2 bg-blue-50 px-4 py-1 border-gray-200 text-wrap">
                {templateData?.permission?.can_create_new_template && (
                  <button
                    onClick={() => router.push("/draft-template")}
                    className="px-2 py-2 bg-red-300 text-black mb-4 hover:bg-red-300 transition-colors cursor-pointer text-sm w-full"
                    disabled={loading}
                  >
                    Draft Template
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : templateData?.templates?.length === 0 ? (
                  <div className="p-4 text-gray-500 italic">
                    No templates yet
                  </div>
                ) : (
                  templateData?.templates?.map((template) => (
                    <div
                      key={template.template_id}
                      className={`p-4 flex justify-between items-center cursor-pointer  ${
                        selectedTemplateId === template.template_id
                          ? "bg-blue-200"
                          : ""
                      }`}
                      onClick={() => selectTemplate(template.template_id)}
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {template.name}
                        </h3>
                      </div>
                      {templateData?.permission?.can_edit_template && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.template_id);
                          }}
                          className="cursor-pointer p-2 border border-red-600 bg-red-400 text-black-600 text-sm"
                          title="Delete Template"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Template Editor/View */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white border border-gray-200 shadow-sm  overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">
                  {isCreatingNew
                    ? "Create New Template"
                    : selectedTemplateId
                    ? isEditingTemplate || isEditingMeasurements
                      ? "Edit Template"
                      : `View ${tempList?.name || "Template"}`
                    : "Select or Create a Template"}
                </h2>
              </div>
              {/* CREATE NEW TEMPLATE VIEW */}
              {isCreatingNew && (
                <>
                  <div className="p-4">
                    {/* WebSocket Connection Info */}
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Real-time Connection Status
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Status:</span>
                          <span
                            className={`ml-1 ${
                              wsStatus === "connected"
                                ? "text-green-600"
                                : wsStatus === "connecting"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {wsStatus}
                          </span>
                        </div>

                        {/* Debounce Indicator */}
                        {isDebouncing && pendingUpdate && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="flex items-center text-xs text-yellow-700">
                              <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                              <span>
                                Pending update: {pendingUpdate.type} (sending in
                                2s)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Template Basic Info */}
                    <div className="mb-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={newTemplateName}
                          onChange={(e) =>
                            handleTemplateNameChange(e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 "
                          placeholder="e.g., Tops Template"
                        />
                      </div>
                      {}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Description (Optional)
                        </label>
                        <textarea
                          value={newTemplateDescription}
                          onChange={(e) =>
                            handleTemplateDescriptionChange(e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 "
                          placeholder="Description of the template..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* New Measurements */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Template Measurements *
                      </h3>
                      <div className="border border-gray-200  overflow-hidden">
                        <div className="bg-gray-50 grid grid-cols-[2fr_2fr_2fr_100px] gap-2 border-b border-gray-200 text-xs font-semibold text-gray-600">
                          <div>HEADER</div>
                          <div>MEASUREMENT TYPE</div>
                          <div>LOCATION</div>
                          <div>ACTION</div>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {newMeasurements.map((measurement, index) => (
                            <div
                              key={measurement.id}
                              className="grid grid-cols-[2fr_2fr_2fr_100px] gap-2 p-3"
                            >
                              <input
                                type="text"
                                value={measurement.header}
                                onChange={(e) =>
                                  handleNewMeasurementChange(
                                    index,
                                    "header",
                                    e.target.value
                                  )
                                }
                                className="p-2 border border-gray-300  text-sm"
                                placeholder="Header"
                              />
                              <input
                                type="text"
                                value={measurement.measurement_name}
                                onChange={(e) =>
                                  handleNewMeasurementChange(
                                    index,
                                    "measurement_name",
                                    e.target.value
                                  )
                                }
                                className="p-2 border border-gray-300  text-sm"
                                placeholder="Type"
                              />
                              <input
                                type="text"
                                value={measurement.location}
                                onChange={(e) =>
                                  handleNewMeasurementChange(
                                    index,
                                    "location",
                                    e.target.value
                                  )
                                }
                                className="p-2 border border-gray-300  text-sm"
                                placeholder="Location"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewMeasurement(index)}
                                className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 text-sm"
                                disabled={newMeasurements.length === 1}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Create Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={createNewTemplate}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white  hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Creating..." : "Create Template"}
                      </button>
                      <button
                        onClick={() => setIsCreatingNew(false)}
                        className="px-4 py-2 bg-gray-600 text-white  hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {/* VIEW/EDIT EXISTING TEMPLATE */}
              {selectedTemplateId && tempList && !isCreatingNew && (
                <div className="p-4">
                  {/* Template Info Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Template Information
                      </h3>
                      {tempList.permission?.can_edit_template &&
                        !isEditingTemplate && (
                          <button
                            onClick={() => setIsEditingTemplate(true)}
                            className="px-3 py-2 bg-blue-600 text-white  hover:bg-blue-700 text-sm"
                          >
                            Edit Info
                          </button>
                        )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Template Name *
                        </label>
                        {isEditingTemplate ? (
                          <input
                            type="text"
                            required
                            value={editingTemplateName}
                            onChange={(e) =>
                              setEditingTemplateName(e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 "
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 border border-gray-300 ">
                            {tempList.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Template Description (Optional)
                        </label>
                        {isEditingTemplate ? (
                          <textarea
                            required
                            value={editingTemplateDescription}
                            onChange={(e) =>
                              setEditingTemplateDescription(e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 "
                            rows={3}
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 border border-gray-300  min-h-[80px]">
                            {tempList.description || "No description"}
                          </div>
                        )}
                      </div>

                      {isEditingTemplate && (
                        <div className="flex gap-2">
                          <button
                            onClick={updateTemplateInfo}
                            disabled={loading}
                            className="px-3 py-2 bg-green-600 text-white  hover:bg-green-700 text-sm disabled:opacity-50"
                          >
                            {loading ? "Saving..." : "Save Info"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingTemplate(false);
                              setEditingTemplateName(tempList.name);
                              setEditingTemplateDescription(
                                tempList.description
                              );
                            }}
                            className="px-3 py-2 bg-gray-600 text-white  hover:bg-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Measurements Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Measurements ({tempList.measurements?.length || 0})
                      </h3>
                      {tempList.permission?.can_edit_measurements && (
                        <button
                          onClick={() =>
                            setIsEditingMeasurements(!isEditingMeasurements)
                          }
                          className={`px-3 py-2 text-white  text-sm ${
                            isEditingMeasurements
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {isEditingMeasurements
                            ? "Stop Editing"
                            : "Edit Measurements"}
                        </button>
                      )}
                    </div>

                    <div className="border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div
                        className={`bg-gray-50 grid ${
                          isEditingMeasurements
                            ? "grid-cols-[2fr_2fr_2fr_150px]" // 3 wide columns + 1 narrow
                            : "grid-cols-[2fr_2fr_2fr]" // only 3 when actions hidden
                        } gap-2 p-3 border-b border-gray-200 text-xs font-semibold text-gray-600`}
                      >
                        <div>HEADER</div>
                        <div>MEASUREMENT TYPE</div>
                        <div>LOCATION</div>
                        {isEditingMeasurements && <div>ACTIONS</div>}
                      </div>

                      {/* Rows */}
                      <div className="divide-y divide-gray-100">
                        {tempList.measurements?.map((measurement) => (
                          <div
                            key={measurement.measurement_id}
                            className={`grid ${
                              isEditingMeasurements
                                ? "grid-cols-[2fr_2fr_2fr_150px]"
                                : "grid-cols-[2fr_2fr_2fr]"
                            } gap-2 p-3`}
                          >
                            <input
                              type="text"
                              value={measurement.header}
                              onChange={(e) =>
                                handleMeasurementInputChange(
                                  measurement.measurement_id,
                                  "header",
                                  e.target.value
                                )
                              }
                              className="p-2 border border-gray-300 text-sm"
                              disabled={!isEditingMeasurements}
                            />
                            <input
                              type="text"
                              value={measurement.measurement_name}
                              onChange={(e) =>
                                handleMeasurementInputChange(
                                  measurement.measurement_id,
                                  "measurement_name",
                                  e.target.value
                                )
                              }
                              className="p-2 border border-gray-300 text-sm"
                              disabled={!isEditingMeasurements}
                            />
                            <input
                              type="text"
                              value={measurement.location}
                              onChange={(e) =>
                                handleMeasurementInputChange(
                                  measurement.measurement_id,
                                  "location",
                                  e.target.value
                                )
                              }
                              className="p-2 border border-gray-300 text-sm"
                              disabled={!isEditingMeasurements}
                            />
                            {isEditingMeasurements && (
                              <div className="flex flex-col gap-1 ">
                                <button
                                  onClick={() =>
                                    deleteMeasurement(
                                      measurement.measurement_id
                                    )
                                  }
                                  className="bg-red-600 text-white hover:bg-red-700 px-2 py-1 text-xs cursor-pointer "
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => {
                                    // Check if user is trying to edit a different row while another row has unsaved changes
                                    if (
                                      currentEditingRowId &&
                                      currentEditingRowId !==
                                        measurement.measurement_id &&
                                      hasUnsavedChanges
                                    ) {
                                      // Show modal to restrict editing
                                      setOneTimeEditModal({
                                        isOpen: true,
                                        title: "Update Required",
                                        message:
                                          "Please update the current measurement before editing another row.",
                                        type: "warning",
                                      });
                                      return; // Don't allow the change
                                    } else {
                                      updateMeasurementRow(
                                        measurement.measurement_id
                                      );
                                    }
                                  }}
                                  className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 text-xs cursor-pointer"
                                >
                                  Update
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add New Measurement */}
                    {isEditingMeasurements && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 ">
                        <h4 className="text-sm font-medium text-blue-800 mb-3">
                          Add New Measurement
                        </h4>
                        <div className="grid grid-cols-[2fr_2fr_2fr_100px] gap-2">
                          <div>
                            <input
                              type="text"
                              placeholder="Header"
                              className={`p-2 border text-sm w-full ${
                                validationErrors.header
                                  ? "border-red-500 bg-red-50"
                                  : "border-blue-300"
                              }`}
                              id="new-header"
                              required
                            />
                            {validationErrors.header && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationErrors.header}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Measurement Type"
                              className={`p-2 border text-sm w-full ${
                                validationErrors.measurementName
                                  ? "border-red-500 bg-red-50"
                                  : "border-blue-300"
                              }`}
                              id="new-measurement-name"
                              required
                            />
                            {validationErrors.measurementName && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationErrors.measurementName}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Location"
                              className={`p-2 border text-sm w-full ${
                                validationErrors.location
                                  ? "border-red-500 bg-red-50"
                                  : "border-blue-300"
                              }`}
                              id="new-location"
                              required
                            />
                            {validationErrors.location && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationErrors.location}
                              </p>
                            )}
                          </div>
                          <button
                            aria-required
                            onClick={() => {
                              // Clear previous validation errors
                              setValidationErrors({
                                header: "",
                                measurementName: "",
                                location: "",
                              });
                              const header = (
                                document.getElementById(
                                  "new-header"
                                ) as HTMLInputElement
                              )?.value;
                              const measurementName = (
                                document.getElementById(
                                  "new-measurement-name"
                                ) as HTMLInputElement
                              )?.value;
                              const location = (
                                document.getElementById(
                                  "new-location"
                                ) as HTMLInputElement
                              )?.value;

                              // Validation object to track errors
                              const errors = {
                                header: "",
                                measurementName: "",
                                location: "",
                              };

                              // Check each field individually
                              if (!header || !header.trim()) {
                                errors.header = "Header is required";
                              }

                              if (!measurementName || !measurementName.trim()) {
                                errors.measurementName =
                                  "Measurement Type is required";
                              }

                              if (!location || !location.trim()) {
                                errors.location = "Location is required";
                              }

                              // If there are any errors, set them and don't proceed
                              if (
                                errors.header ||
                                errors.measurementName ||
                                errors.location
                              ) {
                                setValidationErrors(errors);
                                return;
                              }

                              // All fields are valid, proceed with adding measurement
                              addNewMeasurement({
                                header: header.trim(),
                                measurement_name: measurementName.trim(),
                                location: location.trim(),
                              });

                              // Clear inputs after successful submission
                              (
                                document.getElementById(
                                  "new-header"
                                ) as HTMLInputElement
                              ).value = "";
                              (
                                document.getElementById(
                                  "new-measurement-name"
                                ) as HTMLInputElement
                              ).value = "";
                              (
                                document.getElementById(
                                  "new-location"
                                ) as HTMLInputElement
                              ).value = "";
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700 py-2  text-sm cursor-pointer"
                          >
                            {editLoadingSpec ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Empty State */}
              {!isCreatingNew && !selectedTemplateId && (
                <div className="p-6 text-center text-gray-500">
                  Select a template to view or edit, or create a new one
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        error={confirmModal.error}
        cancelErrorMessage={cancelErrorMessage}
      />
      {/* Template row edit confirmation modal */}
      <ConfirmationModal
        isOpen={oneTimeEditModal.isOpen}
        onClose={closeOneTimeEditModal}
        onConfirm={closeOneTimeEditModal}
        title={oneTimeEditModal.title}
        message={oneTimeEditModal.message}
        type={oneTimeEditModal.type}
        error={confirmModal.error}
        cancelErrorMessage={cancelErrorMessage}
      />
      {/* Template Name Required Modal */}
      <ConfirmationModal
        isOpen={templateNameModal.isOpen}
        onClose={closeTemplateNameModal}
        onConfirm={closeTemplateNameModal}
        title={templateNameModal.title}
        message={templateNameModal.message}
        type={templateNameModal.type}
        error={confirmModal.error}
        cancelErrorMessage={cancelErrorMessage}
      />
    </div>
  );
};

export default LayoutComponents(SpecTemplatePage);
