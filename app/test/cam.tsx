"use client";

import { useEffect, useRef, useState } from "react";
import { uploadImageToCloudinary } from "@/lib/rug-storage";
import type { CloudinaryImage } from "@/lib/rug-storage";

export default function CameraCapture({ rugId }: { rugId: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<CloudinaryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access error:", error);
        alert("Camera access denied or not supported.");
      }
    };
    startCamera();

    return () => {
      // Stop camera when component unmounts
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCaptureAndUpload = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to capture image"));
      }, "image/jpeg", 0.8);
    });

    const file = new File([blob], `${rugId}_0.jpg`, { type: "image/jpeg" });

    setImageData(URL.createObjectURL(file));
    setIsUploading(true);

    try {
      const uploaded = await uploadImageToCloudinary(file, rugId, 0);
      setUploadedImage(uploaded);
      console.log("Uploaded to Cloudinary:", uploaded);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Camera Capture & Upload</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", maxWidth: "500px", border: "1px solid #ccc" }}
      />

      <br />
      <button
        onClick={handleCaptureAndUpload}
        style={{ marginTop: "10px", padding: "10px 20px" }}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Capture & Upload"}
      </button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {uploadedImage && (
        <>
          <h3>Uploaded Preview</h3>
          <img
            src={uploadedImage.secureUrl || uploadedImage.url}
            alt="Uploaded"
            style={{ width: "100%", maxWidth: "500px" }}
          />
        </>
      )}
    </div>
  );
}
