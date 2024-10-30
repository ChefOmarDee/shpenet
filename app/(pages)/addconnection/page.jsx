"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

import { Camera, SwitchCamera, ExternalLink } from "lucide-react";
import jsQR from "jsqr";

const QRCodeScanner = () => {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [hours, setHours] = useState("");
  const [showHoursInput, setShowHoursInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const processingRef = useRef(false);
  const frameCountRef = useRef(0);
  const router = useRouter();

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setCameras(videoDevices);

      // Set default camera to the environment-facing one if available
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment")
      );
      setCurrentCamera(backCamera || videoDevices[0]);
    } catch (err) {
      console.error("Error getting cameras:", err);
      setError("Error accessing camera list");
    }
  }, []);

  // Get constraints based on selected camera
  const getConstraints = useCallback(
    () => ({
      video: {
        deviceId: currentCamera?.deviceId
          ? { exact: currentCamera.deviceId }
          : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 },
      },
    }),
    [currentCamera]
  );

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
    } finally {
      processingRef.current = false;
      if (isScanning) {
        requestAnimationFrame(processFrame);
      }
    }
  }, [isScanning]);

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

  // Initialize camera list on component mount
  useEffect(() => {
    getCameras();
  }, [getCameras]);

  const startScanning = useCallback(async () => {
    try {
      setResult("");
      setError("");
      setShowHoursInput(false);
      setHours("");
      frameCountRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia(
        getConstraints()
      );
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      setError("Error accessing camera: " + err.message);
    }
  }, [getConstraints]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

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

      // Success handling
      router.push("/");

      alert("Reminder set successfully!");
      // Reset the form
      setResult("");
      setHours("");
      setShowHoursInput(false);
      setTimeout(() => {
        router.push("/"); // Redirect to the home page
      }, 2000);
    } catch (error) {
      console.error("Error setting reminder:", error);
      alert("Failed to set reminder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CameraControls = useMemo(() => {
    if (showHoursInput) return null;

    return (
      <div className="flex gap-2">
        <button
          onClick={isScanning ? stopScanning : startScanning}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </button>
        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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

  const ResultDisplay = useMemo(() => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Scanned Result:</h3>
          <div className="flex items-center gap-2">
            {result.startsWith("http") ? (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                Go to link <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="break-all">{result}</p>
            )}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result);
              alert("Copied to clipboard!");
            }}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600"
          >
            Copy to clipboard
          </button>
        </div>

        {showHoursInput ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="hours" className="font-medium">
                Set reminder in how many hours?
              </label>
              <input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                min="1"
                step="1"
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter whole number of hours"
                disabled={isSubmitting}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
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
            className="w-full border border-blue-500 text-blue-500 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Scan Another Code
          </button>
        )}
      </div>
    );
  }, [result, startScanning, showHoursInput, hours, isSubmitting]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {showHoursInput
                ? "Input Hours Until Reminder"
                : "QR Code Scanner"}
            </h2>
          </div>
          {currentCamera && !showHoursInput && (
            <p className="text-sm text-gray-500">
              Using: {currentCamera.label.split("(")[0].trim()}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* Rest of the component remains the same */}
          {!showHoursInput && (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {!isScanning && !result && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">
                    Camera preview will appear here
                  </p>
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-lg"></div>
                </div>
              )}
            </div>
          )}

          {CameraControls}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {ResultDisplay}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
