import path from "path"
import fs from "fs"
import type { Express } from "express"

// Ensure upload directories exist
export function ensureUploadDirs() {
  const dirs = [
    path.join(__dirname, "../../uploads/users"),
    path.join(__dirname, "../../uploads/products"),
    path.join(__dirname, "../../uploads/leads/documents"),
    path.join(__dirname, "../../uploads/leads/images"),
  ]

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`Created upload directory: ${dir}`)
    }
  })
}

// Helper to delete file from server
export async function deleteLocalFile(filePath?: string): Promise<void> {
  if (!filePath) return

  try {
    // If it's a full path, use it; otherwise construct it
    const fullPath = filePath.startsWith("/uploads") ? path.join(__dirname, "../../" + filePath) : filePath

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      console.log(`Deleted file: ${fullPath}`)
    }
  } catch (error) {
    console.error("Error deleting file:", error)
  }
}

// Helper to extract file path for database storage
export function getStoragePath(file?: Express.Multer.File): string | undefined {
  if (!file) return undefined
  // Return relative path from uploads folder
  return `/uploads/${path.relative(path.join(__dirname, "../../uploads"), file.path)}`
}
