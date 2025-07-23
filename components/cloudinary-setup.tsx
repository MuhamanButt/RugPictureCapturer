"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, CheckCircle, Copy } from "lucide-react"
import { useState } from "react"

export default function CloudinarySetup() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  const testCloudinaryConfig = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Create a small test image (1x1 pixel)
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, 1, 1)
      }

      const testBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8)
      })

      const formData = new FormData()
      formData.append("file", testBlob, "test.jpg")
      formData.append("upload_preset", uploadPreset!)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult(`✅ Success! Test image uploaded: ${data.public_id}`)
      } else {
        const errorText = await response.text()
        setTestResult(`❌ Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error}`)
    } finally {
      setIsTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (cloudName && uploadPreset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              Cloudinary Configuration Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Current Configuration:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Cloud Name:</span>
                  <code className="bg-green-100 px-2 py-1 rounded text-green-800">{cloudName}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Upload Preset:</span>
                  <code className="bg-green-100 px-2 py-1 rounded text-green-800">{uploadPreset}</code>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={testCloudinaryConfig} disabled={isTesting} className="w-full">
                {isTesting ? "Testing..." : "Test Configuration"}
              </Button>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    testResult.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {testResult}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">If you're getting upload errors:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Make sure your upload preset is set to "Unsigned"</li>
                <li>• Check that the preset name is spelled correctly</li>
                <li>• Verify your cloud name is correct</li>
                <li>• Try the test button above to diagnose issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Cloudinary Configuration Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            To use this application, you need to configure Cloudinary for image storage. Please follow these steps:
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Create a free account at{" "}
                <a
                  href="https://cloudinary.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  cloudinary.com <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>Go to your Cloudinary Dashboard</li>
              <li>Copy your "Cloud Name" from the dashboard</li>
              <li>
                Go to Settings → Upload → Upload presets
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Click "Add upload preset"</li>
                  <li>Set "Preset name" (e.g., "rug-manager")</li>
                  <li>
                    <strong>Set "Signing Mode" to "Unsigned"</strong> (This is crucial!)
                  </li>
                  <li>Set "Folder" to "rug-manager" (optional)</li>
                  <li>Save the preset and copy the preset name</li>
                </ul>
              </li>
              <li>
                Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in your project root
              </li>
              <li>Add the following environment variables:</li>
            </ol>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm relative">
            <div>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here</div>
            <div>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here</div>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 text-green-400 hover:text-green-300"
              onClick={() =>
                copyToClipboard(
                  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here\nNEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here",
                )
              }
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• The upload preset MUST be set to "Unsigned" mode</li>
              <li>• Double-check the spelling of your cloud name and preset name</li>
              <li>• Environment variables must start with NEXT_PUBLIC_ to work in the browser</li>
              <li>• Restart your development server after adding environment variables</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Missing Configuration:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {!cloudName && <li>• NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set</li>}
              {!uploadPreset && <li>• NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not set</li>}
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            After adding the environment variables, restart your development server and refresh this page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
