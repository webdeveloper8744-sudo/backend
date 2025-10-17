import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { LeadAssignment } from "../models/LeadAssignment"
import { LeadAssignmentHistory } from "../models/LeadAssignmentHistory"
import { Leads } from "../models/Lead"
import { User } from "../models/User"
import { LeadNotification } from "../models/LeadNotification"

const assignmentRepo = () => AppDataSource.getRepository(LeadAssignment)
const historyRepo = () => AppDataSource.getRepository(LeadAssignmentHistory)
const leadRepo = () => AppDataSource.getRepository(Leads)
const userRepo = () => AppDataSource.getRepository(User)
const notificationRepo = () => AppDataSource.getRepository(LeadNotification)

// Get all assignments (filtered by role)
export async function getAllAssignments(req: Request, res: Response) {
  try {
    const user = (req as any).user
    const { status, priority, isActive } = req.query

    let query = assignmentRepo().createQueryBuilder("assignment")

    // Role-based filtering
    if (user.role === "employee") {
      query = query.where("assignment.assignedToId = :userId", { userId: user.sub })
    }

    // Additional filters
    if (status) {
      query = query.andWhere("assignment.status = :status", { status })
    }
    if (priority) {
      query = query.andWhere("assignment.priority = :priority", { priority })
    }
    if (isActive !== undefined) {
      query = query.andWhere("assignment.isActive = :isActive", { isActive: isActive === "true" })
    }

    const assignments = await query.orderBy("assignment.createdAt", "DESC").getMany()

    res.json({ total: assignments.length, assignments })
  } catch (error: any) {
    console.error("Get assignments error:", error)
    res.status(500).json({ error: "Failed to fetch assignments" })
  }
}

// Get single assignment with history
export async function getAssignmentById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const user = (req as any).user

    const assignment = await assignmentRepo().findOne({ where: { id } })

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    // Check permissions
    if (user.role === "employee" && assignment.assignedToId !== user.sub) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Get history
    const history = await historyRepo()
      .createQueryBuilder("history")
      .where("history.assignmentId = :id", { id })
      .orderBy("history.createdAt", "DESC")
      .getMany()

    res.json({ assignment, history })
  } catch (error: any) {
    console.error("Get assignment error:", error)
    res.status(500).json({ error: "Failed to fetch assignment" })
  }
}

// Create assignment from lead
export async function createAssignment(req: Request, res: Response) {
  try {
    const user = (req as any).user
    const { leadId, assignedToId, priority, dueDate, notes } = req.body

    // Only admin and manager can create assignments
    if (!["admin", "manager"].includes(user.role)) {
      return res.status(403).json({ error: "Only admin and manager can create assignments" })
    }

    // Fetch lead details
    const lead = await leadRepo().findOne({ where: { id: leadId } })
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" })
    }

    // Fetch assigned user details
    const assignedUser = await userRepo().findOne({ where: { id: assignedToId } })
    if (!assignedUser) {
      return res.status(404).json({ error: "Assigned user not found" })
    }

    // Create assignment
    const assignment = assignmentRepo().create({
      leadId,
      assignedToId,
      assignedToName: assignedUser.fullName,
      assignedById: user.sub,
      assignedByName: user.email,
      leadClientName: lead.clientName,
      leadClientCompany: lead.clientCompanyName,
      leadClientAddress: lead.clientAddress,
      leadProductName: lead.productName,
      leadQuotedPrice: lead.quotedPrice,
      priority: priority || "medium",
      dueDate,
      notes,
      status: "new",
      isActive: true,
    })

    await assignmentRepo().save(assignment)

    // Create history entry
    const historyEntry = historyRepo().create({
      assignmentId: assignment.id,
      changedById: user.sub,
      changedByName: user.email,
      action: "assignment_created",
      comment: `Assignment created with priority: ${assignment.priority}`,
    })
    await historyRepo().save(historyEntry)

    const notification = notificationRepo().create({
      assignmentId: assignment.id,
      userId: assignedToId,
      userName: assignedUser.fullName,
      leadClientName: lead.clientName,
      leadClientCompany: lead.clientCompanyName,
      notificationType: "assignment_created",
      message: `New lead assigned: ${lead.clientName} from ${lead.clientCompanyName}`,
      isViewed: false,
    })
    await notificationRepo().save(notification)

    res.status(201).json(assignment)
  } catch (error: any) {
    console.error("Create assignment error:", error)
    res.status(500).json({ error: "Failed to create assignment" })
  }
}

// Update assignment status
export async function updateAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params
    const user = (req as any).user
    const { status, priority, contactAttempts, lastContactedAt, nextFollowUpAt, notes, internalComments } = req.body

    const assignment = await assignmentRepo().findOne({ where: { id } })

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    // Check permissions
    if (user.role === "employee" && assignment.assignedToId !== user.sub) {
      return res.status(403).json({ error: "Access denied" })
    }

    const changes: any[] = []

    // Track status change
    if (status && status !== assignment.status) {
      changes.push({
        assignmentId: id,
        changedById: user.sub,
        changedByName: user.email,
        action: "status_changed",
        fieldName: "status",
        oldValue: assignment.status,
        newValue: status,
      })
      assignment.status = status

      // Mark as completed if status is won or lost
      if (["won", "lost"].includes(status)) {
        assignment.isActive = false
        assignment.completedAt = new Date()
        assignment.completedBy = user.email
      }
    }

    // Track priority change
    if (priority && priority !== assignment.priority) {
      changes.push({
        assignmentId: id,
        changedById: user.sub,
        changedByName: user.email,
        action: "priority_changed",
        fieldName: "priority",
        oldValue: assignment.priority,
        newValue: priority,
      })
      assignment.priority = priority
    }

    // Update other fields
    if (contactAttempts !== undefined) assignment.contactAttempts = contactAttempts
    if (lastContactedAt) {
      assignment.lastContactedAt = new Date(lastContactedAt)
      changes.push({
        assignmentId: id,
        changedById: user.sub,
        changedByName: user.email,
        action: "contacted",
        comment: `Contact attempt #${assignment.contactAttempts}`,
      })
    }
    if (nextFollowUpAt) assignment.nextFollowUpAt = new Date(nextFollowUpAt)
    if (notes) assignment.notes = notes
    if (internalComments) {
      assignment.internalComments = internalComments
      changes.push({
        assignmentId: id,
        changedById: user.sub,
        changedByName: user.email,
        action: "comment_added",
        comment: internalComments,
      })
    }

    await assignmentRepo().save(assignment)

    // Save history entries
    for (const change of changes) {
      await historyRepo().save(historyRepo().create(change))
    }

    res.json(assignment)
  } catch (error: any) {
    console.error("Update assignment error:", error)
    res.status(500).json({ error: "Failed to update assignment" })
  }
}

// Delete assignment (admin/manager only)
export async function deleteAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params
    const user = (req as any).user

    if (!["admin", "manager"].includes(user.role)) {
      return res.status(403).json({ error: "Only admin and manager can delete assignments" })
    }

    const assignment = await assignmentRepo().findOne({ where: { id } })

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    // Delete history first
    await historyRepo().delete({ assignmentId: id })

    // Delete assignment
    await assignmentRepo().remove(assignment)

    res.json({ message: "Assignment deleted successfully" })
  } catch (error: any) {
    console.error("Delete assignment error:", error)
    res.status(500).json({ error: "Failed to delete assignment" })
  }
}

// Get assignment statistics
export async function getAssignmentStats(req: Request, res: Response) {
  try {
    const user = (req as any).user

    let query = assignmentRepo().createQueryBuilder("assignment")

    // Role-based filtering
    if (user.role === "employee") {
      query = query.where("assignment.assignedToId = :userId", { userId: user.sub })
    }

    const all = await query.getMany()

    const stats = {
      total: all.length,
      active: all.filter((a) => a.isActive).length,
      new: all.filter((a) => a.status === "new").length,
      inProgress: all.filter((a) => a.status === "in_progress").length,
      won: all.filter((a) => a.status === "won").length,
      lost: all.filter((a) => a.status === "lost").length,
      highPriority: all.filter((a) => a.priority === "high" || a.priority === "urgent").length,
      overdue: all.filter((a) => a.dueDate && new Date(a.dueDate) < new Date() && a.isActive).length,
    }

    res.json(stats)
  } catch (error: any) {
    console.error("Get stats error:", error)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
}
