import express from "express"
import { authMiddleware, requireAnyRole } from "../middlewares/auth"
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
} from "../controllers/leadAssignmentController"

const router = express.Router()

router.use(authMiddleware)

// Get statistics
router.get("/stats", getAssignmentStats)

// Get all assignments (role-based filtering)
router.get("/", getAllAssignments)

// Get single assignment with history
router.get("/:id", getAssignmentById)

// Create assignment (admin/manager only)
router.post("/", requireAnyRole(["admin", "manager"]), createAssignment)

// Update assignment
router.put("/:id", updateAssignment)

// Delete assignment (admin/manager only)
router.delete("/:id", requireAnyRole(["admin", "manager"]), deleteAssignment)

export default router
