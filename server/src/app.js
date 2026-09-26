import "dotenv/config";
import express from "express" 
import cors from "cors"
import authRouter from "./auth.js";



const app = express() 
app.use(cors())
app.use(express.json()) 
app.use("/api/auth", authRouter);

// API Routes
app.use("/api", userMiddleware, warehouseRoutes);
app.use("/api", userMiddleware, locationRoutes);
app.use("/api", userMiddleware, receiptRoutes);
app.use("/api", userMiddleware, stockRoutes);
app.use("/api", userMiddleware, deliveryRoutes);


export default app;
