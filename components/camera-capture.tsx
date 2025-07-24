"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Camera, Check, X, Upload, AlertCircle } from "lucide-react"
import { uploadImageToCloudinary, type CloudinaryImage } from "@/lib/rug-storage"

export default function CameraCapture({
  rugId,
  onComplete,
  onBack,
}: {
  rugId: string
  onComplete: (images: CloudinaryImage[]) => void
  onBack: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [images, setImages] = useState<CloudinaryImage[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")

  useEffect(() => {
    return () => stopCamera()
  }, [])

  useEffect(()=>{
    startCamera()
    setTimeout(() => {
      startCamera()
    }, 2000);
      },[])
      const startCamera = async () => {
        setError("")
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
          })
          console.log(mediaStream)
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
          setStream(mediaStream)
          setIsCapturing(true)
        } catch (err) {
          setError("Camera access failed. Please check your permissions.")
        }
      }
      

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
    setIsCapturing(false)
  }

  // This is adapted from your second code's capture + upload method
  const captureImage = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
  
    // Set desired aspect ratio: 3:4 (width:height)
    const desiredAspectRatio = 3 / 4
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    const currentAspectRatio = videoWidth / videoHeight
  
    let cropWidth = videoWidth
    let cropHeight = videoHeight
  
    // Crop the image to match the 3:4 aspect ratio
    if (currentAspectRatio > desiredAspectRatio) {
      // Too wide, crop horizontally
      cropWidth = videoHeight * desiredAspectRatio
    } else {
      // Too tall, crop vertically
      cropHeight = videoWidth / desiredAspectRatio
    }
  
    const offsetX = (videoWidth - cropWidth) / 2
    const offsetY = (videoHeight - cropHeight) / 2
  
    canvas.width = cropWidth
    canvas.height = cropHeight
  
    const ctx = canvas.getContext("2d")
    if (!ctx) return
  
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
    )
  
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to capture image"))
          },
          "image/jpeg",
          0.8
        )
      })
  
      const file = new File([blob], `${rugId}_${Date.now()}.jpg`, { type: "image/jpeg" })
  
      setIsUploading(true)
      setUploadProgress("Uploading captured image...")
      const uploaded = await uploadImageToCloudinary(file, rugId, images.length)
      setImages((prev) => [...prev, uploaded])
    } catch (e) {
      alert("Upload failed")
    } finally {
      setIsUploading(false)
      setUploadProgress("")
    }
  }
  

  const handleUpload = async (files: FileList) => {
    const arr = Array.from(files)
    setIsUploading(true)
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]
      setUploadProgress(`Uploading ${file.name} (${i + 1}/${arr.length})`)
      try {
        const uploaded = await uploadImageToCloudinary(file, rugId, images.length + i)
        setImages((prev) => [...prev, uploaded])
      } catch (err) {
        alert(`Upload failed for ${file.name}`)
      }
    }
    setIsUploading(false)
    setUploadProgress("")
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Add Photos - {rugId}</h1>
        <span>{images.length} photos</span>
      </div>

      {/* Camera Area */}
      {isCapturing && (
        <Card className="mb-6">
          <CardContent className="p-4">
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-96 bg-black rounded-lg"
              style={{ objectFit: "cover" }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-4 flex justify-center space-x-4">
              <Button onClick={captureImage} disabled={isUploading}>
                <Camera className="w-5 h-5 mr-1" />
                Capture
              </Button>
              <Button onClick={stopCamera} variant="outline" disabled={isUploading}>
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
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
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
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

      {/* Upload progress */}
      {isUploading && (
        <div className="text-center mb-4 text-blue-600 font-medium">
          {uploadProgress || "Uploading..."}
        </div>
      )}

      {/* Uploaded images preview */}
      {images.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="mb-4 font-semibold">Uploaded Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={img.publicId} className="relative group">
                  <img
                    src={img.secureUrl}
                    className="w-full h-32 object-cover rounded"
                    alt={`Image ${i + 1}`}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => onComplete(images)} disabled={isUploading}>
              <Check className="w-4 h-4 mr-2" />
              Done ({images.length})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
