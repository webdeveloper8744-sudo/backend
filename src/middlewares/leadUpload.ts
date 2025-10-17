import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary"
import type { Express } from "express"

// Configure Cloudinary storage for lead files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = file.fieldname === "clientImage"
    const isPdf = ["aadhaarPdf", "panPdf", "optionalPdf", "billDoc"].includes(file.fieldname)

    if (isImage) {
      return {
        folder: "crm/clients/images",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        resource_type: "image",
        public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      }
    }

    // For PDFs - use raw resource_type without allowed_formats restriction
    return {
      folder: "crm/clients/docs",
      resource_type: "raw", // 'raw' for PDFs and other documents
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }
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

// Helper to get Cloudinary URL from uploaded file
export function toPublicUrl(file?: Express.Multer.File & { path?: string }): string | undefined {
  if (!file) return undefined
  // Cloudinary provides the full URL in file.path
  return file.path
}
