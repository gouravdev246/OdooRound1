import prisma from "../../config/prisma.js";

// GET /api/ledger
export const getStockLedger = async (req, res) => {
  try {
    const { productId, locationId, movementType } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (movementType) where.movementType = movementType;

    const ledger = await prisma.stockLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
