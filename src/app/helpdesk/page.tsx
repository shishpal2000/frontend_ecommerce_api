"use client";
import React, { useState, useEffect, useRef } from "react";
import LayoutComponents from "../layoutComponents";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";

// Gemini API config
const API_CONFIG = {
  model: "gemini-2.5-flash-preview-09-2025",
  url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`,
};
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Error types for better handling
enum ErrorType {
  NETWORK = "network",
  API = "api",
  TRANSCRIPTION = "transcription",
  MICROPHONE = "microphone",
  VALIDATION = "validation",
}

// Helper: convert Blob to Base64
const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        if (!result || !result.includes(",")) {
          throw new Error("Invalid file format");
        }
        resolve(result.split(",")[1]);
      } catch (error) {
        reject(new Error("Failed to convert audio file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsDataURL(blob);
  });

const HelpdeskPage: React.FC = () => {
  const { getApi, postApi } = useGeneralApiCall();
  const [queryArray, setQueryArray] = useState<any[]>([]);
  const [text, setText] = useState<string>("");
  const [originalText, setOriginalText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [hasTranscription, setHasTranscription] = useState(false);
  const [isTextVerified, setIsTextVerified] = useState(false);

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setOriginalText(newText);
    setIsTextVerified(false);
    clearError();
  };

  // Fetch queries with error handling
  const fetchComments = async () => {
    try {
      clearError();
      const response = await getApi<any[]>("/helpdesk/queries/");

      if (!response || typeof response !== "object") {
        throw new Error("Invalid response format from server");
      }

      if (response.error_status) {
        throw new Error(response.message || "Failed to fetch queries");
      }

      setQueryArray(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching queries:", error);
      setError({
        type: ErrorType.API,
        message: "Failed to load previous queries",
        details: error instanceof Error ? error.message : "Unknown error",
      });
      setQueryArray([]);
    }
  };

  // Validate audio quality
  const validateAudioQuality = (audioBlob: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      if (audioBlob.size < 1024) {
        // Less than 1KB
        resolve(false);
      }

      // Additional audio validation could be added here
      // For now, just check basic size
      resolve(true);
    });
  };

  // Enhanced Gemini transcription with better error handling
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    clearError();

    try {
      // Validate audio first
      const isValidAudio = await validateAudioQuality(audioBlob);
      if (!isValidAudio) {
        throw new Error("Audio quality is too poor or recording is too short");
      }

      // Show progress alert
      showAlert("info", "Processing audio with Google Gemini AI...");

      // Convert to base64
      let base64Data: string;
      try {
        base64Data = await blobToBase64(audioBlob);
      } catch (conversionError) {
        throw new Error("Failed to process audio file format");
      }

      // Prepare API payload
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Please transcribe the following audio accurately. The speaker may use a mix of Hindi and English (Hinglish). Only return the text exactly as spoken.",
              },
              {
                inlineData: {
                  mimeType: audioBlob.type,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more consistent transcription
          maxOutputTokens: 1000,
        },
      };

      const apiUrl = `${API_CONFIG.url}?key=${apiKey}`;

      // API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "HelpdeskApp/1.0",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Google Gemini API rate limit exceeded. Please wait a moment and try again."
          );
        } else if (response.status === 401) {
          throw new Error(
            "Google Gemini API authentication failed. Please check API configuration."
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Google Gemini server is currently unavailable. Please try again later."
          );
        } else {
          throw new Error(
            `Google Gemini API error (${response.status}). Please try again.`
          );
        }
      }

      const result = await response.json();

      if (!result || !result.candidates || result.candidates.length === 0) {
        throw new Error("Google Gemini returned no transcription results");
      }

      const generatedText = result.candidates[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Google Gemini failed to generate transcription");
      }

      if (generatedText.trim() === "AUDIO_UNCLEAR") {
        throw new Error(
          "Audio is unclear or inaudible. Please try recording again in a quieter environment."
        );
      }

      // Success - set transcription
      const cleanedText = generatedText.trim();
      setText(originalText + (originalText ? " " : "") + cleanedText);
      setHasTranscription(true);
      setIsTextVerified(false);

      showAlert(
        "success",
        "Audio transcribed successfully! Please verify the text before submitting."
      );
    } catch (error) {
      console.error("Transcription error:", error);

      let errorMessage = "Transcription failed";
      let errorType = ErrorType.TRANSCRIPTION;

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage =
            "Transcription timed out. Please try with a shorter audio recording.";
          errorType = ErrorType.NETWORK;
        } else if (error.message.includes("Gemini")) {
          errorMessage = error.message;
          errorType = ErrorType.API;
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network connection failed. Please check your internet connection.";
          errorType = ErrorType.NETWORK;
        } else {
          errorMessage = error.message;
        }
      }

      setError({
        type: errorType,
        message: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });

      showAlert("error", `Google Gemini Error: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Enhanced recording with better error handling
  const handleAudioClick = async () => {
    if (isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      return;
    }

    try {
      clearError();
      setRecordedChunks([]);
      setHasTranscription(false);
      if (audioRef.current) audioRef.current.src = "";

      // Check microphone permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        throw new Error("Audio recording format not supported in this browser");
      }

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      let chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
        stream.getTracks().forEach((t) => t.stop());

        if (chunks.length === 0) {
          showAlert("warning", "No audio was recorded. Please try again.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          transcribeAudio(audioBlob);
        } else {
          showAlert(
            "warning",
            "Recording is empty. Please try recording again."
          );
        }
      };

      recorder.onerror = (e) => {
        console.error("Recording error:", e);
        setError({
          type: ErrorType.MICROPHONE,
          message: "Recording failed due to microphone error",
          details: "Please check microphone permissions and try again",
        });
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recorder.start(1000); // Collect data every second

      showAlert(
        "info",
        "Recording started. Speak clearly into your microphone."
      );
    } catch (error) {
      console.error("Microphone error:", error);
      setIsRecording(false);

      let errorMessage = "Microphone access failed";
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Microphone permission denied. Please allow microphone access and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setError({
        type: ErrorType.MICROPHONE,
        message: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      });

      showAlert("error", errorMessage);
    }
  };

  // Verify transcription
  const handleVerifyText = () => {
    if (!text.trim()) {
      showAlert("warning", "Please enter some text before verifying.");
      return;
    }

    setIsTextVerified(true);
    showAlert("success", "Text verified! You can now submit your query.");
  };

  // Play recorded audio
  const handlePlayAudio = () => {
    if (recordedChunks.length === 0 || !audioRef.current) {
      showAlert("warning", "No audio available to play.");
      return;
    }

    try {
      const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
      audioRef.current.src = URL.createObjectURL(audioBlob);
      audioRef.current.play();
      showAlert("info", "Playing recorded audio...");
    } catch (error) {
      showAlert("error", "Failed to play audio.");
    }
  };

  // Enhanced submit with validation
  const handleSubmit = async () => {
    // Validation
    if (!text.trim() && recordedChunks.length === 0) {
      showAlert(
        "warning",
        "Please enter text or record audio before submitting."
      );
      return;
    }

    if (hasTranscription && !isTextVerified) {
      showAlert(
        "warning",
        "Please verify the transcribed text before submitting. Google Gemini voice-to-text may not be 100% accurate."
      );
      return;
    }

    if (text.trim().length < 5) {
      showAlert("warning", "Query must be at least 5 characters long.");
      return;
    }

    setLoading(true);
    clearError();

    try {
      const formData = new FormData();
      formData.append("issue", text.trim());

      if (recordedChunks.length > 0) {
        const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
        formData.append("audio", audioBlob, "voice-message.webm");
      }

      const response = await postApi("/helpdesk/queries/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!response || response.error_status) {
        throw new Error(response?.message || "Failed to submit query");
      }

      // Success
      if (response.status === 201 || response.data) {
        setQueryArray((prev) => [...prev, response.data]);
        setText("");
        setOriginalText("");
        setRecordedChunks([]);
        setHasTranscription(false);
        setIsTextVerified(false);

        if (audioRef.current) audioRef.current.src = "";

        showAlert("success", "Query submitted successfully!");
        await fetchComments();
      }
    } catch (error) {
      console.error("Submission error:", error);

      let errorMessage = "Failed to submit query";
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

  // Cleanup on unmount
  useEffect(() => {
    fetchComments();

    return () => {
      setIsRecording(false);
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
        className={`${alertStyles[alert.type]} border-l-4 p-4 mb-4 relative`}
      >
        <button
          onClick={() => setAlert({ type: null, message: "" })}
          className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          ×
        </button>
        <p className="font-medium">{alert.message}</p>
      </div>
    );
  };

  // Error Component
  const ErrorComponent = () => {
    if (!error.type) return null;

    return (
      <div className="bg-red-50 border border-red-200 -md p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {error.type === ErrorType.API && "API Error"}
              {error.type === ErrorType.TRANSCRIPTION && "Transcription Error"}
              {error.type === ErrorType.MICROPHONE && "Microphone Error"}
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
          </div>
        </div>
        <button
          onClick={clearError}
          className="mt-3 text-sm text-red-800 underline hover:text-red-900 cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    );
  };

  return (
    <div className="border p-4 my-8 mx-4 sm:mx-8 md:mx-16 lg:mx-32 xl:mx-48 2xl:mx-64">
      <div className="text-center font-bold uppercase text-2xl mb-4">
        Helpdesk Page
      </div>

      <AlertComponent />
      <ErrorComponent />

      <div className="relative">
        <textarea
          rows={4}
          style={{ minHeight: "100px" }}
          className={`border p-2 w-full ${
            hasTranscription && !isTextVerified
              ? "border-yellow-400 bg-yellow-50"
              : isTextVerified
              ? "border-green-400 bg-green-50"
              : "border-gray-300"
          }`}
          placeholder={
            isTranscribing
              ? "Transcribing audio with Google Gemini AI..."
              : hasTranscription && !isTextVerified
              ? "Please verify the transcribed text before submitting..."
              : "Enter your query or use Audio..."
          }
          value={text}
          onChange={handleTextChange}
          disabled={isTranscribing}
        />

        {hasTranscription && !isTextVerified && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 ">
            <p className="text-sm text-yellow-800">
              ⚠️ Text was transcribed using Google Gemini AI. Please verify
              accuracy before submitting.
            </p>
            <button
              onClick={handleVerifyText}
              className="mt-1 text-sm bg-yellow-500 text-white px-3 py-1  hover:bg-yellow-600 cursor-pointer"
            >
              Verify Text
            </button>
          </div>
        )}

        {isTextVerified && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 ">
            <p className="text-sm text-green-800">
              ✅ Text verified and ready to submit!
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4 items-center flex-wrap">
          <button
            type="button"
            onClick={handleAudioClick}
            disabled={isTranscribing || loading}
            className={`border py-2 px-4  cursor-pointer flex items-center gap-2 transition-colors ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 text-white"
                : isTranscribing
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-amber-200 hover:bg-amber-300"
            }`}
          >
            {isRecording ? (
              <>
                <span className="w-2 h-2 bg-white -full animate-pulse"></span>
                Stop Recording
              </>
            ) : isTranscribing ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent -full animate-spin"></span>
                Transcribing...
              </>
            ) : (
              "Record Audio"
            )}
          </button>

          {recordedChunks.length > 0 && !isRecording && (
            <button
              type="button"
              onClick={handlePlayAudio}
              disabled={isTranscribing}
              className="border py-2 px-4  bg-green-200 hover:bg-green-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Listen
            </button>
          )}

          <button
            className="bg-blue-500 text-white px-4 py-2  hover:bg-blue-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSubmit}
            disabled={
              loading ||
              isTranscribing ||
              (!text.trim() && recordedChunks.length === 0) ||
              (hasTranscription && !isTextVerified)
            }
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent -full animate-spin"></span>
                Submitting...
              </>
            ) : (
              "Submit Query"
            )}
          </button>
        </div>

        <audio ref={audioRef} hidden />
      </div>

      {queryArray.length > 0 && (
        <div className="text-center font-medium text-lg mt-6 uppercase border p-3 bg-gray-50">
          📋 YOUR SUBMITTED QUERIES ({queryArray.length})
        </div>
      )}

      {queryArray.map((item, index) => (
        <div
          key={item.id || index}
          className="border p-4 mt-4 bg-white -lg shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-500">
              Query #{index + 1}
            </span>
            <span
              className={`text-xs px-2 py-1  ${
                item.status === "resolved"
                  ? "bg-green-100 text-green-800"
                  : item.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {item.status || "submitted"}
            </span>
          </div>

          <p className="text-gray-800 text-md mb-3">{item.issue}</p>

          {item.audio && (
            <audio
              src={item.audio}
              controls
              className="mt-2 w-full sm:w-[60%] md:w-[50%]"
              preload="metadata"
            />
          )}

          <div className="w-full flex gap-4 justify-end mt-3 text-xs text-gray-500 border-t pt-2">
            <p>👤 {item.created_by || "Anonymous"}</p>
            <p>📅 {item.created_at?.split("T")[0] || "N/A"}</p>
            <p>🕐 {item.created_at?.split("T")[1]?.split(".")[0] || "N/A"}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LayoutComponents(HelpdeskPage);
