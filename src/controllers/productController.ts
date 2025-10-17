import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { Product } from "../models/Product"
import { deleteFromCloudinary, extractPublicId } from "../config/cloudinary"

const repo = () => AppDataSource.getRepository(Product)

// Get all products
export async function getAllProducts(req: Request, res: Response) {
  try {
    const products = await repo().find({
      order: { createdAt: "DESC" },
    })

    res.json({ products, total: products.length })
  } catch (error: any) {
    console.error("Get products error:", error)
    res.status(500).json({ error: "Failed to fetch products" })
  }
}

// Get single product by ID
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params

    const product = await repo().findOne({ where: { id } })

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json(product)
  } catch (error: any) {
    console.error("Get product error:", error)
    res.status(500).json({ error: "Failed to fetch product" })
  }
}

// Create new product
export async function createProduct(req: Request, res: Response) {
  try {
    const { name, description } = req.body

    console.log("Create product request received:", { name, description })
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

    // Validation
    if (!name || !description) {
      return res.status(400).json({ error: "Product name and description are required" })
    }

    // Create product
    const product = new Product()
    product.name = name
    product.description = description

    if (req.file) {
      product.imageUrl = req.file.path // Cloudinary URL
      console.log("Image URL set to:", product.imageUrl)
    }

    await repo().save(product)

    res.status(201).json({
      message: "Product created successfully",
      product,
    })
  } catch (error: any) {
    console.error("Create product error:", error)
    res.status(500).json({ error: "Failed to create product" })
  }
}

// Update product
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description } = req.body

    console.log("Update product request received:", { id, name, description })
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

    const product = await repo().findOne({ where: { id } })
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    // Update fields
    if (name) product.name = name
    if (description) product.description = description

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (product.imageUrl) {
        const publicId = extractPublicId(product.imageUrl)
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
      product.imageUrl = req.file.path // New Cloudinary URL
      console.log("New image URL set to:", product.imageUrl)
    }

    await repo().save(product)

    res.json({ message: "Product updated successfully", product })
  } catch (error: any) {
    console.error("Update product error:", error)
    res.status(500).json({ error: "Failed to update product" })
  }
}

// Delete product
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params

    const product = await repo().findOne({ where: { id } })
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    if (product.imageUrl) {
      const publicId = extractPublicId(product.imageUrl)
      if (publicId) {
        await deleteFromCloudinary(publicId)
      }
    }

    await repo().remove(product)
    res.json({ message: "Product deleted successfully", productId: id })
  } catch (error: any) {
    console.error("Delete product error:", error)
    res.status(500).json({ error: "Failed to delete product" })
  }
}
