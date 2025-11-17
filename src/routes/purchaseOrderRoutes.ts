import express from "express"
import {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getAllMTokenSerialNumbers,
  searchMTokenSerialNumbers,
  markMTokenAsUsed,
} from "../controllers/purchaseOrderController"
import { authMiddleware, requireAnyRole } from "../middlewares/auth"

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Purchase Order routes
router.get("/", getAllPurchaseOrders)
router.get("/:id", getPurchaseOrderById)
router.post("/", requireAnyRole(["admin", "manager"]), createPurchaseOrder)
router.put("/:id", requireAnyRole(["admin", "manager"]), updatePurchaseOrder)
router.delete("/:id", requireAnyRole(["admin", "manager"]), deletePurchaseOrder)

// MToken Serial Number routes
router.get("/serial/all", getAllMTokenSerialNumbers)
router.get("/serial/search", searchMTokenSerialNumbers)
router.post("/serial/mark-used", markMTokenAsUsed)

export default router
