import { uploadImageToCloudinary } from "@/lib/rug-storage";
import imageCompression from "browser-image-compression";

export const captureImage = async (
  videoRef,
  canvasRef,
  setIsUploading,
  setUploadProgress,
  setImages,
  rugId,
  images
) => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas) return;

  // Set desired aspect ratio: 3:4 (width:height)
  const desiredAspectRatio = 3 / 4;
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const currentAspectRatio = videoWidth / videoHeight;

  let cropWidth = videoWidth;
  let cropHeight = videoHeight;

  // Crop the image to match the 3:4 aspect ratio
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

  ctx.drawImage(
    video,
    offsetX,
    offsetY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  try {
    // Export as WebP with high quality
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to capture image"));
        },
        "image/webp",
        0.95 // high quality WebP
      );
    });

    // Compress the WebP blob (optional but can improve size)
    const compressedBlob = await imageCompression(blob, {
      maxSizeMB: 1,               // allow up to 1MB for high quality
      maxWidthOrHeight: 1600,     // larger max dimensions for better quality
      useWebWorker: true,
      initialQuality: 0.95,       // keep quality high during compression
      fileType: "image/webp",
    });

    // Create file from compressed WebP blob
    const file = new File([compressedBlob], `${rugId}_${Date.now()}.webp`, {
      type: "image/webp",
    });

    setIsUploading(true);
    setUploadProgress("Uploading captured image...");
    const uploaded = await uploadImageToCloudinary(file, rugId, images.length);
    setImages((prev) => [...prev, uploaded]);
  } catch (e) {
    alert("Upload failed");
  } finally {
    setIsUploading(false);
    setUploadProgress("");
  }
};
