import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { store } from "../models/store.model"
// import { PurchaseOrder } from "../models/purchase_order.model"
import { PurchaseOrder } from "../models/PurchaseOrder"

// Get all stores
export async function getAllStore(req: Request, res: Response) {
    try {
        console.log("[v0] getAllStore called")
        const storeRepository = AppDataSource.getRepository(store)
        const stores = await storeRepository.find({
            order: {
                createdAt: "DESC"
            }
        })
        console.log("[v0] Found stores:", stores.length)
        res.json({ stores, total: stores.length });
    } catch (error: any) {
        console.error("[v0] Get stores error:", error);
        res.status(500).json({ error: "Failed to fetch stores", details: error.message });
    }
}

// Create new store
export async function createStore(req: Request, res: Response) {
    try {
        const { name, description } = req.body

        console.log("[v0] Create store request:", { name, description });

        // Validation
        if (!name || !description) {
            return res.status(400).json({ error: "Store name and description are required" })
        }

        const storeRepository = AppDataSource.getRepository(store)

        // Create store
        const newStore = new store()
        newStore.name = name
        newStore.description = description

        const savedStore = await storeRepository.save(newStore)

        console.log("[v0] Store created successfully:", savedStore.id)
        res.status(201).json({
            message: "Store created successfully",
            store: savedStore,
        })
    } catch (error: any) {
        console.error("[v0] Create store error:", error);
        res.status(500).json({ error: "Failed to create store", details: error.message });
    }
}

// Update store
export async function updateStore(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description } = req.body

    console.log("[v0] Update store request:", { id, name, description })

    const storeRepository = AppDataSource.getRepository(store)
    const storeToUpdate = await storeRepository.findOne({ where: { id } })
    
    if (!storeToUpdate) {
      return res.status(404).json({ error: "Store not found" })
    }

    // Update fields
    if (name) storeToUpdate.name = name
    if (description) storeToUpdate.description = description

    const updatedStore = await storeRepository.save(storeToUpdate)

    console.log("[v0] Store updated successfully:", id)
    res.json({ message: "Store updated successfully", store: updatedStore })
  } catch (error: any) {
    console.error("[v0] Update store error:", error)
    res.status(500).json({ error: "Failed to update store", details: error.message })
  }
}

// Delete store
export async function deleteStore(req: Request, res: Response) {
  try {
    const { id } = req.params
    const storeRepository = AppDataSource.getRepository(store)

    const storeToDelete = await storeRepository.findOne({ where: { id } })
    if (!storeToDelete) {
      return res.status(404).json({ error: "Store not found" })
    }

    // Check for related purchase orders before deleting
    const purchaseOrderRepository = AppDataSource.getRepository(PurchaseOrder)
    const relatedOrdersCount = await purchaseOrderRepository.count({ where: { store: { id } } })

    if (relatedOrdersCount > 0) {
      return res.status(409).json({
        error: "Cannot delete store",
        details: `This store has ${relatedOrdersCount} associated purchase order(s) and cannot be deleted.`,
        code: "STORE_HAS_DEPENDENCIES",
      })
    }

    await storeRepository.remove(storeToDelete)
    console.log("[v0] Store deleted successfully:", id)
    res.json({ message: "Store deleted successfully", storeId: id })
  } catch (error: any) {
    console.error("[v0] Delete store error:", error)
    res.status(500).json({ error: "Failed to delete store", details: error.message })
  }
}
