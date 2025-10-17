import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET || "supersecret", (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    (req as any).user = decoded;
    next();
  });
}

// Single role requirement
export function requireRole(role: "admin" | "manager" | "employee" | "guest") {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== role) {
      return res.status(403).json({ error: `Only ${role} can access this route` });
    }
    next();
  };
}

// Multiple roles requirement (OR logic)
export function requireAnyRole(roles: ("admin" | "manager" | "employee" | "guest")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(" or ")}` 
      });
    }
    next();
  };
}