import { Router } from "express";
import {
  getAllReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  markReceiptAsReady,
  validateReceipt,
  cancelReceipt,
} from "./receipt.controller.js";

const router = Router();

router.get("/receipts", getAllReceipts);
router.get("/receipts/:id", getReceiptById);
router.post("/receipts", createReceipt);
router.put("/receipts/:id", updateReceipt);

// Workflow state transition actions from Mockup
router.patch("/receipts/:id/ready", markReceiptAsReady);    // "To DO" button in Draft
router.post("/receipts/:id/validate", validateReceipt);     // "Validate" button in Ready
router.patch("/receipts/:id/cancel", cancelReceipt);        // "Cancel" button

export default router;
