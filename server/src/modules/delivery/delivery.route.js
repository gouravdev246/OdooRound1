import Router from "express";
import { getalldevilery } from "./delivery.controller.js";
import prisma from "../../config/prisma.js";

const router = Router();

// List & Details
router.get("/delivery", getalldevilery);
router.get("/deliveries", getalldevilery);

// POST /api/deliveries
router.post("/deliveries", async (req, res) => {
  try {
    const { customerName, scheduledDate, notes, items } = req.body;
    const count = await prisma.delivery.count();
    const deliveryNumber = `WH/OUT/${String(count + 1).padStart(4, "0")}`;

    let createdById = req.user?.id || req.body.createdById;
    if (!createdById) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) createdById = defaultUser.id;
    }

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        customerName: customerName || "Customer Delivery",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        createdById: createdById || undefined,
        status: "DRAFT",
      },
    });

    return res.status(201).json({ success: true, message: "Delivery created", data: delivery });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;