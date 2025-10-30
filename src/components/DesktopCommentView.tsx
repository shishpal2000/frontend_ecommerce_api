"use client";

import { useApiCall } from "@/hooks/useApiCall";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { Comment, GetCommentsResponse, Person } from "@/types/Comments";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import LoadingComponent from "@/components/Loding";

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
  setViewMode: React.Dispatch<React.SetStateAction<boolean>>;
  protoId: string | null;
}

function DesktopCommentView({
  people,
  protoId,
  setViewMode,
}: DesktopCommentFormProps) {
  const { get } = useApiCall();
  // Initialize rows with existing comments followed by an empty row

  const [rows, setRows] = useState<CommentRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [collectionPermission, setCollectionPermission] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await get<GetCommentsResponse>(`/comment/${proto_id}/`);
      console.log("Comments API Response:", response);
      if (response.error_status) {
        throw new Error(response.message || "Failed to fetch comments");
      }
      setComments(response.data.comments);
      setCollectionPermission(response.data.proto as any);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [protoId]);

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

  // Use separate ref-based approach for each row's comment
  const actualCommentRefs = useRef<{
    [key: string]: HTMLTextAreaElement | null;
  }>({});
  const interpretedCommentRefs = useRef<{
    [key: string]: HTMLTextAreaElement | null;
  }>({});
  const photoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [originalRow, setOriginalRow] = useState<CommentRow | null>(null);

  const [imageErrorRows, setImageErrorRows] = useState<{
    [rowId: string]: boolean;
  }>({});
  const [videoErrorRows, setVideoErrorRows] = useState<{
    [rowId: string]: boolean;
  }>({});

  const router = useRouter();
  // websocket connection for real-time updates can be added here

  const [loadingStates, setLoadingStates] = useState({
    saveEdit: false,
    deleteComment: {} as { [commentId: string]: boolean },
    styleComment: {} as { [commentId: string]: boolean },
    removeStyleComment: {} as { [commentId: string]: boolean },
    submit: false,
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
    for: string | null;
  }>({
    type: null,
    message: "",
    for: null,
  });

  const { postApi } = useGeneralApiCall();

  const proto_id = protoId;

  useEffect(() => {
    const existingRows = comments.map((comment) => ({
      id: comment.comment_id,
      actual_comment: comment.actual_comment,
      interpreted_comment: comment.interpreted_comment,
      image: comment.image,
      video: comment.video,
      comment_by: comment.comment_by,
      comment_by_id: comment.comment_by_id,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      created_by: comment.created_by,
      updated_by: comment.updated_by,
      is_collection_comment: comment.is_collection_comment,
      permissions: {
        can_edit: comment.permissions?.can_edit,
        can_delete: comment.permissions?.can_delete,
      },
      isExisting: true,
      photoPreview: typeof comment.image === "string" ? comment.image : null,
      videoPreview: typeof comment.video === "string" ? comment.video : null,
      uploadedImageUrl:
        typeof comment.image === "string" ? comment.image : null,
      uploadedVideoUrl:
        typeof comment.video === "string" ? comment.video : null,
    }));

    setRows([...existingRows]);
  }, [comments]);

  // Upload image to S3 immediately when selected
  const uploadImageToS3 = async (rowId: string, file: File) => {
    updateRow(rowId, {
      isImageUploading: true,
      imageUploadError: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await postApi("/media-upload/", formData);

      if (!response.status) {
        throw new Error(response.message || "Failed to upload image");
      }

      const imageUrl =
        (response.data as any)?.image_url || (response.data as any)?.url;

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

  // Upload video to S3 immediately when selected
  const uploadVideoToS3 = async (rowId: string, file: File) => {
    updateRow(rowId, {
      isVideoUploading: true,
      videoUploadError: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await postApi("/media-upload/", formData);

      if (!response.status) {
        throw new Error(response.message || "Failed to upload video");
      }

      // Assuming the API returns { status: true, data: { video_url: "s3-url" } }
      const videoUrl =
        (response.data as any)?.video_url || (response.data as any)?.url;

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

  // Handle escape key for modals
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

  // Modal functions
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

  // Check if a row has any data
  const hasRowData = (row: CommentRow) => {
    return (
      row.person ||
      row.photo ||
      row.photoPreview ||
      row.uploadedImageUrl ||
      row.interpreted_comment.trim()
    );
  };

  // Check if a row is complete (has all required fields)
  const isRowComplete = (row: CommentRow) => {
    return row.person && row.interpreted_comment.trim();
  };

  // Get counts for validation
  const getRowCounts = () => {
    const totalRows = rows.length;
    const existingRows = rows.filter((row) => row.isExisting).length;
    const newRows = rows.filter((row) => !row.isExisting).length;
    const rowsWithData = rows.filter(
      (row) => !row.isExisting && hasRowData(row)
    );
    const completeRows = rows.filter(
      (row) => !row.isExisting && isRowComplete(row)
    );
    const incompleteRows = rowsWithData.filter((row) => !isRowComplete(row));

    return {
      totalRows,
      existingRows,
      newRows: newRows,
      rowsWithData: rowsWithData.length,
      completeRows: completeRows.length,
      incompleteRows: incompleteRows.length,
    };
  };

  const counts = getRowCounts();

  // Update a specific row
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

  // Handle photo upload
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

  // Handle video upload
  const handleVideoSelect = (
    rowId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        // Using 200MB as specified in UI
        alert("Video file size must be less than 00MB");
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

  // Remove photo
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

  // Remove video
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

  // Handle comment change - using ref approach to maintain focus
  const syncCommentFromRef = (rowId: string) => {
    const actualComment = actualCommentRefs.current[rowId]?.value || "";
    const interpretedComment =
      interpretedCommentRefs.current[rowId]?.value || "";
    updateRow(rowId, {
      actual_comment: actualComment,
      interpreted_comment: interpretedComment,
    });
  };

  // Delete row (only for new rows)
  const deleteRow = (rowId: string) => {
    setRows((prevRows) => {
      // Don't delete existing comments
      if (prevRows.find((row) => row.id === rowId)?.isExisting) {
        return prevRows;
      }

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

  // In the handleDeleteComment function, add the WebSocket broadcast:
  const handleDeleteComment = async (commentId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      deleteComment: { ...prev.deleteComment, [commentId]: true },
    }));

    try {
      const response = await postApi(`/comment/${commentId}/delete/`);

      if (!response.status) {
        throw new Error(response.message || "Failed to delete comment");
      }

      // Remove the comment from the UI
      setRows((prevRows) => prevRows.filter((row) => row.id !== commentId));

      setFeedback({
        type: "success",
        message: "Comment deleted successfully!",
        for: "general",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete comment",
        for: commentId,
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        deleteComment: { ...prev.deleteComment, [commentId]: false },
      }));
    }
  };
  const handleEditComment = (rowId: string) => {
    // If another row is being edited, cancel it first
    if (editingRowId && editingRowId !== rowId) {
      handleCancelEdit();
    }

    setEditingRowId(rowId);
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      // Store original row data for cancellation
      setOriginalRow({ ...row });

      // Set textarea values
      if (actualCommentRefs.current[rowId]) {
        actualCommentRefs.current[rowId]!.value = row.actual_comment;
      }
      if (interpretedCommentRefs.current[rowId]) {
        interpretedCommentRefs.current[rowId]!.value = row.interpreted_comment;
      }

      // Clear any existing feedback
      setFeedback({ type: null, message: "", for: null });
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    const row = rows.find((r) => r.id === commentId);
    if (!row) return;

    // Get current values from refs
    const actualComment =
      actualCommentRefs.current[commentId]?.value ?? row.actual_comment ?? "";
    const interpretedComment =
      interpretedCommentRefs.current[commentId]?.value ??
      row.interpreted_comment ??
      "";
    const selectedPerson = row.person || row.comment_by_id;

    if (!selectedPerson) {
      setFeedback({
        type: "error",
        message: "Please select a person for this comment.",
        for: commentId,
      });
      return;
    }

    if (!interpretedComment.trim()) {
      setFeedback({
        type: "error",
        message: "Interpreted comment cannot be empty.",
        for: commentId,
      });
      return;
    }

    // Prepare FormData with S3 URLs instead of files
    const formData = new FormData();

    formData.append("comment_by_id", selectedPerson);
    formData.append("actual_comment", actualComment);
    formData.append("interpreted_comment", interpretedComment);

    // Send S3 URLs instead of files
    if (row.uploadedImageUrl) {
      formData.append("image", row.uploadedImageUrl);
    } else if (!row.photoPreview && row.image) {
      formData.append("image", "");
    }

    if (row.uploadedVideoUrl) {
      formData.append("video", row.uploadedVideoUrl);
    } else if (row.videoRemoved) {
      formData.append("video", "");
    }

    // If nothing changed, don't send request
    if (
      !formData.has("comment_by_id") &&
      !formData.has("actual_comment") &&
      !formData.has("interpreted_comment") &&
      !formData.has("image") &&
      !formData.has("video")
    ) {
      setEditingRowId(null);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, saveEdit: true }));

    try {
      const response = await postApi(
        `/comment/${commentId}/update-comment/`,
        formData
      );

      if (!response.status) {
        throw new Error(response.message || "Failed to update comment");
      }

      if (response.status === 200 || response.status === 201) {
        fetchComments();
      }

      setFeedback({
        type: "success",
        message: "Comment updated successfully!",
        for: "general",
      });
      setEditingRowId(null);
      setOriginalRow(null);
    } catch (error) {
      console.error("Failed to update comment.", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to update comment",
        for: commentId,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, saveEdit: false }));
    }
  };

  const handleCancelEdit = () => {
    if (editingRowId && originalRow) {
      // Restore original values in the rows state
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === editingRowId ? { ...originalRow } : row
        )
      );

      // Reset textarea values to original
      if (actualCommentRefs.current[editingRowId]) {
        actualCommentRefs.current[editingRowId]!.value =
          originalRow.actual_comment;
      }
      if (interpretedCommentRefs.current[editingRowId]) {
        interpretedCommentRefs.current[editingRowId]!.value =
          originalRow.interpreted_comment;
      }
    }

    // Clear editing state
    setEditingRowId(null);
    setOriginalRow(null);

    // Clear any feedback messages
    setFeedback({ type: null, message: "", for: null });
  };

  // Check if delete button should be disabled for a specific row
  const canDeleteRow = (rowId: string) => {
    // Can't delete existing comments
    const row = rows.find((r) => r.id === rowId);
    if (row?.isExisting) return false;

    // Can't delete if it's the only new row
    const newRows = rows.filter((r) => !r.isExisting);
    if (newRows.length === 1) return false;

    const isLastRow = rows[rows.length - 1].id === rowId;
    const isEmptyRow = !hasRowData(row!);
    const otherNewRowsHaveData = rows
      .filter((r) => !r.isExisting && r.id !== rowId)
      .some(hasRowData);

    if (isLastRow && isEmptyRow && otherNewRowsHaveData) return false;

    return true;
  };

  // Get person name by ID
  const getPersonName = (personId: string) => {
    return people.find((p) => p.user_id === personId)?.name || "Unknown";
  };

  // Add these functions to your DesktopCommentForm component
  const upgradeToStyleComment = async (commentId: string) => {
    try {
      const response = await postApi(
        `/comment/${commentId}/collection-comment/mark/`
      );

      if (!response.status) {
        throw new Error("Failed to mark comment as style comment.");
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === commentId ? { ...row, is_collection_comment: true } : row
        )
      );
    } catch (error) {
      console.error("Error marking comment as style comment:", error);
    }
  };

  const removeStyleComment = async (commentId: string) => {
    try {
      const response = await postApi(
        `/comment/${commentId}/collection-comment/unmark/`
      );

      if (!response.status) {
        throw new Error("Failed to unmark comment as style comment.");
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === commentId ? { ...row, is_collection_comment: false } : row
        )
      );
    } catch (error) {
      console.error("Error unmarking style comment:", error);
    }
  };

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

    if (!row.isExisting) {
      // For new comments, show delete button
      return (
        <>
          {rowFeedback}
          <button
            onClick={() => deleteRow(row.id)}
            disabled={!canDeleteRow(row.id) || isSubmitting}
            className="px-3 py-1 bg-red-500 text-white text-xs cursor-pointer hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </>
      );
    }

    // For existing comments, show timestamp and style comment upgrade on hover
    return (
      <div className="flex flex-col gap-2">
        {rowFeedback}

        <div className="text-xs text-gray-500">
          {row.created_at
            ? `${new Date(row.created_at).toLocaleString()} +5:30 GMT`
            : ""}
        </div>

        <p className="capitalize">
          <span className="text-sm">Created By - </span>
          {row.created_by || "Unknown"}
        </p>

        {/* Style badge for existing style comments */}
        {row.is_collection_comment && (
          <span className=" inline-flex items-center px-2 py-0.5 rounded text-base font-medium bg-yellow-500 text-white">
            In Collection
          </span>
        )}

        {row?.permissions?.can_edit && editingRowId === row.id ? (
          <div className="flex flex-col gap-2">
            <button
              className="px-3 py-2 bg-green-500 text-white text-xs cursor-pointer hover:bg-green-600 disabled:opacity-70 flex items-center justify-center gap-1"
              onClick={() => handleSaveEdit(row.id)}
              disabled={loadingStates.saveEdit}
            >
              {loadingStates.saveEdit ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              className="px-3 py-2 bg-gray-500 text-white text-xs cursor-pointer hover:bg-gray-600 disabled:opacity-70"
              onClick={handleCancelEdit}
              disabled={loadingStates.saveEdit}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {row?.permissions?.can_edit && (
              <button
                className="px-3 py-2 bg-blue-500 text-white text-xs cursor-pointer hover:bg-blue-600 disabled:opacity-70"
                onClick={() => handleEditComment(row.id)}
                disabled={!!editingRowId && editingRowId !== row.id}
                title={
                  !!editingRowId && editingRowId !== row.id
                    ? "Another row is being edited"
                    : "Edit this comment"
                }
              >
                {!!editingRowId && editingRowId !== row.id ? "Locked" : "Edit"}
              </button>
            )}

            {row?.permissions?.can_delete && (
              <button
                className="px-3 py-2 bg-red-500 text-white text-xs cursor-pointer hover:bg-red-600 disabled:opacity-70 flex items-center justify-center gap-1"
                onClick={() => handleDeleteComment(row.id)}
                disabled={loadingStates.deleteComment[row.id] || !!editingRowId}
                title={
                  !!editingRowId
                    ? "Cannot delete while editing"
                    : "Delete this comment"
                }
              >
                {loadingStates.deleteComment[row.id] ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            )}
          </div>
        )}

        {/* Hover action buttons */}
        {collectionPermission?.permissions
          .can_mark_proto_comment_as_collection_comment &&
          !editingRowId && (
            <div
              className={`hidden group-hover:block absolute ${
                row.is_collection_comment ? "top-[103px]" : "top-[123px]"
              } left-[15px]`}
            >
              {row.is_collection_comment ? (
                <button
                  onClick={() => removeStyleComment(row.id)}
                  disabled={loadingStates.removeStyleComment[row.id]}
                  className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded border border-red-200 hover:bg-red-200 cursor-pointer disabled:opacity-70 flex items-center gap-1"
                >
                  {loadingStates.removeStyleComment[row.id] ? (
                    <>
                      <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Removing...</span>
                    </>
                  ) : (
                    "Remove from Collection"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => upgradeToStyleComment(row.id)}
                  disabled={loadingStates.styleComment[row.id]}
                  className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded border border-yellow-200 hover:bg-yellow-200 cursor-pointer disabled:opacity-70 flex items-center gap-1"
                >
                  {loadingStates.styleComment[row.id] ? (
                    <>
                      <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    "Add to Collection"
                  )}
                </button>
              )}
            </div>
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

      {/* Edit mode indicator */}
      {editingRowId && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Editing Mode Active:</span> Row #
                {rows.findIndex((r) => r.id === editingRowId) + 1} is being
                edited. Save or cancel to continue with other actions.
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={handleCancelEdit}
                className="text-blue-400 hover:text-blue-600"
                title="Cancel editing"
              >
                <svg
                  className="w-5 h-5"
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
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Comments Table</h2>
          <p className="text-sm text-gray-500">
            Showing {counts.existingRows} existing comments and {counts.newRows}{" "}
            new rows
          </p>
        </div>

        <div className="flex gap-2">
          {collectionPermission?.permissions.can_add_new_comments && (
            <button
              onClick={() => setViewMode(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
            >
              Add Comment
            </button>
          )}

          {rows.length !== 0 && (
            <button
              onClick={() => router.push(`/print/comments/${protoId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
              title="Print this proto"
            >
              Print
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingComponent />
      ) : rows.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No comments available.
        </div>
      ) : (
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
              {rows.map((row, index) => {
                const rowHasData = hasRowData(row);
                const isExistingRow = row.isExisting === true;

                return (
                  <tr
                    key={row.id}
                    className={`${isExistingRow ? "bg-gray-50" : ""} ${
                      editingRowId === row.id
                        ? "bg-blue-50 border-2 border-blue-300 relative"
                        : editingRowId && editingRowId !== row.id
                        ? "opacity-60"
                        : ""
                    } transition-all duration-200`}
                  >
                    <td className="border border-gray-300 px-4 py-4 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      {isExistingRow ? (
                        <>
                          {editingRowId === row.id ? (
                            <select
                              value={row.person || row.comment_by_id}
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
                                  {person.name ? person.name : "No Name"}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="py-2 px-1">
                              {isExistingRow
                                ? `${row.comment_by}`
                                : getPersonName(row.person || "")}
                            </div>
                          )}
                        </>
                      ) : (
                        <select
                          value={row.person || row.comment_by_id}
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
                              {person.name ? person.name : "No Name"}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      {isExistingRow ? (
                        <>
                          {editingRowId === row.id ? (
                            <textarea
                              rows={5}
                              ref={(el) => {
                                actualCommentRefs.current[row.id] = el;
                              }}
                              defaultValue={row.actual_comment}
                              onBlur={() => syncCommentFromRef(row.id)}
                              placeholder="Enter comment..."
                              className={`w-full h-full p-2 focus:ring-transparent focus:border-transparent`}
                            />
                          ) : (
                            <div className="py-2 px-1">
                              {row.actual_comment}
                            </div>
                          )}
                        </>
                      ) : (
                        <textarea
                          ref={(el) => {
                            actualCommentRefs.current[row.id] = el;
                          }}
                          rows={5}
                          defaultValue={row.actual_comment}
                          onBlur={() => syncCommentFromRef(row.id)}
                          placeholder="Enter comment..."
                          className={`w-full h-full p-2 focus:ring-transparent focus:border-transparent`}
                        />
                      )}
                    </td>

                    <td className="border border-gray-300 px-4 py-4">
                      {isExistingRow ? (
                        <>
                          {editingRowId === row.id ? (
                            <textarea
                              rows={5}
                              ref={(el) => {
                                interpretedCommentRefs.current[row.id] = el;
                              }}
                              defaultValue={row.interpreted_comment}
                              onBlur={() => syncCommentFromRef(row.id)}
                              placeholder="Enter comment..."
                              className={`w-full h-full p-2 focus:ring-transparent focus:border-transparent`}
                            />
                          ) : (
                            <div className="py-2 px-1">
                              {row.interpreted_comment}
                            </div>
                          )}
                        </>
                      ) : (
                        <textarea
                          ref={(el) => {
                            interpretedCommentRefs.current[row.id] = el;
                          }}
                          rows={5}
                          defaultValue={row.interpreted_comment}
                          onBlur={() => syncCommentFromRef(row.id)}
                          placeholder="Enter comment..."
                          className={`w-full h-full p-2 focus:ring-transparent focus:border-transparent`}
                        />
                      )}
                    </td>

                    <td
                      className={`border border-gray-300 px-4 py-4 text-center ${
                        row.photoPreview || isExistingRow ? "h-[423px]" : ""
                      }`}
                    >
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
                          {/* Remove button logic as before */}
                          {isExistingRow && editingRowId === row.id && (
                            <button
                              onClick={() => removePhoto(row.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer remove-photo-btn"
                            >
                              ×
                            </button>
                          )}
                          {!isExistingRow && (
                            <button
                              onClick={() => removePhoto(row.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer remove-photo-btn"
                            >
                              ×
                            </button>
                          )}
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
                      ) : null}

                      {/* For upload photo button */}
                      {!row.photoPreview && (
                        <>
                          {!isExistingRow || editingRowId === row.id ? (
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
                          ) : (
                            <div className="text-gray-500 italic">No photo</div>
                          )}
                        </>
                      )}

                      {(!isExistingRow || editingRowId === row.id) && (
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
                          {/* Remove button logic as before */}
                          {isExistingRow && editingRowId === row.id && (
                            <button
                              onClick={() => removeVideo(row.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer remove-video-btn"
                            >
                              ×
                            </button>
                          )}
                          {!isExistingRow && (
                            <button
                              onClick={() => removeVideo(row.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer remove-video-btn"
                            >
                              ×
                            </button>
                          )}
                          {isExistingRow &&
                            editingRowId === row.id &&
                            !videoErrorRows[row.id] && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none play-overlay">
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
                            )}
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
                      ) : null}

                      {/* For upload video button */}
                      {!row.videoPreview && (
                        <>
                          {!isExistingRow || editingRowId === row.id ? (
                            <button
                              onClick={() =>
                                videoInputRefs.current[row.id]?.click()
                              }
                              className="px-3 py-2 bg-blue-500 text-white text-xs hover:bg-blue-600 cursor-pointer transition-colors"
                            >
                              Upload Video
                            </button>
                          ) : (
                            <div className="text-gray-500 italic">No video</div>
                          )}
                        </>
                      )}

                      {(editingRowId === row.id || !isExistingRow) && (
                        <input
                          ref={(el) => {
                            videoInputRefs.current[row.id] = el;
                          }}
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoSelect(row.id, e)}
                          className="hidden"
                        />
                      )}
                    </td>

                    <td className="border group relative border-gray-300 px-4 py-4">
                      {renderActionsCell(row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PhotoModal />
      <VideoModal />
    </div>
  );
}

export default DesktopCommentView;
