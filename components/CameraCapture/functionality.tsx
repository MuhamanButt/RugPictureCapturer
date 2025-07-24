import { type CloudinaryImage, uploadImageToCloudinary } from "@/lib/rug-storage";

// Start the camera
export const startCameraStream = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,  // allow null
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  setIsCapturing: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string>>
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
export const stopCameraStream = (stream: MediaStream | null, setStream: (val: null) => void, setIsCapturing: (val: boolean) => void) => {
  stream?.getTracks().forEach((track) => track.stop());
  setStream(null);
  setIsCapturing(false);
};

// Capture and store blob locally
export const captureImage = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,   // allow null here too
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  setCapturedImages: (fn: (prev: any[]) => any[]) => void,
  rugId: string
): Promise<void> => {
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
    setCapturedImages((prev) => [...prev, { blob, fileName }]);
  } catch (e) {
    console.error(e);
    alert("Failed to capture image.");
  }
};

// Upload single or multiple files to Cloudinary
export const uploadCapturedImages = async (
  capturedImages: { blob: Blob; fileName: string }[],
  rugId: string,
  startIndex: number,
  setUploadProgress: (msg: string) => void
): Promise<CloudinaryImage[]> => {
  const uploadedImages: CloudinaryImage[] = [];

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
  files: FileList,
  rugId: string,
  existingImageCount: number,
  setUploadProgress: (msg: string) => void
): Promise<CloudinaryImage[]> => {
  const arr = Array.from(files);
  const uploaded: CloudinaryImage[] = [];

  for (let i = 0; i < arr.length; i++) {
    const file = arr[i];
    setUploadProgress(`Uploading ${file.name} (${i + 1}/${arr.length})`);
    try {
      const result = await uploadImageToCloudinary(file, rugId, existingImageCount + i);
      uploaded.push(result);
    } catch {
      alert(`Upload failed for ${file.name}`);
    }
  }

  return uploaded;
};
