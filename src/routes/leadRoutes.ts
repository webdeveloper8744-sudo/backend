import express from "express"
import { authMiddleware } from "../middlewares/auth"
import { leadUpload } from "../middlewares/leadUpload"
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getAssignedLeads,
  updateLeadAssignmentStatus,
  bulkUploadLeads, // Import bulk upload function
} from "../controllers/leadController"

const router = express.Router()

router.use(authMiddleware)

const uploadFields = leadUpload.fields([
  { name: "aadhaarPdf", maxCount: 1 },
  { name: "panPdf", maxCount: 1 },
  { name: "optionalPdf", maxCount: 1 },
  { name: "clientImage", maxCount: 1 },
  { name: "billDoc", maxCount: 1 },
])

router.get("/", listLeads)
router.get("/assigned", getAssignedLeads)
router.get("/:id", getLead)
router.post("/", uploadFields, createLead)
router.post("/bulk-upload", bulkUploadLeads) // Add bulk upload route
router.put("/:id", uploadFields, updateLead)
router.patch("/:id/assignment-status", updateLeadAssignmentStatus)
router.delete("/:id", deleteLead)

export default router
