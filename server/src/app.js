import "dotenv/config";
import express from "express";
import cors from "cors";
import warehouseRoutes from "./modules/warehouse/warehouse.routes.js";
import locationRoutes from "./modules/location/location.routes.js";
import receiptRoutes from "./modules/receipt/receipt.routes.js";
import stockRoutes from "./modules/stock/stock.route.js";
import deliveryRoutes from "./modules/delivery/delivery.route.js";
import productRoutes from "./modules/product/product.routes.js";
import ledgerRoutes from "./modules/ledger/ledger.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.send({ message: "StockSense Server alive" });
});

// API Routes
app.use("/api", warehouseRoutes);
app.use("/api", locationRoutes);
app.use("/api", receiptRoutes);
app.use("/api", stockRoutes);
app.use("/api", deliveryRoutes);
app.use("/api", productRoutes);
app.use("/api", ledgerRoutes);

export default app;
