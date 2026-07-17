# faahro-app — Boceto del modelo de datos

> Sistema de gestión **genérico y multi-tenant** (stock + ventas + facturación ARCA).
> Orientado inicialmente a un almacén, pensado para ofrecerse a otros comercios.
> Target: **PostgreSQL / Supabase** con RLS.

_Última actualización: 2026-07-17 · Estado: boceto para revisión_

---

## Decisiones de diseño que atraviesan todo

1. **Multi-tenant por `org_id`** en toda tabla + **RLS** de Supabase. Un negocio = una `organization`.
2. **Unidad de medida por producto** (`UN` vs `KG` vs `LT`) → clave para un almacén que vende por
   peso. Cantidades como `numeric`, no `integer`.
3. **Stock = ledger append-only** (`stock_movements`) + stock actual derivado (`stock_levels`).
   Nunca un solo campo `cantidad` mutado.
4. **Plata como `numeric(14,2)`** (o centavos en `bigint`), nunca float.
5. **Facturación desacoplada**: la factura es consecuencia de una venta, en su propio módulo con
   los campos ARCA. Se enchufa sin tocar el core.

---

## Diagrama de alto nivel

```
organizations ──┬── memberships ── users
                ├── locations (sucursales/depósitos)
                ├── categories ── products ── product_barcodes
                │                     └── stock_movements ── stock_levels (derivado)
                ├── customers ── customer_account_movements (cuenta corriente / fiado)
                ├── suppliers ── purchases ── purchase_items
                ├── cash_sessions ── cash_movements
                └── sales ── sale_items
                       └── payments
                       └── invoices (comprobante ARCA) ── invoice_tax_breakdown
```

---

## Módulo 0 — Tenancy, usuarios y locales

```
organizations
  id (uuid, pk) · name · cuit · condicion_iva · address · timezone (default 'America/Argentina/Cordoba')
  created_at · updated_at

memberships                 -- usuario ↔ organización con rol
  id · org_id (fk) · user_id (fk auth.users) · role (owner|admin|cajero|repositor)
  unique(org_id, user_id)

locations                   -- sucursal o depósito; genérico, un almacén tiene 1
  id · org_id (fk) · name · type (tienda|deposito) · is_default (bool)
```
> `role` habilita RBAC. `locations` deja la puerta abierta a multi-sucursal sin obligar a usarla.

## Módulo 1 — Catálogo y stock

```
categories
  id · org_id · name · parent_id (fk self, nullable)   -- árbol de rubros

products
  id · org_id · sku · name · description
  category_id (fk, nullable)
  unit_of_measure (UN|KG|LT)            -- venta por peso = KG
  track_stock (bool)                    -- servicios/varios sin stock
  cost_price (numeric 14,2)             -- último costo
  sale_price (numeric 14,2)
  iva_rate (numeric 5,2, default 21)    -- alícuota
  is_active (bool)
  unique(org_id, sku)

product_barcodes                        -- 1 producto, N códigos (EAN, interno)
  id · product_id (fk) · barcode · unique(org_id, barcode)

stock_movements                         -- LEDGER append-only, corazón del stock
  id · org_id · product_id · location_id
  qty (numeric 14,3)                    -- +entrada / -salida
  type (compra|venta|ajuste|devolucion|merma|apertura)
  ref_type · ref_id                     -- vínculo polimórfico a sale/purchase
  unit_cost (numeric 14,2, nullable)
  created_at · created_by

stock_levels                            -- stock actual por (producto, local)
  product_id · location_id · qty (numeric 14,3) · updated_at
  pk(product_id, location_id)           -- se mantiene por trigger/función desde el ledger
```
> `stock_levels` es un *cache* del ledger (más rápido de leer). La verdad está siempre en `stock_movements`.

## Módulo 2 — Clientes y cuenta corriente (fiado)

```
customers
  id · org_id · name · doc_type (DNI|CUIT) · doc_number
  condicion_iva (consumidor_final|responsable_inscripto|monotributo|exento)
  email · phone · credit_limit (numeric, nullable)
  balance (numeric 14,2, default 0)     -- saldo cuenta corriente (derivado)

customer_account_movements              -- ledger de cuenta corriente
  id · org_id · customer_id
  amount (numeric 14,2)                 -- +deuda (fiado) / -pago
  type (venta|pago|ajuste)
  ref_type · ref_id · created_at
```

## Módulo 3 — Proveedores y compras (ingreso de stock)

```
suppliers
  id · org_id · name · cuit · phone · email

purchases
  id · org_id · supplier_id · location_id
  status (borrador|recibida) · total (numeric) · doc_number · created_at

purchase_items
  id · purchase_id · product_id · qty (numeric 14,3) · unit_cost (numeric 14,2)
```
> Al marcar `purchases` como *recibida* → genera `stock_movements` tipo `compra`.

## Módulo 4 — Caja (apertura/cierre)

```
cash_sessions
  id · org_id · location_id · opened_by · opened_at · opening_amount
  closed_by · closed_at · closing_amount · status (abierta|cerrada)

cash_movements
  id · cash_session_id · type (venta|ingreso|egreso|retiro)
  amount (numeric 14,2) · ref_type · ref_id · created_at
```

## Módulo 5 — Ventas (POS)

```
sales
  id · org_id · location_id · cash_session_id (fk, nullable)
  customer_id (fk, nullable)            -- null = consumidor final mostrador
  status (completada|anulada)
  subtotal · discount · total (numeric 14,2)
  payment_status (pagada|cta_cte)
  created_at · created_by

sale_items
  id · sale_id · product_id
  qty (numeric 14,3) · unit_price (numeric 14,2)
  iva_rate (numeric 5,2) · line_total (numeric 14,2)
  -- se copian precio/iva al momento de la venta (snapshot, no FK viva)

payments
  id · sale_id · method (efectivo|debito|credito|transferencia|qr|cta_cte)
  amount (numeric 14,2)                 -- N pagos por venta (pago mixto)
```
> Confirmar una venta genera, en **una sola transacción**: `stock_movements` (venta),
> `cash_movements` (si efectivo) y `customer_account_movements` (si va a cuenta corriente).

## Módulo 6 — Facturación ARCA (módulo aislado, opcional por venta)

```
invoices                                -- comprobante electrónico
  id · org_id · sale_id (fk, nullable)  -- puede facturarse una venta o suelto
  pto_vta (int) · cbte_tipo (int)       -- códigos ARCA (Factura A=1, B=6, C=11...)
  cbte_nro (bigint)                     -- número que devuelve ARCA
  concepto (int) · doc_tipo · doc_nro   -- receptor
  condicion_iva_receptor (int)          -- obligatorio hoy en ARCA
  neto · iva · total (numeric 14,2)
  cae (varchar) · cae_vto (date)
  qr_data (text) · status (pendiente|autorizada|rechazada|error)
  arca_env (homologacion|produccion)
  idempotency_key (unique)              -- evita CAE duplicado en reintentos
  created_at

invoice_tax_breakdown                   -- desglose por alícuota de IVA
  id · invoice_id · iva_rate (numeric 5,2) · base (numeric) · importe (numeric)
```
> Los **certificados/keys de ARCA no van en la DB en texto plano** → secret manager /
> Supabase Vault, referenciados por `org_id`.

---

## Notas transversales

- **Auditoría**: `created_at`, `updated_at`, `created_by` en todas las tablas operativas.
- **RLS**: policy base `org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid())`.
- **Índices clave**: `(org_id, sku)`, `(org_id, barcode)`,
  `stock_movements(product_id, location_id, created_at)`, `sales(org_id, created_at)`.
- **Concurrencia**: transacciones ACID; optimistic locking (columna `version`) donde haya
  riesgo de sobreventa.

---

## Alcance por fase

- **MVP** (almacén inicial): Módulos **0, 1, 4, 5** + clientes básicos.
- **Fase 2**: Compras (3) y cuenta corriente / fiado (2).
- **Fase 3**: Facturación ARCA (6), empezando en homologación.

---

## Decisiones abiertas (pendientes de definir)

1. **Variantes de producto** (talle/color): fuera del MVP por ahora. ¿Agregar `product_variants`
   desde ya por lo "genérico", o dejarlo para cuando aparezca un rubro que lo necesite?
2. **Multi-sucursal**: soportado pero opcional (`locations`). ¿Se mantiene, o se simplifica a un
   solo local en el MVP?
3. **Listas de precios** (mayorista/minorista): no incluido. ¿Necesario para los otros comercios
   a los que se quiere ofrecer?
