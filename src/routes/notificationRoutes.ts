import express from "express"
import { authMiddleware } from "../middlewares/auth"
import {
  getNotificationCount,
  getNotifications,
  markNotificationsAsViewed,
  markAllNotificationsAsViewed,
} from "../controllers/notificationController"

const router = express.Router()

router.use(authMiddleware)

// Get notification count
router.get("/count", getNotificationCount)

// Get all notifications
router.get("/", getNotifications)

// Mark specific notifications as viewed
router.post("/mark-viewed", markNotificationsAsViewed)

// Mark all notifications as viewed
router.post("/mark-all-viewed", markAllNotificationsAsViewed)

export default router
