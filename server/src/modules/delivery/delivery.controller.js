import prisma from "../../config/prisma.js";

/**
 * Auto-generate delivery number sequence in the format WH/OUT/0001
 */
const generateDeliveryNumber = async () => {
  const count = await prisma.delivery.count();
  const nextNum = String(count + 1).padStart(4, "0");
  return `WH/OUT/${nextNum}`;
};


const checkItemsStock = async (items) => {
  const enriched = await Promise.all(
    items.map(async (item) => {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.locationId,
          },
        },
      });

      const availableQty = Number(stock?.quantity || 0);
      const requiredQty = Number(item.quantity);
      const isAvailable = availableQty >= requiredQty;
      const shortage = isAvailable ? 0 : requiredQty - availableQty;

      return {
        ...item,
        availableQuantity: availableQty,
        requiredQuantity: requiredQty,
        isAvailable,
        hasShortage: !isAvailable,
        shortage,
      };
    })
  );

  const hasAnyShortage = enriched.some((i) => !i.isAvailable);
  return { items: enriched, hasAnyShortage };
};

// GET /api/delivery
export const getalldevilery = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { deliveryNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, deliveries] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, unit: true, minStock: true },
              },
              location: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  warehouse: {
                    select: { id: true, name: true, code: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Deliveries fetched successfully",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: deliveries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch deliveries",
    });
  }
};

// GET /api/delivery/:id
export const getDeliveryById = async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
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

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    // Check live stock status for every product line
    const { items: enrichedItems, hasAnyShortage } = await checkItemsStock(delivery.items);

    return res.status(200).json({
      success: true,
      data: {
        ...delivery,
        items: enrichedItems,
        hasShortage: hasAnyShortage,
        stockAlert: hasAnyShortage
          ? "Some products are out of stock or have insufficient quantity"
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/delivery (Create new delivery - Initial State: Draft or Waiting/Ready)
export const createDelivery = async (req, res) => {
  try {
    const { customerName, deliveredAt, scheduledDate, notes, items } = req.body;
    const targetDeliveryDate = deliveredAt || scheduledDate;

    // Use logged in user if available
    let createdById = req.user?.id || req.body.createdById;
    if (!createdById) {
      const defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        return res.status(400).json({
          success: false,
          message: "A user is required to create a delivery.",
        });
      }
      createdById = defaultUser.id;
    }

    const deliveryNumber = req.body.deliveryNumber?.trim() || (await generateDeliveryNumber());

    const existing = await prisma.delivery.findUnique({ where: { deliveryNumber } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Delivery number '${deliveryNumber}' already exists`,
      });
    }

    const lineItems = Array.isArray(items)
      ? items.map((item) => ({
          productId: item.productId,
          locationId: item.locationId,
          quantity: Number(item.quantity || 0),
        }))
      : [];

    // Check stock availability upfront to set initial status
    let initialStatus = "DRAFT";
    let stockCheckResult = null;
    if (lineItems.length > 0) {
      stockCheckResult = await checkItemsStock(lineItems);
    }

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        customerName: customerName?.trim() || null,
        deliveredAt: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
        notes: notes?.trim() || null,
        status: initialStatus,
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

    const enrichedItems = stockCheckResult ? stockCheckResult.items : delivery.items;

    return res.status(201).json({
      success: true,
      message: "Delivery order created successfully in Draft stage",
      data: {
        ...delivery,
        items: enrichedItems,
        hasShortage: stockCheckResult?.hasAnyShortage || false,
        stockAlert: stockCheckResult?.hasAnyShortage
          ? "Alert: Some products are out of stock. Mark red on UI."
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/delivery/:id (Update delivery order in Draft stage)
export const updateDelivery = async (req, res) => {
  try {
    const { customerName, deliveredAt, notes, items } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    if (delivery.status === "DONE" || delivery.status === "CANCELED") {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a delivery order with status '${delivery.status}'`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(items)) {
        await tx.deliveryItem.deleteMany({
          where: { deliveryId: req.params.id },
        });

        if (items.length > 0) {
          await tx.deliveryItem.createMany({
            data: items.map((item) => ({
              deliveryId: req.params.id,
              productId: item.productId,
              locationId: item.locationId,
              quantity: Number(item.quantity || 0),
            })),
          });
        }
      }

      return tx.delivery.update({
        where: { id: req.params.id },
        data: {
          ...(customerName !== undefined && { customerName: customerName?.trim() || null }),
          ...(deliveredAt !== undefined && {
            deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
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

    const stockCheck = await checkItemsStock(updated.items);

    return res.status(200).json({
      success: true,
      message: "Delivery updated successfully",
      data: {
        ...updated,
        items: stockCheck.items,
        hasShortage: stockCheck.hasAnyShortage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/delivery/:id/check-availability
// Checks stock availability and moves status between WAITING (out of stock) and READY (ready to deliver)
export const checkAvailability = async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    if (delivery.status === "DONE" || delivery.status === "CANCELED") {
      return res.status(400).json({
        success: false,
        message: `Cannot check availability for delivery with status '${delivery.status}'`,
      });
    }

    if (!delivery.items || delivery.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Delivery has no items to check",
      });
    }

    const { items: enrichedItems, hasAnyShortage } = await checkItemsStock(delivery.items);

    // If shortage exists -> status becomes WAITING (Waiting for product to be in stock)
    // If all items available -> status becomes READY (Ready to deliver)
    const nextStatus = hasAnyShortage ? "WAITING" : "READY";

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { status: nextStatus },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: true, location: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: hasAnyShortage
        ? "Delivery moved to Waiting (some products are out of stock)"
        : "Delivery moved to Ready (all products are in stock)",
      data: {
        ...updated,
        items: enrichedItems,
        hasShortage: hasAnyShortage,
        stockAlert: hasAnyShortage
          ? "Alert: Products not in stock are highlighted"
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/delivery/:id/validate
// "Validate" button action: decreases stock and moves status to DONE
export const validateDelivery = async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    if (delivery.status === "DONE") {
      return res.status(400).json({
        success: false,
        message: "Delivery order has already been validated (DONE)",
      });
    }

    if (delivery.status === "CANCELED") {
      return res.status(400).json({
        success: false,
        message: "Cannot validate a canceled delivery",
      });
    }

    if (!delivery.items || delivery.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Delivery has no items to validate",
      });
    }

    // Verify stock availability before decreasing
    const { items: enrichedItems, hasAnyShortage } = await checkItemsStock(delivery.items);

    if (hasAnyShortage) {
      const shortages = enrichedItems
        .filter((i) => !i.isAvailable)
        .map((i) => `Product ${i.productId}: available ${i.availableQuantity}, required ${i.requiredQuantity}`);

      // Auto update status to WAITING
      await prisma.delivery.update({
        where: { id: req.params.id },
        data: { status: "WAITING" },
      });

      return res.status(400).json({
        success: false,
        message: "Cannot validate delivery: insufficient stock for some items.",
        shortages,
        items: enrichedItems,
      });
    }

    // Atomic transaction: decrease stock, log to StockLedger, mark delivery DONE
    const result = await prisma.$transaction(async (tx) => {
      for (const item of delivery.items) {
        const qty = Number(item.quantity);

        const currentStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId,
            },
          },
        });

        const currentQty = currentStock ? Number(currentStock.quantity) : 0;
        const newQty = currentQty - qty;

        // Decrease stock
        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId,
            },
          },
          data: {
            quantity: newQty,
          },
        });

        // Record in StockLedger
        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            locationId: item.locationId,
            type: "DELIVERY",
            quantity: qty,
            quantityBefore: currentQty,
            quantityAfter: newQty,
            referenceType: "DELIVERY",
            referenceId: delivery.deliveryNumber,
          },
        });
      }

      // Mark delivery as DONE
      return tx.delivery.update({
        where: { id: req.params.id },
        data: {
          status: "DONE",
          deliveredAt: new Date(),
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
      message: "Delivery validated successfully. Stock decreased and logged in ledger.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/delivery/:id/cancel ("Cancel" button)
export const cancelDelivery = async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found" });
    }

    if (delivery.status === "DONE") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a delivery order that has already been validated (DONE)",
      });
    }

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { status: "CANCELED" },
    });

    return res.status(200).json({
      success: true,
      message: "Delivery order canceled",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


