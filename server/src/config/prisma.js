import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Enable WebSocket support for Neon over port 443 (avoids port 5432 network timeouts)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

