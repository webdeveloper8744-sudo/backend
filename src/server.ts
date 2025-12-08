import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import path from "path"
import { initializeDatabase } from "./config/db"
import { ensureUploadDirs } from "./config/fileStorage"
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes"
import productRoutes from "./routes/productRoutes"
import leadRoutes from "./routes/leadRoutes"
import leadAssignmentRoutes from "./routes/leadAssignmentRoutes"
import notificationRoutes from "./routes/notificationRoutes"
import storeRoute from "./routes/storeRoute"
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes"

dotenv.config()
const app = express()

app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "https://crm.vishwnet.com", "https://crm.codeiing.com"],
    credentials: true,
  }),
)

app.use(express.json())

// Routes
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/products", productRoutes)
app.use("/store", storeRoute)
app.use("/leads", leadRoutes)
app.use("/lead-assignments", leadAssignmentRoutes)
app.use("/notifications", notificationRoutes)
app.use("/purchase-orders", purchaseOrderRoutes)

app.get("/", (req, res) => res.send("CRM API Running with Local File Storage"))

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || "Something went wrong!" })
})

initializeDatabase().then(() => {
  ensureUploadDirs()

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`))
})
