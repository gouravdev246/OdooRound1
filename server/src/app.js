import "dotenv/config";
import express from "express";
import cors from "cors";

import authRouter from "./auth.js";
import warehouseRoutes from "./modules/warehouse/warehouse.routes.js";
import locationRoutes from "./modules/location/location.routes.js";
import receiptRoutes from "./modules/receipt/receipt.routes.js";
import stockRoutes from "./modules/stock/stock.route.js";
import deliveryRoutes from "./modules/delivery/delivery.route.js";
import moveHistoryRoutes from "./modules/move-history/move-history.routes.js";
import { userMiddleware } from "./middleware/user.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.send({ message: "Server alive" });
});

// Authentication (Public)
app.use("/api/auth", authRouter);

// Protected API Routes
app.use("/api", userMiddleware, warehouseRoutes);
app.use("/api", userMiddleware, locationRoutes);
app.use("/api", userMiddleware, receiptRoutes);
app.use("/api", userMiddleware, stockRoutes);
app.use("/api", userMiddleware, deliveryRoutes);
app.use("/api", userMiddleware, moveHistoryRoutes);

export default app;
