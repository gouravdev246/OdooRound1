import prisma from "../../config/prisma.js";

/**
 * GET /api/move-history
 * Query parameters:
 *  - search: searches across reference number, contact name, product name/sku
 *  - status: filters by status (DRAFT, WAITING, READY, DONE, CANCELED)
 *  - type: filters by operation type (IN, OUT, INTERNAL)
 *  - view: 'list' (default) or 'kanban' (groups by status for Kanban board)
 *  - page: page number (default 1)
 *  - limit: items per page (default 20)
 */
export const getMoveHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
    const { search, status, type, view } = req.query;

    const searchLower = search ? search.trim().toLowerCase() : null;
    const statusUpper = status ? status.trim().toUpperCase() : null;
    const typeUpper = type ? type.trim().toUpperCase() : null;

    // 1. Fetch Receipts with line items (IN movements)
    const shouldFetchReceipts = !typeUpper || typeUpper === "IN" || typeUpper === "RECEIPT";
    const receiptPromise = shouldFetchReceipts
      ? prisma.receipt.findMany({
          where: statusUpper ? { status: statusUpper } : {},
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            items: {
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
            },
          },
        })
      : Promise.resolve([]);

    // 2. Fetch Deliveries with line items (OUT movements)
    const shouldFetchDeliveries = !typeUpper || typeUpper === "OUT" || typeUpper === "DELIVERY";
    const deliveryPromise = shouldFetchDeliveries
      ? prisma.delivery.findMany({
          where: statusUpper ? { status: statusUpper } : {},
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            items: {
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
            },
          },
        })
      : Promise.resolve([]);

    // 3. Fetch Transfers with line items (INTERNAL movements)
    const shouldFetchTransfers = !typeUpper || typeUpper === "INTERNAL" || typeUpper === "TRANSFER";
    const transferPromise = shouldFetchTransfers
      ? prisma.transfer.findMany({
          where: statusUpper ? { status: statusUpper } : {},
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            sourceLocation: {
              select: {
                id: true,
                name: true,
                code: true,
                warehouse: { select: { id: true, name: true, code: true } },
              },
            },
            destinationLocation: {
              select: {
                id: true,
                name: true,
                code: true,
                warehouse: { select: { id: true, name: true, code: true } },
              },
            },
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true, unit: true } },
              },
            },
          },
        })
      : Promise.resolve([]);

    const [receipts, deliveries, transfers] = await Promise.all([
      receiptPromise,
      deliveryPromise,
      transferPromise,
    ]);

    // 4. Flatten multi-product line items into individual rows as per wireframe:
    // "if single reference has multiple product display it in multiple rows."
    const allMoves = [];

    // Transform Receipts (IN -> green)
    for (const r of receipts) {
      const contact = r.supplierName || "Vendor";
      for (const item of r.items) {
        const destLoc = item.location
          ? `${item.location.warehouse?.code || "WH"}/${item.location.code || item.location.name}`
          : "WH/Stock";

        allMoves.push({
          id: `rec-${r.id}-${item.id}`,
          reference: r.receiptNumber,
          referenceId: r.id,
          referenceType: "RECEIPT",
          date: r.receivedAt || r.createdAt,
          contact,
          from: contact,
          to: destLoc,
          productId: item.productId,
          product: item.product?.name || "Product",
          productSku: item.product?.sku || "",
          quantity: Number(item.quantity || 0),
          formattedQuantity: `+${Number(item.quantity || 0)}`,
          unit: item.product?.unit || "pcs",
          status: r.status,
          type: "IN",
          color: "green", // In event display in green
          notes: r.notes,
        });
      }
    }

    // Transform Deliveries (OUT -> red)
    for (const d of deliveries) {
      const contact = d.customerName || "Customer";
      for (const item of d.items) {
        const srcLoc = item.location
          ? `${item.location.warehouse?.code || "WH"}/${item.location.code || item.location.name}`
          : "WH/Stock";

        allMoves.push({
          id: `del-${d.id}-${item.id}`,
          reference: d.deliveryNumber,
          referenceId: d.id,
          referenceType: "DELIVERY",
          date: d.deliveredAt || d.createdAt,
          contact,
          from: srcLoc,
          to: contact,
          productId: item.productId,
          product: item.product?.name || "Product",
          productSku: item.product?.sku || "",
          quantity: Number(item.quantity || 0),
          formattedQuantity: `-${Number(item.quantity || 0)}`,
          unit: item.product?.unit || "pcs",
          status: d.status,
          type: "OUT",
          color: "red", // Out moves display in red
          notes: d.notes,
        });
      }
    }

    // Transform Transfers (INTERNAL -> neutral)
    for (const t of transfers) {
      const contact = t.createdBy?.name || "Staff";
      const srcLoc = t.sourceLocation
        ? `${t.sourceLocation.warehouse?.code || "WH"}/${t.sourceLocation.code || t.sourceLocation.name}`
        : "Source";
      const destLoc = t.destinationLocation
        ? `${t.destinationLocation.warehouse?.code || "WH"}/${t.destinationLocation.code || t.destinationLocation.name}`
        : "Destination";

      for (const item of t.items) {
        allMoves.push({
          id: `tra-${t.id}-${item.id}`,
          reference: t.transferNumber,
          referenceId: t.id,
          referenceType: "TRANSFER",
          date: t.completedAt || t.createdAt,
          contact,
          from: srcLoc,
          to: destLoc,
          productId: item.productId,
          product: item.product?.name || "Product",
          productSku: item.product?.sku || "",
          quantity: Number(item.quantity || 0),
          formattedQuantity: `${Number(item.quantity || 0)}`,
          unit: item.product?.unit || "pcs",
          status: t.status,
          type: "INTERNAL",
          color: "neutral",
          notes: t.notes,
        });
      }
    }

    // 5. Search filter: "Allow user to search Delivery based on reference & contacts"
    let filtered = allMoves;
    if (searchLower) {
      filtered = filtered.filter(
        (m) =>
          m.reference.toLowerCase().includes(searchLower) ||
          m.contact.toLowerCase().includes(searchLower) ||
          m.product.toLowerCase().includes(searchLower) ||
          m.productSku.toLowerCase().includes(searchLower) ||
          m.from.toLowerCase().includes(searchLower) ||
          m.to.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 6. View: Kanban grouping support: "Allow user to switch to the kanban view based on status"
    if (view === "kanban") {
      const kanban = {
        DRAFT: filtered.filter((m) => m.status === "DRAFT"),
        WAITING: filtered.filter((m) => m.status === "WAITING"),
        READY: filtered.filter((m) => m.status === "READY"),
        DONE: filtered.filter((m) => m.status === "DONE"),
        CANCELED: filtered.filter((m) => m.status === "CANCELED"),
      };

      return res.status(200).json({
        success: true,
        view: "kanban",
        total: filtered.length,
        data: kanban,
      });
    }

    // 7. View: Paginated List View (Default)
    const total = filtered.length;
    const paginatedData = filtered.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      view: "list",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: paginatedData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch move history",
    });
  }
};

/**
 * GET /api/move-history/ledger
 * Direct immutable audit log from StockLedger table
 */
export const getStockLedger = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;

    const { type, productId, locationId } = req.query;

    const where = {};
    if (type) where.type = type;
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;

    const [total, entries] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        skip,
        take: limit,
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
      }),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: entries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stock ledger",
    });
  }
};
