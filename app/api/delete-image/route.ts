import { type NextRequest, NextResponse } from "next/server"

// Server-side image deletion (requires Cloudinary API key and secret)
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    // This requires server-side Cloudinary configuration with API key and secret
    // For security reasons, deletion should be handled server-side

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary configuration missing" }, { status: 500 })
    }

    // Generate signature for deletion
    const timestamp = Math.round(new Date().getTime() / 1000)
    const crypto = require("crypto")

    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex")

    // Delete from Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        public_id: publicId,
        timestamp: timestamp.toString(),
        api_key: apiKey,
        signature: signature,
      }),
    })

    const result = await response.json()

    if (result.result === "ok") {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
