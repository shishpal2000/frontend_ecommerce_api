import React from "react";

interface WebSocketStatusProps {
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string | null;
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  status,
  error,
  className = "",
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          color: "bg-green-500",
          text: "Connected",
          icon: "●",
          textColor: "text-green-700",
        };
      case "connecting":
        return {
          color: "bg-yellow-500",
          text: "Connecting...",
          icon: "●",
          textColor: "text-yellow-700",
        };
      case "error":
        return {
          color: "bg-red-500",
          text: "Error",
          icon: "●",
          textColor: "text-red-700",
        };
      case "disconnected":
      default:
        return {
          color: "bg-gray-500",
          text: "Disconnected",
          icon: "●",
          textColor: "text-gray-700",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`} />
      <span className={`text-sm font-medium ${config.textColor}`}>
        WebSocket: {config.text}
      </span>
      {error && status === "error" && (
        <span className="text-xs text-red-600" title={error}>
          ({error})
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;
