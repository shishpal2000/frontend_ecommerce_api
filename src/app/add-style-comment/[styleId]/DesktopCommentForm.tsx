"use client";

import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { Comment, GetCommentsResponse, Person } from "@/types/Comments";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";

interface CommentRow {
  id: string;
  actual_comment: string;
  proto_number: string;
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
}

interface DesktopCommentFormProps {
  people: Person[];
  comments: Comment[];
  fullData: GetCommentsResponse | null;
  currentUser: {
    id: string;
    role: string;
  };

  fetchComments: () => void;
  styleOwner?: {
    id: string;
  };
  protoId: string | null;
  onCommentCreate?: (commentData: any) => void;
  onCommentUpdate?: (commentData: any) => void;
}

function DesktopCommentForm({
  people,
  comments,
  fullData,
  currentUser,
  fetchComments,
  styleOwner,
  protoId,
  onCommentCreate,
  onCommentUpdate,
}: DesktopCommentFormProps) {
  // Initialize rows with existing comments followed by an empty row
  const [rows, setRows] = useState<CommentRow[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const proto_id = protoId || fullData?.proto.proto_id;

  useEffect(() => {
    const existingRows = comments.map((comment) => ({
      id: comment.comment_id,
      proto_number: comment.proto_number || "",
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
    }));

    setRows([...existingRows]);
  }, [comments]);

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
      row.interpreted_comment.trim()
    );
  };

  // Check if a row is complete (has all required fields)
  const isRowComplete = (row: CommentRow) => {
    return (
      row.person &&
      (row.photo || row.photoPreview) &&
      row.interpreted_comment.trim()
    );
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
          proto_number: "",
          photoPreview: null,
          video: null,
          videoPreview: null,
          actual_comment: "",
          interpreted_comment: "",
          image: null,
          comment_by: "",
          comment_by_id: "",
          isExisting: false,
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
    }
  };

  // Remove photo
  const removePhoto = (rowId: string) => {
    updateRow(rowId, { photo: null, photoPreview: null });
    if (photoInputRefs.current[rowId]) {
      photoInputRefs.current[rowId]!.value = "";
    }
  };

  // Remove video
  const removeVideo = (rowId: string) => {
    updateRow(rowId, {
      video: null,
      videoPreview: null,
      videoRemoved: true, // Flag to track removal
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

  // Manually add row
  const addRow = () => {
    const newRow: CommentRow = {
      id: Date.now().toString(),
      person: "",
      photo: null,
      proto_number: "",
      photoPreview: null,
      video: null,
      videoPreview: null,
      actual_comment: "",
      interpreted_comment: "",
      image: null,
      comment_by: "",
      comment_by_id: "",
      isExisting: false,
    };
    setRows((prevRows) => [...prevRows, newRow]);
  };

  // Submit form - only submit new rows
  const handleSubmit = async () => {
    // Check if any row is currently being edited
    if (editingRowId) {
      setFeedback({
        type: "error",
        message: "Please save or cancel the current edit before submitting.",
        for: "submit",
      });
      return;
    }

    // First sync all comments from refs for new rows
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

    setIsSubmitting(true);
    setLoadingStates((prev) => ({ ...prev, submit: true }));

    try {
      const formData = new FormData();

      rowsWithData.forEach((row, idx) => {
        formData.append(`comments[${idx}][comment_by_id]`, row.person || "");

        if (row.photo) {
          formData.append(`comments[${idx}][image]`, row.photo);
        }
        formData.append(
          `comments[${idx}][actual_comment]`,
          row.actual_comment || ""
        );
        formData.append(
          `comments[${idx}][interpreted_comment]`,
          row.interpreted_comment || ""
        );

        if (row.video) {
          formData.append(`comments[${idx}][video]`, row.video);
        }
      });

      fetchComments();
      setFeedback({
        type: "success",
        message: `${rowsWithData.length} comment${
          rowsWithData.length > 1 ? "s" : ""
        } submitted successfully!`,
        for: "general",
      });

      // Reset to just the existing comments plus one empty row
      const existingRows = rows.filter((row) => row.isExisting);
      setRows([
        ...existingRows,
        {
          id: Date.now().toString(),
          person: "",
          photo: null,
          proto_number: "",
          photoPreview: null,
          video: null,
          videoPreview: null,
          actual_comment: "",
          interpreted_comment: "",
          image: null,
          comment_by: "",
          comment_by_id: "",
          isExisting: false,
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
      setIsSubmitting(false);
      setLoadingStates((prev) => ({ ...prev, submit: false }));
    }
  };

  // Get person name by ID
  const getPersonName = (personId: string) => {
    return people.find((p) => p.user_id === personId)?.name || "Unknown";
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

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Comments Table</h2>
          <p className="text-sm text-gray-500">
            Showing {counts.existingRows} existing comments and {counts.newRows}{" "}
            new rows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(`/add-style-comment/comments/${protoId}`)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
            title="Print this proto"
          >
            Print
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
                Proto NO *
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
                Comment Video <span className="text-xs">(max 200MB)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
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
                    {row.proto_number || "N/A"}
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
                          <div className="py-2 px-1">{row.actual_comment}</div>
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
                            className={`px-3 py-2 text-white text-xs cursor-pointer transition-colors bg-blue-500 hover:bg-blue-600`}
                          >
                            Upload Photo
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
                        className="hidden"
                      />
                    )}
                  </td>

                  <td className="border border-gray-300 px-4 py-4 text-center">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DesktopCommentForm;
