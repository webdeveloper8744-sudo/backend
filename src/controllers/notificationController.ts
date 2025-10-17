import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { LeadNotification } from "../models/LeadNotification"

const notificationRepo = () => AppDataSource.getRepository(LeadNotification)

// Get notification count for current user
export async function getNotificationCount(req: Request, res: Response) {
  try {
    const user = (req as any).user

    const count = await notificationRepo()
      .createQueryBuilder("notification")
      .where("notification.userId = :userId", { userId: user.sub })
      .andWhere("notification.isViewed = :isViewed", { isViewed: false })
      .getCount()

    res.json({ count })
  } catch (error: any) {
    console.error("Get notification count error:", error)
    res.status(500).json({ error: "Failed to fetch notification count" })
  }
}

// Get all notifications for current user
export async function getNotifications(req: Request, res: Response) {
  try {
    const user = (req as any).user
    const { isViewed, limit = 50 } = req.query

    let query = notificationRepo()
      .createQueryBuilder("notification")
      .where("notification.userId = :userId", { userId: user.sub })

    if (isViewed !== undefined) {
      query = query.andWhere("notification.isViewed = :isViewed", { isViewed: isViewed === "true" })
    }

    const notifications = await query.orderBy("notification.createdAt", "DESC").limit(Number(limit)).getMany()

    res.json({ notifications })
  } catch (error: any) {
    console.error("Get notifications error:", error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
}

// Mark notifications as viewed
export async function markNotificationsAsViewed(req: Request, res: Response) {
  try {
    const user = (req as any).user
    const { notificationIds } = req.body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: "notificationIds array is required" })
    }

    await notificationRepo()
      .createQueryBuilder()
      .update(LeadNotification)
      .set({ isViewed: true, viewedAt: new Date() })
      .where("userId = :userId", { userId: user.sub })
      .andWhere("id IN (:...ids)", { ids: notificationIds })
      .execute()

    res.json({ message: "Notifications marked as viewed" })
  } catch (error: any) {
    console.error("Mark notifications as viewed error:", error)
    res.status(500).json({ error: "Failed to mark notifications as viewed" })
  }
}

// Mark all notifications as viewed for current user
export async function markAllNotificationsAsViewed(req: Request, res: Response) {
  try {
    const user = (req as any).user

    await notificationRepo()
      .createQueryBuilder()
      .update(LeadNotification)
      .set({ isViewed: true, viewedAt: new Date() })
      .where("userId = :userId", { userId: user.sub })
      .andWhere("isViewed = :isViewed", { isViewed: false })
      .execute()

    res.json({ message: "All notifications marked as viewed" })
  } catch (error: any) {
    console.error("Mark all notifications as viewed error:", error)
    res.status(500).json({ error: "Failed to mark all notifications as viewed" })
  }
}
