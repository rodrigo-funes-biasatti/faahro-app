import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  // organization: multi-tenancy (Módulo 0 del modelo de datos).
  // Aporta organizaciones, miembros con rol e invitaciones.
  // nextCookies debe ir último en la lista de plugins.
  plugins: [organization(), nextCookies()],
});
