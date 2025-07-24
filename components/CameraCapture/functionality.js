import {  uploadImageToCloudinary } from "@/lib/rug-storage";
import imageCompression from "browser-image-compression";

// Start the camera
export const startCameraStream = async (
  videoRef,
  setStream,
  setIsCapturing,
  setError
) => {

  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }

    setStream(mediaStream);
    setIsCapturing(true);
    setError("");
  } catch {
    setError("Camera access failed. Please check your permissions.");
  }
};

// Stop the camera
export const stopCameraStream = (stream, setStream, setIsCapturing) => {
  stream?.getTracks().forEach((track) => track.stop());
  setStream(null);
  setIsCapturing(false);
};

// Capture and store blob locally
export const captureImage = async (
  videoRef,   // allow null here too
  canvasRef,
  setCapturedImages,
  rugId
) => {
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
    const blob = await new Promise((resolve, reject) => {
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
    setCapturedImages((prev) => [...prev, { blob, fileName }]);
  } catch (e) {
    console.error(e);
    alert("Failed to capture image.");
  }
};

// Upload single or multiple files to Cloudinary
export const uploadCapturedImages = async (
  capturedImages,
  rugId,
  startIndex,
  setUploadProgress
)=> {
  const uploadedImages = [];

  for (let i = 0; i < capturedImages.length; i++) {
    const { blob, fileName } = capturedImages[i];
    setUploadProgress(`Uploading ${i + 1} of ${capturedImages.length} images...`);

    try {
      const file = new File([blob], fileName, { type: "image/webp" });
      const uploaded = await uploadImageToCloudinary(file, rugId, startIndex + i);
      uploadedImages.push(uploaded);
    } catch (e) {
      alert(`Failed to upload image ${fileName}.`);
      console.error(e);
    }
  }

  return uploadedImages;
};

// Upload file input images
export const uploadDeviceImages = async (
  files,
  rugId,
  existingImageCount,
  setUploadProgress
)=> {
  const arr = Array.from(files);
  const uploaded = [];

  for (let i = 0; i < arr.length; i++) {
    const file = arr[i];
    setUploadProgress(`Compressing ${file.name} (${i + 1}/${arr.length})`);

    try {
      // ✅ Compress file
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      setUploadProgress(`Uploading ${compressedFile.name} (${i + 1}/${arr.length})`);

      // ✅ Upload compressed file
      const result = await uploadImageToCloudinary(compressedFile, rugId, existingImageCount + i);
      uploaded.push(result);
    } catch (err) {
      console.error(`Failed to process ${file.name}:`, err);
      alert(`Upload failed for ${file.name}`);
    }
  }

  return uploaded;
};

