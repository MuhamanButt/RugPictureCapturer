export interface Rug {
  id: string
  type: string
  size: string
  color: string
  images: CloudinaryImage[]
  createdAt: string
}

export interface CloudinaryImage {
  publicId: string
  url: string
  secureUrl: string
  originalFilename?: string
}

const STORAGE_KEY = "rug-manager-data"

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export async function uploadImageToCloudinary(
  imageFile: File | string,
  rugId: string,
  imageIndex: number,
): Promise<CloudinaryImage> {
  // Validate configuration
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing. Please check your environment variables.")
  }

  const formData = new FormData()

  if (typeof imageFile === "string") {
    // Handle base64 string (legacy support)
    try {
      const response = await fetch(imageFile)
      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error("Image data is empty")
      }

      const file = new File([blob], `${rugId}_${Date.now()}_${imageIndex}.jpg`, { type: "image/jpeg" })
      formData.append("file", file)
    } catch (error) {
      throw new Error("Failed to process image data")
    }
  } else {
    // Handle File object
    if (imageFile.size === 0) {
      throw new Error("Image file is empty")
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      // 10MB limit
      throw new Error("Image file is too large (max 10MB)")
    }

    formData.append("file", imageFile)
  }

  // Required fields for Cloudinary upload
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

  // Optional fields - only add if you want to organize files
  formData.append("folder", `rug-manager/${rugId}`)
  formData.append("public_id", `${rugId}_${Date.now()}_${imageIndex}`) // Add timestamp to avoid conflicts

  console.log("Uploading to Cloudinary with:", {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    folder: `rug-manager/${rugId}`,
    fileSize: typeof imageFile === "string" ? "base64" : imageFile.size,
  })

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    })

    // Get the response text first to see what Cloudinary is returning
    const responseText = await response.text()
    console.log("Cloudinary response:", responseText)

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`

      try {
        const errorData = JSON.parse(responseText)
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message
        }
      } catch (e) {
        // If we can't parse the error, use the status text
        errorMessage = `${response.status}: ${response.statusText}`
      }

      throw new Error(errorMessage)
    }

    const data = JSON.parse(responseText)

    return {
      publicId: data.public_id,
      url: data.url,
      secureUrl: data.secure_url,
      originalFilename: data.original_filename,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    throw error
  }
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    const response = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete image from Cloudinary")
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error("Cloudinary deletion failed")
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error)
    // Don't throw the error to prevent UI breaking - just log it
    // The image will be removed from local storage regardless
  }
}

export function getAllRugs(): Rug[] {
  if (typeof window === "undefined") return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error loading rugs:", error)
    return []
  }
}

export function saveRug(rug: Rug): void {
  if (typeof window === "undefined") return

  try {
    const rugs = getAllRugs()
    rugs.push(rug)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rugs))
  } catch (error) {
    console.error("Error saving rug:", error)
  }
}

export function updateRug(id: string, updates: Partial<Rug>): void {
  if (typeof window === "undefined") return

  try {
    const rugs = getAllRugs()
    const index = rugs.findIndex((rug) => rug.id === id)

    if (index !== -1) {
      rugs[index] = { ...rugs[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rugs))
    }
  } catch (error) {
    console.error("Error updating rug:", error)
  }
}

export async function deleteRugImage(rugId: string, imageIndex: number): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const rugs = getAllRugs()
    const rugIndex = rugs.findIndex((rug) => rug.id === rugId)

    if (rugIndex !== -1) {
      const imageToDelete = rugs[rugIndex].images[imageIndex]

      // Delete from Cloudinary
      if (imageToDelete?.publicId) {
        await deleteImageFromCloudinary(imageToDelete.publicId)
      }

      // Remove from local storage
      rugs[rugIndex].images.splice(imageIndex, 1)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rugs))
    }
  } catch (error) {
    console.error("Error deleting image:", error)
  }
}

export function generateRugId(type: string, size: string, color: string): string {
  const rugs = getAllRugs()
  const baseId = `${type}${size}${color}`

  // Find existing rugs with the same base pattern
  const existingNumbers = rugs
    .filter((rug) => rug.id.startsWith(baseId + "-"))
    .map((rug) => {
      const match = rug.id.match(/-(\d+)$/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .sort((a, b) => b - a)

  const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1
  return `${baseId}-${nextNumber}`
}
