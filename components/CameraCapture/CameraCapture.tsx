"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Camera,
  Check,
  X,
  Upload,
  AlertCircle,
} from "lucide-react";
import "./../styles.css";
import {
  type CloudinaryImage,
  uploadImageToCloudinary,
} from "@/lib/rug-storage";
import {
  startCameraStream,
  stopCameraStream,
  captureImage,
  uploadCapturedImages,
  uploadDeviceImages,
} from "./functionality";

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
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    startCameraStream(videoRef, setStream, setIsCapturing, setError);
    const retry = setTimeout(() => {
      startCameraStream(videoRef, setStream, setIsCapturing, setError);
    }, 2000);
    return () => {
      clearTimeout(retry);
      stopCameraStream(stream, setStream, setIsCapturing);
    };
  }, []);

  const captureImageWrapper = () => {
    captureImage(videoRef, canvasRef, setCapturedImages, rugId);
  };

  const handleUploadAll = async () => {
    if (capturedImages.length === 0) {
      onComplete(images);
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Uploading 0 of ${capturedImages.length} images...`);

    const uploaded = await uploadCapturedImages(
      capturedImages,
      rugId,
      images.length,
      setUploadProgress
    );

    const allImages = [...images, ...uploaded];

    setIsUploading(false);
    setUploadProgress("");
    setCapturedImages([]);
    setImages(allImages);
    onComplete(allImages);
  };

  const handleUploadWrapper = async (files: FileList) => {
    setIsUploading(true);

    const uploaded = await uploadDeviceImages(
      files,
      rugId,
      images.length,
      setUploadProgress
    );

    setImages((prev) => [...prev, ...uploaded]);
    setIsUploading(false);
    setUploadProgress("");
  };

  const startCamera = async () => {
    startCameraStream(videoRef, setStream, setIsCapturing, setError);
  };

  const removeCapturedImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="camera-capture-container">
      <div className="header">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="icon" />
        </Button>
        <h1 className="title">Add Photos - {rugId}</h1>
      </div>

      {isCapturing && (
        <Card className="card camera-card">
          <CardContent className="card-content">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="button-group">
              <Button onClick={captureImageWrapper} disabled={isUploading}>
                <Camera className="icon-button" />
                Capture
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCapturing && (
        <Card className="card upload-card">
          <CardContent className="card-content upload-content">
            <h2 className="subtitle">Upload Photos</h2>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleUploadWrapper(e.target.files)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="upload-button"
            >
              <Upload className="icon-button" />
              Upload from Device
            </Button>
            <p className="or-text">or</p>
            <Button
              onClick={startCamera}
              variant="outline"
              disabled={isUploading}
              className="camera-button"
            >
              <Camera className="icon-button" />
              Use Camera
            </Button>
            {error && (
              <div className="error-message">
                <AlertCircle className="icon-button" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <div className="upload-progress">
          {uploadProgress || "Uploading..."}
        </div>
      )}

      <Button
        className="done-button"
        onClick={handleUploadAll}
        disabled={isUploading}
      >
        <Check className="icon-button" />
        Done ({images.length + capturedImages.length})
      </Button>

      {(capturedImages.length > 0 || images.length > 0) && (
        <Card className="card images-card">
          <CardContent>
            {capturedImages.length > 0 && (
              <>
                <h3 className="section-title">Captured Images (Pending Upload)</h3>
                <div className="images-grid captured-images-grid">
                  {capturedImages.map((img, i) => (
                    <div key={img.fileName} className="image-wrapper group">
                      <img
                        src={URL.createObjectURL(img.blob)}
                        className="image-thumb"
                        alt={`Captured Image ${i + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="remove-button"
                        onClick={() => removeCapturedImage(i)}
                        disabled={isUploading}
                      >
                        <X className="icon-button" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {images.length > 0 && (
              <>
                <h3 className="section-title">Uploaded Images</h3>
                <div className="images-grid uploaded-images-grid">
                  {images.map((img, i) => (
                    <div key={img.publicId} className="image-wrapper group">
                      <img
                        src={img.secureUrl}
                        className="image-thumb"
                        alt={`Uploaded Image ${i + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="remove-button"
                        onClick={() => removeUploadedImage(i)}
                        disabled={isUploading}
                      >
                        <X className="icon-button" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
