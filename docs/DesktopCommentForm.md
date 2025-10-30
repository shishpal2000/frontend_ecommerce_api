"use client";

import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { Person } from "@/types/Comments";
import React, { useState, useRef, useEffect, useCallback } from "react";
import DesktopCommentView from "./DesktopCommentView";
import { useWebSocket } from "@/utils/websocket";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface CommentRow {
  id: string;
  actual_comment: string;
  interpreted_comment: string;
  image: string | File | null;
  video: string | File | null;
  comment_by: string;
  comment_by_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_collection_comment?: boolean;
  can_edit?: boolean;
  // For new comments only:
  photoPreview?: string | null;
  videoPreview?: string | null;
  person?: string;
  photo?: File | null;
  videoFile?: File | null;
  isExisting?: boolean;
  videoRemoved?: boolean;
  permissions?: {
    can_edit: boolean;
    can_delete: boolean;
  };
  // S3 URLs for uploaded files
  uploadedImageUrl?: string | null;
  uploadedVideoUrl?: string | null;
  // Upload states
  isImageUploading?: boolean;
  isVideoUploading?: boolean;
  imageUploadError?: string | null;
  videoUploadError?: string | null;
}

interface DesktopCommentFormProps {
  people: Person[];
  protoId: string | null;
}

function DesktopCommentForm({ people, protoId }: DesktopCommentFormProps) {
  // State variables
  const router = useRouter();
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

  // Ref to track last processed message to prevent infinite loops
  const lastProcessedMessageRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

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

  // WebSocket Configuration
  const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  const getAuthToken = () => {
    return localStorage.getItem("access") || "";
  };

  // WebSocket connection with proper configuration
  const webSocket = useWebSocket({
    url: `${WS_BASE_URL}/v1/comments/draft/?token=${getAuthToken()}&proto_id=${protoId}`,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
  });

  // FIXED: WebSocket message broadcasting for comment creation
  const broadcastCommentCreation = useCallback(
    (commentData: any) => {
      console.log("🚀 broadcastCommentCreation called with:", commentData);
      console.log("🔗 WebSocket connected:", webSocket.isConnected);

      if (!commentData) {
        console.error("❌ No comment data provided to broadcast");
        return;
      }

      if (!webSocket.isConnected) {
        console.log("❌ WebSocket not connected, cannot send rows data");
        return;
      }

      try {
        // Handle both single object and array of comments
        const commentsToSend = Array.isArray(commentData)
          ? commentData
          : [commentData];

        console.log("📤 Preparing to send comments:", commentsToSend.length);

        // Send each comment individually with proper structure
        commentsToSend.forEach((singleComment, index) => {
          console.log(`📋 Processing comment ${index + 1}:`, singleComment);

          // Create the message in the format your server expects
          const message = {
            type: "comment",
            proto_id: protoId,
            user_id: user?.user_id?.toString(),
            timestamp: new Date().toISOString(),
            content: {
              rows,
            },
          };

          console.log(`📋 Sending message ${index + 1}:`, message);

          // Send the message
          const sent = webSocket.sendMessage(message);
          console.log("message sent status:", sent);
        });
      } catch (error) {
        console.error("❌ Error in broadcastCommentCreation:", error);
      }
    },
    [webSocket, protoId, rows]
  );
  // Handle incoming WebSocket messages - FIXED VERSION
  useEffect(() => {
    if (webSocket.lastMessage && !isProcessingRef.current) {
      const message: any = webSocket.lastMessage; // Cast to any to handle dynamic server properties

      // Prevent concurrent processing
      isProcessingRef.current = true;

      // Create a unique message identifier to prevent duplicate processing
      const messageId = `${message.draft_id || "msg"}_${
        message.created_at || message.updated_at || Date.now()
      }`;

      // Check if we've already processed this message
      if (lastProcessedMessageRef.current === messageId) {

        isProcessingRef.current = false;
        return;
      }

      // Update the last processed message ID
      lastProcessedMessageRef.current = messageId;

      console.log("📨 Received WebSocket message:", message);
      console.log("🆔 Processing message ID:", messageId);
      console.log("🔍 Message structure:", {
        hasType: !!message.type,
        hasDraftId: !!message.draft_id,
        hasProtoId: !!message.proto_id,
        hasContent: !!message.content,
        hasRows: !!(message.content && message.content.rows),
        rowsLength: message.content?.rows?.length || 0,
      });

      // Handle different message structures - FIXED LOGIC
      let messageType = message.type;
      let messageContent = message.content || message;

      // Since your WebSocket response doesn't have a 'type' field,
      // we need to infer the type from the message structure
      if (!messageType || messageType === undefined) {
        console.log(
          "⚠️ Message type is undefined, inferring from structure..."
        );

        if (
          message.draft_id &&
          message.content &&
          message.content.rows &&
          Array.isArray(message.content.rows)
        ) {
          messageType = "draft_rows_update";
          messageContent = message.content;
          console.log(
            "✅ Detected as draft_rows_update with",
            message.content.rows.length,
            "rows"
          );
        } else if (
          message.content &&
          message.content.rows &&
          Array.isArray(message.content.rows)
        ) {
          messageType = "rows_update";
          messageContent = message.content;
          console.log(
            "✅ Detected as rows_update with",
            message.content.rows.length,
            "rows"
          );
        } else if (message.proto_id && message.content) {
          messageType = "proto_update";
          messageContent = message.content;
          console.log("✅ Detected as proto_update");
        } else {
          messageType = "unknown";
          console.log("❓ Could not determine message type");
        }
      }

      console.log("🔄 Processing message type:", messageType);

      // Skip messages from the same user if applicable
      if (message.user_id && message.user_id === user?.user_id?.toString()) {
        console.log("⏭️ Skipping own message");
        return;
      }

      // Filter by proto_id to ensure relevance
      if (message.proto_id && message.proto_id !== protoId) {
        console.log(
          "⏭️ Skipping message from different proto:",
          message.proto_id
        );
        return;
      }

      switch (messageType) {
        case "draft_rows_update":
        case "rows_update":
        case "proto_update":
        case "comment": // Keep your original case for backward compatibility
          if (
            messageContent &&
            messageContent.rows &&
            Array.isArray(messageContent.rows)
          ) {
            console.log(
              "🔄 Processing rows update:",
              messageContent.rows.length,
              "rows"
            );
            console.log("📊 Incoming rows data:", messageContent.rows);

            // Transform incoming rows to match CommentRow interface
            const incomingRows: CommentRow[] = messageContent.rows.map(
              (row: any, index: number) => {
                console.log(`📝 Processing row ${index + 1}:`, row);

                return {
                  // Core identification - Use more unique ID generation
                  id:
                    row.id ||
                    `ws_${message.draft_id || "msg"}_${index}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,

                  // Comment content
                  actual_comment: row.actual_comment || "",
                  interpreted_comment: row.interpreted_comment || "",
                  comment_by: row.comment_by || "",
                  comment_by_id: row.comment_by_id || "",

                  // Media files
                  image: row.image || null,
                  video: row.video || null,

                  // Timestamps
                  created_at: row.created_at || message.created_at,
                  updated_at: row.updated_at || message.updated_at,
                  created_by: row.created_by,
                  updated_by: row.updated_by,

                  // UI-specific fields
                  photoPreview:
                    row.photoPreview ||
                    (row.uploadedImageUrl ? row.uploadedImageUrl : null),
                  videoPreview:
                    row.videoPreview ||
                    (row.uploadedVideoUrl ? row.uploadedVideoUrl : null),
                  person: row.person || row.comment_by_id || "",
                  photo: row.photo || null,
                  videoFile: row.videoFile || null,

                  // Status flags - IMPORTANT: Set based on incoming data
                  isExisting:
                    row.isExisting !== undefined ? row.isExisting : true, // Mark as existing from server
                  videoRemoved: row.videoRemoved || false,
                  can_edit: row.can_edit !== undefined ? row.can_edit : false,

                  // S3 URLs
                  uploadedImageUrl: row.uploadedImageUrl || null,
                  uploadedVideoUrl: row.uploadedVideoUrl || null,

                  // Upload states
                  isImageUploading: row.isImageUploading || false,
                  isVideoUploading: row.isVideoUploading || false,
                  imageUploadError: row.imageUploadError || null,
                  videoUploadError: row.videoUploadError || null,

                  // Optional metadata
                  is_collection_comment: row.is_collection_comment,
                  permissions: row.permissions || {
                    can_edit: row.can_edit || false,
                    can_delete: row.can_delete || false,
                  },
                };
              }
            );

            console.log("✅ Transformed", incomingRows.length, "incoming rows");
            console.log("📊 Transformed rows:", incomingRows);

            // Smart merging logic - FIXED FOR DUPLICATES
            setRows((prevRows) => {
              console.log("📊 Current rows before merge:", prevRows.length);
              console.log("📊 Current rows:", prevRows);
              console.log("📊 Incoming rows to merge:", incomingRows.length);

              // Strategy: Replace server rows, keep local draft rows
              const localDraftRows = prevRows.filter(
                (row) =>
                  !row.isExisting &&
                  (row.person ||
                    row.interpreted_comment?.trim() ||
                    row.actual_comment?.trim() ||
                    row.photoPreview ||
                    row.videoPreview)
              );

              console.log(
                "📝 Preserving",
                localDraftRows.length,
                "local draft rows"
              );
              console.log("📝 Local draft rows:", localDraftRows);

              // Remove existing server rows to prevent duplicates
              const existingServerRows = prevRows.filter(
                (row) => row.isExisting
              );
              const existingServerRowIds = new Set(
                existingServerRows.map((row) => row.id)
              );

              // Filter incoming rows to avoid duplicates based on ID
              const uniqueIncomingRows = incomingRows.filter(
                (row) => !existingServerRowIds.has(row.id)
              );

              console.log(
                "🔄 Filtered incoming rows to prevent duplicates:",
                uniqueIncomingRows.length
              );

              // Combine: unique incoming server rows + existing server rows + local draft rows
              const mergedRows = [
                ...existingServerRows,
                ...uniqueIncomingRows,
                ...localDraftRows,
              ];

              // Ensure we always have at least one empty row for new input
              const hasEmptyDraftRow = mergedRows.some(
                (row) =>
                  !row.isExisting &&
                  !row.person &&
                  !row.interpreted_comment?.trim() &&
                  !row.actual_comment?.trim() &&
                  !row.photoPreview &&
                  !row.videoPreview
              );

              if (!hasEmptyDraftRow) {
             
                mergedRows.push({
                  id: `draft_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
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
                });
              }

              console.log("📊 Final merged rows:", mergedRows.length);
              console.log("📊 Final rows breakdown:");
              console.log("  - Server rows:", incomingRows.length);
              console.log("  - Local drafts:", localDraftRows.length);
              console.log("  - Total:", mergedRows.length);

              return mergedRows;
            });

            console.log("✅ Successfully updated rows from WebSocket");
          } else {
            console.log("❌ No rows found in message content");
            console.log(
              "📋 Available content keys:",
              messageContent ? Object.keys(messageContent) : "No content"
            );
          }
          break;

        case "image_upload":
          // Handle image upload notifications from other users
          if (
            messageContent &&
            messageContent.row_id &&
            messageContent.image_url
          ) {
            console.log(
              "📸 Processing image upload notification:",
              messageContent
            );

            setRows((prevRows) => {
              return prevRows.map((row) => {
                if (row.id === messageContent.row_id) {
                  console.log(
                    `🖼️ Updating row ${row.id} with image URL:`,
                    messageContent.image_url
                  );
                  return {
                    ...row,
                    uploadedImageUrl: messageContent.image_url,
                    photoPreview: messageContent.image_url,
                    image: messageContent.image_url,
                    isImageUploading: false,
                    imageUploadError: null,
                  };
                }
                return row;
              });
            });
          }
          break;

        case "video_upload":
          // Handle video upload notifications from other users
          if (
            messageContent &&
            messageContent.row_id &&
            messageContent.video_url
          ) {
            console.log(
              "🎥 Processing video upload notification:",
              messageContent
            );

            setRows((prevRows) => {
              return prevRows.map((row) => {
                if (row.id === messageContent.row_id) {
                  console.log(
                    `🎬 Updating row ${row.id} with video URL:`,
                    messageContent.video_url
                  );
                  return {
                    ...row,
                    uploadedVideoUrl: messageContent.video_url,
                    videoPreview: messageContent.video_url,
                    video: messageContent.video_url,
                    isVideoUploading: false,
                    videoUploadError: null,
                  };
                }
                return row;
              });
            });
          }
          break;

        case "ping":
        case "pong":
          // Ignore heartbeat messages
          console.log("💓 Heartbeat:", messageType);
          break;

        default:
          console.log(
            "🔍 Unknown message type, attempting fallback processing..."
          );

          // Fallback: Try to process any message that has the expected structure
          if (
            message.content &&
            message.content.rows &&
            Array.isArray(message.content.rows)
          ) {
            console.log(
              "🔄 Found rows in unknown message, processing as fallback"
            );

            // Process the same way as above
            const fallbackRows: CommentRow[] = message.content.rows.map(
              (row: any, index: number) => ({
                id:
                  row.id ||
                  `fallback_${
                    message.draft_id || "msg"
                  }_${index}_${Math.random().toString(36).substr(2, 9)}`,
                actual_comment: row.actual_comment || "",
                interpreted_comment: row.interpreted_comment || "",
                comment_by: row.comment_by || "",
                comment_by_id: row.comment_by_id || "",
                image: row.image || null,
                video: row.video || null,
                created_at: row.created_at || message.created_at,
                updated_at: row.updated_at || message.updated_at,
                isExisting:
                  row.isExisting !== undefined ? row.isExisting : true,
                can_edit: row.can_edit !== undefined ? row.can_edit : false,
                uploadedImageUrl: row.uploadedImageUrl,
                uploadedVideoUrl: row.uploadedVideoUrl,
                photoPreview: row.photoPreview,
                videoPreview: row.videoPreview,
                person: row.person,
                photo: row.photo,
                videoFile: row.videoFile,
                videoRemoved: row.videoRemoved || false,
                isImageUploading: row.isImageUploading || false,
                isVideoUploading: row.isVideoUploading || false,
                imageUploadError: row.imageUploadError,
                videoUploadError: row.videoUploadError,
              })
            );

            console.log("✅ Processed fallback rows:", fallbackRows.length);

            setRows((prevRows) => {
              const localDrafts = prevRows.filter((row) => !row.isExisting);
              const finalRows = [...fallbackRows, ...localDrafts];

              // Ensure empty row
              const hasEmpty = finalRows.some(
                (row) =>
                  !row.isExisting &&
                  !row.person &&
                  !row.interpreted_comment?.trim()
              );

              if (!hasEmpty) {
                finalRows.push({
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
                });
              }

              return finalRows;
            });
          } else {
            console.log("❓ Completely unknown message structure - ignoring");
          }
          break;
      }

      // Reset processing flag
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    }
  }, [webSocket.lastMessage, protoId, user?.user_id]);

  // Connect WebSocket when component mounts and user is authenticated
  useEffect(() => {
    if (user && protoId && getAuthToken()) {
      console.log("🔌 Connecting to WebSocket...");
      webSocket.connect();
    } else {
      console.log("❌ Missing required data for WebSocket connection:", {
        user: !!user,
        protoId: !!protoId,
        token: !!getAuthToken(),
      });
    }

    return () => {
      if (webSocket.isConnected) {
        console.log("🔌 Disconnecting WebSocket...");
        webSocket.disconnect();
      }
    };
  }, [user, protoId]);

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

  // S3 Upload Functions
  const uploadImageToS3 = async (rowId: string, file: File) => {
    updateRow(rowId, {
      isImageUploading: true,
      imageUploadError: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response: any = await postApi("/media-upload/", formData);

      if (!response.status) {
        throw new Error(response.message || "Failed to upload image");
      }

      const imageUrl = response.data?.image_url || response.data?.url;

      updateRow(rowId, {
        uploadedImageUrl: imageUrl,
        isImageUploading: false,
        imageUploadError: null,
      });

      setFeedback({
        type: "success",
        message: "Image uploaded successfully!",
        for: `photo-${rowId}`,
      });

      // Broadcast the image upload update via WebSocket
      const updatedRow = rows.find((row) => row.id === rowId);
      if (updatedRow && webSocket.isConnected) {
        const broadcastMessage = {
          type: "image_upload",
          proto_id: protoId,
          user_id: user?.user_id?.toString(),
          timestamp: new Date().toISOString(),
          content: {
            row_id: rowId,
            image_url: imageUrl,
            row_data: {
              ...updatedRow,
              uploadedImageUrl: imageUrl,
              isImageUploading: false,
              imageUploadError: null,
            },
          },
        };

        console.log("📤 Broadcasting image upload:", broadcastMessage);
        webSocket.sendMessage(broadcastMessage);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      updateRow(rowId, {
        isImageUploading: false,
        imageUploadError:
          error instanceof Error ? error.message : "Upload failed",
        photo: null,
        photoPreview: null,
      });

      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to upload image",
        for: `photo-${rowId}`,
      });
    }
  };

  const uploadVideoToS3 = async (rowId: string, file: File) => {
    updateRow(rowId, {
      isVideoUploading: true,
      videoUploadError: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response: any = await postApi("/media-upload/", formData);

      if (!response.status) {
        throw new Error(response.message || "Failed to upload video");
      }

      const videoUrl = response.data?.video_url || response.data?.url;

      updateRow(rowId, {
        uploadedVideoUrl: videoUrl,
        isVideoUploading: false,
        videoUploadError: null,
      });

      setFeedback({
        type: "success",
        message: "Video uploaded successfully!",
        for: `video-${rowId}`,
      });

      // Broadcast the video upload update via WebSocket
      const updatedRow = rows.find((row) => row.id === rowId);
      if (updatedRow && webSocket.isConnected) {
        const broadcastMessage = {
          type: "video_upload",
          proto_id: protoId,
          user_id: user?.user_id?.toString(),
          timestamp: new Date().toISOString(),
          content: {
            row_id: rowId,
            video_url: videoUrl,
            row_data: {
              ...updatedRow,
              uploadedVideoUrl: videoUrl,
              isVideoUploading: false,
              videoUploadError: null,
            },
          },
        };

        console.log("📤 Broadcasting video upload:", broadcastMessage);
        webSocket.sendMessage(broadcastMessage);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      updateRow(rowId, {
        isVideoUploading: false,
        videoUploadError:
          error instanceof Error ? error.message : "Upload failed",
        video: null,
        videoPreview: null,
      });

      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to upload video",
        for: `video-${rowId}`,
      });
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
  const hasRowData = (row: CommentRow) => {
    return (
      row.person ||
      row.photo ||
      row.photoPreview ||
      row.uploadedImageUrl ||
      row.interpreted_comment.trim()
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

  // Row management functions
  const updateRow = (id: string, updates: Partial<CommentRow>) => {
    setRows((prevRows) => {
      const updatedRows = prevRows.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      );

      // Check if we need to add a new row (if last row has data)
      const lastRow = updatedRows[updatedRows.length - 1];
      if (!lastRow.isExisting && hasRowData(lastRow)) {
        const newRow: CommentRow = {
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
        };
        updatedRows.push(newRow);
      }

      return updatedRows;
    });
  };

  const deleteRow = (rowId: string) => {
    setRows((prevRows) => {
      const filteredRows = prevRows.filter((row) => row.id !== rowId);
      // Ensure at least one empty row exists for new comments
      if (!filteredRows.some((row) => !row.isExisting && !hasRowData(row))) {
        filteredRows.push({
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
        });
      }
      return filteredRows;
    });
  };

  const addRow = () => {
    const newRow: CommentRow = {
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
    };
    setRows((prevRows) => [...prevRows, newRow]);
  };

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
      updateRow(rowId, {
        photo: file,
        photoPreview: reader.result as string,
      });

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
      updateRow(rowId, {
        video: file,
        videoPreview: videoUrl,
      });

      // Upload to S3 immediately
      uploadVideoToS3(rowId, file);
    }
  };

  const removePhoto = (rowId: string) => {
    updateRow(rowId, {
      photo: null,
      photoPreview: null,
      uploadedImageUrl: null,
      imageUploadError: null,
    });
    if (photoInputRefs.current[rowId]) {
      photoInputRefs.current[rowId]!.value = "";
    }
  };

  const removeVideo = (rowId: string) => {
    updateRow(rowId, {
      video: null,
      videoPreview: null,
      uploadedVideoUrl: null,
      videoRemoved: true,
      videoUploadError: null,
    });
    if (videoInputRefs.current[rowId]) {
      videoInputRefs.current[rowId]!.value = "";
    }
  };

  // Comment synchronization
  const syncCommentFromRef = (rowId: string) => {
    const actualComment = actualCommentRefs.current[rowId]?.value || "";
    const interpretedComment =
      interpretedCommentRefs.current[rowId]?.value || "";
    updateRow(rowId, {
      actual_comment: actualComment,
      interpreted_comment: interpretedComment,
    });
  };

  // Ref to track the last broadcast to prevent infinite loops
  const lastBroadcastRef = useRef<string>("");

  useEffect(() => {
    // Only broadcast when there are actual changes to non-existing rows
    const draftRows = rows.filter(
      (row) =>
        !row.isExisting &&
        (row.person ||
          row.interpreted_comment.trim() ||
          row.actual_comment.trim())
    );

    if (draftRows.length > 0) {
      // Create a hash of the draft rows to detect actual changes
      const draftHash = draftRows
        .map(
          (row) =>
            `${row.id}-${row.person}-${row.actual_comment}-${row.interpreted_comment}`
        )
        .join("|");

      // Only broadcast if the content has actually changed
      if (lastBroadcastRef.current !== draftHash) {
        console.log("📤 Broadcasting", draftRows.length, "draft rows");
        lastBroadcastRef.current = draftHash;

        // Debounce the broadcasting to avoid too frequent updates
        const timeoutId = setTimeout(() => {
          broadcastCommentCreation(draftRows);
        }, 1000); // Wait 1 second before broadcasting

        return () => clearTimeout(timeoutId);
      }
    }
  }, [rows]);

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
          updateRow(row.id, {
            actual_comment: actualComment,
            interpreted_comment: interpretedComment,
          });
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

      if (!response.status) {
        throw new Error("Failed to submit comments.");
      }

      console.log("Comments submitted successfully:", response.data);

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
          webSocket.isConnected
            ? "bg-green-500"
            : webSocket.isConnecting
            ? "bg-yellow-500 animate-pulse"
            : "bg-red-500"
        }`}
        title={
          webSocket.isConnected
            ? `Connected to real-time updates`
            : webSocket.isConnecting
            ? "Connecting to real-time updates..."
            : "Real-time updates disconnected"
        }
      />
      <span className="text-sm text-gray-600">
        {webSocket.isConnected
          ? "Live"
          : webSocket.isConnecting
          ? "Connecting..."
          : "Offline"}
      </span>
      {webSocket.error && (
        <span className="text-xs text-red-500" title={webSocket.error}>
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
            onClick={() => deleteRow(row.id)}
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
                onClick={addRow}
                className="px-4 py-2 bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
              >
                Add Row
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                onClick={() =>
                  router.push(`/video-comment/?proto_id=${protoId}`)
                }
              >
                Create video Comment
              </button>
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
                          updateRow(row.id, { person: e.target.value })
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

                      {/* Upload success indicator */}
                      {row.uploadedImageUrl && !row.isImageUploading && (
                        <div className="mb-2 p-1 bg-green-100 text-green-700 text-xs rounded">
                          ✓ Uploaded to S3
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

                      {/* Upload success indicator */}
                      {row.uploadedVideoUrl && !row.isVideoUploading && (
                        <div className="mb-2 p-1 bg-green-100 text-green-700 text-xs rounded">
                          ✓ Uploaded to S3
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




websocket logic

import { useCallback, useEffect, useRef, useState } from "react";

export interface WebSocketMessage {
  type: string;
  data?: any;
  content?: any;

  timestamp?: string;

  action?: string;
}

export interface WebSocketConfig {
  url: string;
  token?: string;
  uuid?: string;
  proto_id?: string; // Add proto_id support
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export interface WebSocketState {
  status: "disconnected" | "connecting" | "connected" | "error";
  messages: WebSocketMessage[];
  lastMessage: WebSocketMessage | null;
  connectionUuid: string | null;
  error: string | null;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const [state, setState] = useState<WebSocketState>({
    status: "disconnected",
    messages: [],
    lastMessage: null,
    connectionUuid: null,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (wsRef.current && state.status === "connected") {
        try {
          const fullMessage = {
            ...message,
            uuid: state.connectionUuid,
            timestamp: message.timestamp || new Date().toISOString(),
          };

          console.log("Sending WebSocket message:", fullMessage);
          wsRef.current.send(JSON.stringify(fullMessage));

          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, fullMessage],
          }));

          return true;
        } catch (error) {
          console.error("Failed to send WebSocket message:", error);
          return false;
        }
      } else {
        console.log("WebSocket not connected, cannot send message:", {
          status: state.status,
          message,
        });
      }
      return false;
    },
    [state.status, ]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    cleanup();

    try {
      setState((prev) => ({ ...prev, status: "connecting", error: null }));

      const { url, token, uuid, proto_id } = config;

      // Build WebSocket URL based on available parameters
      let wsUrl = url;
      const params = new URLSearchParams();

      if (token) params.append("token", token);
      if (uuid) params.append("uuid", uuid);
      if (proto_id) params.append("proto_id", proto_id);

      if (params.toString()) {
        wsUrl += `?${params.toString()}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setState((prev) => ({
          ...prev,
          status: "connected",
          connectionUuid: uuid || proto_id || null,
          error: null,
        }));

        reconnectAttemptsRef.current = 0;

        // Send initial connection message
        const connectionId = uuid || proto_id;
        if (connectionId) {
          const connectionMessage = {
            type: "comment",
            proto_id: proto_id,
            timestamp: new Date().toISOString(),
          };
          ws.send(JSON.stringify(connectionMessage));
        }

        // Start heartbeat
        if (config.heartbeatInterval) {
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              const pingMessage = {
                type: "ping",

                proto_id: proto_id,
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(pingMessage));
            }
          }, config.heartbeatInterval);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log("Received WebSocket message:", data);

          const message: WebSocketMessage = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
          };

          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, message],
            lastMessage: message,
          }));
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error,
            event.data
          );
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "WebSocket connection error",
        }));
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setState((prev) => ({
          ...prev,
          status: "disconnected",
        }));

        cleanup();
        wsRef.current = null;

        // Auto-reconnect logic
        const maxAttempts = config.reconnectAttempts || 5;
        const interval = config.reconnectInterval || 3000;

        if (reconnectAttemptsRef.current < maxAttempts && !event.wasClean) {
          reconnectAttemptsRef.current++;
          console.log(
            `Reconnecting in ${interval}ms (attempt ${reconnectAttemptsRef.current}/${maxAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, interval);
        } else {
          console.log("Max reconnection attempts reached or clean close");
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to create WebSocket connection",
      }));
    }
  }, [config, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      status: "disconnected",
      connectionUuid: null,
    }));
  }, [cleanup]);

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      lastMessage: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [cleanup]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    isConnected: state.status === "connected",
    isConnecting: state.status === "connecting",
    isDisconnected: state.status === "disconnected",
  };
};

