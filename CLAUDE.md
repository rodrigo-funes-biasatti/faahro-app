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

## graphify

> **Setup (una vez por máquina):** este repo usa [graphify](https://github.com/Graphify-Labs/graphify)
> para consultar el código como knowledge graph y ahorrar tokens. Instalarlo con:
> `uv tool install graphifyy && graphify install`. Si no está instalado, los hooks
> de `.claude/settings.json` hacen no-op (no rompen nada). El grafo (`graphify-out/graph.json`,
> `GRAPH_REPORT.md`) ya viene commiteado; refrescarlo tras cambios con `graphify update .` (gratis, sin LLM).

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
