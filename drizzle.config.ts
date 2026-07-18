import { defineConfig } from "drizzle-kit";

// drizzle-kit corre fuera de Next.js y no carga .env.local solo.
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Para migraciones usar el connection string DIRECTO de Neon (sin -pooler):
    // PgBouncer en modo transaction no se lleva bien con DDL/advisory locks.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
