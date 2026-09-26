import { Router } from "express";
import {
  getalldevilery,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  checkAvailability,
  validateDelivery,
  cancelDelivery,
} from "./delivery.controller.js";

const router = Router();

// List deliveries (support both /deliveries and /delivery)
router.get("/deliveries", getalldevilery);
router.get("/delivery", getalldevilery);

// Create delivery
router.post("/deliveries", createDelivery);
router.post("/delivery", createDelivery);

// Details & Updates
router.get("/deliveries/:id", getDeliveryById);
router.get("/delivery/:id", getDeliveryById);
router.put("/deliveries/:id", updateDelivery);
router.put("/delivery/:id", updateDelivery);

// Workflow state actions
router.post("/deliveries/:id/check-availability", checkAvailability);
router.post("/deliveries/:id/validate", validateDelivery);
router.patch("/deliveries/:id/cancel", cancelDelivery);

export default router;