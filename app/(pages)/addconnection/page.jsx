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

  useEffect(() => {
    getCameras();
    return () => {
      stopScanning();
    };
  }, [getCameras, stopScanning]);

  return (
    <div className="min-h-screen w-full bg-lightteal-500 bg-gradient-to-b from-lightteal-500 to-lightteal-500">
      <div className="flex flex-col justify-center min-h-screen w-full px-4 py-12">
        <div className="w-full max-w-md mx-auto rounded-lg border border-orange-600 shadow-lg overflow-hidden bg-lightteal-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-orange-500">
                  {showHoursInput
                    ? "Input Hours Until Reminder"
                    : "QR Code Scanner"}
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
    </div>
  );
};

export default QRCodeScanner;
