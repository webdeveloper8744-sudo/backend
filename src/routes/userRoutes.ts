import express from "express";
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from "../controllers/userController";
import { authMiddleware, requireRole, requireAnyRole } from "../middlewares/auth";
import { upload } from "../middlewares/upload"; // Add this import

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all users (any authenticated user)
router.get("/", getAllUsers);

// Get single user (any authenticated user)
router.get("/:id", getUserById);

// Update user (admin and manager only) - ADD upload.single('image')
router.put("/:id", requireAnyRole(["admin", "manager"]), upload.single('image'), updateUser);

// Delete user (admin only)
router.delete("/:id", requireRole("admin"), deleteUser);

export default router;