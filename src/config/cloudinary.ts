import fs from "fs"
import path from "path"

export async function deleteFromLocalStorage(filePath?: string): Promise<void> {
  if (!filePath) return

  try {
    // Construct full path
    const fullPath = path.join(__dirname, "../../" + filePath)

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      console.log(`Deleted file from local storage: ${filePath}`)
    }
  } catch (error) {
    console.error("Error deleting local file:", error)
  }
}

// Legacy function kept for compatibility - now uses local storage
export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "raw" = "image"): Promise<void> {
  // For local storage, we don't use publicId
  console.log(`[Legacy] Cloudinary deletion called for: ${publicId}`)
}

// Helper to extract file path from local URL
export function extractPublicId(url: string): string | null {
  if (!url) return null
  // For local storage, just return the URL as is since it's a file path
  return url
}

export function getResourceType(url: string): "image" | "raw" {
  return url.includes("/images/") ? "image" : "raw"
}

export default { deleteFromLocalStorage }
