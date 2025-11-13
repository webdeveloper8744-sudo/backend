import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { store } from "../models/store.model"

// Get all stores
export async function getAllStore(req: Request, res: Response) {
    try {
        const storeRepository = AppDataSource.getRepository(store)
        const stores = await storeRepository.find()
        res.json({ stores, total: stores.length });
    } catch (error: any) {
        console.error("Get stores error or data not found:", error);
        res.status(500).json({ error: "Failed to fetch stores" });
    }
}


// // Get single product by ID
// export async function getProductById(req: Request, res: Response) {
//   try {
//     const { id } = req.params

//     const product = await repo().findOne({ where: { id } })

//     if (!product) {
//       return res.status(404).json({ error: "Product not found" })
//     }

//     res.json(product)
//   } catch (error: any) {
//     console.error("Get product error:", error)
//     res.status(500).json({ error: "Failed to fetch product" })
//   }
// }


// Create new store
export async function createStore(req: Request, res: Response) {
    try {
        const { name, description } = req.body

        console.log("Create store request received:", { name, description });

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

        res.status(201).json({
            message: "Store created successfully",
            store: savedStore,
        })
    } catch (error: any) {
        console.error("Create Store error:", error);
        res.status(500).json({ error: "Failed to create Store" });
    }
}

// Update product
export async function updateStore(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description } = req.body

    console.log("Update store request received:", { id, name, description })
    console.log(
      "File received:",
      req.file
        ? {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : "No file",
    )

    // const store = await repo().findOne({ where: { id } })
    const storeRepository = AppDataSource.getRepository(store)

    const storeToUpdate = await storeRepository.findOne({ where: { id } })
    if (!storeToUpdate) {
      return res.status(404).json({ error: "Store not found" })
    }

    // Update fields
    if (name) storeToUpdate.name = name
    if (description) storeToUpdate.description = description

    await storeRepository.save(storeToUpdate)

    res.json({ message: "Store updated successfully", store: storeToUpdate })
  } catch (error: any) {
    console.error("Update store error:", error)
    res.status(500).json({ error: "Failed to update store" })
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

    await storeRepository.remove(storeToDelete)
    res.json({ message: "Store deleted successfully", storeId: id })
  } catch (error: any) {
    console.error("Delete store error:", error)
    res.status(500).json({ error: "Failed to delete store" })
  }
}