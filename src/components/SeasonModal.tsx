"use client";
import { useState, useEffect } from "react";

type Season = {
  development_cycle_id?: string;
  name: string;
  year: number;
  season: string;
  remarks?: string;
  updated_by?: string;
  created_by?: string;
  can_edit?: boolean;
  created_at?: string;
  updated_at?: string;
};

type SeasonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  error?: string | null;
  onSubmit: (
    seasonData: Omit<
      Season,
      | "development_cycle_id"
      | "updated_by"
      | "created_by"
      | "can_edit"
      | "created_at"
      | "updated_at"
    >
  ) => void;
  editData?: Season | null;
  loading?: boolean;
};

const SeasonModal = ({
  isOpen,
  onClose,
  onSubmit,
  error = null,
  editData = null,
  loading = false,
}: SeasonModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    season: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    year: "",
    season: "",
    remarks: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          name: editData.name || "",
          year: editData.year || new Date().getFullYear(),
          season: editData.season || "",
          remarks: editData.remarks || "",
        });
      } else {
        setFormData({
          name: "",
          year: new Date().getFullYear(),
          season: "",
          remarks: "",
        });
      }
      setErrors({ name: "", year: "", season: "", remarks: "" });
    }
  }, [isOpen, editData]);

  const validateForm = () => {
    const newErrors = {
      name: "",
      year: "",
      season: "",
      remarks: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Season name is required";
    }

    if (!formData.year || formData.year < 2020 || formData.year > 2050) {
      newErrors.year = "Please enter a valid year (2020-2050)";
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
      year: Number(formData.year),
      season: formData.season.trim(),
      remarks: formData.remarks.trim(),
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" ? Number(value) : value,
    }));

    // Clear error when user starts typing
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
      {/* Fixed Backdrop */}
      <div className="fixed " onClick={handleBackdropClick} />

      {/* Modal */}
      <div className="fixed backdrop-blur-sm inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {editData ? "Edit MSR" : "Create New MSR"}
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
                <p className="font-bold">Error: {error} </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Season Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  MSR Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="e.g., 1/29 MSR"
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

              {/* Year */}
              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Year *
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="2020"
                  max="2050"
                  placeholder="2027"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-colors ${
                    errors.year
                      ? "border-red-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
                {errors.year && (
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
                    {errors.year}
                  </p>
                )}
              </div>

              {/* Season Description */}
              <div>
                <label
                  htmlFor="season"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Season Description{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="season"
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                  disabled={loading}
                  rows={3}
                  placeholder="e.g., it is perfect, summer collection, winter items..."
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-colors ${
                    errors.season
                      ? "border-red-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
                {errors.season && (
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
                    {errors.season}
                  </p>
                )}
              </div>

              {editData && (
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
                    placeholder="Additional notes or comments..."
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-colors ${
                      errors.remarks
                        ? "border-red-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                  {errors.remarks && (
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
                      {errors.remarks}
                    </p>
                  )}
                </div>
              )}
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
                <span>{editData ? "Update MSR" : "Create MSR"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SeasonModal;
