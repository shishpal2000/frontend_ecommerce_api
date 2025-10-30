"use client";

import { useState, useEffect } from "react";

type DevelopmentCycle = {
  development_cycle_id: string;
  name: string;
  year: number;
  season: string;
  remarks: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  can_edit: boolean;
};

type ProtoModelProps = {
  isOpen: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (data: { development_cycle_id: string }) => void;
  loading?: boolean;
  developmentCycles?: DevelopmentCycle[];
};

const ProtoModel = ({
  isOpen,
  onClose,
  onSubmit,
  errorMessage,
  loading = false,
  developmentCycles = [],
}: ProtoModelProps) => {
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [error, setError] = useState("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCycleId("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCycleId) {
      setError("Please select a development cycle");
      return;
    }

    onSubmit({ development_cycle_id: selectedCycleId });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed z-40" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed backdrop-blur-sm inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Add MSR Cycle</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
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

          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md mx-6 my-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">Error: {errorMessage} </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select MSR Cycle *
              </label>
              <select
                value={selectedCycleId}
                onChange={(e) => {
                  setSelectedCycleId(e.target.value);
                  setError("");
                }}
                disabled={loading}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  error ? "border-red-500" : "border-gray-200"
                }`}
              >
                <option value="">Select MSR Cycle</option>
                {developmentCycles.map((cycle) => (
                  <option
                    key={cycle.development_cycle_id}
                    value={cycle.development_cycle_id}
                  >
                    {cycle.name} ({cycle.year} - {cycle.season})
                  </option>
                ))}
              </select>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {/* Debug info */}
            <div className="mb-4 text-xs text-gray-500">
              Available cycles: {developmentCycles.length}
              {selectedCycleId && <div>Selected ID: {selectedCycleId}</div>}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedCycleId}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 border-2 border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
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
                <span>Add MSR</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProtoModel;
