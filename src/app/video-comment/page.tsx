"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import LayoutComponents from "../layoutComponents";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";

// Gemini API config
const API_CONFIG = {
  model: "gemini-2.5-flash-preview-09-2025",
  url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`,
};
const apiKey = "";

// Constants
const MAX_FILE_SIZE_MB = 25;
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/mov",
  "video/avi",
  "video/webm",
  "video/mkv",
];

// Error types for better handling
enum ErrorType {
  NETWORK = "network",
  API = "api",
  TRANSCRIPTION = "transcription",
  FILE = "file",
  VALIDATION = "validation",
}

// Helper: convert File to Base64
const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        if (!result || !result.includes(",")) {
          throw new Error("Invalid file format");
        }
        resolve(result.split(",")[1]);
      } catch (error) {
        reject(new Error("Failed to convert video file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read video file"));
    reader.readAsDataURL(file);
  });

// Utility function for exponential backoff during API calls
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 5
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(
          `API Error: ${response.status} - ${
            errorBody.error?.message || response.statusText
          }`
        );
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error("Max retries reached. Request failed.", error);
        throw error;
      }
      if ((error as Error).message.includes("API Error")) throw error;
    }
  }
  throw new Error("Request failed after max retries.");
}

interface Source {
  uri: string;
  title: string;
}

const VideoCommentPage: React.FC = () => {
  const { getApi, postApi } = useGeneralApiCall();

  // Video file states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Text and transcription states
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [originalText, setOriginalText] = useState<string>("");
  const [hasTranscription, setHasTranscription] = useState(false);
  const [isTextVerified, setIsTextVerified] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);

  // Loading and UI states
  const [loading, setLoading] = useState(false);
  const [queryArray, setQueryArray] = useState<any[]>([
    {
      comment: "Sample video comment with transcription",
      created_at: "2024-10-10T12:00:00Z",
      id: 1,
      video: "https://www.w3schools.com/html/mov_bbb.mp4",
      transcription: "This is a sample transcribed text from the video.",
    },
  ]);

  // Error handling states
  const [error, setError] = useState<{
    type: ErrorType | null;
    message: string;
    details?: string;
  }>({ type: null, message: "", details: "" });

  // Alert/notification state
  const [alert, setAlert] = useState<{
    type: "success" | "warning" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear error helper
  const clearError = () => {
    setError({ type: null, message: "", details: "" });
  };

  // Show alert helper
  const showAlert = (
    type: "success" | "warning" | "error" | "info",
    message: string
  ) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: "" }), 5000);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate video file
  const validateVideoFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return `Unsupported file type. Please use: ${ACCEPTED_VIDEO_TYPES.join(
        ", "
      )}`;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `File size (${fileSizeMB.toFixed(
        2
      )}MB) exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB`;
    }

    return null;
  };

  // Handle file selection
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      setTranscriptionText("");
      setHasTranscription(false);
      setIsTextVerified(false);
      setSources([]);
      clearError();

      const files = event.target.files;
      if (!files || files.length === 0) {
        setSelectedFile(null);
        setVideoBase64(null);
        setVideoPreview(null);
        return;
      }

      const file = files[0];

      // Validate file
      const validationError = validateVideoFile(file);
      if (validationError) {
        setError({
          type: ErrorType.FILE,
          message: validationError,
        });
        showAlert("error", validationError);
        return;
      }

      setSelectedFile(file);
      setVideoMimeType(file.type);
      setIsProcessing(true);

      try {
        // Create video preview
        const previewUrl = URL.createObjectURL(file);
        setVideoPreview(previewUrl);

        // Convert to base64 with progress
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const base64Data = await getBase64(file);
        setVideoBase64(base64Data);

        clearInterval(progressInterval);
        setUploadProgress(100);

        showAlert(
          "success",
          `Video file "${file.name}" loaded successfully! Ready for transcription.`
        );

        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        console.error("Error processing file:", error);
        setError({
          type: ErrorType.FILE,
          message: "Error processing video file",
          details: error instanceof Error ? error.message : "Unknown error",
        });
        showAlert("error", "Failed to process video file. Please try again.");
        setVideoBase64(null);
        setVideoPreview(null);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        handleFileChange({ target: { files: dt.files } } as any);
      }
    }
  };

  // Transcribe video using Gemini API
  const handleTranscribe = useCallback(async () => {
    if (isTranscribing || !videoBase64 || !videoMimeType) return;

    setIsTranscribing(true);
    setTranscriptionText("");
    setSources([]);
    clearError();

    try {
      showAlert(
        "info",
        "Transcribing video with Google Gemini AI... This may take a few minutes."
      );

      const userPrompt =
        "Transcribe all spoken dialogue and narration from this video file into plain text. Focus only on the audio content - what people are saying or any voice-over. Do not describe visual elements. Return only the complete transcription of the spoken words.";

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: userPrompt },
              {
                inlineData: {
                  mimeType: videoMimeType,
                  data: videoBase64,
                },
              },
            ],
          },
        ],
        tools: [{ google_search: {} }],
        systemInstruction: {
          parts: [
            {
              text: "You are an expert video transcription service. You must accurately transcribe only the spoken audio content from videos. Do not describe visual elements or add interpretations - only transcribe what is actually spoken.",
            },
          ],
        },
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        },
      };

      const apiUrl = `${API_CONFIG.url}?key=${apiKey}`;
      const response = await fetchWithBackoff(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const transcribedText = candidate.content.parts[0].text.trim();
        setTranscriptionText(transcribedText);
        setHasTranscription(true);
        setIsTextVerified(false);

        // Extract grounding sources
        let extractedSources: Source[] = [];
        const groundingMetadata = candidate.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingAttributions) {
          extractedSources = groundingMetadata.groundingAttributions
            .map((attribution: any) => ({
              uri: attribution.web?.uri,
              title: attribution.web?.title,
            }))
            .filter((source: Source) => source.uri && source.title);
        }
        setSources(extractedSources);

        showAlert(
          "success",
          "Video transcribed successfully! Please verify the transcription before submitting."
        );
      } else {
        throw new Error("No transcription content received from Gemini API");
      }
    } catch (error) {
      console.error("Transcription error:", error);

      let errorMessage = "Video transcription failed";
      if (error instanceof Error) {
        if (error.message.includes("API Error")) {
          errorMessage = error.message;
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("429")
        ) {
          errorMessage =
            "Google Gemini API rate limit exceeded. Please wait and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setError({
        type: ErrorType.TRANSCRIPTION,
        message: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });

      showAlert("error", `Transcription failed: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  }, [videoBase64, videoMimeType]);

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTranscriptionText(newText);
    setOriginalText(newText);
    setIsTextVerified(false);
    clearError();
  };

  // Verify transcription
  const handleVerifyText = () => {
    if (!transcriptionText.trim()) {
      showAlert("warning", "Please enter some text before verifying.");
      return;
    }

    setIsTextVerified(true);
    showAlert(
      "success",
      "Transcription verified! You can now submit your video comment."
    );
  };

  // Submit video comment
  const handleSubmit = async () => {
    // Validation
    if (!selectedFile && !transcriptionText.trim()) {
      showAlert(
        "warning",
        "Please upload a video or enter text before submitting."
      );
      return;
    }

    if (hasTranscription && !isTextVerified) {
      showAlert(
        "warning",
        "Please verify the transcribed text before submitting."
      );
      return;
    }

    if (transcriptionText.trim().length < 5) {
      showAlert("warning", "Comment must be at least 5 characters long.");
      return;
    }

    setLoading(true);
    clearError();

    try {
      const formData = new FormData();
      formData.append("comment", transcriptionText.trim());

      if (selectedFile) {
        formData.append("video", selectedFile, selectedFile.name);
      }

      // Mock API call - replace with your actual endpoint
      // const response = await postApi("/video-comments/create/", formData, {
      //   headers: { "Content-Type": "multipart/form-data" },
      // });

      // Mock successful response
      const mockResponse = {
        status: 201,
        data: {
          id: Date.now(),
          comment: transcriptionText.trim(),
          video: videoPreview,
          transcription: transcriptionText.trim(),
          created_at: new Date().toISOString(),
          created_by: "Current User",
        },
      };

      // Success
      setQueryArray((prev) => [...prev, mockResponse.data]);
      setTranscriptionText("");
      setOriginalText("");
      setSelectedFile(null);
      setVideoBase64(null);
      setVideoPreview(null);
      setHasTranscription(false);
      setIsTextVerified(false);
      setSources([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showAlert("success", "Video comment submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);

      let errorMessage = "Failed to submit video comment";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError({
        type: ErrorType.API,
        message: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });

      showAlert("error", `Submission failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  // Alert Component
  const AlertComponent = () => {
    if (!alert.type) return null;

    const alertStyles = {
      success: "bg-green-100 border-green-500 text-green-700",
      error: "bg-red-100 border-red-500 text-red-700",
      warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
      info: "bg-blue-100 border-blue-500 text-blue-700",
    };

    return (
      <div
        className={`${alertStyles[alert.type]} border-l-4 p-4 mb-4 relative  `}
      >
        <button
          onClick={() => setAlert({ type: null, message: "" })}
          className="absolute top-2 right-2 text-2xl hover:opacity-70 cursor-pointer"
        >
          ×
        </button>
        <p className="font-medium pr-8">{alert.message}</p>
      </div>
    );
  };

  // Error Component
  const ErrorComponent = () => {
    if (!error.type) return null;

    return (
      <div className="bg-red-50 border border-red-200  p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {error.type === ErrorType.API && "API Error"}
              {error.type === ErrorType.TRANSCRIPTION && "Transcription Error"}
              {error.type === ErrorType.FILE && "File Error"}
              {error.type === ErrorType.NETWORK && "Network Error"}
              {error.type === ErrorType.VALIDATION && "Validation Error"}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
              {error.details && (
                <p className="mt-1 text-xs text-red-600">
                  Details: {error.details}
                </p>
              )}
            </div>
            <button
              onClick={clearError}
              className="mt-3 text-sm text-red-800 underline hover:text-red-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.55-2.55a1 1 0 011.45.9v6.2a1 1 0 01-1.45.9L15 14H9a2 2 0 01-2-2V8a2 2 0 012-2h6z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Video Comment Transcription
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a video file and let Google Gemini AI transcribe the audio
            into text for your comment
          </p>
        </div>

        <AlertComponent />
        <ErrorComponent />

        {/* Main Content Card */}
        <div className="bg-white shadow-xl border border-gray-200 overflow-hidden">
          {/* Video Upload Section */}
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-indigo-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Video File
            </h2>

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed p-8 text-center transition-all duration-200 ${
                isProcessing
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer"
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />

              {uploadProgress > 0 && uploadProgress < 100 ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-indigo-600 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Processing Video...
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {uploadProgress}% complete
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Ready for transcription
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop video file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports MP4, MOV, AVI, WebM, MKV files up to{" "}
                      {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Preview */}
            {videoPreview && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Video Preview
                </h3>
                <div className="relative overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    className="w-full max-h-96 object-contain"
                    preload="metadata"
                  />
                </div>
              </div>
            )}

            {/* Transcribe Button */}
            {selectedFile && (
              <div className="mt-6">
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing || !videoBase64}
                  className={`w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                    isTranscribing
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isTranscribing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Transcribing with Gemini AI...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
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
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      <span>Start Video Transcription</span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Transcription Section */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-indigo-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Transcribed Text
            </h2>

            <div className="space-y-4">
              <textarea
                rows={8}
                className={`w-full p-4 border transition-colors resize-none ${
                  hasTranscription && !isTextVerified
                    ? "border-yellow-400 bg-yellow-50"
                    : isTextVerified
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 bg-white"
                } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder={
                  isTranscribing
                    ? "Transcribing video with Google Gemini AI..."
                    : hasTranscription && !isTextVerified
                    ? "Please verify the transcribed text before submitting..."
                    : "Transcribed text will appear here, or you can type manually..."
                }
                value={transcriptionText}
                onChange={handleTextChange}
                disabled={isTranscribing}
              />

              {/* Verification Notice */}
              {hasTranscription && !isTextVerified && (
                <div className="bg-yellow-50 border border-yellow-200  p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Verify Transcription
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        AI transcription may not be 100% accurate. Please review
                        and verify the text before submitting.
                      </p>
                      <button
                        onClick={handleVerifyText}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-medium  hover:bg-yellow-700 transition-colors"
                      >
                        Verify & Approve Text
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Notice */}
              {isTextVerified && (
                <div className="bg-green-50 border border-green-200  p-4">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-green-800">
                      ✅ Text verified and ready to submit!
                    </p>
                  </div>
                </div>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <div className="bg-gray-50 border border-gray-200  p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Grounding Sources (Google Search)
                  </h3>
                  <ul className="space-y-1">
                    {sources.map((source, index) => (
                      <li key={index}>
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  isTranscribing ||
                  (!transcriptionText.trim() && !selectedFile) ||
                  (hasTranscription && !isTextVerified)
                }
                className={`w-full px-6 py-4  font-semibold text-white transition-all duration-200 ${
                  loading ||
                  isTranscribing ||
                  (!transcriptionText.trim() && !selectedFile) ||
                  (hasTranscription && !isTextVerified)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    <span>Submit Video Comment</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submitted Videos Section */}
        {queryArray.length > 0 && (
          <div className="mt-8">
            <div className="bg-white  shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 text-indigo-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Submitted Video Comments ({queryArray.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {queryArray.map((item, index) => (
                  <div key={item.id || index} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        Video #{index + 1}
                      </span>
                      <div className="text-right text-sm text-gray-500">
                        <p>👤 {item.created_by || "Anonymous"}</p>
                        <p>
                          📅 {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        <p>
                          🕐 {new Date(item.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Video */}
                      {item.video && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Video
                          </h4>
                          <video
                            src={item.video}
                            controls
                            className="w-full  shadow-sm"
                            preload="metadata"
                          />
                        </div>
                      )}

                      {/* Transcription */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Transcribed Comment
                        </h4>
                        <div className="bg-gray-50  p-4 max-h-40 overflow-y-auto">
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {item.transcription || item.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutComponents(VideoCommentPage);
