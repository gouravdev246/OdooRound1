import { Router } from "express";
import { getStockLedger } from "./ledger.controller.js";

const router = Router();

router.get("/ledger", getStockLedger);
router.get("/stocks/ledger", getStockLedger);

export default router;
