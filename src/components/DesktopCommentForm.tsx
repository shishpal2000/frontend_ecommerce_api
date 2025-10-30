"use client";

import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { Person } from "@/types/Comments";
import { CommentRow } from "@/types";
import React, { useState, useRef, useEffect, useCallback } from "react";
import DesktopCommentView from "./DesktopCommentView";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import {
  handleRowsDataReceivedComment,
  addRow,
  deleteRow,
  updateRow,
  objectUtils,
} from "@/utils/websocketComment";

interface DesktopCommentFormProps {
  people: Person[];
  protoId: string | null;
}

function DesktopCommentForm({ people, protoId }: DesktopCommentFormProps) {
  const [viewMode, setViewMode] = useState<boolean>(true);
  const [rows, setRows] = useState<CommentRow[]>([]);

  // Modal states
  const [photoModal, setPhotoModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    rowIndex: number | null;
  }>({
    isOpen: false,
    imageUrl: null,
    rowIndex: null,
  });

  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string | null;
    rowIndex: number | null;
  }>({
    isOpen: false,
    videoUrl: null,
    rowIndex: null,
  });

  // Refs for form inputs
  const actualCommentRefs = useRef<{
    [key: string]: HTMLTextAreaElement | null;
  }>({});
  const interpretedCommentRefs = useRef<{
    [key: string]: HTMLTextAreaElement | null;
  }>({});
  const photoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Error state for media
  const [imageErrorRows, setImageErrorRows] = useState<{
    [rowId: string]: boolean;
  }>({});
  const [videoErrorRows, setVideoErrorRows] = useState<{
    [rowId: string]: boolean;
  }>({});

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    submit: false,
  });

  // Feedback state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
    for: string | null;
  }>({
    type: null,
    message: "",
    for: null,
  });

  // Hooks
  const { user } = useAuth();
  const { postApi } = useGeneralApiCall();

  // ===== WEBSOCKET IMPLEMENTATION (DRAFT-TEMPLATE PATTERN) =====
  const [connectionUuid, setConnectionUuid] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReceivingDataRef = useRef<boolean>(false);
  const lastBroadcastRef = useRef<string>("");

  const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  const getAuthToken = () => {
    return localStorage.getItem("access") || "";
  };

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setWsStatus("connecting");
      const uuid = uuidv4();
      setConnectionUuid(uuid);

      const wsUrl = `${WS_BASE_URL}/v1/comments/draft/?token=${getAuthToken()}&proto_id=${protoId}&uuid=${uuid}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        setWsConnection(ws);
        setError(null);

        // Send initial connection message
        const initialMessage = {
          type: "connection_established",
          proto_id: protoId,
          user_id: user?.user_id?.toString(),
          uuid: uuid,
          timestamp: new Date().toISOString(),
        };

        ws.send(JSON.stringify(initialMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle rows data
          handleRowsDataReceived(data);
        } catch (error) {
     
          setError("Error processing WebSocket message");
        }
      };

      ws.onerror = (error) => {
    
        setWsStatus("disconnected");
        setError("WebSocket connection error");
      };

      ws.onclose = (event) => {
        setWsStatus("disconnected");
        setWsConnection(null);
        wsRef.current = null;

        if (event.code !== 1000) {
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
 
      setWsStatus("disconnected");
      setError("Failed to establish WebSocket connection");
    }
  }, [protoId, user]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounting");
      wsRef.current = null;
      setWsConnection(null);
      setWsStatus("disconnected");
      setConnectionUuid(null);
    }
  }, []);

  // Handle incoming rows data
  const handleRowsDataReceived = useCallback(
    (data: any) => {
      // Skip messages from the same user
      if (data.user_id && data.user_id === user?.user_id?.toString()) {
        return;
      }

      // Filter by proto_id to ensure relevance
      if (data.proto_id && data.proto_id !== protoId) {
        return;
      }

      // Set flag to indicate we're receiving data
      isReceivingDataRef.current = true;

      handleRowsDataReceivedComment(data, setRows);

      // Reset flag after processing
      setTimeout(() => {
        isReceivingDataRef.current = false;
      }, 100);
    },
    [user, protoId]
  );

  // Send debounced WebSocket message
  const sendDebouncedWebSocketMessage = useCallback(
    (rowsData: CommentRow[]) => {
      if (!wsConnection || wsStatus !== "connected") {
        return;
      }

      // Prevent infinite loops - don't send if we're currently receiving data
      if (isReceivingDataRef.current) {
        return;
      }

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced sending
      debounceTimeoutRef.current = setTimeout(() => {
        try {
          // Filter rows to send only meaningful data (include both existing and draft rows with content)
          const rowsToSend = rowsData.filter(
            (row) =>
              // Include existing rows (server data) OR draft rows with content
              row.isExisting ||
              row.person ||
              row.interpreted_comment?.trim() ||
              row.actual_comment?.trim() ||
              row.uploadedImageUrl ||
              row.uploadedVideoUrl ||
              row.photoPreview ||
              row.videoPreview
          );

          if (rowsToSend.length === 0) {
            return;
          }

          const message = {
            type: "draft_rows_update",
            proto_id: protoId,
            user_id: user?.user_id?.toString(),
            uuid: connectionUuid,
            timestamp: new Date().toISOString(),
            content: {
              rows: rowsToSend.map(objectUtils),
            },
          };

          // Check for duplicate messages
          const messageString = JSON.stringify(message.content);
          if (lastBroadcastRef.current === messageString) {
            return;
          }

          lastBroadcastRef.current = messageString;

          wsConnection.send(JSON.stringify(message));
        } catch (error) {
          console.error("❌ Error sending WebSocket message:", error);
          setError("Error sending WebSocket message");
        }
      }, 2000); // 2 second debounce
    },
    [wsConnection, wsStatus, protoId, user, connectionUuid]
  );

  // Connect WebSocket when component mounts
  useEffect(() => {
    if (user && protoId) {
      connectWebSocket();
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      disconnectWebSocket();
    };
  }, [user, protoId, connectWebSocket, disconnectWebSocket]);

  // Send WebSocket updates when rows change
  useEffect(() => {
    if (
      wsStatus === "connected" &&
      rows.length > 0 &&
      !isReceivingDataRef.current
    ) {
      sendDebouncedWebSocketMessage(rows);
    }
  }, [rows, wsStatus, sendDebouncedWebSocketMessage]);

  // Initialize rows with one empty row
  useEffect(() => {
    setRows([
      {
        id: Date.now().toString(),
        actual_comment: "",
        interpreted_comment: "",
        image: null,
        video: null,
        comment_by: "",
        comment_by_id: "",
        photoPreview: null,
        videoPreview: null,
        person: "",
        photo: null,
        videoFile: null,
        isExisting: false,
        uploadedImageUrl: null,
        uploadedVideoUrl: null,
        isImageUploading: false,
        isVideoUploading: false,
        imageUploadError: null,
        videoUploadError: null,
      },
    ]);
  }, []);

  // Send immediate WebSocket message (bypasses debounce)
  const sendImmediateWebSocketMessage = useCallback(
    (rowsData: CommentRow[]) => {
      if (!wsConnection || wsStatus !== "connected") {
        return;
      }

      try {
        const rowsToSend = rowsData.filter(
          (row) =>
            // Include existing rows (server data) OR draft rows with content
            row.isExisting ||
            row.person ||
            row.interpreted_comment?.trim() ||
            row.actual_comment?.trim() ||
            row.uploadedImageUrl ||
            row.uploadedVideoUrl ||
            row.photoPreview ||
            row.videoPreview
        );

        if (rowsToSend.length === 0) {
          return;
        }

        const message = {
          type: "draft_rows_update",
          proto_id: protoId,
          user_id: user?.user_id?.toString(),
          uuid: connectionUuid,
          timestamp: new Date().toISOString(),
          content: {
            rows: rowsToSend.map(objectUtils),
          },
        };

        wsConnection.send(JSON.stringify(message));
      } catch (error) {
        setError("Error sending immediate WebSocket message");
      }
    },
    [wsConnection, wsStatus, protoId, user, connectionUuid]
  );

  // S3 Upload Functions
  const uploadImageToS3 = async (rowId: string, file: File) => {
    // Prevent WebSocket broadcasts during upload
    isReceivingDataRef.current = true;

    updateRow(
      rowId,
      {
        isImageUploading: true,
        imageUploadError: null,
      },
      setRows,
      hasRowData,
      isReceivingDataRef
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response: any = await postApi("/media-upload/", formData);

      if (!response.status) {
        throw new Error(response.message || "Failed to upload image");
      }

      const imageUrl = response.data?.image_url || response.data?.url;

      updateRow(
        rowId,
        {
          uploadedImageUrl: imageUrl,
          isImageUploading: false,
          imageUploadError: null,
        },
        setRows,
        hasRowData,
        isReceivingDataRef
      );

      setFeedback({
        type: "success",
        message: "Image uploaded successfully!",
        for: `photo-${rowId}`,
      });

      // Reset flag to allow WebSocket broadcasting
      isReceivingDataRef.current = false;

      // Immediately broadcast the updated rows with the new image URL
      setTimeout(() => {
        if (wsConnection && wsStatus === "connected") {
          // Get the current rows state and send immediately
          setRows((currentRows) => {
            // Find the updated row
            const updatedRows = currentRows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    uploadedImageUrl: imageUrl,
                    isImageUploading: false,
                  }
                : row
            );

            // Send WebSocket message immediately (bypass debounce)
            sendImmediateWebSocketMessage(updatedRows);

            return updatedRows;
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error uploading image:", error);
      updateRow(
        rowId,
        {
          isImageUploading: false,
          imageUploadError:
            error instanceof Error ? error.message : "Upload failed",
          photo: null,
          photoPreview: null,
        },
        setRows,
        hasRowData,
        isReceivingDataRef
      );

      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to upload image",
        for: `photo-${rowId}`,
      });

      isReceivingDataRef.current = false;
    }
  };

  const uploadVideoToS3 = async (rowId: string, file: File) => {
    // Prevent WebSocket broadcasts during upload
    isReceivingDataRef.current = true;

    updateRow(
      rowId,
      {
        isVideoUploading: true,
        videoUploadError: null,
      },
      setRows,
      hasRowData,
      isReceivingDataRef
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response: any = await postApi("/media-upload/", formData);

      if (!response.status) {
        throw new Error(response.message || "Failed to upload video");
      }

      const videoUrl = response.data?.video_url || response.data?.url;

      updateRow(
        rowId,
        {
          uploadedVideoUrl: videoUrl,
          isVideoUploading: false,
          videoUploadError: null,
        },
        setRows,
        hasRowData,
        isReceivingDataRef
      );

      setFeedback({
        type: "success",
        message: "Video uploaded successfully!",
        for: `video-${rowId}`,
      });

      // Reset flag to allow WebSocket broadcasting
      isReceivingDataRef.current = false;

      // Immediately broadcast the updated rows with the new video URL
      setTimeout(() => {
        if (wsConnection && wsStatus === "connected") {
          // Get the current rows state and send immediately
          setRows((currentRows) => {
            // Find the updated row
            const updatedRows = currentRows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    uploadedVideoUrl: videoUrl,
                    isVideoUploading: false,
                  }
                : row
            );

            // Send WebSocket message immediately (bypass debounce)
            sendImmediateWebSocketMessage(updatedRows);

            return updatedRows;
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error uploading video:", error);
      updateRow(
        rowId,
        {
          isVideoUploading: false,
          videoUploadError:
            error instanceof Error ? error.message : "Upload failed",
          video: null,
          videoPreview: null,
        },
        setRows,
        hasRowData,
        isReceivingDataRef
      );

      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to upload video",
        for: `video-${rowId}`,
      });

      isReceivingDataRef.current = false;
    }
  };

  // Modal handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePhotoModal();
        closeVideoModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const openPhotoModal = (imageUrl: string, rowIndex: number) => {
    setPhotoModal({
      isOpen: true,
      imageUrl,
      rowIndex,
    });
    document.body.style.overflow = "hidden";
  };

  const closePhotoModal = () => {
    setPhotoModal({
      isOpen: false,
      imageUrl: null,
      rowIndex: null,
    });
    document.body.style.overflow = "unset";
  };

  const openVideoModal = (videoUrl: string, rowIndex: number) => {
    setVideoModal({
      isOpen: true,
      videoUrl,
      rowIndex,
    });
    document.body.style.overflow = "hidden";
  };

  const closeVideoModal = () => {
    setVideoModal({
      isOpen: false,
      videoUrl: null,
      rowIndex: null,
    });
    document.body.style.overflow = "unset";
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
    }
  };

  // Utility functions
  const hasRowData = (row: CommentRow): boolean => {
    return Boolean(
      row.person ||
        row.photo ||
        row.photoPreview ||
        row.uploadedImageUrl ||
        row.video ||
        row.videoPreview ||
        row.uploadedVideoUrl ||
        row.interpreted_comment?.trim() ||
        row.actual_comment?.trim()
    );
  };

  const isRowComplete = (row: CommentRow) => {
    return row.person && row.interpreted_comment.trim();
  };

  const getRowCounts = () => {
    const newRows = rows.filter((row) => !row.isExisting);
    const rowsWithData = newRows.filter(hasRowData);
    const completeRows = rowsWithData.filter(isRowComplete);
    const incompleteRows = rowsWithData.filter((row) => !isRowComplete(row));

    return {
      newRows: newRows.length,
      rowsWithData: rowsWithData.length,
      completeRows: completeRows.length,
      incompleteRows: incompleteRows.length,
    };
  };

  const counts = getRowCounts();

  // File handling functions
  const handlePhotoSelect = (
    rowId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setFeedback({
        type: "error",
        message: `Photo size exceeds the 20MB limit (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB)`,
        for: `photo-${rowId}`,
      });
      if (photoInputRefs.current[rowId]) {
        photoInputRefs.current[rowId]!.value = "";
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateRow(
        rowId,
        {
          photo: file,
          photoPreview: reader.result as string,
        },
        setRows,
        hasRowData,
        isReceivingDataRef
      );

      // Upload to S3 immediately
      uploadImageToS3(rowId, file);
    };

    reader.onerror = () => {
      setFeedback({
        type: "error",
        message: "Failed to read the image file. Please try another file.",
        for: `photo-${rowId}`,
      });
      if (photoInputRefs.current[rowId]) {
        photoInputRefs.current[rowId]!.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (
    rowId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setFeedback({
          type: "error",
          message: "Video file size must be less than 500MB",
          for: `video-${rowId}`,
        });
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      updateRow(
        rowId,
        {
          video: file,
          videoPreview: videoUrl,
        },
        setRows,
        hasRowData,
        isReceivingDataRef
      );

      // Upload to S3 immediately
      uploadVideoToS3(rowId, file);
    }
  };

  const removePhoto = (rowId: string) => {
    updateRow(
      rowId,
      {
        photo: null,
        photoPreview: null,
        uploadedImageUrl: null,
        imageUploadError: null,
      },
      setRows,
      hasRowData,
      isReceivingDataRef
    );
    if (photoInputRefs.current[rowId]) {
      photoInputRefs.current[rowId]!.value = "";
    }
  };

  const removeVideo = (rowId: string) => {
    updateRow(
      rowId,
      {
        video: null,
        videoPreview: null,
        uploadedVideoUrl: null,
        videoRemoved: true,
        videoUploadError: null,
      },
      setRows,
      hasRowData,
      isReceivingDataRef
    );
    if (videoInputRefs.current[rowId]) {
      videoInputRefs.current[rowId]!.value = "";
    }
  };

  // Comment synchronization
  const syncCommentFromRef = (rowId: string) => {
    const actualComment = actualCommentRefs.current[rowId]?.value || "";
    const interpretedComment =
      interpretedCommentRefs.current[rowId]?.value || "";
    updateRow(
      rowId,
      {
        actual_comment: actualComment,
        interpreted_comment: interpretedComment,
      },
      setRows,
      hasRowData,
      isReceivingDataRef
    );
  };

  // Form submission
  const handleSubmit = async () => {
    // Check if any uploads are in progress
    const uploadingRows = rows.filter(
      (row) => !row.isExisting && (row.isImageUploading || row.isVideoUploading)
    );

    if (uploadingRows.length > 0) {
      setFeedback({
        type: "error",
        message: "Please wait for all uploads to complete before submitting.",
        for: "submit",
      });
      return;
    }

    // Sync all comments from refs for new rows
    rows
      .filter((row) => !row.isExisting)
      .forEach((row) => {
        const actualComment = actualCommentRefs.current[row.id]?.value || "";
        const interpretedComment =
          interpretedCommentRefs.current[row.id]?.value || "";

        if (
          actualComment !== row.actual_comment ||
          interpretedComment !== row.interpreted_comment
        ) {
          updateRow(
            row.id,
            {
              actual_comment: actualComment,
              interpreted_comment: interpretedComment,
            },
            setRows,
            hasRowData,
            isReceivingDataRef
          );
        }
      });

    // Only process new rows with data
    const rowsWithData = rows.filter(
      (row) => !row.isExisting && hasRowData(row)
    );

    if (rowsWithData.length === 0) {
      setFeedback({
        type: "info",
        message: "Please add at least one new comment",
        for: "submit",
      });
      return;
    }

    // Validate all rows have required fields
    const incompleteRows = rowsWithData.filter(
      (row) => !row.person || !row.interpreted_comment.trim()
    );

    if (incompleteRows.length > 0) {
      const missingFields = incompleteRows.map((row) => {
        const missing = [];
        if (!row.person) missing.push("Person");
        if (!row.interpreted_comment.trim())
          missing.push("Interpreted Comment");
        return `Row ${
          rows.findIndex((r) => r.id === row.id) + 1
        }: ${missing.join(", ")}`;
      });

      setFeedback({
        type: "error",
        message: `Please complete all required fields: ${missingFields.join(
          ", "
        )}`,
        for: "submit",
      });
      return;
    }

    setLoadingStates((prev) => ({ ...prev, submit: true }));

    try {
      const formData = new FormData();

      rowsWithData.forEach((row, idx) => {
        formData.append(`comments[${idx}][comment_by_id]`, row.person || "");
        formData.append(
          `comments[${idx}][actual_comment]`,
          row.actual_comment || ""
        );
        formData.append(
          `comments[${idx}][interpreted_comment]`,
          row.interpreted_comment || ""
        );

        // Send S3 URLs instead of files
        if (row.uploadedImageUrl) {
          formData.append(`comments[${idx}][image]`, row.uploadedImageUrl);
        }

        if (row.uploadedVideoUrl) {
          formData.append(`comments[${idx}][video]`, row.uploadedVideoUrl);
        }
      });

      const response = await postApi(
        `/comment/${protoId}/add-comment/desktop/`,
        formData
      );

      if (response.status === 201) {
        setViewMode(true);
      }

      setFeedback({
        type: "success",
        message: `${rowsWithData.length} comment${
          rowsWithData.length > 1 ? "s" : ""
        } submitted successfully!`,
        for: "general",
      });

      // Reset to just one empty row
      setRows([
        {
          id: Date.now().toString(),
          person: "",
          photo: null,
          photoPreview: null,
          video: null,
          videoPreview: null,
          actual_comment: "",
          interpreted_comment: "",
          image: null,
          comment_by: "",
          comment_by_id: "",
          isExisting: false,
          uploadedImageUrl: null,
          uploadedVideoUrl: null,
          isImageUploading: false,
          isVideoUploading: false,
          imageUploadError: null,
          videoUploadError: null,
        },
      ]);
    } catch (error) {
      console.error("Error submitting comments:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to submit comments",
        for: "submit",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, submit: false }));
    }
  };

  // WebSocket Status Component
  const renderWebSocketStatus = () => (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          wsStatus === "connected"
            ? "bg-green-500"
            : wsStatus === "connecting"
            ? "bg-yellow-500 animate-pulse"
            : "bg-red-500"
        }`}
        title={
          wsStatus === "connected"
            ? `Connected to real-time updates`
            : wsStatus === "connecting"
            ? "Connecting to real-time updates..."
            : "Real-time updates disconnected"
        }
      />
      <span className="text-sm text-gray-600">
        {wsStatus === "connected"
          ? "Live"
          : wsStatus === "connecting"
          ? "Connecting..."
          : "Offline"}
      </span>
      {error && (
        <span className="text-xs text-red-500" title={error}>
          (Error)
        </span>
      )}
    </div>
  );

  // Feedback Message Component
  const FeedbackMessage = ({
    type,
    message,
    onClose,
  }: {
    type: "success" | "error" | "info" | null;
    message: string;
    onClose: () => void;
  }) => {
    if (!type || !message) return null;

    const bgColors = {
      success: "bg-green-100 border-green-500 text-green-700",
      error: "bg-red-100 border-red-500 text-red-700",
      info: "bg-blue-100 border-blue-500 text-blue-700",
    };

    return (
      <div className={`${bgColors[type]} border-l-4 p-4 mb-4 relative`}>
        <button
          onClick={onClose}
          className="absolute top-[50%] -translate-y-[60%] right-2 text-2xl text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        <p className="font-medium">{message}</p>
      </div>
    );
  };

  // Photo Modal Component
  const PhotoModal = () => {
    if (!photoModal.isOpen || !photoModal.imageUrl) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
        <div className="relative max-w-4xl max-h-full p-4">
          <button
            onClick={closePhotoModal}
            className="absolute top-2 right-2 z-10 bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>

          <img
            src={photoModal.imageUrl}
            alt={`Comment ${
              photoModal.rowIndex !== null ? photoModal.rowIndex + 1 : ""
            } photo`}
            className="max-w-[500px] max-h-[80%] object-contain"
          />

          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            Comment #
            {photoModal.rowIndex !== null ? photoModal.rowIndex + 1 : ""} Photo
          </div>
        </div>
      </div>
    );
  };

  // Video Modal Component
  const VideoModal = () => {
    if (!videoModal.isOpen || !videoModal.videoUrl) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
        <div className="relative max-w-4xl max-h-full p-4">
          <button
            onClick={closeVideoModal}
            className="absolute top-2 right-2 z-10 bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>

          <video
            ref={videoPlayerRef}
            src={videoModal.videoUrl}
            controls
            autoPlay
            className="max-w-full max-h-full"
            style={{ maxHeight: "80vh" }}
          >
            Your browser does not support the video tag.
          </video>

          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            Comment #
            {videoModal.rowIndex !== null ? videoModal.rowIndex + 1 : ""} Video
          </div>
        </div>
      </div>
    );
  };

  // Actions Cell Renderer
  const renderActionsCell = (row: CommentRow) => {
    const rowFeedback =
      feedback.for === row.id ? (
        <div
          className={`mb-2 text-xs p-1 ${
            feedback.type === "error"
              ? "bg-red-100 text-red-700"
              : feedback.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {feedback.message}
          <button
            onClick={() => setFeedback({ type: null, message: "", for: null })}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
      ) : null;

    return (
      <div className="flex flex-col gap-2">
        {rowFeedback}
        {!row.isExisting && (
          <button
            type="button"
            onClick={() => deleteRow(row.id, setRows, hasRowData)}
            className="px-3 py-2 bg-red-500 text-white text-xs cursor-pointer hover:bg-red-600"
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Global feedback message */}
      {feedback.type && feedback.for === "general" && (
        <FeedbackMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: null, message: "", for: null })}
        />
      )}

      {/* Submit feedback message */}
      {feedback.type && feedback.for === "submit" && (
        <FeedbackMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: null, message: "", for: null })}
        />
      )}

      {/* Upload feedback messages */}
      {feedback.type &&
        (feedback.for?.startsWith("photo-") ||
          feedback.for?.startsWith("video-")) && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback({ type: null, message: "", for: null })}
          />
        )}

      {viewMode ? (
        <div>
          <DesktopCommentView
            people={people}
            
            setViewMode={setViewMode}
            protoId={protoId || ""}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Comments Table</h2>
              {renderWebSocketStatus()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
              >
                View Comments
              </button>

              <button
                onClick={() => addRow(setRows)}
                className="px-4 py-2 bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
              >
                Add Row
              </button>
              {/* <button
                className="px-4 py-2 bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                onClick={() =>
                  router.push(`/video-comment/?proto_id=${protoId}`)
                }
              >
                Create video Comment
              </button> */}
              <button
                onClick={handleSubmit}
                disabled={loadingStates.submit || counts.rowsWithData === 0}
                className="px-4 py-2 bg-green-600 text-white cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Submit all new comments"
              >
                {loadingStates.submit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Comments"
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    S.No
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Comment By *
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Actual Comment
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Interpreted Comment *
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Comment Photo <span className="text-xs">(max 20MB)</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Comment Video <span className="text-xs">(max 500MB)</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="transition-all duration-200">
                    <td className="border border-gray-300 px-4 py-4 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      <select
                        value={row.person || ""}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            { person: e.target.value },
                            setRows,
                            hasRowData,
                            isReceivingDataRef
                          )
                        }
                        className="w-full p-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Person</option>
                        {people.map((person) => (
                          <option
                            key={person.user_id}
                            value={person.user_id}
                            className="capitalize"
                          >
                            {person.name || "No Name"}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      <textarea
                        ref={(el) => {
                          actualCommentRefs.current[row.id] = el;
                        }}
                        rows={5}
                        defaultValue={row.actual_comment}
                        onBlur={() => syncCommentFromRef(row.id)}
                        placeholder="Enter actual comment..."
                        className="w-full h-full p-2 focus:ring-transparent focus:border-transparent resize-none"
                      />
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      <textarea
                        ref={(el) => {
                          interpretedCommentRefs.current[row.id] = el;
                        }}
                        rows={5}
                        defaultValue={row.interpreted_comment}
                        onBlur={() => syncCommentFromRef(row.id)}
                        placeholder="Enter interpreted comment..."
                        className="w-full h-full p-2 focus:ring-transparent focus:border-transparent resize-none"
                      />
                    </td>

                    <td className="border border-gray-300 px-4 py-4 text-center">
                      {/* Upload status indicator */}
                      {row.isImageUploading && (
                        <div className="flex flex-col items-center justify-center mb-2">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                          <span className="text-xs text-blue-600">
                            Uploading...
                          </span>
                        </div>
                      )}

                      {/* Upload error */}
                      {row.imageUploadError && (
                        <div className="mb-2 p-2 bg-red-100 text-red-700 text-xs rounded">
                          {row.imageUploadError}
                        </div>
                      )}

                      {row.photoPreview && !imageErrorRows[row.id] ? (
                        <div className="relative inline-block">
                          <img
                            src={row.photoPreview}
                            alt="Preview"
                            className="w-full h-96 object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              openPhotoModal(row.photoPreview!, index)
                            }
                            title="Click to view full size"
                            onError={() =>
                              setImageErrorRows((prev) => ({
                                ...prev,
                                [row.id]: true,
                              }))
                            }
                          />
                          <button
                            onClick={() => removePhoto(row.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ) : row.photoPreview && imageErrorRows[row.id] ? (
                        <div className="flex flex-col items-center justify-center h-32">
                          <div className="text-red-500 text-sm mt-2">
                            Preview not available
                          </div>
                          <a
                            href={row.photoPreview}
                            download={`comment-image-${row.id}`}
                            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                          >
                            Download Image
                          </a>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              photoInputRefs.current[row.id]?.click()
                            }
                            disabled={row.isImageUploading}
                            className={`px-3 py-2 text-white text-xs cursor-pointer transition-colors ${
                              row.isImageUploading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                          >
                            {row.isImageUploading
                              ? "Uploading..."
                              : "Upload Photo"}
                          </button>
                          <input
                            ref={(el) => {
                              photoInputRefs.current[row.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoSelect(row.id, e)}
                            disabled={row.isImageUploading}
                            className="hidden"
                          />
                        </>
                      )}
                    </td>

                    <td className="border border-gray-300 px-4 py-4 text-center">
                      {/* Upload status indicator */}
                      {row.isVideoUploading && (
                        <div className="flex flex-col items-center justify-center mb-2">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                          <span className="text-xs text-blue-600">
                            Uploading...
                          </span>
                        </div>
                      )}

                      {/* Upload error */}
                      {row.videoUploadError && (
                        <div className="mb-2 p-2 bg-red-100 text-red-700 text-xs rounded">
                          {row.videoUploadError}
                        </div>
                      )}

                      {row.videoPreview && !videoErrorRows[row.id] ? (
                        <div className="relative inline-block">
                          <video
                            src={row.videoPreview}
                            className="w-full h-36 object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                            muted
                            onClick={() =>
                              openVideoModal(row.videoPreview!, index)
                            }
                            title="Click to play video"
                            onError={() =>
                              setVideoErrorRows((prev) => ({
                                ...prev,
                                [row.id]: true,
                              }))
                            }
                          />
                          <button
                            onClick={() => removeVideo(row.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
                          >
                            ×
                          </button>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black bg-opacity-50 rounded-full p-1">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : row.videoPreview && videoErrorRows[row.id] ? (
                        <div className="flex flex-col items-center justify-center h-32">
                          <div className="text-red-500 text-sm mt-2">
                            Preview not available
                          </div>
                          <a
                            href={row.videoPreview}
                            download={`comment-video-${row.id}`}
                            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                          >
                            Download Video
                          </a>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              videoInputRefs.current[row.id]?.click()
                            }
                            disabled={row.isVideoUploading}
                            className={`px-3 py-2 text-white text-xs cursor-pointer transition-colors ${
                              row.isVideoUploading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                          >
                            {row.isVideoUploading
                              ? "Uploading..."
                              : "Upload Video"}
                          </button>
                          <input
                            ref={(el) => {
                              videoInputRefs.current[row.id] = el;
                            }}
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoSelect(row.id, e)}
                            disabled={row.isVideoUploading}
                            className="hidden"
                          />
                        </>
                      )}
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      {renderActionsCell(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PhotoModal />
      <VideoModal />
    </div>
  );
}

export default DesktopCommentForm;
