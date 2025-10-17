import type { Request, Response, Express } from "express"
import { AppDataSource } from "../config/db"
import { Leads } from "../models/Lead"
import { toPublicUrl } from "../middlewares/leadUpload"
import { deleteFromCloudinary, extractPublicId, getResourceType } from "../config/cloudinary"

const repo = () => AppDataSource.getRepository(Leads)

async function unlinkIfExists(cloudinaryUrl?: string) {
  if (!cloudinaryUrl) return
  const publicId = extractPublicId(cloudinaryUrl)
  if (publicId) {
    const resourceType = getResourceType(cloudinaryUrl)
    await deleteFromCloudinary(publicId, resourceType)
  }
}

export async function listLeads(req: Request, res: Response) {
  const [leads, total] = await repo().findAndCount({ order: { createdAt: "DESC" } })
  res.json({ total, leads })
}

export async function getLead(req: Request, res: Response) {
  const lead = await repo().findOne({ where: { id: req.params.id } })
  if (!lead) return res.status(404).json({ error: "Lead not found" })
  res.json(lead)
}

export async function createLead(req: Request, res: Response) {
  try {
    const b = req.body

    const existingLead = await repo().findOne({ where: { orderId: b.orderId } })
    if (existingLead) {
      return res.status(400).json({
        error: `Duplicate order ID: ${b.orderId}. A lead with this order ID already exists.`,
      })
    }

    // Minimal validation
    const required = [
      "employeeName",
      "source",
      "leadCreatedAt",
      "stage",
      "clientName",
      "clientCompanyName",
      "productName",
      "assignTeamMember",
      "email",
      "phone",
      "orderId",
      "orderDate",
      "clientAddress",
      "clientKycId",
      "kycPin",
      "processedBy",
      "processedAt",
      "quotedPrice",
      "companyNameAddress",
      "billingSentStatus",
    ]
    for (const k of required) {
      if (!b[k] || String(b[k]).trim() === "") {
        return res.status(400).json({ error: `Field '${k}' is required` })
      }
    }

    const files = req.files as Record<string, Express.Multer.File[]>
    const lead = repo().create({
      // Step 1
      employeeName: b.employeeName,
      source: b.source,
      otherSource: b.otherSource || null,
      leadCreatedAt: b.leadCreatedAt,
      expectedCloseDate: b.expectedCloseDate || null,
      lastContactedAt: b.lastContactedAt || null,
      stage: b.stage,
      comment: b.comment || null,
      remarks: b.remarks || null,
      // Step 2
      clientName: b.clientName,
      clientCompanyName: b.clientCompanyName,
      productName: b.productName,
      assignTeamMember: b.assignTeamMember,
      email: b.email,
      phone: b.phone,
      orderId: b.orderId,
      orderDate: b.orderDate,
      clientAddress: b.clientAddress,
      clientKycId: b.clientKycId,
      kycPin: b.kycPin,
      downloadStatus: b.downloadStatus || "process",
      processedBy: b.processedBy,
      processedAt: b.processedAt,
      aadhaarPdfUrl: toPublicUrl(files?.aadhaarPdf?.[0]),
      panPdfUrl: toPublicUrl(files?.panPdf?.[0]),
      optionalPdfUrl: toPublicUrl(files?.optionalPdf?.[0]),
      clientImageUrl: toPublicUrl(files?.clientImage?.[0]),
      // Step 3
      quotedPrice: Number(b.quotedPrice ?? 0),
      companyName: b.companyName || null,
      companyNameAddress: b.companyNameAddress,
      referenceBy: b.referenceBy || null,
      paymentStatus: b.paymentStatus || "pending",
      paymentStatusNote: b.paymentStatusNote || null,
      invoiceNumber: b.invoiceNumber || null,
      invoiceDate: b.invoiceDate || null,
      billingSentStatus: b.billingSentStatus || "not_sent",
      billingDate: b.billingDate || null,
      billDocUrl: toPublicUrl(files?.billDoc?.[0]),
      assignmentStatus: b.assignmentStatus || "new", // Initialize assignment status
    })

    const saved = await repo().save(lead)

    if (saved.assignTeamMember) {
      try {
        const userRepo = AppDataSource.getRepository("User")
        const assignedUser = await userRepo.findOne({
          where: { fullName: saved.assignTeamMember },
        })

        if (assignedUser) {
          const notificationRepo = AppDataSource.getRepository("LeadNotification")
          await notificationRepo.save({
            leadId: saved.id,
            userId: assignedUser.id,
            isViewed: false,
          })
        }
      } catch (notifError) {
        console.error("Failed to create notification:", notifError)
        // Don't fail the lead creation if notification fails
      }
    }

    res.status(201).json(saved)
  } catch (err: any) {
    console.error("Create lead error:", err)
    res.status(500).json({ error: "Failed to create lead" })
  }
}

export async function updateLead(req: Request, res: Response) {
  try {
    const existing = await repo().findOne({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: "Lead not found" })
    const b = req.body
    const files = req.files as Record<string, Express.Multer.File[]>

    if (b.orderId && b.orderId !== existing.orderId) {
      const duplicateLead = await repo().findOne({ where: { orderId: b.orderId } })
      if (duplicateLead) {
        return res.status(400).json({
          error: `Duplicate order ID: ${b.orderId}. Another lead with this order ID already exists.`,
        })
      }
    }

    const oldAssignedMember = existing.assignTeamMember

    // Update scalar fields if present
    Object.assign(existing, {
      // Step 1
      employeeName: b.employeeName ?? existing.employeeName,
      source: b.source ?? existing.source,
      otherSource: b.otherSource ?? existing.otherSource,
      leadCreatedAt: b.leadCreatedAt ?? existing.leadCreatedAt,
      expectedCloseDate: b.expectedCloseDate ?? existing.expectedCloseDate,
      lastContactedAt: b.lastContactedAt ?? existing.lastContactedAt,
      stage: b.stage ?? existing.stage,
      comment: b.comment ?? existing.comment,
      remarks: b.remarks ?? existing.remarks,
      // Step 2
      clientName: b.clientName ?? existing.clientName,
      clientCompanyName: b.clientCompanyName ?? existing.clientCompanyName,
      productName: b.productName ?? existing.productName,
      assignTeamMember: b.assignTeamMember ?? existing.assignTeamMember,
      email: b.email ?? existing.email,
      phone: b.phone ?? existing.phone,
      orderId: b.orderId ?? existing.orderId,
      orderDate: b.orderDate ?? existing.orderDate,
      clientAddress: b.clientAddress ?? existing.clientAddress,
      clientKycId: b.clientKycId ?? existing.clientKycId,
      kycPin: b.kycPin ?? existing.kycPin,
      downloadStatus: b.downloadStatus ?? existing.downloadStatus,
      processedBy: b.processedBy ?? existing.processedBy,
      processedAt: b.processedAt ?? existing.processedAt,
      // Step 3
      quotedPrice: b.quotedPrice != null ? Number(b.quotedPrice) : existing.quotedPrice,
      companyName: b.companyName ?? existing.companyName,
      companyNameAddress: b.companyNameAddress ?? existing.companyNameAddress,
      referenceBy: b.referenceBy ?? existing.referenceBy,
      paymentStatus: b.paymentStatus ?? existing.paymentStatus,
      paymentStatusNote: b.paymentStatusNote ?? existing.paymentStatusNote,
      invoiceNumber: b.invoiceNumber ?? existing.invoiceNumber,
      invoiceDate: b.invoiceDate ?? existing.invoiceDate,
      billingSentStatus: b.billingSentStatus ?? existing.billingSentStatus,
      billingDate: b.billingDate ?? existing.billingDate,
      billDocUrl: b.billDocUrl ?? existing.billDocUrl,
      assignmentStatus: b.assignmentStatus ?? existing.assignmentStatus, // Allow updating assignment status
    })

    const setFile = async (field: keyof Leads, f?: Express.Multer.File) => {
      if (!f) return
      await unlinkIfExists(existing[field] as any)
      ;(existing as any)[field] = toPublicUrl(f)
    }

    await setFile("aadhaarPdfUrl", files?.aadhaarPdf?.[0])
    await setFile("panPdfUrl", files?.panPdf?.[0])
    await setFile("optionalPdfUrl", files?.optionalPdf?.[0])
    await setFile("clientImageUrl", files?.clientImage?.[0])
    await setFile("billDocUrl", files?.billDoc?.[0])

    const saved = await repo().save(existing)

    if (saved.assignTeamMember && saved.assignTeamMember !== oldAssignedMember) {
      try {
        const userRepo = AppDataSource.getRepository("User")
        const assignedUser = await userRepo.findOne({
          where: { fullName: saved.assignTeamMember },
        })

        if (assignedUser) {
          const notificationRepo = AppDataSource.getRepository("LeadNotification")
          await notificationRepo.save({
            leadId: saved.id,
            userId: assignedUser.id,
            isViewed: false,
          })
        }
      } catch (notifError) {
        console.error("Failed to create notification:", notifError)
      }
    }

    res.json(saved)
  } catch (err: any) {
    console.error("Update lead error:", err)
    res.status(500).json({ error: "Failed to update lead" })
  }
}

export async function updateLeadAssignmentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { assignmentStatus } = req.body

    if (!assignmentStatus) {
      return res.status(400).json({ error: "Assignment status is required" })
    }

    const lead = await repo().findOne({ where: { id } })
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" })
    }

    lead.assignmentStatus = assignmentStatus
    const saved = await repo().save(lead)

    res.json(saved)
  } catch (err: any) {
    console.error("Update assignment status error:", err)
    res.status(500).json({ error: "Failed to update assignment status" })
  }
}

export async function getAssignedLeads(req: Request, res: Response) {
  try {
    const { userId, role } = req.query

    if (!userId || !role) {
      return res.status(400).json({ error: "User ID and role are required" })
    }

    let leads: Leads[]

    // If admin or manager, get all leads
    if (role === "admin" || role === "manager") {
      leads = await repo().find({
        order: { createdAt: "DESC" },
      })
    } else {
      // If employee, get only their assigned leads
      const userRepo = AppDataSource.getRepository("User")
      const user = await userRepo.findOne({ where: { id: userId as string } })

      if (!user) {
        return res.status(404).json({ error: "User not found" })
      }

      leads = await repo().find({
        where: { assignTeamMember: user.fullName },
        order: { createdAt: "DESC" },
      })
    }

    res.json({ leads, total: leads.length })
  } catch (err: any) {
    console.error("Get assigned leads error:", err)
    res.status(500).json({ error: "Failed to fetch assigned leads" })
  }
}

export async function deleteLead(req: Request, res: Response) {
  try {
    const lead = await repo().findOne({ where: { id: req.params.id } })
    if (!lead) return res.status(404).json({ error: "Lead not found" })

    await unlinkIfExists(lead.aadhaarPdfUrl)
    await unlinkIfExists(lead.panPdfUrl)
    await unlinkIfExists(lead.optionalPdfUrl)
    await unlinkIfExists(lead.clientImageUrl)
    await unlinkIfExists(lead.billDocUrl)

    await repo().remove(lead)
    res.json({ message: "Lead deleted", id: req.params.id })
  } catch (err: any) {
    console.error("Delete lead error:", err)
    res.status(500).json({ error: "Failed to delete lead" })
  }
}

export async function bulkUploadLeads(req: Request, res: Response) {
  try {
    const { leads } = req.body

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "No leads data provided" })
    }

    const userRepo = AppDataSource.getRepository("User")
    const allUsers = await userRepo.find()
    const userNames = allUsers.map((u) => u.fullName)

    const existingLeads = await repo().find({ select: ["orderId"] })
    const existingOrderIds = new Set(existingLeads.map((l) => l.orderId))

    const results = {
      success: [] as any[],
      failed: [] as any[],
    }

    for (let i = 0; i < leads.length; i++) {
      const leadData = leads[i]
      try {
        if (existingOrderIds.has(leadData.orderId)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName || "Unknown",
            error: `Duplicate order ID: ${leadData.orderId}. A lead with this order ID already exists.`,
          })
          continue
        }

        const required = [
          "employeeName",
          "source",
          "leadCreatedAt",
          "stage",
          "clientName",
          "clientCompanyName",
          "productName",
          "assignTeamMember",
          "email",
          "phone",
          "orderId",
          "orderDate",
          "clientAddress",
          "clientKycId",
          "kycPin",
          "downloadStatus",
          "processedBy",
          "processedAt",
          "quotedPrice",
          "companyNameAddress",
          "paymentStatus",
          "billingSentStatus",
        ]

        const missingFields = required.filter((field) => !leadData[field] || String(leadData[field]).trim() === "")

        if (missingFields.length > 0) {
          results.failed.push({
            row: i + 2, // +2 because row 1 is header, array is 0-indexed
            clientName: leadData.clientName || "Unknown",
            error: `Missing required fields: ${missingFields.join(", ")}`,
          })
          continue
        }

        if (!userNames.includes(leadData.employeeName)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Employee Name "${leadData.employeeName}" not found. Available users: ${userNames.join(", ")}`,
          })
          continue
        }

        if (!userNames.includes(leadData.assignTeamMember)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Assign Team Member "${leadData.assignTeamMember}" not found. Available users: ${userNames.join(", ")}`,
          })
          continue
        }

        if (!userNames.includes(leadData.processedBy)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Processed By "${leadData.processedBy}" not found. Available users: ${userNames.join(", ")}`,
          })
          continue
        }

        const validSources = ["Survey", "Facebook", "Website", "Other"]
        if (!validSources.includes(leadData.source)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Invalid Source "${leadData.source}". Must be one of: ${validSources.join(", ")}`,
          })
          continue
        }

        const validStages = ["Lead", "Contacted", "Qualified", "Proposal Made", "Won", "Lost", "Fridge"]
        if (!validStages.includes(leadData.stage)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Invalid Stage "${leadData.stage}". Must be one of: ${validStages.join(", ")}`,
          })
          continue
        }

        const validDownloadStatus = ["completed", "not_complete", "process"]
        if (!validDownloadStatus.includes(leadData.downloadStatus)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Invalid Download Status "${leadData.downloadStatus}". Must be one of: ${validDownloadStatus.join(", ")}`,
          })
          continue
        }

        const validPaymentStatus = ["paid", "pending", "failed", "other"]
        if (!validPaymentStatus.includes(leadData.paymentStatus)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Invalid Payment Status "${leadData.paymentStatus}". Must be one of: ${validPaymentStatus.join(", ")}`,
          })
          continue
        }

        const validBillingStatus = ["sent", "not_sent", "process"]
        if (!validBillingStatus.includes(leadData.billingSentStatus)) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: `Invalid Billing Sent Status "${leadData.billingSentStatus}". Must be one of: ${validBillingStatus.join(", ")}`,
          })
          continue
        }

        if (leadData.source === "Other" && (!leadData.otherSource || leadData.otherSource.trim() === "")) {
          results.failed.push({
            row: i + 2,
            clientName: leadData.clientName,
            error: 'Other Source is required when Source is "Other"',
          })
          continue
        }

        // Create lead with optional document URLs
        const lead = repo().create({
          // Step 1
          employeeName: leadData.employeeName,
          source: leadData.source,
          otherSource: leadData.otherSource || null,
          leadCreatedAt: leadData.leadCreatedAt,
          expectedCloseDate: leadData.expectedCloseDate || null,
          lastContactedAt: leadData.lastContactedAt || null,
          stage: leadData.stage,
          comment: leadData.comment || null,
          remarks: leadData.remarks || null,
          // Step 2
          clientName: leadData.clientName,
          clientCompanyName: leadData.clientCompanyName,
          productName: leadData.productName,
          assignTeamMember: leadData.assignTeamMember,
          email: leadData.email,
          phone: leadData.phone,
          orderId: leadData.orderId,
          orderDate: leadData.orderDate,
          clientAddress: leadData.clientAddress,
          clientKycId: leadData.clientKycId,
          kycPin: leadData.kycPin,
          downloadStatus: leadData.downloadStatus,
          processedBy: leadData.processedBy,
          processedAt: leadData.processedAt,
          aadhaarPdfUrl: leadData.aadhaarPdfUrl || null,
          panPdfUrl: leadData.panPdfUrl || null,
          optionalPdfUrl: leadData.optionalPdfUrl || null,
          clientImageUrl: leadData.clientImageUrl || null,
          // Step 3
          quotedPrice: Number(leadData.quotedPrice ?? 0),
          companyName: leadData.companyName || null,
          companyNameAddress: leadData.companyNameAddress,
          referenceBy: leadData.referenceBy || null,
          paymentStatus: leadData.paymentStatus,
          paymentStatusNote: leadData.paymentStatusNote || null,
          invoiceNumber: leadData.invoiceNumber || null,
          invoiceDate: leadData.invoiceDate || null,
          billingSentStatus: leadData.billingSentStatus,
          billingDate: leadData.billingDate || null,
          billDocUrl: leadData.billDocUrl || null,
          assignmentStatus: "new",
        })

        const saved = await repo().save(lead)

        existingOrderIds.add(saved.orderId)

        // Create notification for assigned team member
        if (saved.assignTeamMember) {
          try {
            const assignedUser = await userRepo.findOne({
              where: { fullName: saved.assignTeamMember },
            })

            if (assignedUser) {
              const notificationRepo = AppDataSource.getRepository("LeadNotification")
              await notificationRepo.save({
                leadId: saved.id,
                userId: assignedUser.id,
                isViewed: false,
              })
            }
          } catch (notifError) {
            console.error("Failed to create notification:", notifError)
          }
        }

        results.success.push({
          row: i + 2,
          clientName: saved.clientName,
          id: saved.id,
        })
      } catch (error: any) {
        results.failed.push({
          row: i + 2,
          clientName: leadData.clientName || "Unknown",
          error: error.message || "Failed to create lead",
        })
      }
    }

    res.status(201).json({
      message: `Bulk upload completed. ${results.success.length} succeeded, ${results.failed.length} failed.`,
      results,
      totalProcessed: leads.length,
    })
  } catch (err: any) {
    console.error("Bulk upload error:", err)
    res.status(500).json({ error: "Failed to process bulk upload" })
  }
}
