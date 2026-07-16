@AGENTS.md

# faahro-app — Sistema de Gestión Almacenero

App web para la gestión de un almacén/comercio de barrio: productos, stock,
ventas, clientes y caja. Mobile-first.

## Stack

- **Next.js 16** (App Router, Turbopack) — ⚠️ ver `AGENTS.md`, tiene breaking changes.
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **ESLint** (flat config, `eslint.config.mjs`)

## Estructura

- `src/app/` — rutas (App Router). Server Components por defecto.
- `public/` — assets estáticos.
- Alias de imports: `@/*` → `src/*`.

## Comandos

- `npm run dev` — servidor de desarrollo (Turbopack).
- `npm run build` — build de producción.
- `npm run start` — servir el build.
- `npm run lint` — ESLint.

## Convenciones

- Componentes en Server Components salvo que necesiten interactividad (`"use client"`).
- Mobile-first: diseñar primero para pantalla chica, luego escalar con breakpoints de Tailwind.
- Textos de UI en **español** (es-AR).
- Antes de escribir código de Next.js, leer la guía relevante en `node_modules/next/dist/docs/`.

## Notas de plataforma

- Zona horaria del negocio: Argentina (UTC-3). Calcular límites de día en cliente
  para evitar corrimientos de fecha.
