import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { User, type UserRole } from "../models/User"
import bcrypt from "bcryptjs"
import { deleteFromCloudinary, extractPublicId } from "../config/cloudinary"

const repo = () => AppDataSource.getRepository(User)

// Get all users (accessible by all authenticated users)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await repo().find({
      select: ["id", "fullName", "email", "phone", "role", "imageUrl", "createdAt", "updatedAt"],
    })

    res.json({ users, total: users.length })
  } catch (error: any) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
}

// Get single user by ID
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params

    const user = await repo().findOne({
      where: { id },
      select: ["id", "fullName", "email", "phone", "role", "imageUrl", "createdAt", "updatedAt"],
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error: any) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

// Create new user (admin only)
export async function createUser(req: Request, res: Response) {
  try {
    const { fullName, email, phone, password, role } = req.body

    console.log("Create user request received:", { fullName, email, phone, role })
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
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: "Full name, email, phone, and password are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    // Check if user exists
    const existing = await repo().findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: "User already exists" })
    }

    // Create user
    const user = new User()
    user.fullName = fullName
    user.email = email
    user.phone = phone
    user.password = await bcrypt.hash(password, 10)
    user.role = (role as UserRole) || "employee"

    if (req.file) {
      user.imageUrl = req.file.path // Cloudinary URL
      console.log("Image URL set to:", user.imageUrl)
    }

    await repo().save(user)

    const { password: _p, ...safeUser } = user as any
    res.status(201).json({
      message: "User created successfully",
      user: safeUser,
    })
  } catch (error: any) {
    console.error("Create user error:", error)
    res.status(500).json({ error: "Failed to create user" })
  }
}

// Update user (admin and manager can update)
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { fullName, email, phone, password, role } = req.body
    const currentUser = (req as any).user

    console.log("Update user request received:", { id, fullName, email, phone, role })
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

    const user = await repo().findOne({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Role validation logic
    if (role && role !== user.role && currentUser.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change user roles" })
    }

    if (role === "admin" && currentUser.sub === id && currentUser.role !== "admin") {
      return res.status(403).json({ error: "Cannot elevate your own privileges" })
    }

    // Email update logic
    if (email && email !== user.email) {
      const existing = await repo().findOne({ where: { email } })
      if (existing) {
        return res.status(409).json({ error: "Email already exists" })
      }
      user.email = email
    }

    if (fullName) user.fullName = fullName
    if (phone) user.phone = phone
    if (role) user.role = role as UserRole

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (user.imageUrl) {
        const publicId = extractPublicId(user.imageUrl)
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
      user.imageUrl = req.file.path // New Cloudinary URL
      console.log("New image URL set to:", user.imageUrl)
    }

    // Password update logic
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" })
      }
      user.password = await bcrypt.hash(password, 10)
    }

    await repo().save(user)

    const { password: _p, ...safeUser } = user as any
    res.json({ message: "User updated successfully", user: safeUser })
  } catch (error: any) {
    console.error("Update user error:", error)
    res.status(500).json({ error: "Failed to update user" })
  }
}

// Delete user (only admin can delete)
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const currentUser = (req as any).user

    // Prevent self-deletion
    if (currentUser.sub === id) {
      return res.status(403).json({ error: "Cannot delete your own account" })
    }

    const user = await repo().findOne({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (user.imageUrl) {
      const publicId = extractPublicId(user.imageUrl)
      if (publicId) {
        await deleteFromCloudinary(publicId)
      }
    }

    await repo().remove(user)
    res.json({ message: "User deleted successfully", userId: id })
  } catch (error: any) {
    console.error("Delete user error:", error)
    res.status(500).json({ error: "Failed to delete user" })
  }
}
