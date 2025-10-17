import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { initializeDatabase } from "./config/db"
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes"
import productRoutes from "./routes/productRoutes"
import leadRoutes from "./routes/leadRoutes"
import leadAssignmentRoutes from "./routes/leadAssignmentRoutes"
import notificationRoutes from "./routes/notificationRoutes"

dotenv.config()
const app = express()

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
)

app.use(express.json())

// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/products", productRoutes)
app.use("/leads", leadRoutes)
app.use("/lead-assignments", leadAssignmentRoutes) // Added lead assignment routes
app.use("/notifications", notificationRoutes) // Added notification routes

app.get("/", (req, res) => res.send("CRM API Running with Cloudinary"))

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || "Something went wrong!" })
})

initializeDatabase().then(() => {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`))
})
