"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
export default function AddConnection() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });
    scanner.render(success, error);
    function success(res) {
      scanner.clear();
      setScanResult(res);
    }
    function error(err) {
      console.warn(err);
    }
  }, []);

  return (
    <div className="">
      {scanResult ? <div>{scanResult}</div> : <div id="reader"></div>}
    </div>
  );
}
