import type { Request, Response } from "express"
import { AppDataSource } from "../config/db"
import { User, type UserRole } from "../models/User"
import { PasswordReset } from "../models/PasswordReset"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const repo = () => AppDataSource.getRepository(User)
const resetRepo = () => AppDataSource.getRepository(PasswordReset)

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

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  try {
    const user = await repo().findOne({ where: { email } })
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: "If the email exists, a verification code has been sent" })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiration to 15 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Invalidate any existing codes for this email
    await resetRepo()
      .createQueryBuilder()
      .update(PasswordReset)
      .set({ isUsed: true })
      .where("email = :email AND isUsed = false", { email })
      .execute()

    // Create new reset code
    const resetRecord = resetRepo().create({
      email,
      code,
      expiresAt,
    })
    await resetRepo().save(resetRecord)

    // TODO: Send email with code (for now, log it)
    console.log(`Password reset code for ${email}: ${code}`)

    res.json({
      message: "If the email exists, a verification code has been sent",
      // For demo purposes, include the code in response
      // Remove this in production and send via email
      code,
    })
  } catch (error: any) {
    console.error("Forgot password error:", error)
    res.status(500).json({ error: "Failed to process request" })
  }
}

export async function verifyResetCode(req: Request, res: Response) {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" })
  }

  try {
    const resetRecord = await resetRepo().findOne({
      where: {
        email,
        code,
        isUsed: false,
      },
    })

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired verification code" })
    }

    // Check if code is expired
    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: "Verification code has expired" })
    }

    res.json({ message: "Code verified successfully" })
  } catch (error: any) {
    console.error("Verify code error:", error)
    res.status(500).json({ error: "Failed to verify code" })
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { email, code, newPassword } = req.body

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code, and new password are required" })
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" })
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    return res.status(400).json({ error: "Password must contain uppercase, lowercase, and numbers" })
  }

  try {
    const resetRecord = await resetRepo().findOne({
      where: {
        email,
        code,
        isUsed: false,
      },
    })

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired verification code" })
    }

    // Check if code is expired
    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: "Verification code has expired" })
    }

    // Find user and update password
    const user = await repo().findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed
    await repo().save(user)

    // Mark reset code as used
    resetRecord.isUsed = true
    await resetRepo().save(resetRecord)

    res.json({ message: "Password reset successfully" })
  } catch (error: any) {
    console.error("Reset password error:", error)
    res.status(500).json({ error: "Failed to reset password" })
  }
}
