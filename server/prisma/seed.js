import prisma from "../src/config/prisma.js";

async function main() {
  console.log("🌱 Starting StockSense database seeding...");

  // 1. Create default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@stocksense.io" },
    update: {},
    create: {
      email: "admin@stocksense.io",
      name: "StockSense Admin",
      passwordHash: "password123",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user ready:", admin.email);

  // 2. Create warehouses
  const mainWh = await prisma.warehouse.upsert({
    where: { code: "WH/MAIN" },
    update: {},
    create: {
      name: "Main Distribution Center",
      code: "WH/MAIN",
      address: "Plot 42, Central Industrial Zone",
      isActive: true,
    },
  });

  const northDepot = await prisma.warehouse.upsert({
    where: { code: "WH/NORTH" },
    update: {},
    create: {
      name: "North Depot",
      code: "WH/NORTH",
      address: "Industrial Area B, Building 4",
      isActive: true,
    },
  });
  console.log("✅ Warehouses created");

  // 3. Create locations
  const rackA1 = await prisma.location.upsert({
    where: {
      warehouseId_code: {
        warehouseId: mainWh.id,
        code: "LOC-A01",
      },
    },
    update: {},
    create: {
      warehouseId: mainWh.id,
      name: "Stock Rack A-01",
      code: "LOC-A01",
      type: "RACK",
      isActive: true,
    },
  });

  const rackB1 = await prisma.location.upsert({
    where: {
      warehouseId_code: {
        warehouseId: mainWh.id,
        code: "LOC-B01",
      },
    },
    update: {},
    create: {
      warehouseId: mainWh.id,
      name: "Stock Rack B-01",
      code: "LOC-B01",
      type: "RACK",
      isActive: true,
    },
  });

  const receivingDock = await prisma.location.upsert({
    where: {
      warehouseId_code: {
        warehouseId: mainWh.id,
        code: "LOC-IN",
      },
    },
    update: {},
    create: {
      warehouseId: mainWh.id,
      name: "Receiving Bay 1",
      code: "LOC-IN",
      type: "RECEIVING",
      isActive: true,
    },
  });

  console.log("✅ Storage locations created");

  // 4. Create categories
  const furnitureCat = await prisma.category.upsert({
    where: { name: "Office Furniture" },
    update: {},
    create: { name: "Office Furniture", description: "Desks, chairs, and ergonomic furniture" },
  });

  const techCat = await prisma.category.upsert({
    where: { name: "Tech & Accessories" },
    update: {},
    create: { name: "Tech & Accessories", description: "Cables, mounts, monitors, and peripherals" },
  });

  // 5. Create products & initial stock
  const p1 = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      name: "Ergonomic Desk Chair",
      sku: "SKU-001",
      categoryId: furnitureCat.id,
      unit: "Units",
      minStock: 10,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: {
      name: "Dual Monitor Mount",
      sku: "SKU-002",
      categoryId: techCat.id,
      unit: "Units",
      minStock: 15,
    },
  });

  const p3 = await prisma.product.upsert({
    where: { sku: "SKU-003" },
    update: {},
    create: {
      name: "Braided Type-C Cable",
      sku: "SKU-003",
      categoryId: techCat.id,
      unit: "Pcs",
      minStock: 50,
    },
  });

  // 6. Seed stock
  await prisma.stock.upsert({
    where: {
      productId_locationId: {
        productId: p1.id,
        locationId: rackA1.id,
      },
    },
    update: { quantity: 45 },
    create: {
      productId: p1.id,
      locationId: rackA1.id,
      quantity: 45,
    },
  });

  await prisma.stock.upsert({
    where: {
      productId_locationId: {
        productId: p2.id,
        locationId: rackB1.id,
      },
    },
    update: { quantity: 110 },
    create: {
      productId: p2.id,
      locationId: rackB1.id,
      quantity: 110,
    },
  });

  console.log("✅ Products and stock levels seeded");
  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
