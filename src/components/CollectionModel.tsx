"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Updated types to match your page
type Collection = {
  collection_id?: string;
  name: string;
  collection_jc_number?: string;
  sampling_merchant_id: string;
  development_cycle_id: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
};

type CollectionModalProps = {
  isOpen: boolean;
  error?: string | null;
  currentSeasonName?: string;
  onClose: () => void;
  onSubmit: (collectionData: {
    name: string;
    sampling_merchant_id: string;
    development_cycle_id?: string;
    remarks?: string;

    collection_jc_number?: string;
  }) => void;
  editData?: any | null;
  loading?: boolean;
  merchants?: { user_id: string; name: string }[];
  sampling_merchant_id?: string;
};

const CollectionModal = ({
  isOpen,
  error,
  onClose,
  onSubmit,
  editData = null,
  loading = false,
  merchants = [],
}: CollectionModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    sampling_merchant_id: "",
    remarks: "",

    collection_jc_number: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    sampling_merchant_id: "",

    collection_jc_number: "",
  });

  console.log("Current user in editData:", editData);

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        console.log("editData:", editData);
        setFormData({
          name: editData.name || "",
          sampling_merchant_id: editData.sampling_merchant_id || "",
          remarks: editData.remarks || "",
          collection_jc_number:
            editData.jc_number || editData.collection_jc_number || "",
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: "",
          sampling_merchant_id: user?.user_id || "",
          remarks: "",
          collection_jc_number: "",
        });
      }
      setErrors({
        name: "",
        sampling_merchant_id: "",
        collection_jc_number: "",
      });
    }
  }, [isOpen, editData, user?.user_id]);

  const validateForm = () => {
    const newErrors = {
      name: "",
      sampling_merchant_id: "",
      collection_jc_number: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Collection name is required";
    }

    if (!formData.collection_jc_number.trim()) {
      newErrors.collection_jc_number = "JC Number is required";
    }

    if (!editData && !formData.sampling_merchant_id) {
      newErrors.sampling_merchant_id = "Please select a sampling merchant";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      collection_jc_number: formData.collection_jc_number.trim(),
      sampling_merchant_id: formData.sampling_merchant_id,
      remarks: formData.remarks.trim(),
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing/selecting
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Bootstrap-like Modal Backdrop with Fade Animation */}
      <div
        className="fixed  z-40"
        onClick={handleBackdropClick}
        style={{
          animation: isOpen ? "fadeIn 0.15s ease-out" : "fadeOut 0.15s ease-in",
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isOpen
              ? "slideIn 0.3s ease-out"
              : "slideOut 0.3s ease-in",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {editData ? "Edit Style" : "Create New Style"}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-2 hover:bg-gray-100 rounded-full transition-colors"
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

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md mx-6 my-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">
                  Error: <span>{error}</span>{" "}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Collection Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Style Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="e.g., Summer Style 2024"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors ${
                    errors.name
                      ? "border-red-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* JC Number */}
              <div>
                <label
                  htmlFor="collection_jc_number" // Fixed: was "name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  JC Number *
                </label>
                <input
                  type="text"
                  id="collection_jc_number"
                  name="collection_jc_number"
                  required
                  value={formData.collection_jc_number || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="e.g., JC12345"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors ${
                    errors.collection_jc_number
                      ? "border-red-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
                {errors.collection_jc_number && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.collection_jc_number}
                  </p>
                )}
              </div>

              {/* Sampling Merchant Dropdown */}
              <div>
                <label
                  htmlFor="sampling_merchant_id"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Sampling Merchant *
                </label>
                <select
                  id="sampling_merchant_id"
                  name="sampling_merchant_id"
                  value={formData.sampling_merchant_id}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors ${
                    errors.sampling_merchant_id
                      ? "border-red-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <option value="">Select Sampling Merchant</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.user_id} value={merchant.user_id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
                {errors.sampling_merchant_id && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.sampling_merchant_id}
                  </p>
                )}
              </div>

              {/* Remarks (Optional) */}
              {editData ? (
                <div>
                  <label
                    htmlFor="remarks"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Remarks{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    disabled={loading}
                    rows={3}
                    placeholder="Additional notes about this style..."
                    className="w-full px-4 py-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-colors"
                  />
                </div>
              ) : null}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-transparent rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
              >
                {loading && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                <span>{editData ? "Update Style" : "Create Style"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
        }
      `}</style>
    </>
  );
};

export default CollectionModal;
