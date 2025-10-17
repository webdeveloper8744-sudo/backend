import express from "express"
import { register, login, forgotPassword, verifyResetCode, resetPassword } from "../controllers/authController"
import { createUser } from "../controllers/userController"
import { authMiddleware, requireRole } from "../middlewares/auth"
import { upload } from "../middlewares/upload"

const router = express.Router()

// Public routes
router.post("/register", upload.single("image"), register)
router.post("/login", login)

router.post("/forgot-password", forgotPassword)
router.post("/verify-reset-code", verifyResetCode)
router.post("/reset-password", resetPassword)

// Protected - only admin can add users
router.post("/add-user", authMiddleware, requireRole("admin"), upload.single("image"), createUser)

// Dashboard route...
router.get("/dashboard", authMiddleware, (req, res) => {
  const user = (req as any).user
  res.json({
    message: "Welcome to CRM Dashboard",
    user,
    features: {
      canManageUsers: user.role === "admin",
      canViewReports: user.role === "admin" || user.role === "manager",
      canEditProfile: user.role !== "guest",
      canViewDashboard: true,
    },
  })
})

export default router
