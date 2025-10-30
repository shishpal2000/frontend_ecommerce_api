"use client";

import { Suspense } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cancelErrorMessage?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  error?: string | null;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  cancelErrorMessage,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
  error,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getButtonColors = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
      default:
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
    }
  };

  const getIconColors = () => {
    switch (type) {
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-center mb-4">
              <div
                className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10`}
              >
                <svg
                  className={`h-6 w-6 ${getIconColors()}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-gray-500">{message}</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full inline-flex justify-center px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto ${getButtonColors()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md mx-6 my-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">Error: </p>
                <button
                  className="text-white cursor-pointer border-2 px-2 py-1 border-red-900 bg-red-600"
                  onClick={cancelErrorMessage}
                >
                  Dismiss
                </button>
              </div>
              <div>
                {" "}
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}
