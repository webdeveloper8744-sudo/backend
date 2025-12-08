import multer from "multer"
import path from "path"
import fs from "fs"

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/products")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
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

export const productUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
})
