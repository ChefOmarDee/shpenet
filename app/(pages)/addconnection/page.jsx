"use client";
import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRCodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 300,
        height: 300,
      },
      fps: 5,
    });

    const handleScanSuccess = (decodedText) => {
      scanner.clear(); // Stop scanning after a successful scan
      setScanResult(decodedText);
    };

    const handleScanError = (error) => {
      console.warn("QR code scan error:", error);
    };

    scanner.render(handleScanSuccess, handleScanError);

    return () => {
      scanner.clear(); // Cleanup the scanner on component unmount
    };
  }, []);

  return (
    <div className="">
      {scanResult ? <div>{scanResult}</div> : <div id="reader"></div>}
    </div>
  );
};

export default QRCodeScanner;
