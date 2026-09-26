import { Router } from "express";
import {
  getMoveHistory,
  getStockLedger,
} from "./move-history.controller.js";

const router = Router();

// Move History (List & Kanban View)
router.get("/move-history", getMoveHistory);

// Detailed Immutable Ledger Audit Log
router.get("/move-history/ledger", getStockLedger);

export default router;
