# faahro-app — Backlog inicial (para Trello)

> Lista de tareas estimada con **escala Fibonacci** (1 · 2 · 3 · 5 · 8 · 13) estilo planning poker.
> Cada tarea referencia el caso de uso (CU) que la origina. Pensado para un equipo de 2–4
> personas trabajando estilo scrum-liviano (sprints de 1–2 semanas, sin ceremonia de más).
>
> Basado en las decisiones ya tomadas en [`modelo-datos.md`](./modelo-datos.md) y
> [`investigacion-gestion.md`](./investigacion-gestion.md): Supabase + RLS, stock como ledger
> append-only, multi-tenant por `org_id`, ARCA al final como módulo aislado, mobile-first, es-AR.

_Última actualización: 2026-07-17_

---

## Cómo leer las estimaciones

| Puntos | Significa aprox. |
|---|---|
| 1 | Trivial, menos de una hora, sin decisiones. |
| 2 | Chico, camino conocido. |
| 3 | Un día de trabajo o menos, alguna decisión menor. |
| 5 | Tarea grande, varios archivos, hay que pensar el diseño. |
| 8 | Grande + riesgo/incógnitas. Candidata a dividirse durante el sprint. |
| 13 | Demasiado grande para un sprint prolijo → **dividir antes de arrancar**. Las dejo así donde el corte natural todavía no se conoce. |

---

## Casos de uso (CU) — el "por qué" de cada tarea

### Núcleo (MVP)
- **CU-01** — Como almacenero quiero cargar mis productos (nombre, precio, unidad UN/KG, código de barras, categoría) para tener el catálogo en el sistema.
- **CU-02** — Como cajero quiero encontrar un producto en segundos —escaneando el código de barras o tipeando 2–3 letras— porque hay gente esperando en el mostrador.
- **CU-03** — Como cajero quiero armar una venta agregando ítems (por unidad y por peso) y ver el total en grande para cobrar rápido.
- **CU-04** — Como cajero quiero registrar cómo me pagaron (efectivo, transferencia, QR, débito, o mixto) para que cierre la caja después.
- **CU-05** — Como dueño quiero ver qué vendí hoy/esta semana (total y detalle) para saber cómo viene el negocio.
- **CU-06** — Como dueño quiero abrir la caja con un monto inicial y cerrarla contando el efectivo, para detectar diferencias.
- **CU-07** — Como dueño quiero que el stock se descuente solo al vender y se sume al cargar mercadería, para no llevarlo en un cuaderno.
- **CU-08** — Como dueño quiero ajustar stock a mano (merma, rotura, conteo físico) dejando registro de por qué.
- **CU-09** — Como cajero quiero anular una venta hecha por error y que el stock/caja vuelvan atrás.
- **CU-10** — Como dueño quiero usar todo desde el celular en el mostrador (la compu puede no existir).
- **CU-11** — Como dueño quiero entrar con mi usuario y que un empleado tenga el suyo con menos permisos (no ver reportes, no anular ventas).

### Fase 2
- **CU-12** — Como dueño quiero fiar a clientes de confianza y ver cuánto me debe cada uno (cuenta corriente).
- **CU-13** — Como dueño quiero registrar el pago de un fiado (total o parcial) y que baje la deuda.
- **CU-14** — Como dueño quiero cargar la compra al proveedor (factura/remito) y que ingrese el stock de una.
- **CU-15** — Como dueño quiero actualizar precios de forma masiva (por % o por categoría/proveedor) porque con la inflación remarco seguido. ⚠️ *No estaba contemplado en el modelo de datos.*
- **CU-16** — Como dueño quiero ver qué productos están por agotarse para saber qué comprar.
- **CU-17** — Como dueño quiero mandar el comprobante/resumen de deuda por WhatsApp al cliente.

### Fase 3 (ARCA)
- **CU-18** — Como dueño quiero emitir una factura válida (CAE + QR de ARCA) a partir de una venta, cuando el cliente la pide.
- **CU-19** — Como dueño quiero que si ARCA está caído la venta no se frene, y la factura se autorice después.

---

## ÉPICA 0 — Fundaciones (Sprint 0)

*Sin esto no se puede construir nada arriba. Casi todo es infraestructura, no sale de un CU puntual.*

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Crear proyecto Supabase + conectar desde Next.js (client server-side, env vars, `.env.example`) | 3 | — | Confirma la decisión "probable Supabase" de la investigación. |
| Migración SQL Módulo 0: `organizations`, `memberships`, `locations` + RLS base | 5 | CU-11 | El modelo ya está bocetado en `modelo-datos.md`; acá se escribe y prueba de verdad. |
| Auth: login con Supabase Auth + creación de organización al registrarse | 5 | CU-11 | Definir antes: ¿email+password, magic link, o ambos? (ver "Para charlar"). |
| RBAC mínimo: helper de roles (owner/admin/cajero) + protección de rutas | 5 | CU-11 | Los roles ya están definidos en `memberships.role`. |
| Layout base mobile-first: navegación (bottom tabs en mobile), tema, tipografía | 5 | CU-10 | Definir antes la lib de componentes (ver "Para charlar": Base UI). |
| Seed de datos de prueba (org + productos + ventas falsas) | 2 | — | Acelera todo el desarrollo posterior. |
| CI mínimo: lint + typecheck + build en GitHub Actions | 2 | — | |
| Deploy continuo a Vercel (preview por PR + producción) | 2 | — | |
| Acordar flujo de trabajo del equipo: branches, PRs, review, definición de "hecho" | 1 | — | Tarea de charla, pero va al tablero para que quede escrita. |

**Subtotal: ~30 pts**

---

## ÉPICA 1 — Catálogo y stock

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Migración SQL Módulo 1: `categories`, `products`, `product_barcodes`, `stock_movements`, `stock_levels` + trigger que mantiene `stock_levels` desde el ledger | 8 | CU-01, CU-07 | El trigger del ledger es el corazón del sistema; merece tests SQL propios. |
| ABM de productos: listado con búsqueda + alta/edición (precio, unidad UN/KG/LT, IVA, categoría, código de barras) | 8 | CU-01 | Mobile-first: cargar un producto desde el celu tiene que ser cómodo. |
| ABM de categorías (árbol simple, sin drag&drop) | 3 | CU-01 | |
| Búsqueda rápida de productos: por nombre (parcial, sin tildes) y por código de barras exacto | 5 | CU-02 | Componente reutilizado por POS y por compras. Índices ya definidos en el modelo. |
| Escaneo de código de barras con la cámara del celular | 5 | CU-02 | Spike incluido: Barcode Detection API vs `html5-qrcode` (ver "Para charlar"). |
| Soporte lector de código de barras USB/BT (modo teclado: detectar ráfaga de teclas + Enter) | 2 | CU-02 | Mucho más simple que la cámara; los lectores actúan como teclado. |
| Ajuste manual de stock con motivo (merma/rotura/conteo) → `stock_movements` tipo `ajuste` | 3 | CU-08 | |
| Vista de stock actual por producto + historial de movimientos de un producto | 3 | CU-07, CU-08 | El historial sale gratis del ledger; es la prueba de que el diseño paga. |
| Carga inicial de mercadería ("apertura"): flujo para cargar stock existente al empezar a usar la app | 3 | CU-07 | Tipo `apertura` del ledger. Sin esto el día 1 del almacenero es un infierno. |

**Subtotal: ~40 pts**

---

## ÉPICA 2 — Ventas (POS)

*El corazón de la app. La pantalla donde el usuario vive el 90% del tiempo.*

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Migración SQL Módulo 5: `sales`, `sale_items`, `payments` | 3 | CU-03 | |
| Diseño UX de la pantalla de venta (wireframe + review antes de codear) | 3 | CU-03, CU-10 | Vale la pena como tarea aparte: es LA pantalla. Usar el agente ui-reviewer. |
| Pantalla POS: carrito, agregar por búsqueda/escaneo, editar cantidad, quitar ítem, total visible siempre | 13 | CU-02, CU-03 | **Dividir en el sprint** (ej.: carrito básico / integración scanner / pulido mobile). |
| Venta por peso: ingreso de cantidad decimal (0.350 kg) con teclado numérico cómodo | 3 | CU-03 | Unidad KG ya contemplada en el modelo (`qty numeric 14,3`). |
| Cobro: selección de medio de pago, pago mixto (N `payments` por venta), cálculo de vuelto | 5 | CU-04 | |
| Confirmar venta = transacción única: `sales` + `sale_items` + `stock_movements` + `cash_movements` (función SQL/RPC) | 8 | CU-03, CU-07 | La transacción atómica ya está decidida en el modelo. Punto de mayor riesgo de bugs. |
| Ítem de venta libre / "varios" (monto tipeado sin producto asociado) | 2 | CU-03 | Caso real de almacén: cosas sin catalogar. `track_stock=false`. |
| Anular venta: revierte stock y caja, deja la venta en estado `anulada` (nunca borrar) | 5 | CU-09 | Definir permisos: ¿cajero puede anular o solo owner? |
| Listado de ventas del día con detalle de cada una | 3 | CU-05 | |
| Comprobante no fiscal: vista imprimible/compartible del ticket (para WhatsApp o impresión) | 3 | CU-17 | La impresión térmica real es tema aparte (ver "Para charlar"). |

**Subtotal: ~48 pts**

---

## ÉPICA 3 — Caja

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Migración SQL Módulo 4: `cash_sessions`, `cash_movements` | 2 | CU-06 | |
| Apertura de caja (monto inicial) y bloqueo de venta en efectivo sin caja abierta | 3 | CU-06 | Definir: ¿se puede vender sin caja abierta? (ver "Para charlar"). |
| Ingresos/egresos manuales de caja con motivo (retiro, pago proveedor, etc.) | 3 | CU-06 | |
| Cierre de caja: esperado vs contado, diferencia, resumen por medio de pago | 5 | CU-06 | |
| Historial de cajas cerradas | 2 | CU-05, CU-06 | |

**Subtotal: ~15 pts**

---

## ÉPICA 4 — Reportes básicos

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Dashboard de inicio: total vendido hoy, cantidad de ventas, caja actual | 5 | CU-05 | Cuidado con límites de día en TZ Argentina (nota ya escrita en CLAUDE.md). |
| Reporte de ventas por rango de fechas + por medio de pago | 5 | CU-05 | |
| Productos más vendidos del período | 3 | CU-05 | |
| Alerta de stock bajo (umbral por producto, `min_stock`) | 3 | CU-16 | ⚠️ Requiere agregar campo `min_stock` a `products` — no está en el modelo. |

**Subtotal: ~16 pts**

---

## ÉPICA 5 — Clientes y cuenta corriente (fiado) — Fase 2

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Migración SQL Módulo 2: `customers`, `customer_account_movements` + trigger de `balance` | 3 | CU-12 | |
| ABM de clientes | 3 | CU-12 | |
| Vender "al fiado": venta con `payment_status=cta_cte` asociada a cliente → genera deuda | 5 | CU-12 | Se enchufa a la transacción de venta ya hecha en Épica 2. |
| Límite de crédito: aviso/bloqueo al superar `credit_limit` | 2 | CU-12 | |
| Registrar pago de deuda (total/parcial) → baja el saldo y entra a caja | 3 | CU-13 | |
| Vista de deudores + detalle de movimientos de un cliente | 3 | CU-12 | |
| Compartir resumen de deuda por WhatsApp (link `wa.me` con texto armado) | 2 | CU-17 | Barato y de altísimo valor percibido para el almacenero. |

**Subtotal: ~21 pts**

---

## ÉPICA 6 — Proveedores y compras — Fase 2

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Migración SQL Módulo 3: `suppliers`, `purchases`, `purchase_items` | 2 | CU-14 | |
| ABM de proveedores | 2 | CU-14 | |
| Carga de compra (ítems + costos) en estado borrador | 5 | CU-14 | |
| Confirmar compra "recibida" → genera `stock_movements` tipo `compra` y actualiza `cost_price` | 5 | CU-14, CU-07 | Transición ya definida en el modelo. |
| Actualización masiva de precios: por % sobre categoría/proveedor, con preview antes de aplicar | 5 | CU-15 | ⚠️ Abre la pregunta del historial de precios (ver "Para charlar"). |

**Subtotal: ~19 pts**

---

## ÉPICA 7 — Facturación ARCA — Fase 3

*Todo detrás de la interfaz `emitirComprobante(venta)` como ya está decidido. Empezar 100% en homologación.*

| Tarea | Pts | CU | Notas |
|---|---|---|---|
| Trámite: certificado de homologación (WSASS) + alta de punto de venta de prueba | 3 | CU-18 | Es burocracia, no código — pero bloquea todo lo demás. Arrancarla temprano. |
| Spike: emitir 1 factura C hardcodeada en homologación con `@ramiidv/arca-sdk` (server-side) | 8 | CU-18 | Valida el SDK candidato antes de construir encima. Salida esperada: CAE de prueba + notas. |
| Migración SQL Módulo 6: `invoices`, `invoice_tax_breakdown` | 3 | CU-18 | |
| Guardado seguro de certificados (Supabase Vault / secret manager, por org) | 5 | CU-18 | Regla de oro de la investigación: la `.key` jamás toca el cliente ni el repo. |
| Servicio `emitirComprobante(venta)`: numeración vía `FECompUltimoAutorizado`, idempotency key, estados pendiente/autorizada/rechazada | 8 | CU-18 | |
| Facturar desde la pantalla de venta (botón "Facturar", datos del receptor, condición IVA obligatoria) | 5 | CU-18 | |
| Comprobante con QR oficial ARCA + datos legales, imprimible/compartible | 5 | CU-18 | |
| Cola de reintentos / contingencia: ARCA caído no frena la venta, la factura queda `pendiente` y se reintenta | 8 | CU-19 | Decisión CAEA vs reintento simple: charlar en el spike. |
| Pasaje a producción: certificado real, config por entorno, checklist de salida | 3 | CU-18 | |

**Subtotal: ~48 pts**

---

## 🗣️ Para charlar ANTES de codear (no son tareas de código todavía)

1. **¿Supabase confirmado?** La investigación dice "probable". Confirmarlo o no, pero decidirlo ya: la Épica 0 entera depende de esto.
2. **Método de login**: email+password es lo esperable, pero para un almacenero un **magic link o PIN** puede ser más realista. También: ¿un solo dispositivo compartido en el mostrador con "cambio rápido de usuario"?
3. **Multi-tenant en el MVP**: el modelo es multi-tenant, perfecto. Pero ¿el onboarding (crear org, invitar miembros) se construye ya, o se hardcodea una org y el flujo de invitaciones queda para después? Recomendación: RLS y `org_id` desde el día 1 (barato ahora, carísimo después), pantallas de onboarding después.
4. **Lector de código de barras — dos caminos distintos**:
   - *Lector físico USB/BT*: actúa como teclado, esfuerzo mínimo, experiencia excelente. Preguntar si el almacén tiene o compraría uno (~barato).
   - *Cámara del celular*: gratis pero más fricción (permisos, luz, foco). Spike corto para elegir lib (Barcode Detection API nativa vs `html5-qrcode` vs `zxing-js`).
   - Recomendación: soportar los dos; el físico es casi gratis de implementar.
5. **Impresión de tickets**: ¿el almacén imprime ticket o alcanza con mostrar/mandar por WhatsApp? La impresión térmica (58/80mm, ESC/POS) **desde una web app** es un problema con nombre propio — si se necesita, merece su propio spike (¿app companion? ¿impresora con SDK web? ¿imprimir vía diálogo del navegador?). No asumirlo resuelto.
6. **Historial de precios**: la investigación lo recomienda ("no pisar el precio anterior") pero el modelo actual **no tiene tabla para eso** — `products.sale_price` se pisa. Con la inflación argentina y la remarcación masiva (CU-15), un `price_history` barato desde el día 1 puede valer la pena. Detectado como hueco entre ambos docs.
7. **¿Vender sin caja abierta?** El modelo permite `cash_session_id` null. Definir la regla de negocio: ¿bloquea, avisa, o se permite y queda sin caja? Afecta la UX del día 1 del usuario.
8. **Offline / conexión inestable**: una web app pura muere sin internet, y un almacén de barrio puede tener internet flaky. ¿Se acepta el riesgo en el MVP (recomendado: sí, para no complicarse) o se investiga PWA + cola offline? Al menos: que la app avise claramente cuando no hay conexión y no pierda el carrito armado.
9. **Lib de componentes UI**: Next 16 se lleva con **Base UI** (reemplazo de Radix, ya notado en la investigación). Decidir: Base UI + Tailwind puro, o algo tipo shadcn adaptado. Impacta la Épica 0.
10. **Variantes de producto y listas de precios**: ya listadas como decisiones abiertas en `modelo-datos.md`. Postura sugerida: fuera del MVP las dos, revisar cuando haya un segundo comercio real interesado.
11. **Estimación conjunta**: los puntos de este doc son un borrador de una sola persona — re-estimarlos juntos en 30 min (planning poker real) antes del sprint 1; ahí también se dividen las tareas de 13.
12. **Backups/export**: el almacenero confía su negocio a la app. Definir qué pasa si quiere sus datos (export CSV de productos/ventas) y verificar el esquema de backups de Supabase. Barato de resolver, feo de olvidar.

---

## Orden sugerido de sprints (equipo de 2)

| Sprint | Contenido | Meta demostrable |
|---|---|---|
| 0 | Épica 0 completa | "Me logueo y veo el layout vacío en el celu, deployado." |
| 1 | Épica 1 (catálogo + stock) | "Cargo productos con el celu, escaneo un código y lo encuentra." |
| 2–3 | Épica 2 (POS) + Épica 3 (caja) | "Hago una venta real de punta a punta y cierro la caja." |
| 4 | Épica 4 (reportes) + pulido + **uso real en el almacén** | "El almacenero lo usó un día entero y sobrevivió." |
| 5+ | Fase 2 (fiado, compras) según feedback real | |
| luego | Fase 3 (ARCA), arrancando el trámite del certificado bastante antes | |

> El hito clave es el del sprint 4: **poner la app en manos del almacenero cuanto antes**,
> con fiado y facturación todavía sin hacer. El feedback real reordena el resto del backlog
> mejor que cualquier planificación.
