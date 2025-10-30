"use client";
import React, { Suspense } from "react";
import LayoutComponents from "../layoutComponents";
import { useSearchParams, useRouter } from "next/navigation";

function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settingsOptionsParam = searchParams.get("list");

  let settingsOptions: any[] = [];

  try {
    if (settingsOptionsParam) {
      const decodedOptions = decodeURIComponent(settingsOptionsParam);
      settingsOptions = JSON.parse(decodedOptions);
    }
  } catch (error) {
    console.error("Error parsing settings options from query param:", error);
    settingsOptions = [];
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
          ⚙️ Settings
        </h1>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {settingsOptions?.length > 0 ? (
            settingsOptions.map((option: any) => (
              <div
                key={option.id}
                onClick={() => router.push(option.path)}
                className="group cursor-pointer bg-white border border-gray-200  shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-6"
              >
                <div className="flex flex-col items-start gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {option.title}
                  </h2>
                  {option.description && (
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 italic">
              No settings options found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg
            className="animate-spin w-8 h-8 text-blue-600"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Loading Settings
        </h2>
        <p className="text-gray-600">
          Please wait while we load your settings...
        </p>
      </div>
    </div>
  );
}

function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full w-full">
          <LoadingSpinner />
        </div>
      }
    >
      <SettingsPage />
    </Suspense>
  );
}

export default LayoutComponents(Page);
