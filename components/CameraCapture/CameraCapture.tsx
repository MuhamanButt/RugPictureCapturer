"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Camera, Check, X, Upload, AlertCircle } from "lucide-react"
import './../styles.css'
import {captureImage} from './functionality'
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
const captureImageWrapper = async()=>{
    await captureImage(videoRef, canvasRef, setIsUploading, setUploadProgress, setImages, rugId, images)

}
  // This is adapted from your second code's capture + upload method
  
  

  const handleUploadWrapper = async (files: FileList) => { 
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
        <h1 className="add-photos-header">Add Photos - {rugId}</h1>
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
  style={{
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    border: "1px solid #ccc",
    maxWidth:"500px"
  }}
/>

            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-4 flex justify-center space-x-4">
              <Button onClick={captureImageWrapper} className="capture-btn" disabled={isUploading}>
                <Camera className="h-5 mr-1" />
                Capture
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

      {/* Upload progress */}
      {isUploading && (
        <div className="text-center mb-4 text-blue-600 font-medium">
          {uploadProgress || "Uploading..."}
        </div>
      )}
 <Button className="my-4 w-full" onClick={() => onComplete(images)} disabled={isUploading}>
              <Check className="w-4 h-4 mr-2" />
              Done ({images.length})
            </Button>
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
                    style={{width:"300px",height:"400px"}}
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
           
          </CardContent>
        </Card>
      )}
    </div>
  )
}
