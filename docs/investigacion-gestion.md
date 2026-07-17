# faahro-app — Investigación y estado del proyecto

> Sistema de Gestión Almacenero (stock + ventas + facturación ARCA). Colaboración Rodrigo + Diogenes.
> Documento vivo: acá dejamos lo que hicimos y la investigación que guía las decisiones.

_Última actualización: 2026-07-17_

---

## 1. Estado actual del proyecto (lo que ya montamos)

### Base Next.js
- **Next.js 16.2.10** · React 19.2.4 · Tailwind v4 · TypeScript strict.
- App Router, carpeta `src/`, ESLint (flat config), alias `@/*`, Turbopack.
- ⚠️ Next.js 16 tiene breaking changes (ver `AGENTS.md`): `middleware` → `proxy`, Base UI en vez de Radix, config de Turbopack.

### Scaffolding de Claude Code
- `CLAUDE.md` — contexto del proyecto (stack, estructura, convenciones, notas de plataforma).
- `.claude/agents/nextjs-engineer.md` — subagente fullstack para features.
- `.claude/agents/ui-reviewer.md` — subagente de review UX/UI.
- `.claude/settings.json` — allowlist de permisos + hooks de graphify (portables y fail-safe).

### Graphify (knowledge graph para ahorrar tokens)
- Instalado a nivel proyecto (`.claude/skills/graphify`).
- Grafo solo-código construido con AST (tree-sitter), **0 tokens**: 75 nodos, 76 aristas, 11 comunidades.
- Outputs commiteados en `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`).
- Guía de instalación en [`setup-graphify.md`](../setup-graphify.md) (macOS + Windows).
- Refrescar tras cambios: `graphify update .` (gratis, sin LLM).

### Pendiente (próximos pasos sugeridos)
- Definir backend/DB (probable **Supabase**, en línea con otros proyectos).
- Modelo de datos: catálogo/stock, ventas/caja, comprobantes.
- Spike de facturación en **homologación** con SDK de ARCA.

---

## 2. Facturación en ARCA (ex-AFIP) — lo crítico y específico de Argentina

La facturación **legal** se hace contra **web services SOAP** de ARCA. Es la parte que ningún
template internacional resuelve, así que conviene apoyarse en librerías probadas.

### Circuito
1. **WSAA** (autenticación): con un **certificado digital** (`.crt` + `.key`) se obtiene un
   *ticket de acceso* temporal.
2. **WSFEv1** (facturación mercado interno): se pide autorización de cada comprobante y ARCA
   devuelve el **CAE** (Código de Autorización Electrónica). **Sin CAE la factura no es válida.**

### Conceptos que hay que modelar sí o sí
- **Punto de venta** + **tipo de comprobante** (Factura A / B / C / E / M, notas de crédito/débito).
- **CAE** + su vencimiento, y el **QR oficial** que va impreso.
- **Condición frente al IVA** del emisor y **del receptor** (el del receptor pasó a ser
  obligatorio en los comprobantes por RG reciente — no omitir).
- **Numeración controlada por ARCA**: antes de emitir se consulta el *último comprobante
  autorizado* por punto de venta (`FECompUltimoAutorizado`). No se numera del lado nuestro.
- **Homologación vs. Producción**: endpoints y certificados distintos.
  - Certificado de testing: **WSASS**.
  - Certificado de producción: **Administrador de Certificados Digitales**.
- **Monotributo** → normalmente **Factura C**.

### SDKs / librerías
Para el stack Next.js/TS conviene un SDK TypeScript:

| Librería | Lenguaje | Notas |
|---|---|---|
| [@ramiidv/arca-sdk](https://github.com/ramiidv/arca-facturacion) | TypeScript | Tipado. WSFEv1/WSFEX/CAEA/QR. Encaja en route handler / server action. **Candidato principal.** |
| [afipts.com — Arca SDK](https://www.afipts.com/introduction) | TypeScript | Servicios tipados, WSAA resuelto. |
| [vousys/tusfacturas](https://github.com/vousys/tusfacturas) | API SDK | Opción con servicio hosteado (no manejás certificados vos). |
| [reingart/pyafipws](https://github.com/reingart/pyafipws) | Python | Referencia histórica más completa; su código documenta casos borde. |

> ⚠️ **Regla de oro**: WSAA, certificados y llamadas a ARCA van **siempre server-side**.
> El `.key` **nunca** toca el cliente ni se commitea — va en env vars / secret manager.

### Documentación oficial
- [WSAA](https://www.afip.gob.ar/ws/documentacion/wsaa.asp)
- [Certificados digitales (programadores)](https://www.afip.gob.ar/ws/programadores/certificados-digitales.asp)
- [Manual del desarrollador ARCA (PDF)](https://www.afip.gob.ar/fe/documentos/manual-desarrollador-ARCA-COMPG-v4-0.pdf)

---

## 3. Buenas prácticas de diseño (stock + ventas + facturación)

### Datos y consistencia (PostgreSQL / Supabase)
- **Ledger de movimientos de stock append-only**: no guardar solo un campo `cantidad` que se
  muta. Registrar *cada* movimiento (compra, venta, ajuste, devolución) y derivar el stock
  actual. Auditable y evita descuadres.
- **Transacciones ACID + optimistic locking** (columna `version`) para **no sobrevender** el
  último ítem con ventas concurrentes.
- **Productos con SKU + variantes** e **historial de precios** (no pisar el precio anterior).
- **Idempotencia en la emisión**: solicitud de CAE idempotente (`idempotency_key` por venta)
  para no emitir **CAE duplicado** ante reintentos o cortes de red.
- **Contingencia (CAEA)**: definir desde el día 1 qué pasa si ARCA está caído — el comprobante
  se guarda y se autoriza después.

### Arquitectura
- Módulos desacoplados: `catálogo/stock` ↔ `ventas/caja` ↔ `facturación`.
  La factura es una *consecuencia* de una venta, no la misma tabla.
- **Fechas en timezone Argentina (UTC-3)** — crítico en facturación porque ARCA valida la fecha
  del comprobante. Calcular límites de día en cliente.
- Seguridad: **RBAC** (roles), cifrado en tránsito/reposo, log de accesos/cambios
  (Supabase RLS + policies encaja bien).

### Referencias de arquitectura
- [Design an Inventory Management System](https://www.systemdesignhandbook.com/guides/design-inventory-management-system/)
- [POS Software Architecture](https://www.retailgear.com/pos-software-architecture)
- [ER Diagrams for POS Systems](https://www.geeksforgeeks.org/dbms/how-to-design-er-diagrams-for-point-of-sale-pos-systems/)

---

## 4. Proyectos open-source argentinos de referencia (estudiar, no copiar)

Ya resolvieron el problema completo *con facturación AFIP/ARCA*; sirven como mapa de decisiones:

- **[goxtech88/open-erp](https://github.com/goxtech88/open-erp)** — ERP modular (Laravel + PostgreSQL):
  stock, clientes/proveedores, **facturación WSFEv1**, multi-empresa, dashboard. El más parecido
  a lo nuestro; ver cómo modela stock ↔ comprobantes.
- **[mliezun/gestionx](https://github.com/mliezun/gestionx)** — POS + facturación electrónica AFIP.
  Bueno para el flujo de punto de venta.
- **[fedepazw/OpenReceArg](https://github.com/fedepazw/OpenReceArg)** (.NET) — circuito legal del
  comprobante (RECE).
- **[FacturaLibre](https://www.sistemasagiles.com.ar/trac/wiki/FacturaLibre)** — alternativa libre
  clásica sobre PyAfipWs.
- Topics de GitHub como fuente continua:
  [`afip`](https://github.com/topics/afip) ·
  [`facturacion-electronica`](https://github.com/topics/facturacion-electronica) ·
  [`afip-facturas`](https://github.com/topics/afip-facturas)

---

## 5. Plan de arranque recomendado

1. **Core sin ARCA primero**: catálogo + stock (con ledger) + ventas/caja. Es ~70% del valor y
   no depende de burocracia fiscal.
2. **Facturación después**, como módulo aislado detrás de una interfaz (`emitirComprobante(venta)`),
   empezando en **homologación** con `@ramiidv/arca-sdk`. Así se desarrolla todo sin certificado
   de producción y se "enchufa" ARCA cuando el negocio lo necesite.
