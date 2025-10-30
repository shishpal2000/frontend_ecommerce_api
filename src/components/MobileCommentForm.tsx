"use client";

import { useApiCall } from "@/hooks/useApiCall";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { Comment, GetCommentsResponse, Person } from "@/types/Comments";
import React, { useState, useRef, useEffect, Suspense } from "react";

interface MobileCommentFormProps {
  people: Person[];

  protoId: string | null;
}

export default function MobileCommentForm({
  people,

  protoId,
}: MobileCommentFormProps) {
  const { get } = useApiCall();
  const [comments, setComments] = useState<Comment[]>([]);
  const [savedComments, setSavedComments] = useState<Comment[]>([]);
  const [collectionPermission, setCollectionPermission] = useState<any>(null);

  const fetchComments = async () => {
    try {
      const response = await get<GetCommentsResponse>(`/comment/${protoId}/`);
      console.log("Comments API Response:", response);
      if (response.error_status) {
        throw new Error(response.message || "Failed to fetch comments");
      }
      setComments(response.data.comments);
      setSavedComments(response.data.comments);
      setCollectionPermission(response.data.proto as any);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [protoId]);

  // images and video preview urls
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
    for: string | null;
  }>({
    type: null,
    message: "",
    for: null,
  });

  const [loadingStates, setLoadingStates] = useState({
    submit: false,
    styleComment: {} as { [commentId: string]: boolean },
    removeStyleComment: {} as { [commentId: string]: boolean },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [longPressedComment, setLongPressedComment] = useState<string | null>(
    null
  );
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 500; // ms

  const { postApi } = useGeneralApiCall();

  // Use refs for uncontrolled inputs to prevent focus issues
  const personRef = useRef<HTMLSelectElement>(null);
  const actualCommentRef = useRef<HTMLTextAreaElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Update when props change
  useEffect(() => {
    setSavedComments((prevComments) => {
      // Keep only comments added in this session (not from props)
      const newlyAddedComments = prevComments.filter(
        (comment) => !comments.some((c) => c.comment_id === comment.comment_id)
      );

      // Combine with the latest props
      return [...comments, ...newlyAddedComments];
    });
  }, [comments]);

  const handleTouchStart = (commentId: string) => {
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Start new timer
    longPressTimer.current = setTimeout(() => {
      setLongPressedComment(commentId);
    }, longPressThreshold);
  };

  const handleTouchEnd = () => {
    // Clear timer on touch end
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    // Clear action menu when clicking outside
    const handleClickOutside = () => setLongPressedComment(null);

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Handle long press actions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        setFeedback({
          type: "error",
          message: "Image file size must be less than 50MB",
          for: "submit",
        });
        return;
      }

      setSelectedImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024 * 1024) {
        // 300MB limit
        setFeedback({
          type: "error",
          message: "Video file size must be less than 300MB",
          for: "submit",
        });
        return;
      }

      setSelectedVideoFile(file);
      const videoUrl = URL.createObjectURL(file);
      setSelectedVideo(videoUrl);
    }
  };

  const removeSelectedImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedVideo = () => {
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo);
    }
    setSelectedVideo(null);
    setSelectedVideoFile(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // Upgrade to style comment
  const upgradeToStyleComment = async (commentId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      styleComment: { ...prev.styleComment, [commentId]: true },
    }));

    try {
      const response = await postApi(
        `/comment/${commentId}/collection-comment/mark/`
      );

      if (!response.status) {
        throw new Error(
          response.message || "Failed to mark as collection comment"
        );
      }

      setSavedComments((prev) =>
        prev.map((comment) =>
          comment.comment_id === commentId
            ? { ...comment, is_collection_comment: true }
            : comment
        )
      );

      setFeedback({
        type: "success",
        message: "Added to collection comments successfully!",
        for: "general",
      });

      fetchComments();
    } catch (error) {
      console.error("Error marking as collection comment:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to mark as collection comment",
        for: commentId,
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        styleComment: { ...prev.styleComment, [commentId]: false },
      }));
    }

    setLongPressedComment(null);
  };

  // Remove style comment status
  const removeStyleComment = async (commentId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      removeStyleComment: { ...prev.removeStyleComment, [commentId]: true },
    }));

    try {
      const response = await postApi(
        `/comment/${commentId}/collection-comment/unmark/`
      );

      if (!response.status) {
        throw new Error(
          response.message || "Failed to remove from collection comments"
        );
      }

      setSavedComments((prev) =>
        prev.map((comment) =>
          comment.comment_id === commentId
            ? { ...comment, is_collection_comment: false }
            : comment
        )
      );

      setFeedback({
        type: "success",
        message: "Removed from collection comments!",
        for: "general",
      });

      await fetchComments();
    } catch (error) {
      console.error("Error removing from collection comments:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove from collection comments",
        for: commentId,
      });
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        removeStyleComment: { ...prev.removeStyleComment, [commentId]: false },
      }));
    }

    setLongPressedComment(null);
  };

  const saveAndSubmitComment = async () => {
    const personId = personRef.current?.value || "";
    const commentText = commentRef.current?.value || "";
    const actualCommentText = actualCommentRef.current?.value || "";

    if (!personId) {
      setFeedback({
        type: "error",
        message: "Please select a person",
        for: "submit",
      });
      return;
    }

    if (!commentText.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a comment",
        for: "submit",
      });
      return;
    }

    setIsSubmitting(true);
    setLoadingStates((prev) => ({ ...prev, submit: true }));

    console.log(
      "Submitting comment with personId:",
      personId,
      "actual",
      actualCommentText,
      "comment",
      commentText
    );

    try {
      // Create form data
      const formData = new FormData();

      // Append fields to form data
      formData.append("comment_by_id", personId);
      formData.append("actual_comment", actualCommentText);
      formData.append("interpreted_comment", commentText);

      if (selectedImageFile) {
        formData.append("image", selectedImageFile);
      }
      if (selectedVideoFile) {
        formData.append("video", selectedVideoFile);
      }

      const response = await postApi(
        `/comment/${protoId}/add-comment/mobile/`,
        formData
      );

      if (!response.status) {
        throw new Error(response.message || "Failed to submit comment");
      }

      fetchComments();

      setFeedback({
        type: "success",
        message: "Comment added successfully!",
        for: "general",
      });

      // Clear the inputs and preview after saving
      if (personRef.current) personRef.current.value = "";
      if (commentRef.current) commentRef.current.value = "";
      if (actualCommentRef.current) actualCommentRef.current.value = "";

      // Clear file previews
      removeSelectedImage();
      removeSelectedVideo();
    } catch (error) {
      console.error("Error submitting comment:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to submit comment",
        for: "submit",
      });
    } finally {
      setIsSubmitting(false);
      setLoadingStates((prev) => ({ ...prev, submit: false }));
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
        <p className="text-sm">{message}</p>
      </div>
    );
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="p-4 min-h-screen">
        {/* Global feedback message */}
        {feedback.type && feedback.for === "general" && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback({ type: null, message: "", for: null })}
          />
        )}

        <div className="space-y-6">
          {/* Comment Input Card */}

          {collectionPermission?.permissions?.can_add_new_comments && (
            <div className="bg-white border border-gray-200 p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Comment
              </h3>

              {/* Submit feedback message */}
              {feedback.type && feedback.for === "submit" && (
                <FeedbackMessage
                  type={feedback.type}
                  message={feedback.message}
                  onClose={() =>
                    setFeedback({ type: null, message: "", for: null })
                  }
                />
              )}

              <div>
                {/* Comment By */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment By <span className="text-red-500">*</span>
                  </label>
                  <select
                    ref={personRef}
                    defaultValue=""
                    className="w-full p-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                </div>

                {/*  Actual Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={actualCommentRef}
                    defaultValue=""
                    placeholder="Enter your comment here..."
                    className="w-full min-h-[100px] p-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                {/*  Interpreted Comment  */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interpreted Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={commentRef}
                    defaultValue=""
                    placeholder="Enter your comment here..."
                    className="w-full min-h-[100px] p-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* photo */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment Photo <span className="text-red-500"></span>
                  </label>

                  {!selectedImage ? (
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        Maximum file size: 50MB. Supported formats: JPG, PNG,
                        GIF, WebP
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Image Preview */}
                      <div className="relative inline-block">
                        <img
                          src={selectedImage}
                          alt="Selected preview"
                          className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>

                      {/* File info */}
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{selectedImageFile?.name}</p>
                        <p>
                          Size:{" "}
                          {(
                            (selectedImageFile?.size || 0) /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>

                      {/* Change file button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Image
                      </button>

                      {/* Hidden file input for changing */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment Video <span className="text-red-500"></span>
                  </label>

                  {!selectedVideo ? (
                    <div className="relative">
                      <input
                        type="file"
                        ref={videoInputRef}
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        Maximum file size: 300MB. Supported formats: MP4, MOV,
                        AVI, WebM
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Video Preview */}
                      <div className="relative inline-block">
                        <video
                          src={selectedVideo}
                          controls
                          className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeSelectedVideo}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>

                      {/* File info */}
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{selectedVideoFile?.name}</p>
                        <p>
                          Size:{" "}
                          {(
                            (selectedVideoFile?.size || 0) /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Video
                      </button>

                      {/* Hidden file input for changing */}
                      <input
                        type="file"
                        ref={videoInputRef}
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Save Comment Button */}
                <button
                  onClick={saveAndSubmitComment}
                  disabled={loadingStates.submit}
                  className="w-full py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loadingStates.submit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Save Comment"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* All Comments Section */}
          {savedComments.length > 0 ? (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  All Comments ({savedComments.length})
                </h3>
              </div>

              {/* Existing comments section */}
              {comments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2 border-b pb-1">
                    Previously Added Comments
                  </h4>
                  <div className="space-y-3 mb-6">
                    {comments.map((comment) => (
                      <div
                        key={comment.comment_id}
                        className={`relative border p-3 ${
                          comment.is_collection_comment
                            ? "bg-yellow-50 border-yellow-300"
                            : "bg-gray-100 border-gray-200"
                        }`}
                        onTouchStart={() =>
                          handleTouchStart(comment.comment_id)
                        }
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                      >
                        {feedback.type &&
                          feedback.for === comment.comment_id && (
                            <div
                              className={`mb-2 text-xs p-2 ${
                                feedback.type === "error"
                                  ? "bg-red-100 text-red-700"
                                  : feedback.type === "success"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {feedback.message}
                              <button
                                onClick={() =>
                                  setFeedback({
                                    type: null,
                                    message: "",
                                    for: null,
                                  })
                                }
                                className="ml-2 text-gray-500 hover:text-gray-700"
                              >
                                &times;
                              </button>
                            </div>
                          )}

                        {/* Style comment badge */}
                        {comment.is_collection_comment && (
                          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                              Style
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-gray-900">
                              <span className=" text-md capitalize font-bold">
                                {`Comment By ${comment.comment_by} :`}
                              </span>{" "}
                              <p className="text-sm text-gray-600 text-wrap mt-4">
                                {comment.interpreted_comment}
                              </p>
                            </div>
                            <div className="text-sm text-gray-800 text-right mt-4">
                              Date :{" "}
                              {new Date(comment.created_at).toDateString()} Time
                              :{" "}
                              {new Date(
                                comment.created_at
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {/* Long press action menu */}
                        {longPressedComment === comment.comment_id && (
                          <div
                            className="absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded-md border border-gray-300 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {comment.is_collection_comment ? (
                              <button
                                onClick={() =>
                                  removeStyleComment(comment.comment_id)
                                }
                                disabled={
                                  loadingStates.removeStyleComment[
                                    comment.comment_id
                                  ]
                                }
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 flex items-center"
                              >
                                {loadingStates.removeStyleComment[
                                  comment.comment_id
                                ] ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                                    <span>Removing...</span>
                                  </>
                                ) : (
                                  "Remove Style Comment"
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  upgradeToStyleComment(comment.comment_id)
                                }
                                disabled={
                                  loadingStates.styleComment[comment.comment_id]
                                }
                                className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 disabled:opacity-50 flex items-center"
                              >
                                {loadingStates.styleComment[
                                  comment.comment_id
                                ] ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                                    <span>Adding...</span>
                                  </>
                                ) : (
                                  "Upgrade to Style Comment"
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly added comments section */}
              {savedComments.some((c) => c.isNew) && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 border-b pb-1">
                    New Comments
                  </h4>
                  <div className="space-y-3">
                    {savedComments
                      .filter((c) => c.isNew)
                      .map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="bg-green-50 border border-green-200 p-3"
                        >
                          <div className="flex justify-between items-start no-select">
                            <div className="flex-1">
                              <div className="text-gray-900">
                                <span className="font-medium text-sm capitalize">
                                  {comment.comment_by}:
                                </span>{" "}
                                <span className="text-sm text-gray-600">
                                  {comment.interpreted_comment}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1 text-right">
                                {comment.created_at
                                  ? new Date(comment.created_at).toISOString()
                                  : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-center font-bold">
                {" "}
                No comments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}
