import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || process.env.DB_URL || "postgresql://neondb_owner:npg_p3vSE7auWlbI@ep-icy-sound-b4kbz48r.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});
