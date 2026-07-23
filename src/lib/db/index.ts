import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Pool contra el connection string *pooled* de Neon (PgBouncer).
// Se usa `pg` (y no el driver HTTP de Neon) porque necesitamos transacciones
// reales: confirmar una venta escribe sales + stock_movements + cash_movements
// de forma atómica.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
