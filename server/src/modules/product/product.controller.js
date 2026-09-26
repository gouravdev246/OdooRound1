import prisma from "../../config/prisma.js";

// GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const { search, categoryId } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: true,
        stocks: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, sku, categoryId, unit, price, minStockAlert } = req.body;
    if (!name || !sku) {
      return res.status(400).json({ success: false, message: "Name and SKU are required" });
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Product with SKU '${sku}' already exists` });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId: categoryId || undefined,
        unit: unit || "Units",
        minStock: minStockAlert ? parseFloat(minStockAlert) : 0,
      },
    });

    return res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
