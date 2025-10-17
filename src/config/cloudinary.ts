import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"

dotenv.config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "raw" = "image"): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    console.log(`Deleted from Cloudinary (${resourceType}):`, publicId)
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
  }
}

// Helper to extract public_id from Cloudinary URL
export function extractPublicId(url: string): string | null {
  if (!url) return null

  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  // or for raw: https://res.cloudinary.com/{cloud_name}/raw/upload/v{version}/{public_id}.{format}
  const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
  return matches ? matches[1] : null
}

export function getResourceType(url: string): "image" | "raw" {
  return url.includes("/raw/") ? "raw" : "image"
}

export default cloudinary
