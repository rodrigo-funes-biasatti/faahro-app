# Setup de Neon + Better Auth — qué se hizo y cómo terminarlo

> Decisión de equipo del 2026-07-18: la base de datos es **Neon (PostgreSQL serverless)** y la
> autenticación es **Better Auth**, con **Drizzle** como ORM. Esto reemplaza la decisión anterior
> de Firebase/Firestore (revertida el mismo día; el setup viejo quedó en el historial de git) y
> la de Supabase de la investigación inicial.
>
> **Consecuencia clave**: al volver a Postgres, el [`modelo-datos.md`](./modelo-datos.md) vuelve
> a valer prácticamente tal cual — con los ajustes de la sección "Impacto en el modelo de datos".

_Última actualización: 2026-07-18_

---

## Qué es cada pieza

- **Neon**: PostgreSQL serverless. Postgres común y corriente, pero administrado, con tier gratis,
  auto-suspend (la base "duerme" sin uso y despierta en <1s) y **branching**: se puede crear una
  rama de la base (copia instantánea) por cada PR — ideal con los previews de Vercel.
- **Better Auth**: framework de autenticación TypeScript que corre **en nuestra app** (no es un
  servicio externo). Guarda usuarios/sesiones en nuestra propia base vía Drizzle. Trae plugin de
  **organizaciones** que nos resuelve el multi-tenant.
- **Drizzle**: ORM TypeScript. El esquema se define en código (`src/lib/db/schema.ts`) y
  `drizzle-kit` genera las migraciones SQL a partir de eso.

---

## Lo que ya quedó hecho en el repo

| Qué | Dónde |
|---|---|
| Dependencias: `better-auth`, `drizzle-orm`, `pg` (+ `drizzle-kit`, `@types/pg` en dev) | `package.json` |
| Conexión a la base (Pool de `pg` + Drizzle) | `src/lib/db/index.ts` |
| Esquema de auth **generado** por la CLI de Better Auth (7 tablas: user, session, account, verification, organization, member, invitation) | `src/lib/db/auth-schema.ts` |
| Punto de entrada del esquema (acá se suman los módulos futuros) | `src/lib/db/schema.ts` |
| Config del servidor de auth (email+password + Google, plugin `organization`) | `src/lib/auth.ts` — login con Google detallado en [`setup-google-oauth.md`](./setup-google-oauth.md) |
| Cliente de auth para componentes React (`signIn`, `signUp`, `useSession`...) | `src/lib/auth-client.ts` |
| Route handler que expone la API de auth (`/api/auth/*`) | `src/app/api/auth/[...all]/route.ts` |
| Config de drizzle-kit | `drizzle.config.ts` |
| Primera migración SQL (tablas de auth) — **commitear la carpeta `drizzle/`** | `drizzle/0000_auth-inicial.sql` |
| Scripts npm: `db:generate`, `db:migrate`, `db:studio` | `package.json` |
| Template de env vars | `.env.example` |

---

## Lo que falta hacer (manual, una vez)

### 1. Crear el proyecto en Neon
1. Entrar a [neon.tech](https://neon.tech) → crear cuenta (con el GitHub del equipo) → **New Project**.
2. Nombre: `faahro-app`. Postgres 17 (default está bien).
3. **Región: AWS São Paulo (`sa-east-1`)** — la más cercana a Argentina.

### 2. Copiar los DOS connection strings
En el dashboard → botón **Connect**:
- El **pooled** (el host contiene `-pooler`) → va en `DATABASE_URL`. Lo usa la app.
- Destildar "Connection pooling" para ver el **directo** (sin `-pooler`) → va en
  `DATABASE_URL_UNPOOLED`. Lo usan las migraciones.

> ¿Por qué dos? El pooled pasa por PgBouncer y aguanta muchas conexiones serverless (Vercel);
> pero PgBouncer se lleva mal con DDL/locks de migraciones, que van por la conexión directa.

### 3. Configurar el entorno local
```bash
cp .env.example .env.local
# pegar los dos connection strings
npx @better-auth/cli secret   # genera BETTER_AUTH_SECRET, pegarlo en .env.local
```

### 4. Correr la migración inicial
```bash
npm run db:migrate
```
Crea las 7 tablas de auth en Neon. Verificar en la consola de Neon (Tables) o con `npm run db:studio`.

### 5. Probar que auth funciona (todavía sin UI)
```bash
npm run dev
# en otra terminal:
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password1234"}'
```
Debe devolver un JSON con el usuario creado (y aparecer en la tabla `user`).

### 6. En Vercel (cuando se deploye)
Cargar `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET` (uno distinto al de dev)
y `BETTER_AUTH_URL` (la URL de producción) en Environment Variables. Neon tiene integración
nativa con Vercel que además crea una **rama de DB por preview** — vale la pena activarla.

---

## Entornos: desarrollo local en Docker, Neon como compartido

**Nadie desarrolla contra la base de Neon.** Estrategia elegida (2026-07-18) para no consumir
el free tier hasta tener MVP + cliente:

- **Desarrollo diario → Postgres local en Docker** (`docker-compose.yml` en el repo).
  Costo cero garantizado, funciona sin internet, cada dev rompe lo que quiera.
- **Neon (rama principal) → entorno compartido / futura producción.** Sin uso diario vive
  suspendida y casi no consume free tier. Solo la tocan el deploy y las migraciones al mergear.
- **Plan B sin Docker**: crear una *branch* de Neon (`dev-<nombre>`, consola → Branches →
  Create branch) y apuntar `.env.local` a ella. Ojo: consume horas de cómputo del free tier
  mientras el dev server esté corriendo (el pool de `pg` mantiene la base despierta).

### Setup local (por developer, una vez)
```bash
docker compose up -d        # levanta Postgres 17 en localhost:5432
```
En `.env.local`:
```
DATABASE_URL=postgresql://faahro:faahro@localhost:5432/faahro
DATABASE_URL_UNPOOLED=postgresql://faahro:faahro@localhost:5432/faahro
```
(las credenciales de Neon guardarlas comentadas abajo para cuando haga falta apuntar allá)
```bash
npm run db:migrate          # crea las tablas en el Postgres local
npm run dev
```
El contenedor persiste los datos en un volumen (`faahro-pgdata`); `docker compose down -v`
lo borra todo para empezar de cero.

### Regla para las migraciones
- Durante el desarrollo, las migraciones se prueban en **tu Postgres local**.
- Cuando el PR se mergea, alguien corre la migración contra Neon (apuntando `.env.local` allá
  temporalmente), hasta que se automatice en CI/CD — tarea pendiente del backlog.

> Bonus para cuando haya deploys: la integración Neon ↔ Vercel crea automáticamente una rama
> de DB por cada preview de PR.

---

## Flujo de trabajo con el esquema (para todo el equipo)

1. Editar/crear tablas en `src/lib/db/schema.ts` (o archivos que ese re-exporte).
2. `npm run db:generate` → crea el SQL en `drizzle/` (revisarlo, es parte del PR).
3. `npm run db:migrate` → lo aplica a la base.
4. Commitear esquema + migración juntos. **Nunca** editar a mano una migración ya aplicada.
5. `src/lib/db/auth-schema.ts` es generado: si cambia la config de `src/lib/auth.ts`, regenerar
   con `npx @better-auth/cli generate --config src/lib/auth.ts --output src/lib/db/auth-schema.ts`.

---

## Cosas a tener en cuenta (decisiones que este stack implica)

1. **El scoping multi-tenant pasa a la capa de aplicación.** El modelo asumía RLS de Supabase
   (`auth.uid()` en la base). Con Better Auth la sesión vive en la app, así que **toda query debe
   filtrar por `organization_id`** obtenido de la sesión del servidor
   (`auth.api.getSession(...)` → `session.activeOrganizationId`). Regla de equipo: ningún
   acceso a datos sin pasar por un helper que exija la org — conviene construir ese helper
   como primera tarea de datos.
2. **El Módulo 0 del modelo de datos ya casi no hay que construirlo**: `organizations`,
   `memberships` (roles owner/admin/member incluidos) e invitaciones los aportan las tablas del
   plugin de Better Auth. Los campos propios que el modelo le agregaba a la organización
   (`cuit`, `condicion_iva`, `timezone`) hay que decidir dónde van: campos adicionales del
   plugin o una tabla satélite `organization_settings` (1-a-1). **Pendiente de charlar.**
   `locations` sí se construye nuestra, referenciando `organization.id`.
3. **Transacciones**: se usa el driver `pg` (no el HTTP de Neon) justamente porque la venta
   atómica (venta + stock + caja en una transacción) las necesita. `db.transaction(...)` de
   Drizzle funciona normal.
4. **Roles**: los del modelo eran `owner|admin|cajero|repositor`; el plugin trae
   `owner|admin|member`. Se pueden definir roles custom en el plugin — decidir si `cajero` y
   `repositor` se agregan como roles custom o se simplifica. **Pendiente de charlar.**
5. **Protección de rutas**: en Next 16 el middleware se llama **`proxy.ts`** (breaking change ya
   anotado en la investigación). Cuando se haga la tarea de RBAC/protección de rutas, leer
   `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — no copiar recetas de
   Better Auth para Next viejo que usan `middleware.ts`.
6. **Auto-suspend de Neon**: en el tier gratis la base duerme tras ~5 min sin uso; la primera
   query después tarda <1s extra. Para un almacén es irrelevante, pero no asustarse si la
   primera carga de la mañana es apenas más lenta.
7. **Mails de verificación/reseteo**: email+password está habilitado sin verificación de email
   por ahora. Cuando haga falta (reset de contraseña), hay que enchufar un proveedor de mail
   (ej. Resend) en la config de Better Auth. Fuera de alcance por ahora.

---

## Impacto en el backlog

- Épica 0 del [`backlog.md`](./backlog.md): las tareas "Crear proyecto Supabase", "Migración
  Módulo 0" y "Auth" se reemplazan por este setup — gran parte ya quedó hecha acá. Queda viva
  la parte de UI de login/registro y el helper de scoping por organización.
- Las tareas de migraciones SQL de las demás épicas pasan a ser "esquema Drizzle + migración
  generada" (mismo contenido, otra herramienta). El diseño de `modelo-datos.md` sigue siendo
  la referencia.
