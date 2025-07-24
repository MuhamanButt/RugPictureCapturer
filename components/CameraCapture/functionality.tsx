import { uploadImageToCloudinary, type CloudinaryImage } from "@/lib/rug-storage";

export const captureImage = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  setIsUploading: (val: boolean) => void,
  setUploadProgress: (msg: string) => void,
  setImages: React.Dispatch<React.SetStateAction<CloudinaryImage[]>>,
  rugId: string,
  images: CloudinaryImage[]
): Promise<void> => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas) return;

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
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to capture image"));
      }, "image/webp", 1.0);
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
