import "dotenv/config";
import express from "express" 
import cors from "cors"
import authRouter from "./auth.js";
import warehouseRoutes from "./modules/warehouse/warehouse.routes.js";
import locationRoutes from "./modules/location/location.routes.js";
import receiptRoutes from "./modules/receipt/receipt.routes.js";
import stockRoutes from "./modules/stock/stock.route.js";
import deliveryRoutes from "./modules/delivery/delivery.route.js";
import productRoutes from "./modules/product/product.routes.js";
import moveHistoryRoutes from "./modules/move-history/move-history.routes.js";
import ledgerRoutes from "./modules/ledger/ledger.routes.js";
import { userMiddleware } from "./middleware/user.middleware.js";


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
app.use("/api", userMiddleware, productRoutes);
app.use("/api", userMiddleware, moveHistoryRoutes);
app.use("/api", userMiddleware, ledgerRoutes);


export default app;
