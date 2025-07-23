"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Plus, X, Upload } from "lucide-react"
import { useState, useRef } from "react"
import { type Rug, updateRug, deleteRugImage, uploadImageToCloudinary, type CloudinaryImage } from "@/lib/rug-storage"
import { downloadAsZip } from "@/lib/download-utils"

interface RugDetailProps {
  rug: Rug
  onBack: () => void
  onUpdate: () => void
}

export default function RugDetail({ rug, onBack, onUpdate }: RugDetailProps) {
  // Update state to handle CloudinaryImage objects
  const [images, setImages] = useState<CloudinaryImage[]>(rug.images)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add this helper function at the top of the component
  const handleUploadError = (error: any, filename?: string) => {
    console.error("Upload error:", error)
    const message = filename
      ? `Failed to upload ${filename}. Please try again.`
      : "Failed to upload image. Please try again."
    alert(message)
  }

  // Update the handleAddImages function
  const handleAddImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setIsUploading(true)
      const newImages: CloudinaryImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`)

        try {
          const cloudinaryImage = await uploadImageToCloudinary(file, rug.id, images.length + i)
          newImages.push(cloudinaryImage)
        } catch (error) {
          handleUploadError(error, file.name)
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages]
        setImages(updatedImages)
        updateRug(rug.id, { images: updatedImages })
        onUpdate()
      }

      setIsUploading(false)
      setUploadProgress("")
    }
  }

  // Update the handleDeleteImage function
  const handleDeleteImage = async (index: number) => {
    try {
      await deleteRugImage(rug.id, index)
      const updatedImages = images.filter((_, i) => i !== index)
      setImages(updatedImages)
      onUpdate()
    } catch (error) {
      console.error("Error deleting image:", error)
      alert("Failed to delete image. Please try again.")
    }
  }

  // Update the drag and drop handlers
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newImages = [...images]
      const draggedImage = newImages[draggedIndex]

      newImages.splice(draggedIndex, 1)
      newImages.splice(dropIndex, 0, draggedImage)

      setImages(newImages)
      updateRug(rug.id, { images: newImages })
      onUpdate()
    }

    setDraggedIndex(null)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{rug.id}</h1>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Images
            </Button>
            <Button onClick={() => downloadAsZip(rug)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddImages} className="hidden" />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rug Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <div className="font-mono">{rug.type}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Size:</span>
                <div className="font-mono">{rug.size}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Color:</span>
                <div className="font-mono">{rug.color}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Photos:</span>
                <div className="font-mono">{images.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isUploading && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="text-center text-blue-600">{uploadProgress}</div>
            </CardContent>
          </Card>
        )}

        {images.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
              <p className="text-gray-600 mb-4">Add some photos to get started</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Images
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.publicId}
                draggable={!isUploading}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="relative group cursor-move"
              >
                <Card className="overflow-hidden">
                  <div className="aspect-square">
                    <img
                      src={image.secureUrl || "/placeholder.svg"}
                      alt={`${rug.id} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>

                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(index)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>💡 Drag and drop images to reorder them</p>
          </div>
        )}
      </div>
    </div>
  )
}
