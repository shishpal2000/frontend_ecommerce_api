"use client";

import React from "react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  variant?: "spinner" | "dots" | "pulse" | "bars";
  text?: string;
  color?: "blue" | "green" | "red" | "gray" | "purple";
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  variant = "spinner",
  text = "Loading...",
  color = "blue",
  fullScreen = false,
}) => {
  // Size configurations
  const sizeClasses = {
    small: {
      spinner: "w-4 h-4",
      text: "text-xs",
      container: "gap-2",
    },
    medium: {
      spinner: "w-8 h-8",
      text: "text-sm",
      container: "gap-3",
    },
    large: {
      spinner: "w-12 h-12",
      text: "text-base",
      container: "gap-4",
    },
  };

  // Color configurations
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    gray: "text-gray-600",
    purple: "text-purple-600",
  };

  // Spinner Component
  const Spinner = () => (
    <svg
      className={`${sizeClasses[size].spinner} animate-spin ${colorClasses[color]}`}
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
  );

  // Dots Component
  const Dots = () => (
    <div className={`flex ${sizeClasses[size].container}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${
            size === "small"
              ? "w-2 h-2"
              : size === "medium"
              ? "w-3 h-3"
              : "w-4 h-4"
          } bg-current rounded-full animate-pulse ${colorClasses[color]}`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );

  // Pulse Component
  const Pulse = () => (
    <div
      className={`${sizeClasses[size].spinner} bg-current rounded-full animate-pulse ${colorClasses[color]} opacity-75`}
    />
  );

  // Bars Component
  const Bars = () => (
    <div className={`flex ${sizeClasses[size].container} items-end`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`${
            size === "small" ? "w-1" : size === "medium" ? "w-1.5" : "w-2"
          } bg-current ${colorClasses[color]} animate-pulse`}
          style={{
            height:
              size === "small" ? "12px" : size === "medium" ? "20px" : "28px",
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </div>
  );

  // Render appropriate variant
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <Dots />;
      case "pulse":
        return <Pulse />;
      case "bars":
        return <Bars />;
      default:
        return <Spinner />;
    }
  };

  // Container component
  const LoaderContainer = ({ children }: { children: React.ReactNode }) => (
    <div
      className={`flex flex-col items-center justify-center ${
        sizeClasses[size].container
      } ${fullScreen ? "fixed inset-0 bg-white bg-opacity-90 z-50" : "p-4"}`}
    >
      {children}
    </div>
  );

  return (
    <LoaderContainer>
      {renderLoader()}
      {text && (
        <span
          className={`font-medium ${colorClasses[color]} ${sizeClasses[size].text}`}
        >
          {text}
        </span>
      )}
    </LoaderContainer>
  );
};

export default Loading;
