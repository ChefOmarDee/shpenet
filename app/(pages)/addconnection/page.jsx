"use client";
import Footer from "../_comps/footer";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
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
  const handleCameraError = (error) => {
    console.error("Camera Error:", error);
    let errorMessage = "Unable to access camera. ";

    if (!navigator.mediaDevices) {
      errorMessage +=
        "Your browser doesn't support camera access. Please try using a modern browser.";
    } else if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      errorMessage +=
        "Camera permission was denied. Please allow camera access and try again.";
    } else if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      errorMessage += "No camera found on your device.";
    } else if (
      error.name === "NotReadableError" ||
      error.name === "TrackStartError"
    ) {
      errorMessage += "Camera is already in use by another application.";
    } else if (error.name === "OverconstrainedError") {
      errorMessage += "Camera doesn't meet the required constraints.";
    } else if (error.name === "SecurityError") {
      errorMessage += "Camera access is restricted due to security settings.";
    } else {
      errorMessage += error.message || "An unknown error occurred.";
    }

    setError(errorMessage);
  };

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

  // Get constraints based on selected camera
  const getConstraints = useCallback(() => {
    return {
      video: currentCamera?.deviceId
        ? {
            deviceId: { exact: currentCamera.deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15 },
          }
        : {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15 },
          },
    };
  }, [currentCamera]);

  // Frame processing logic
  const processFrame = useCallback(() => {
    if (!isScanning || processingRef.current) return;
    if (!videoRef.current || !canvasRef.current) return;

    frameCountRef.current += 1;
    if (frameCountRef.current % 3 !== 0) {
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
        canvas.width = 240;
        canvas.height = 180;
        context.imageSmoothingEnabled = false;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          setResult(code.data);
          setShowHoursInput(true);
          stopScanning();
          return;
        }
      }
    } catch (err) {
      console.error("Frame processing error:", err);
      handleCameraError(err);
    } finally {
      processingRef.current = false;
      if (isScanning) {
        requestAnimationFrame(processFrame);
      }
    }
  }, [isScanning]);

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

  // Start scanning
  const startScanning = useCallback(async () => {
    try {
      setResult("");
      setError("");
      setShowHoursInput(false);
      setHours("");
      frameCountRef.current = 0;

      // Check for media devices support
      if (!navigator.mediaDevices?.getUserMedia) {
        // Fallback for older browsers
        const getUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia;

        if (!getUserMedia) {
          throw new Error("Your browser doesn't support camera access");
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(
        getConstraints()
      );
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setIsScanning(true);
          } catch (err) {
            handleCameraError(err);
          }
        };
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
      // Short delay to ensure proper cleanup
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
  }, [result, startScanning, showHoursInput, hours, isSubmitting]);

  // Initialize component
  useEffect(() => {
    getCameras();
    return () => {
      stopScanning();
    };
  }, [getCameras, stopScanning]);
  return (
    <div className="min-h-screen w-full bg-lightteal-500 bg-gradient-to-b from-lightteal-500 to-lightteal-500">
      {/* Home Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 bg-orange-500 text-white p-5 rounded-full hover:bg-orange-600 transition-colors"
        aria-label="Back to Home"
      >
        <Home className="w-6 h-6" />
      </button>

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutDialog(true)}
        className="absolute top-4 right-4 bg-orange-500 text-white p-5 rounded-full hover:bg-orange-600 transition-colors"
        aria-label="Logout"
      >
        <LogOut className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center h-full">
        <video ref={videoRef} className="w-64 h-48 bg-black rounded-lg" />
        <canvas ref={canvasRef} className="hidden" />

        {CameraControls}
        {ResultDisplay}
      </div>

      {/* Logout Dialog */}
      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />

      {/* Footer Component */}
      <Footer />
    </div>
  );
};
export default QRCodeScanner;
