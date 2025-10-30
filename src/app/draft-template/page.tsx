"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import LayoutComponents from "../layoutComponents";
import { IoMdArrowBack } from "react-icons/io";
import { TiDeleteOutline } from "react-icons/ti";
import ConfirmationModal from "@/components/ConfirmationModal";
import { TemplateRow, TechSpecListResponse } from "@/types";
import { useRouter } from "next/navigation";

const DraftTemplate = () => {
  const router = useRouter();
  const { getApi, postApi } = useGeneralApiCall();
  const WS_BASE_URL =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

  const [postApiResponse, setPostApiResponse] = useState(false);
  const [notificationData, setNotificationData] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // WebSocket related state
  const [connectionUuid, setConnectionUuid] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Debounce related state
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [templateData, setTemplateData] = useState<TechSpecListResponse | null>(
    null
  );

  const [loading, setLoading] = useState(false);

  // Draft template editing state
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [editingTemplateDescription, setEditingTemplateDescription] =
    useState("");
  const [editingMeasurements, setEditingMeasurements] = useState<TemplateRow[]>(
    []
  );

  // Add template name validation modal
  const [templateNameModal, setTemplateNameModal] = useState({
    isOpen: false,
    title: "Template Name Required",
    message: "Please enter a template name first before adding measurements.",
    type: "warning" as "danger" | "warning" | "info",
  });

  // Focus management state
  const [focusState, setFocusState] = useState<{
    elementType: "templateName" | "templateDescription" | "measurement";
    measurementIndex?: number;
    measurementField?: keyof TemplateRow;
    cursorPosition?: number;
  } | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem("access") || "";
  };

  // WebSocket connection function
  const connectWebSocket = (templateId: string, token: string) => {
    try {
      setWsStatus("connecting");
      const wsUrl = `${WS_BASE_URL}/v1/tech_specs/draft-tech-template/?token=${token}&uuid=${templateId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setConnectionUuid(templateId);

      ws.onopen = () => {
        setWsStatus("connected");
        setWsConnection(ws);

        // Send initial connection message
        const initialMessage = {
          type: "connection_established",
          template_id: templateId,
          timestamp: new Date().toISOString(),
        };

        ws.send(JSON.stringify(initialMessage));

        // Request template data with delay
        setTimeout(() => {
          const requestDataMessage = {
            type: "get_template_data",
            template_id: templateId,
            timestamp: new Date().toISOString(),
          };

          ws.send(JSON.stringify(requestDataMessage));
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setWsMessages((prev) => [
            ...prev,
            {
              ...data,
              direction: "received",
              timestamp: new Date().toISOString(),
              messageSize: event.data.length,
            },
          ]);

          // Handle different message types and data structures
          switch (data.type) {
            case "template_data_response":
            case "template_data":
            case "draft_template_data":
              handleTemplateDataReceived(data);
              break;
            case "template_updated":
              handleTemplateUpdated(data);
              break;
            case "connection_confirmed":
              break;
            case "error":
              setError(data.message || "WebSocket error occurred");
              break;
            default:
              if (
                data.id ||
                data.name ||
                data.content ||
                data.template_schema
              ) {
                handleTemplateDataReceived(data);
              }
          }
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

  // Enhanced template data handler to handle the nested content structure
  const handleTemplateDataReceived = (data: any) => {
    // Store current focus state before updating
    const activeElement = document.activeElement as
      | HTMLInputElement
      | HTMLTextAreaElement;
    let currentFocus = null;
    let cursorPos = 0;

    if (activeElement) {
      cursorPos = activeElement.selectionStart || 0;

      if (activeElement === templateNameRef.current) {
        currentFocus = {
          elementType: "templateName" as const,
          cursorPosition: cursorPos,
        };
      } else if (activeElement === templateDescriptionRef.current) {
        currentFocus = {
          elementType: "templateDescription" as const,
          cursorPosition: cursorPos,
        };
      } else {
        // Check if it's a measurement input
        const measurementKey = Object.keys(measurementRefs.current).find(
          (key) => measurementRefs.current[key] === activeElement
        );
        if (measurementKey) {
          const [index, field] = measurementKey.split("-");
          currentFocus = {
            elementType: "measurement" as const,
            measurementIndex: parseInt(index),
            measurementField: field as keyof TemplateRow,
            cursorPosition: cursorPos,
          };
        }
      }
    }

    if (data) {
      // Handle the nested content structure from your data format
      let templateContent = data;

      // If data has a 'content' property, use that for template data
      if (data.content) {
        templateContent = data.content;
      }

      // Extract template information from various possible locations
      const templateName =
        templateContent.name ||
        data.name ||
        templateContent.template_name ||
        data.template_name ||
        "";

      const templateDescription =
        templateContent.description ||
        data.description ||
        templateContent.template_description ||
        data.template_description ||
        "";

      const measurements =
        templateContent.template_schema ||
        data.template_schema ||
        templateContent.measurements ||
        data.measurements ||
        templateContent.schema ||
        data.schema ||
        [];

      // Set the template name and description
      setEditingTemplateName(templateName);
      setEditingTemplateDescription(templateDescription);

      // Process measurements
      if (
        measurements &&
        Array.isArray(measurements) &&
        measurements.length > 0
      ) {
        const formattedMeasurements = measurements.map((m: any) => ({
          id: m.measurement_id || m.id || uuidv4(),
          header: m.header || m.Header || "",
          measurement_name:
            m.measurement_name || m.measurementName || m.type || "",
          location: m.location || m.Location || "",
        }));

        // Always add an empty row at the end for new entries
        formattedMeasurements.push({
          id: uuidv4(),
          header: "",
          measurement_name: "",
          location: "",
        });

        setEditingMeasurements(formattedMeasurements);
      } else {
        setEditingMeasurements([
          { id: uuidv4(), header: "", measurement_name: "", location: "" },
        ]);
      }

      // Clear any existing errors
      setError(null);

      // Set focus state to restore after render
      if (currentFocus) {
        setFocusState(currentFocus);
      }
    } else {
      setEditingTemplateName("");
      setEditingTemplateDescription("");
      setEditingMeasurements([
        { id: uuidv4(), header: "", measurement_name: "", location: "" },
      ]);
    }
  };

  // Handle template updates from WebSocket
  const handleTemplateUpdated = (data: any) => {
    // Refresh the data
    handleTemplateDataReceived(data);
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsDebouncing(false);
    setPendingUpdate(null);

    if (wsRef.current) {
      wsRef.current.close(1000, "Disconnecting from draft template");
      wsRef.current = null;
    }
    setWsConnection(null);
    setWsStatus("disconnected");
    setConnectionUuid(null);
    setWsMessages([]);
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
              template_id: connectionUuid,
              timestamp: new Date().toISOString(),
            };

            wsConnection.send(JSON.stringify(fullMessage));

            setWsMessages((prev) => [
              ...prev,
              {
                ...fullMessage,
                direction: "sent",
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

  // Template change handlers with debouncing
  const handleTemplateNameChange = (value: string) => {
    setEditingTemplateName(value);

    const messageData = {
      type: "template_name_update",
      content: {
        name: value.trim(),
        description: editingTemplateDescription.trim(),
        template_schema: editingMeasurements
          .filter(
            (m) =>
              m.header.trim() || m.measurement_name.trim() || m.location.trim()
          )
          .map((m) => ({
            header: m.header.trim(),
            measurement_name: m.measurement_name.trim(),
            location: m.location.trim(),
          })),
        update_type: "name_change",
      },
    };

    sendDebouncedWebSocketMessage(messageData, 2000);
  };

  const handleTemplateDescriptionChange = (value: string) => {
    setEditingTemplateDescription(value);

    const messageData = {
      content: {
        name: editingTemplateName.trim(),
        description: value.trim(),
        template_schema: editingMeasurements
          .filter(
            (m) =>
              m.header.trim() || m.measurement_name.trim() || m.location.trim()
          )
          .map((m) => ({
            header: m.header.trim(),
            measurement_name: m.measurement_name.trim(),
            location: m.location.trim(),
          })),
        update_type: "description_change",
      },
    };

    sendDebouncedWebSocketMessage(messageData, 2000);
  };

  const handleMeasurementChange = (
    index: number,
    field: keyof TemplateRow,
    value: string
  ) => {
    if (!editingTemplateName.trim() && value.trim() !== "") {
      setTemplateNameModal({
        ...templateNameModal,
        isOpen: true,
      });
      return; // Don't update the measurement if no template name
    }

    const updatedMeasurements = editingMeasurements.map((measurement, idx) =>
      idx === index ? { ...measurement, [field]: value } : measurement
    );
    setEditingMeasurements(updatedMeasurements);

    const messageData = {
      content: {
        name: editingTemplateName.trim(),
        description: editingTemplateDescription.trim(),
        template_schema: updatedMeasurements
          .filter(
            (m) =>
              m.header.trim() || m.measurement_name.trim() || m.location.trim()
          )
          .map((m) => ({
            header: m.header.trim(),
            measurement_name: m.measurement_name.trim(),
            location: m.location.trim(),
          })),
        last_updated_field: field,
        last_updated_index: index,
        last_updated_value: value,
        update_type: "measurement_change",
      },
    };

    sendDebouncedWebSocketMessage(messageData, 2000);

    // Add new empty row if user is typing in the last row
    if (index === editingMeasurements.length - 1 && value.trim() !== "") {
      setEditingMeasurements([
        ...updatedMeasurements,
        { id: uuidv4(), header: "", measurement_name: "", location: "" },
      ]);
    }
  };

  const removeMeasurement = (index: number) => {
    if (editingMeasurements.length > 1) {
      const updatedMeasurements = editingMeasurements.filter(
        (_, idx) => idx !== index
      );
      setEditingMeasurements(updatedMeasurements);

      // Send update via WebSocket
      const messageData = {
        content: {
          name: editingTemplateName.trim(),
          description: editingTemplateDescription.trim(),
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
          removed_index: index,
          update_type: "measurement_remove",
        },
      };

      sendDebouncedWebSocketMessage(messageData, 1000); // Shorter delay for removal
    }
  };

  // Fetch initial template list
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await getApi<TechSpecListResponse>(
        "/tech-spec/template/drafts/list/"
      );
      if (response.status === 200) {
        setTemplateData(response.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Handle template selection and WebSocket connection
  const handleTemplateSelect = (templateId: string) => {
    // Disconnect existing WebSocket if any
    if (wsConnection) {
      disconnectWebSocket();
    }

    setSelectedTemplateId(templateId);

    // Reset editing state
    setEditingTemplateName("");
    setEditingTemplateDescription("");
    setEditingMeasurements([]);

    setError(null);

    // Connect to WebSocket for this template
    const token = getAuthToken();
    if (token) {
      connectWebSocket(templateId, token);
    } else {
      setError("No authentication token found. Please log in again.");
    }
  };

  // Save template function (HTTP API call)
  const saveTemplate = async () => {
    if (!editingTemplateName.trim()) {
      return;
    }

    const validMeasurements = editingMeasurements.filter(
      (m) => m.header.trim() || m.measurement_name.trim() || m.location.trim()
    );

    if (validMeasurements.length === 0) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        template_draft_id: selectedTemplateId,
        name: editingTemplateName.trim(),
        description: editingTemplateDescription.trim(),
        template_schema: validMeasurements.map((m) => ({
          header: m.header.trim(),
          measurement_name: m.measurement_name.trim(),
          location: m.location.trim(),
        })),
      };

      const response = await postApi(`/tech-spec/template/create/`, payload);

      if (response.status === 200 || response.status === 201) {
        setPostApiResponse(true);
        setNotificationData(
          response.message || "Template updated successfully!"
        );
        setSelectedTemplateId("");
        await fetchInitialData();
      } else {
        setError("Failed to save template. Please try again.");
      }
    } catch (error: any) {
      setError(error.message || "Failed to save template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelAlert = () => {
    setPostApiResponse(false);
  };

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Add function to close template name modal
  const closeTemplateNameModal = () => {
    setTemplateNameModal({ ...templateNameModal, isOpen: false });
  };

  // Effect to restore focus after re-render
  useEffect(() => {
    if (focusState) {
      const restoreFocus = () => {
        let targetElement: HTMLInputElement | HTMLTextAreaElement | null = null;

        if (focusState.elementType === "templateName") {
          targetElement = templateNameRef.current;
        } else if (focusState.elementType === "templateDescription") {
          targetElement = templateDescriptionRef.current;
        } else if (
          focusState.elementType === "measurement" &&
          focusState.measurementIndex !== undefined &&
          focusState.measurementField
        ) {
          const key = `${focusState.measurementIndex}-${focusState.measurementField}`;
          targetElement = measurementRefs.current[key];
        }

        if (targetElement) {
          targetElement.focus();
          if (focusState.cursorPosition !== undefined) {
            targetElement.setSelectionRange(
              focusState.cursorPosition,
              focusState.cursorPosition
            );
          }
        }
      };

      // Use setTimeout to ensure DOM is updated
      const timeoutId = setTimeout(restoreFocus, 0);

      // Clear focus state
      setFocusState(null);

      return () => clearTimeout(timeoutId);
    }
  }, [focusState, editingMeasurements]);

  // Add focus handlers
  const handleInputFocus = (
    elementType: "templateName" | "templateDescription" | "measurement",
    measurementIndex?: number,
    measurementField?: keyof TemplateRow
  ) => {
    // This helps track which input is currently focused
  };

  const handleInputBlur = () => {
    // Optional: clear focus tracking when input loses focus naturally
  };

  // Add refs for input elements
  const templateNameRef = useRef<HTMLInputElement>(null);
  const templateDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const measurementRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer border border-blue-600 px-3 py-1"
            >
              {<IoMdArrowBack />} Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center w-full">
            Draft Template Manager
          </h1>
        </div>

        {/* Notification Banner */}
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
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex justify-between gap-2 bg-blue-50 px-4 py-3 border-b border-gray-200 text-wrap">
                <h2 className="font-semibold text-gray-800">Draft Templates</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : templateData?.length === 0 ? (
                  <div className="p-4 text-gray-500 italic">
                    No draft templates yet
                  </div>
                ) : (
                  templateData?.map((template) => (
                    <div
                      key={template.draft_id}
                      className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTemplateId === template.draft_id
                          ? "bg-blue-100 border-l-4 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleTemplateSelect(template.draft_id)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Updated:{" "}
                          {new Date(template.updated_at).toLocaleDateString()},{" "}
                          {new Date(template.updated_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTemplateId === template.draft_id && (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              wsStatus === "connected"
                                ? "bg-green-500"
                                : wsStatus === "connecting"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            title={`WebSocket: ${wsStatus}`}
                          ></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Template Editor/View */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              {selectedTemplateId ? (
                <div className="p-4">
                  {/* WebSocket Status Panel */}
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Real-time Connection Status
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-gray-600">
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
                    </div>

                    {/* Debounce Indicator */}
                    {isDebouncing && pendingUpdate && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center text-xs text-yellow-700">
                          <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          <span>
                            Pending update: {pendingUpdate.type} (sending in 2s)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex gap-2 mt-3">
                      {wsStatus === "disconnected" && (
                        <button
                          onClick={() => {
                            const token = getAuthToken();
                            if (token && selectedTemplateId) {
                              connectWebSocket(selectedTemplateId, token);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs hover:bg-green-700 transition-colors"
                        >
                          Connect WS
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Template Editor Form */}
                  {wsStatus === "connected" && (
                    <>
                      <div className="mb-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Name *
                          </label>
                          <input
                            ref={templateNameRef}
                            type="text"
                            value={editingTemplateName}
                            onChange={(e) =>
                              handleTemplateNameChange(e.target.value)
                            }
                            onFocus={() => handleInputFocus("templateName")}
                            onBlur={handleInputBlur}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="e.g., Tops Template"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Description (Optional)
                          </label>
                          <textarea
                            ref={templateDescriptionRef}
                            value={editingTemplateDescription}
                            onChange={(e) =>
                              handleTemplateDescriptionChange(e.target.value)
                            }
                            onFocus={() =>
                              handleInputFocus("templateDescription")
                            }
                            onBlur={handleInputBlur}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Description of the template..."
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Measurements Section */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Template Measurements *
                        </h3>
                        <div className="border border-gray-200 rounded overflow-hidden">
                          <div className="bg-gray-50 grid grid-cols-[2fr_2fr_2fr_100px] gap-2 p-3 border-b border-gray-200 text-xs font-semibold text-gray-600">
                            <div>HEADER</div>
                            <div>MEASUREMENT TYPE</div>
                            <div>LOCATION</div>
                            <div>ACTION</div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {editingMeasurements.map((measurement, index) => (
                              <div
                                key={measurement.id}
                                className="grid grid-cols-[2fr_2fr_2fr_100px] gap-2 p-3"
                              >
                                <input
                                  ref={(el) => {
                                    if (el)
                                      measurementRefs.current[
                                        `${index}-header`
                                      ] = el;
                                  }}
                                  type="text"
                                  value={measurement.header}
                                  onChange={(e) =>
                                    handleMeasurementChange(
                                      index,
                                      "header",
                                      e.target.value
                                    )
                                  }
                                  onFocus={() =>
                                    handleInputFocus(
                                      "measurement",
                                      index,
                                      "header"
                                    )
                                  }
                                  onBlur={handleInputBlur}
                                  className="p-2 border border-gray-300 rounded text-sm"
                                  placeholder="Header"
                                />
                                <input
                                  ref={(el) => {
                                    if (el)
                                      measurementRefs.current[
                                        `${index}-measurement_name`
                                      ] = el;
                                  }}
                                  type="text"
                                  value={measurement.measurement_name}
                                  onChange={(e) =>
                                    handleMeasurementChange(
                                      index,
                                      "measurement_name",
                                      e.target.value
                                    )
                                  }
                                  onFocus={() =>
                                    handleInputFocus(
                                      "measurement",
                                      index,
                                      "measurement_name"
                                    )
                                  }
                                  onBlur={handleInputBlur}
                                  className="p-2 border border-gray-300 rounded text-sm"
                                  placeholder="Type"
                                />
                                <input
                                  ref={(el) => {
                                    if (el)
                                      measurementRefs.current[
                                        `${index}-location`
                                      ] = el;
                                  }}
                                  type="text"
                                  value={measurement.location}
                                  onChange={(e) =>
                                    handleMeasurementChange(
                                      index,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                  onFocus={() =>
                                    handleInputFocus(
                                      "measurement",
                                      index,
                                      "location"
                                    )
                                  }
                                  onBlur={handleInputBlur}
                                  className="p-2 border border-gray-300 rounded text-sm"
                                  placeholder="Location"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeMeasurement(index)}
                                  className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 text-sm rounded"
                                  disabled={editingMeasurements.length === 1}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={saveTemplate}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? "Saving..." : "Save Template"}
                        </button>
                        <button
                          onClick={() => {
                            disconnectWebSocket();
                            setSelectedTemplateId(null);
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Draft Template
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose a draft template from the list to view and edit its
                    contents with real-time WebSocket updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Template Name Required Modal */}
      <ConfirmationModal
        isOpen={templateNameModal.isOpen}
        onClose={closeTemplateNameModal}
        onConfirm={closeTemplateNameModal}
        title={templateNameModal.title}
        message={templateNameModal.message}
        type={templateNameModal.type}
      />
    </div>
  );
};

export default LayoutComponents(DraftTemplate);
