import express from "express"
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController"
import { authMiddleware, requireAnyRole } from "../middlewares/auth"
import { productUpload } from "../middlewares/productUpload"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Get all products (any authenticated user)
router.get("/", getAllProducts)

// Get single product (any authenticated user)
router.get("/:id", getProductById)

// Create product (admin and manager only)
router.post("/", requireAnyRole(["admin", "manager"]), productUpload.single("image"), createProduct)

// Update product (admin and manager only)
router.put("/:id", requireAnyRole(["admin", "manager"]), productUpload.single("image"), updateProduct)

// Delete product (admin only)
router.delete("/:id", requireAnyRole(["admin", "manager"]), deleteProduct)

export default router
