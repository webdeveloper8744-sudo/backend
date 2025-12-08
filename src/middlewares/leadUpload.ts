import multer from "multer"
import path from "path"
import fs from "fs"
import type { Express } from "express"

// Ensure upload directories exist
const docDir = path.join(__dirname, "../../uploads/leads/documents")
const imgDir = path.join(__dirname, "../../uploads/leads/images")

if (!fs.existsSync(docDir)) {
  fs.mkdirSync(docDir, { recursive: true })
}
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Send documents to documents folder, images to images folder
    const isImage = file.fieldname === "clientImage"
    const destination = isImage ? imgDir : docDir
    cb(null, destination)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  console.log("[v0] File upload attempt:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  })

  if (file.fieldname === "clientImage") {
    // Check for image mimetypes (case-insensitive)
    const isValidImage = /image\/(jpeg|jpg|png|webp|avif)/i.test(file.mimetype)
    if (isValidImage) {
      console.log("[v0] ✓ Valid image file accepted")
      return cb(null, true)
    }
    console.log("[v0] ✗ Invalid image format:", file.mimetype)
    return cb(new Error(`Only image files (JPEG, PNG, WebP, AVIF) are allowed for clientImage. Got: ${file.mimetype}`))
  }

  // PDFs for Aadhaar, PAN, Optional, Bill
  if (["aadhaarPdf", "panPdf", "optionalPdf", "billDoc"].includes(file.fieldname)) {
    const isValidPdf = /application\/pdf/i.test(file.mimetype)
    if (isValidPdf) {
      console.log("[v0] ✓ Valid PDF file accepted")
      return cb(null, true)
    }
    console.log("[v0] ✗ Invalid PDF format:", file.mimetype)
    return cb(new Error(`Only PDF files are allowed for ${file.fieldname}. Got: ${file.mimetype}`))
  }

  console.log("[v0] ✗ Unknown field:", file.fieldname)
  cb(new Error(`Unknown file field: ${file.fieldname}`))
}

export const leadUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB each
})

// Helper to get URL from uploaded file
export function toPublicUrl(file?: Express.Multer.File): string | undefined {
  if (!file) return undefined
  // Return relative path from uploads folder
  return `/uploads/leads/${file.fieldname === "clientImage" ? "images" : "documents"}/${file.filename}`
}
