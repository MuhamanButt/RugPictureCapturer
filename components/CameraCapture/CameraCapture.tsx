"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Check, X, Upload, AlertCircle } from "lucide-react";
import "./../styles.css";
import { uploadImageToCloudinary, type CloudinaryImage } from "@/lib/rug-storage";

interface Props {
  rugId: string;
  onComplete: (images: CloudinaryImage[]) => void;
  onBack: () => void;
}

interface CapturedImage {
  blob: Blob;
  fileName: string;
}

export default function CameraCapture({ rugId, onComplete, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [images, setImages] = useState<CloudinaryImage[]>([]); // uploaded images
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]); // local captures before upload
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    startCamera();
    setTimeout(() => {
      startCamera();
    }, 2000);
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCapturing(true);
    } catch {
      setError("Camera access failed. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsCapturing(false);
  };

  // Capture the image and store locally (blob), do NOT upload now
  const captureImageWrapper = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      alert("Camera not ready yet. Please wait a second.");
      return;
    }

    const desiredAspectRatio = 3 / 4;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const currentAspectRatio = videoWidth / videoHeight;

    let cropWidth = videoWidth;
    let cropHeight = videoHeight;

    if (currentAspectRatio > desiredAspectRatio) {
      cropWidth = videoHeight * desiredAspectRatio;
    } else {
      cropHeight = videoWidth / desiredAspectRatio;
    }

    const offsetX = (videoWidth - cropWidth) / 2;
    const offsetY = (videoHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, offsetX, offsetY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to capture image"));
          },
          "image/webp",
          1.0
        );
      });

      const fileName = `${rugId}_${Date.now()}.webp`;

      // Store locally (not uploaded yet)
      setCapturedImages((prev) => [...prev, { blob, fileName }]);
    } catch (e) {
      console.error(e);
      alert("Failed to capture image.");
    }
  };

  // Upload all captured images on "Done"
  const handleUploadAll = async () => {
    if (capturedImages.length === 0) {
      // No new images, just finish with existing images
      onComplete(images);
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Uploading 0 of ${capturedImages.length} images...`);

    const uploadedImages: CloudinaryImage[] = [...images]; // start with previously uploaded

    for (let i = 0; i < capturedImages.length; i++) {
      const { blob, fileName } = capturedImages[i];
      setUploadProgress(`Uploading ${i + 1} of ${capturedImages.length} images...`);

      try {
        const file = new File([blob], fileName, { type: "image/webp" });
        const uploaded = await uploadImageToCloudinary(file, rugId, images.length + i);
        uploadedImages.push(uploaded);
      } catch (e) {
        alert(`Failed to upload image ${fileName}.`);
        console.error(e);
      }
    }

    setIsUploading(false);
    setUploadProgress("");
    setCapturedImages([]); // clear local cache
    setImages(uploadedImages); // update with all uploaded images
    onComplete(uploadedImages);
  };

  // Upload images from device immediately (optional: you can change this to batch upload on Done too)
  const handleUploadWrapper = async (files: FileList) => {
    const arr = Array.from(files);
    setIsUploading(true);
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      setUploadProgress(`Uploading ${file.name} (${i + 1}/${arr.length})`);
      try {
        const uploaded = await uploadImageToCloudinary(file, rugId, images.length + i);
        setImages((prev) => [...prev, uploaded]);
      } catch {
        alert(`Upload failed for ${file.name}`);
      }
    }
    setIsUploading(false);
    setUploadProgress("");
  };

  // Remove captured image before upload
  const removeCapturedImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove already uploaded image
  const removeUploadedImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="add-photos-header">Add Photos - {rugId}</h1>
        
      </div>

      {isCapturing && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                aspectRatio: "3 / 4",
                objectFit: "cover",
                border: "1px solid #ccc",
                maxWidth: "500px",
              }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-4 flex justify-center space-x-4">
              <Button onClick={captureImageWrapper} disabled={isUploading}>
                <Camera className="h-5 mr-1" />
                Capture
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCapturing && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Upload Photos</h2>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleUploadWrapper(e.target.files)}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              Upload from Device
            </Button>
            <p className="my-4 text-sm text-gray-500">or</p>
            <Button onClick={startCamera} variant="outline" disabled={isUploading}>
              <Camera className="w-4 h-4 mr-2" />
              Use Camera
            </Button>
            {error && (
              <div className="mt-4 text-red-600 flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <div className="text-center mb-4 text-blue-600 font-medium">{uploadProgress || "Uploading..."}</div>
      )}

      <Button className="my-4 w-full" onClick={handleUploadAll} disabled={isUploading}>
        <Check className="w-4 h-4 mr-2" />
        Done ({images.length + capturedImages.length})
      </Button>

      {(capturedImages.length > 0 || images.length > 0) && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="mb-4 font-semibold">Captured Images (Pending Upload)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {capturedImages.map((img, i) => (
                <div key={img.fileName} className="relative group">
                  <img
                    src={URL.createObjectURL(img.blob)}
                    className="w-full h-32 object-cover rounded"
                    alt={`Captured Image ${i + 1}`}
                    style={{ width: "300px", height: "400px" }}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => removeCapturedImage(i)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <h3 className="mb-4 font-semibold">Uploaded Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={img.publicId} className="relative group">
                  <img
                    src={img.secureUrl}
                    className="w-full h-32 object-cover rounded"
                    alt={`Uploaded Image ${i + 1}`}
                    style={{ width: "300px", height: "400px" }}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => removeUploadedImage(i)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
