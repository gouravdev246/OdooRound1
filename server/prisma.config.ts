import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DB_URL") || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/stocksense",
  },
});
