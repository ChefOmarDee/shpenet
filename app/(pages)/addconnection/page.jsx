"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Footer from "../_comps/footer";
import { useRouter } from "next/navigation";
import { Camera, SwitchCamera, ExternalLink, Home, LogOut } from "lucide-react";
import jsQR from "jsqr";

// Logout Dialog Component
const LogoutDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-lightteal-800 border border-orange-600 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-2">Confirm Logout</h2>
        <p className="text-gray-300 mb-6">
          Are you sure you want to logout? Any unsaved progress will be lost.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-lightteal-500 text-white rounded-lg hover:bg-lightteal-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const QRCodeScanner = () => {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [showHoursInput, setShowHoursInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const processingRef = useRef(false);
  const frameCountRef = useRef(0);
  const router = useRouter();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  // Error handling utility
  const handleCameraError = (error) => {};

  // Get available cameras
  const getCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError("Your browser doesn't support camera access");
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices.length === 0) {
        setError("No cameras found on your device");
        return;
      }

      setCameras(videoDevices);

      // Set default camera to the environment-facing one if available
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment")
      );
      setCurrentCamera(backCamera || videoDevices[0]);
    } catch (err) {
      handleCameraError(err);
    }
  }, []);

  // Enhanced constraints for better video quality
  const getConstraints = useCallback(() => {
    return {
      video: currentCamera?.deviceId
        ? {
            deviceId: { exact: currentCamera.deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            brightness: { ideal: 100 },
            contrast: { ideal: 100 },
            exposureMode: "continuous",
            focusMode: "continuous",
            whiteBalanceMode: "continuous",
          }
        : {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            brightness: { ideal: 100 },
            contrast: { ideal: 100 },
            exposureMode: "continuous",
            focusMode: "continuous",
            whiteBalanceMode: "continuous",
          },
    };
  }, [currentCamera]);

  // Enhanced image processing
  const processImage = useCallback((imageData) => {
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data.length);

    // Apply image processing to improve QR code visibility
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale with enhanced contrast
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const adjusted = avg < 128 ? avg * 0.8 : avg * 1.2; // Increase contrast

      newData[i] = adjusted;
      newData[i + 1] = adjusted;
      newData[i + 2] = adjusted;
      newData[i + 3] = 255; // Alpha channel
    }

    return new ImageData(newData, width, height);
  }, []);

  // Enhanced frame processing with error recovery
  const processFrame = useCallback(() => {
    if (!isScanning || processingRef.current) return;
    if (!videoRef.current || !canvasRef.current) return;

    frameCountRef.current += 1;
    if (frameCountRef.current % 2 !== 0) {
      requestAnimationFrame(processFrame);
      return;
    }

    try {
      processingRef.current = true;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d", {
        willReadFrequently: true,
        alpha: false,
      });

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 640;
        canvas.height = 480;
        context.imageSmoothingEnabled = false;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const rawImageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const processedImageData = processImage(rawImageData);

        let code = null;
        const attempts = [
          { inversionAttempts: "dontInvert" },
          { inversionAttempts: "onlyInvert" },
          { inversionAttempts: "attemptBoth" },
        ];

        for (const settings of attempts) {
          code = jsQR(
            processedImageData.data,
            processedImageData.width,
            processedImageData.height,
            settings
          );

          if (code) break;
        }

        if (code && code.data && code.data.trim().length > 0) {
          setResult(code.data);
          setShowHoursInput(true);
          stopScanning();
          return;
        }
      }
    } catch (err) {
      console.error("Frame processing error:", err);
      if (!error) {
        handleCameraError(new Error("Processing error - retrying..."));
      }
    } finally {
      processingRef.current = false;
      if (isScanning) {
        requestAnimationFrame(processFrame);
      }
    }
  }, [isScanning, processImage, error]);

  // Handle frame processing
  useEffect(() => {
    let animationFrameId;
    if (isScanning) {
      animationFrameId = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScanning, processFrame]);

  // Enhanced camera initialization
  const startScanning = useCallback(async () => {
    try {
      setResult("");
      setError("");
      setShowHoursInput(false);
      setHours("");
      frameCountRef.current = 0;

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access not supported");
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(
        getConstraints()
      );

      // Configure track settings for better quality
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints({
            advanced: [
              { brightness: 100 },
              { contrast: 100 },
              { sharpness: 100 },
              { saturation: 100 },
            ],
          });
        } catch (e) {
          console.warn("Could not apply advanced constraints:", e);
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      handleCameraError(err);
    }
  }, [getConstraints]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    const currentIndex = cameras.findIndex(
      (camera) => camera.deviceId === currentCamera?.deviceId
    );
    const nextCamera = cameras[(currentIndex + 1) % cameras.length];
    setCurrentCamera(nextCamera);

    if (isScanning) {
      stopScanning();
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  }, [cameras, currentCamera, isScanning, stopScanning, startScanning]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!hours || Number(hours) % 1 !== 0) {
      alert("Please enter a valid number of hours");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/addconnection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode: result,
          hours: parseInt(hours),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set reminder");
      }

      alert("Reminder set successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error setting reminder:", error);
      alert("Failed to set reminder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Camera controls component
  const CameraControls = useMemo(() => {
    if (showHoursInput) return null;

    return (
      <div className="flex gap-2">
        <button
          onClick={isScanning ? stopScanning : startScanning}
          className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </button>
        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            className="p-2 bg-navy-800 text-orange-400 rounded-lg hover:bg-navy-700 transition-colors border border-orange-500/30"
            title="Switch Camera"
          >
            <SwitchCamera className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  }, [
    isScanning,
    startScanning,
    stopScanning,
    switchCamera,
    cameras.length,
    showHoursInput,
  ]);

  // Result display component
  const ResultDisplay = useMemo(() => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-lightteal-500 rounded-lg border border-orange-600/30">
          <h3 className="font-medium mb-2 text-white">Scanned Result:</h3>
          <div className="flex items-center gap-2">
            {result.startsWith("http") ? (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-orange-300 font-medium transition-colors"
              >
                Go to link <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="break-all text-gray-300">{result}</p>
            )}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result);
              alert("Copied to clipboard!");
            }}
            className="mt-2 text-sm text-white hover:text-orange-300 transition-colors"
          >
            Copy to clipboard
          </button>
        </div>

        {showHoursInput ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="hours" className="font-medium text-white">
                Set reminder in how many hours?
              </label>
              <input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                min="1"
                step="1"
                className="bg-lightteal-500 border border-orange-600/30 rounded-lg px-4 py-2 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter whole number of hours"
                disabled={isSubmitting}
              />
            </div>

            {/* New notes input field */}
            <div className="flex flex-col gap-2 mt-4">
              <label htmlFor="notes" className="font-medium text-white">
                Add Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-lightteal-500 border border-orange-600/30 rounded-lg px-4 py-2 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                placeholder="Enter any additional notes about this connection"
                disabled={isSubmitting}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-400/50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Setting reminder..." : "Submit"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setResult("");
              startScanning();
            }}
            className="w-full border border-orange-500 text-orange-400 py-2 px-4 rounded-lg hover:bg-navy-800/50 transition-colors"
          >
            Scan Another Code
          </button>
        )}
      </div>
    );
  }, [result, startScanning, showHoursInput, hours, notes, isSubmitting]);

  // Initialize component
  useEffect(() => {
    getCameras();
    return () => {
      stopScanning();
    };
  }, [getCameras, stopScanning]);
  return (
    <div className="relative flex flex-col min-h-screen w-full bg-lightteal-500 bg-gradient-to-b from-lightteal-500 to-lightteal-500">
      {/* Navigation Container */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        {/* Home Button */}
        <button
          onClick={() => router.push("/")}
          className="bg-orange-500 text-white p-2 md:p-3 rounded-full hover:bg-orange-600 transition-colors"
          aria-label="Back to Home"
        >
          <Home className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="bg-orange-500 text-white p-2 md:px-6 md:py-3 rounded-full md:rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />

      <div className="flex-grow flex flex-col justify-center items-center w-full px-4 py-12 pt-20">
        <div className="w-full max-w-md mx-auto rounded-lg border border-orange-600 shadow-lg overflow-hidden bg-lightteal-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-orange-500">
                  {showHoursInput
                    ? "Input Hours Until Reminder"
                    : "LinkedIn QR Scanner"}
                </h2>
              </div>
              {currentCamera && !showHoursInput && (
                <p className="text-sm text-orange-400">
                  Using: {currentCamera.label.split("(")[0].trim()}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {!showHoursInput && (
                <div className="relative aspect-video bg-lightteal-800 rounded-lg overflow-hidden border border-orange-600/30">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {!isScanning && !result && (
                    <div className="absolute inset-0 flex items-center justify-center bg-navy-900/50">
                      <p className="text-orange-400">
                        Camera preview will appear here
                      </p>
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-orange-500 rounded-lg"></div>
                    </div>
                  )}
                </div>
              )}

              {CameraControls}

              {error && (
                <div className="p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
                  <p>{error}</p>
                </div>
              )}

              {ResultDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
export default QRCodeScanner;
