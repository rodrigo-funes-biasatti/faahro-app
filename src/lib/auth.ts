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
  // Login con Google (decisión de equipo, 2026-07-21). Credenciales de
  // Google Cloud Console — ver docs/setup-google-oauth.md para conseguirlas.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // organization: multi-tenancy (Módulo 0 del modelo de datos).
  // Aporta organizaciones, miembros con rol e invitaciones.
  // nextCookies debe ir último en la lista de plugins.
  plugins: [organization(), nextCookies()],
});
