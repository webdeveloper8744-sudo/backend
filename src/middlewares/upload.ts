import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary"

// Configure Cloudinary storage for user images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "crm/users", // Cloudinary folder
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional: resize images
      public_id: `user-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }
  },
})

// File filter - only allow images
const fileFilter = (req: any, file: any, cb: any) => {
  console.log("Filtering file:", file.originalname, "mimetype:", file.mimetype)

  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(file.originalname.toLowerCase().split(".").pop() || "")
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"))
  }
}

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
})
