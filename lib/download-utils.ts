import type { Rug } from "./rug-storage"

// Download image from URL
async function downloadImageFromUrl(url: string, filename: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  return response.blob()
}

// Create and download files
async function createDownloads(files: { name: string; url: string }[], zipName: string) {
  if (files.length === 1) {
    // Single file download
    try {
      const blob = await downloadImageFromUrl(files[0].url, files[0].name)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = files[0].name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Failed to download file. Please try again.")
    }
  } else {
    // Multiple files - download each individually
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        await new Promise((resolve) => setTimeout(resolve, i * 200)) // Delay between downloads
        const blob = await downloadImageFromUrl(file.url, file.name)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error(`Error downloading ${file.name}:`, error)
      }
    }
  }
}

export function downloadAsZip(rug: Rug) {
  const files = rug.images.map((image, index) => ({
    name: `${rug.id}_${index + 1}.jpg`,
    url: image.secureUrl,
  }))

  createDownloads(files, `${rug.id}.zip`)
}

export function downloadAllAsZip(rugs: Rug[]) {
  const files: { name: string; url: string }[] = []

  rugs.forEach((rug) => {
    rug.images.forEach((image, index) => {
      files.push({
        name: `${rug.id}/${rug.id}_${index + 1}.jpg`,
        url: image.secureUrl,
      })
    })
  })

  createDownloads(files, "all_rugs.zip")
}
