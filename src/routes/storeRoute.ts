import express from "express"
import { createStore, deleteStore, getAllStore, updateStore } from "../controllers/storeController"
// import { authMiddleware, requireAnyRole } from "../middlewares/auth"
// import { productUpload } from "../middlewares/productUpload"

const router = express.Router()

// All routes require authentication
// router.use(authMiddleware)

// Get all products (any authenticated user)
router.get("/", getAllStore);

// Get single product (any authenticated user)
// router.get("/:id", getProductById)

// Create product (admin and manager only)
router.post("/createstore", createStore);

// Update product (admin and manager only)
router.put("/update/:id", updateStore);

// Delete product (admin only)
router.delete("/delete/:id", deleteStore);

export default router