import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { PurchaseOrder } from "../models/PurchaseOrder"
import { MTokenSerialNumber } from "../models/MTokenSerialNumber"
import { store } from "../models/store.model"

// Get all purchase orders
export async function getAllPurchaseOrders(req: Request, res: Response) {
  try {
    const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder)
    const orders = await purchaseOrderRepository.find({
      relations: ["store"],
      order: { createdAt: "DESC" },
    })

    res.json({ orders, total: orders.length })
  } catch (error: any) {
    console.error("Get purchase orders error:", error)
    res.status(500).json({ error: "Failed to fetch purchase orders" })
  }
}

// Get single purchase order by ID
export async function getPurchaseOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder)

    const order = await purchaseOrderRepository.findOne({
      where: { id },
      relations: ["store"],
    })

    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" })
    }

    res.json(order)
  } catch (error: any) {
    console.error("Get purchase order error:", error)
    res.status(500).json({ error: "Failed to fetch purchase order" })
  }
}

// Create new purchase order with serial numbers
export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const { storeId, quantity, amount, purchaseDate, serialNumbers } = req.body

    console.log("Create purchase order request:", { storeId, quantity, amount, purchaseDate, serialNumbers })

    // Validation
    if (!storeId || quantity == null || amount == null || !purchaseDate) {
      return res.status(400).json({
        error: "Store, quantity, amount, and purchase date are required",
      })
    }

    if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({
        error: "At least one serial number is required",
      })
    }

    if (serialNumbers.length !== quantity) {
      return res.status(400).json({
        error: `Number of serial numbers (${serialNumbers.length}) must match quantity (${quantity})`,
      })
    }

    const storeRepository = AppDataSource.getRepository(store)
    const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder)
    const serialNumberRepository = AppDataSource.getRepository(MTokenSerialNumber)

    // Verify store exists
    const storeExists = await storeRepository.findOne({ where: { id: storeId } })
    if (!storeExists) {
      return res.status(404).json({ error: "Store not found" })
    }

    // Check for duplicate serial numbers
    const uniqueSerials = new Set(serialNumbers.map((s: string) => s.toUpperCase()))
    if (uniqueSerials.size !== serialNumbers.length) {
      return res.status(400).json({ error: "Duplicate serial numbers provided" })
    }

    const existingSerials = await serialNumberRepository.find({
      where: serialNumbers.map((s: string) => ({ serialNumber: s.toUpperCase() })),
    })

    if (existingSerials.length > 0) {
      return res.status(400).json({
        error: `Serial numbers already exist: ${existingSerials.map((s) => s.serialNumber).join(", ")}`,
      })
    }

    // Create purchase order
    const purchaseOrder = new PurchaseOrder()
    purchaseOrder.productName = "MToken"
    purchaseOrder.storeId = storeId
    purchaseOrder.quantity = quantity
    purchaseOrder.amount = amount
    purchaseOrder.purchaseDate = purchaseDate

    const savedOrder = await purchaseOrderRepository.save(purchaseOrder)

    // Create serial number entries
    const serialNumberEntries = await Promise.all(
      serialNumbers.map(async (serialNum: string) => {
        const serialEntry = new MTokenSerialNumber()
        serialEntry.serialNumber = serialNum.toUpperCase()
        serialEntry.purchaseOrderId = savedOrder.id
        serialEntry.storeId = storeId
        serialEntry.purchaseDate = purchaseDate
        serialEntry.isUsed = false

        return await serialNumberRepository.save(serialEntry)
      }),
    )

    res.status(201).json({
      message: "Purchase order created successfully",
      order: savedOrder,
      serialNumbers: serialNumberEntries,
    })
  } catch (error: any) {
    console.error("Create purchase order error:", error)
    res.status(500).json({ error: "Failed to create purchase order" })
  }
}

// Update purchase order
export async function updatePurchaseOrder(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { storeId, quantity, amount, purchaseDate } = req.body

    const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder)
    const storeRepository = AppDataSource.getRepository(store)

    const order = await purchaseOrderRepository.findOne({ where: { id } })
    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" })
    }

    // Verify store exists if updating
    if (storeId && storeId !== order.storeId) {
      const storeExists = await storeRepository.findOne({ where: { id: storeId } })
      if (!storeExists) {
        return res.status(404).json({ error: "Store not found" })
      }
      order.storeId = storeId
    }

    if (quantity != null) order.quantity = quantity
    if (amount != null) order.amount = amount
    if (purchaseDate) order.purchaseDate = purchaseDate

    const updatedOrder = await purchaseOrderRepository.save(order)

    res.json({ message: "Purchase order updated successfully", order: updatedOrder })
  } catch (error: any) {
    console.error("Update purchase order error:", error)
    res.status(500).json({ error: "Failed to update purchase order" })
  }
}

// Delete purchase order
export async function deletePurchaseOrder(req: Request, res: Response) {
  try {
    const { id } = req.params
    const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder)
    const serialNumberRepository = AppDataSource.getRepository(MTokenSerialNumber)

    const order = await purchaseOrderRepository.findOne({ where: { id } })
    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" })
    }

    // Delete associated serial numbers
    await serialNumberRepository.delete({ purchaseOrderId: id })

    // Delete purchase order
    await purchaseOrderRepository.remove(order)

    res.json({ message: "Purchase order deleted successfully", orderId: id })
  } catch (error: any) {
    console.error("Delete purchase order error:", error)
    res.status(500).json({ error: "Failed to delete purchase order" })
  }
}

// Get all MToken serial numbers
export async function getAllMTokenSerialNumbers(req: Request, res: Response) {
  try {
    const serialNumberRepository = AppDataSource.getRepository(MTokenSerialNumber)
    const { storeId, isUsed } = req.query

    let query = serialNumberRepository.createQueryBuilder("sn").leftJoinAndSelect("sn.store", "store").orderBy("sn.createdAt", "DESC")

    if (storeId) {
      query = query.where("sn.storeId = :storeId", { storeId })
    }

    if (isUsed !== undefined) {
      query = query.andWhere("sn.isUsed = :isUsed", { isUsed: isUsed === "true" })
    }

    const serials = await query.getMany()

    res.json({ serials, total: serials.length })
  } catch (error: any) {
    console.error("Get serial numbers error:", error)
    res.status(500).json({ error: "Failed to fetch serial numbers" })
  }
}

// Search MToken serial numbers
export async function searchMTokenSerialNumbers(req: Request, res: Response) {
  try {
    const { query, storeId } = req.query
    const serialNumberRepository = AppDataSource.getRepository(MTokenSerialNumber)

    let searchQuery = serialNumberRepository
      .createQueryBuilder("sn")
      .leftJoinAndSelect("sn.store", "store")
      .where("sn.isUsed = :isUsed", { isUsed: false })

    if (query) {
      searchQuery = searchQuery.andWhere("UPPER(sn.serialNumber) LIKE :serialNumber", {
        serialNumber: `%${String(query).toUpperCase()}%`,
      })
    }

    if (storeId) {
      searchQuery = searchQuery.andWhere("sn.storeId = :storeId", { storeId })
    }

    const results = await searchQuery.orderBy("sn.createdAt", "DESC").getMany()

    res.json({ results, total: results.length })
  } catch (error: any) {
    console.error("Search serial numbers error:", error)
    res.status(500).json({ error: "Failed to search serial numbers" })
  }
}

// Mark MToken as used in lead
export async function markMTokenAsUsed(req: Request, res: Response) {
  try {
    const { serialNumber, leadId } = req.body

    if (!serialNumber || !leadId) {
      return res.status(400).json({ error: "Serial number and lead ID are required" })
    }

    const serialNumberRepository = AppDataSource.getRepository(MTokenSerialNumber)

    const serial = await serialNumberRepository.findOne({
      where: { serialNumber: serialNumber.toUpperCase() },
    })

    if (!serial) {
      return res.status(404).json({ error: "Serial number not found" })
    }

    serial.isUsed = true
    serial.usedInLeadId = leadId

    const updatedSerial = await serialNumberRepository.save(serial)

    res.json({ message: "MToken marked as used", serial: updatedSerial })
  } catch (error: any) {
    console.error("Mark MToken as used error:", error)
    res.status(500).json({ error: "Failed to mark MToken as used" })
  }
}
