"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader } from "@zxing/library";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";

type QRScannerComponentProps = {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: string) => void;
  onScanError: (error: string) => void;
};

const QRScannerComponent: React.FC<QRScannerComponentProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
}) => {
  const { getApi } = useGeneralApiCall();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
  const [scanResult, setScanResult] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, mounted]);

  // Optimize close function with proper cleanup
  const handleClose = useCallback(() => {
    try {
      stopScanning();
      setShowResultDialog(false);
      setShowNotFoundDialog(false);
      setScanResult("");
      setCameraError("");
      setIsSearching(false);
      onClose();
    } catch (error) {
      console.error("Error closing scanner:", error);
      onClose(); // Force close even if cleanup fails
    }
  }, [onClose]);

  const startScanning = async () => {
    try {
      setCameraError("");

      // Request camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (!codeReader.current) {
        codeReader.current = new BrowserQRCodeReader();
      }

      if (videoRef.current) {
        // Set the stream directly to video element
        videoRef.current.srcObject = stream;

        controlsRef.current = await codeReader.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result, error) => {
            if (result) {
              const qrData = result.getText();
              setScanResult(qrData);
              setShowResultDialog(true);
              stopScanning();
            }
            if (error && error.name !== "NotFoundException") {
              console.error("QR scan error:", error);
            }
          }
        );
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Error starting QR Scanner:", error);
      setCameraError("Unable to access camera. Please check permissions.");
      onScanError((error as Error).message || "Failed to start scanner");
    }
  };

  const stopScanning = useCallback(() => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }

      if (codeReader.current) {
        codeReader.current.reset();
      }

      setIsScanning(false);
    } catch (error) {
      console.error("Error stopping scanner:", error);
      setIsScanning(false);
    }
  }, []);

  const handleResultConfirm = async () => {
    if (!scanResult) {
      setShowResultDialog(false);
      return;
    }

    setIsSearching(true);

    try {
      const response: any = await getApi(
        `/qr/search/${scanResult.toUpperCase()}/`
      );

      if (response?.status === 200) {
        if (
          response?.data &&
          Object.keys(response.data).length > 0 &&
          response?.data?.proto_id
        ) {
          setScanResult("");
          setShowResultDialog(false);
          setIsSearching(false);
          onClose();
          stopScanning();
          onScanSuccess(scanResult);

          try {
            router.push(`/collection/proto-detail/${response.data.proto_id}`);
          } catch (error) {
            window.location.href = `/collection/proto-detail/${response.data.proto_id}`;
          }
        } else {
          setIsSearching(false);
          setShowResultDialog(false);
          setShowNotFoundDialog(true);
        }
      } else {
        setIsSearching(false);
        setShowResultDialog(false);
        setShowNotFoundDialog(true);
      }
    } catch (error) {
      console.error("Error searching QR code:", error);
      setIsSearching(false);
      setShowResultDialog(false);
      setShowNotFoundDialog(true);
    }
  };

  const handleResultCancel = () => {
    setShowResultDialog(false);
    setScanResult("");
    startScanning();
  };

  const handleNotFoundTryAgain = () => {
    setShowNotFoundDialog(false);
    setScanResult("");
    startScanning();
  };

  const handleNotFoundClose = () => {
    setShowNotFoundDialog(false);
    setScanResult("");
    handleClose();
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <>
      {/* QR Scanner Modal - Optimized for mobile */}
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-screen overflow-hidden">
          {/* Header with larger close button for mobile */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">QR Code Scanner</h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              style={{ minWidth: "44px", minHeight: "44px" }} // iOS/Android recommended touch target size
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

          {/* Camera view */}
          <div className="p-4">
            <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden mb-4">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                  <svg
                    className="w-12 h-12 mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">{cameraError}</p>
                  <button
                    onClick={startScanning}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    style={{ transform: "scaleX(-1)" }} // Mirror for better UX
                  />
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Scanning overlay */}
                      <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
                      </div>
                      {/* Scanning line animation */}
                      <div className="absolute inset-4 overflow-hidden rounded-lg">
                        <div
                          className="absolute w-full h-0.5 bg-green-400 animate-pulse"
                          style={{
                            animation: "scanLine 2s linear infinite",
                            top: "50%",
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {!isScanning && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="text-center text-sm text-gray-600">
              Point your camera at a QR code to scan
            </div>
          </div>
        </div>
      </div>

      {/* Result Dialog - Optimized for mobile */}
      {showResultDialog && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-90 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">QR Code Detected</h3>
              <div className="bg-gray-100 p-3 rounded-lg mb-6">
                <code className="text-sm font-mono break-all">
                  {scanResult}
                </code>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResultConfirm}
                  disabled={isSearching}
                  className="w-full py-3 px-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  style={{ minHeight: "44px" }}
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    "Go to Proto Detail"
                  )}
                </button>
                <button
                  onClick={handleResultCancel}
                  disabled={isSearching}
                  className="w-full py-3 px-4 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  style={{ minHeight: "44px" }}
                >
                  Scan Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Not Found Dialog - Optimized for mobile */}
      {showNotFoundDialog && (
        <div className="fixed inset-0  bg-opacity-90 z-70 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                QR Code Not Found
              </h3>
              <p className="text-gray-600 mb-4">
                No proto was found for the scanned QR code:
              </p>
              <div className="bg-gray-100 px-3 py-2 rounded-md mb-6">
                <code className="text-sm font-mono break-all">
                  {scanResult}
                </code>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNotFoundTryAgain}
                  className="w-full py-3 px-4 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  style={{ minHeight: "44px" }}
                >
                  Scan Another QR
                </button>
                <button
                  onClick={handleNotFoundClose}
                  className="w-full py-3 px-4 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  style={{ minHeight: "44px" }}
                >
                  Close Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for scan line animation */}
      <style jsx>{`
        @keyframes scanLine {
          0% {
            top: 10%;
          }
          50% {
            top: 50%;
          }
          100% {
            top: 90%;
          }
        }
      `}</style>
    </>
  );
};

export default QRScannerComponent;
