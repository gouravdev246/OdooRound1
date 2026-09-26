import prisma from "../../config/prisma.js";

/**
 * Generate next sequence for receiptNumber in the format WH/IN/0001
 */
const generateReceiptNumber = async () => {
  const count = await prisma.receipt.count();
  const nextNum = String(count + 1).padStart(4, "0");
  return `WH/IN/${nextNum}`;
};


// GET /api/receipts
export const getAllReceipts = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { supplierName: { contains: search, mode: "insensitive" } },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
            location: {
              select: {
                id: true,
                name: true,
                code: true,
                warehouse: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: receipts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/receipts/:id
export const getReceiptById = async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
            location: {
              select: {
                id: true,
                name: true,
                code: true,
                warehouse: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    return res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/receipts
export const createReceipt = async (req, res) => {
  try {
    const { supplierName, scheduledDate, notes, items } = req.body;

    // Use logged in user if available, or fallback to createdById from body or default user
    let createdById = req.user?.id || req.body.createdById;
    if (!createdById) {
      let defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        try {
          defaultUser = await prisma.user.create({
            data: {
              email: "admin@stocksense.io",
              name: "Administrator",
              passwordHash: "password123",
              role: "ADMIN"
            }
          });
        } catch {
          // ignore error if constraint exists
        }
      }
      createdById = defaultUser?.id;
    }

    // Auto-generate WH/IN/0001 format if receiptNumber is not provided
    const receiptNumber = req.body.receiptNumber?.trim() || (await generateReceiptNumber());

    // Check duplicate receipt number
    const existing = await prisma.receipt.findUnique({ where: { receiptNumber } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Receipt number '${receiptNumber}' already exists`,
      });
    }

    // Prepare line items
    const lineItems = Array.isArray(items)
      ? items.map((item) => ({
          productId: item.productId,
          locationId: item.locationId,
          quantity: Number(item.quantity || 0),
        }))
      : [];

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        supplierName: supplierName?.trim() || null,
        receivedAt: scheduledDate ? new Date(scheduledDate) : null,
        notes: notes?.trim() || null,
        status: "DRAFT",
        createdById,
        ...(lineItems.length > 0 && {
          items: {
            create: lineItems,
          },
        }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: true,
            location: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Receipt created in Draft stage",
      data: receipt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/receipts/:id (Update draft receipt)
export const updateReceipt = async (req, res) => {
  try {
    const { supplierName, scheduledDate, notes, items } = req.body;

    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    if (receipt.status === "DONE" || receipt.status === "CANCELED") {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a receipt with status '${receipt.status}'`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If items provided, replace items
      if (Array.isArray(items)) {
        await tx.receiptItem.deleteMany({
          where: { receiptId: req.params.id },
        });

        if (items.length > 0) {
          await tx.receiptItem.createMany({
            data: items.map((item) => ({
              receiptId: req.params.id,
              productId: item.productId,
              locationId: item.locationId,
              quantity: Number(item.quantity || 0),
            })),
          });
        }
      }

      return tx.receipt.update({
        where: { id: req.params.id },
        data: {
          ...(supplierName !== undefined && { supplierName: supplierName?.trim() || null }),
          ...(scheduledDate !== undefined && {
            receivedAt: scheduledDate ? new Date(scheduledDate) : null,
          }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: true, location: true },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Receipt updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/receipts/:id/ready ("To DO" action -> moves from DRAFT to READY)
export const markReceiptAsReady = async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    if (receipt.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: `Receipt is in '${receipt.status}' status, can only mark DRAFT as READY`,
      });
    }

    if (!receipt.items || receipt.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Receipt must have at least one product before moving to Ready",
      });
    }

    const updated = await prisma.receipt.update({
      where: { id: req.params.id },
      data: { status: "READY" },
      include: {
        items: { include: { product: true, location: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Receipt moved to Ready stage",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/receipts/:id/validate ("Validate" action -> moves to DONE and increases stock)
export const validateReceipt = async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    if (receipt.status === "DONE") {
      return res.status(400).json({
        success: false,
        message: "Receipt has already been validated and marked DONE",
      });
    }

    if (receipt.status === "CANCELED") {
      return res.status(400).json({
        success: false,
        message: "Cannot validate a canceled receipt",
      });
    }

    if (!receipt.items || receipt.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Receipt has no items to validate",
      });
    }

    // Atomic transaction: update stock per item, write to StockLedger, and mark receipt DONE
    const result = await prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        const qty = Number(item.quantity);

        // 1. Fetch current stock at location
        const existingStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId,
            },
          },
        });

        const currentQty = existingStock ? Number(existingStock.quantity) : 0;
        const newQty = currentQty + qty;

        // 2. Increase stock at destination location
        await tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId,
            },
          },
          update: {
            quantity: newQty,
          },
          create: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: qty,
          },
        });

        // 3. Log movement in StockLedger
        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: item.locationId,
            type: "RECEIPT",
            quantity: qty,
            quantityBefore: currentQty,
            quantityAfter: newQty,
            referenceType: "RECEIPT",
            referenceId: receipt.receiptNumber,
          },
        });
      }

      // 4. Mark receipt DONE
      return tx.receipt.update({
        where: { id: req.params.id },
        data: {
          status: "DONE",
          receivedAt: new Date(),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: true, location: true },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Receipt validated successfully. Stock updated and logged in ledger.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/receipts/:id/cancel ("Cancel" action)
export const cancelReceipt = async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    if (receipt.status === "DONE") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a receipt that has already been validated (DONE)",
      });
    }

    const updated = await prisma.receipt.update({
      where: { id: req.params.id },
      data: { status: "CANCELED" },
    });

    return res.status(200).json({
      success: true,
      message: "Receipt canceled",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
