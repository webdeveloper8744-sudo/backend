import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { User, type UserRole } from "../models/User"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const repo = () => AppDataSource.getRepository(User)

function signToken(user: User) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "supersecret", {
    expiresIn: "1h",
  })
}

// Register (first user OR via admin add)
export async function register(req: Request, res: Response) {
  const { fullName, email, phone, password, role, imageUrl } = req.body

  // Add validation
  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: "Full name, email, phone, and password are required" })
  }

  try {
    const existing = await repo().findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: "Email already exists" })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = repo().create({
      fullName, // Add this
      email,
      phone,
      password: hashed,
      role: (role as UserRole) || "employee",
      imageUrl: imageUrl || null,
    })
    await repo().save(user)
    const { password: _p, ...safe } = user as any
    res.status(201).json(safe)
  } catch (error: any) {
    console.error("Register error:", error)
    res.status(500).json({ error: "Registration failed" })
  }
}

export async function login(req: Request, res: Response) {
  const { email, password, selectedRole } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  if (!selectedRole) {
    return res.status(400).json({ error: "Please select a role to continue" })
  }

  try {
    const user = await repo().findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    if (user.role !== selectedRole) {
      return res.status(403).json({
        error: `Invalid credentials for ${selectedRole} role. Please select the correct role or check your credentials.`,
      })
    }

    const token = signToken(user)
    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        imageUrl: user.imageUrl,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
}
