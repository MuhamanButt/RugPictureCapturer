import { uploadImageToCloudinary } from "@/lib/rug-storage";

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

  // Force high-res capture from video (assumes your camera supports it)
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
    // Capture as high-quality WebP (no compression)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to capture image"));
        },
        "image/webp",
        1.0
      );
    });

    const file = new File([blob], `${rugId}_${Date.now()}.webp`, {
      type: "image/webp",
    });

    setIsUploading(true);
    setUploadProgress("Uploading captured image...");

    const uploaded = await uploadImageToCloudinary(file, rugId, images.length);
    setImages((prev) => [...prev, uploaded]);
  } catch (e) {
    console.error(e);
    alert("Upload failed");
  } finally {
    setIsUploading(false);
    setUploadProgress("");
  }
};
