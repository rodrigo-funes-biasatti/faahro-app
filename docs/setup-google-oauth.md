# Login con Google — setup y cómo terminarlo

> Decisión de equipo (Diogenes + Rodrigo), 2026-07-21: sumar "Iniciar sesión con Google" antes
> de mergear el setup de Neon/Better Auth. Se agrega **junto a** email+password (no lo reemplaza).

_Última actualización: 2026-07-21_

---

## Qué se hizo en el código

| Qué | Dónde |
|---|---|
| Proveedor `google` agregado a la config del servidor de auth | `src/lib/auth.ts` (`socialProviders.google`) |
| Helper `signInWithGoogle()` para el botón de login | `src/lib/auth-client.ts` |
| Esquema de Better Auth regenerado | `src/lib/db/auth-schema.ts` — **sin cambios**: la tabla `account` ya es genérica (guarda `providerId`, `accountId`, tokens) y soporta cualquier proveedor social sin migración nueva. |

No hace falta `npm run db:generate` ni `db:migrate` para esto — no cambió el esquema.

---

## Lo que falta hacer (manual, una vez por proyecto)

### 1. Crear las credenciales OAuth en Google Cloud Console
1. Entrar a [console.cloud.google.com](https://console.cloud.google.com) con una cuenta de
   Google del equipo.
2. Arriba a la izquierda, crear un **proyecto nuevo** → nombre `faahro-app`.
3. Menú ☰ → **APIs & Services → OAuth consent screen**.
   - User type: **External** (cualquier cuenta de Google puede loguearse; es lo normal para
     una app de clientes externos).
   - Completar nombre de la app (`faahro-app`), tu email de soporte, y el email de contacto
     del developer.
   - Scopes: dejar los por defecto (`email`, `profile`, `openid`) — no hace falta agregar nada.
   - Test users: mientras la app esté en modo "Testing", solo pueden loguearse las cuentas
     de Google que agregues acá a mano (agregar la tuya y la de Rodrigo). Para que loguee
     cualquier usuario hay que **publicar** la app (botón "Publish app" en esta misma pantalla).
     Alcanza con quedarse en Testing durante el desarrollo.
4. Menú ☰ → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `faahro-app (web)`.
   - **Authorized redirect URIs** — agregar las dos (dev y prod; agregar la de Vercel cuando
     exista):
     ```
     http://localhost:3000/api/auth/callback/google
     https://TU-DOMINIO-DE-VERCEL.vercel.app/api/auth/callback/google
     ```
     ⚠️ La ruta es exactamente `/api/auth/callback/google` — la define Better Auth, no se
     inventa. Si no coincide, Google devuelve `redirect_uri_mismatch`.
5. Al crear, Google muestra el **Client ID** y el **Client Secret**. Copiarlos.
   Si se pierden: Credentials → click en el nombre del cliente OAuth → ahí siguen visibles.

### 2. Cargar las variables de entorno
En **`.env.example`** (plantilla, sin valores reales — agregar estas dos líneas donde están
las demás, con valor vacío):
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

En **`.env.local`** (valores reales, no se commitea):
```
GOOGLE_CLIENT_ID=<el Client ID de la consola>
GOOGLE_CLIENT_SECRET=<el Client Secret de la consola>
```

### 3. Agregar el botón de login en la UI
Todavía no existe pantalla de login (queda para la tarea de "UI de login/registro" del
[`backlog.md`](./backlog.md)). Cuando se construya, usar:
```tsx
"use client";
import { signInWithGoogle } from "@/lib/auth-client";

<button onClick={() => signInWithGoogle("/")}>Continuar con Google</button>
```
`signInWithGoogle` redirige a Google y, al volver, Better Auth ya dejó la sesión creada
(usuario en `user`, vínculo en `account` con `providerId = "google"`).

### 4. Probar
```bash
npm run dev
```
Entrar a `http://localhost:3000/api/auth/sign-in/social` no sirve por GET (es un endpoint
POST); para probar de verdad hace falta el botón de login (paso 3) o, mientras no exista,
disparar `authClient.signIn.social({ provider: "google" })` desde la consola del browser
en `http://localhost:3000`. Debe redirigir a la pantalla de cuentas de Google y, al volver,
aparecer un registro nuevo en las tablas `user` y `account` (`providerId = "google"`).

---

## Cosas a tener en cuenta

1. **Un usuario, dos formas de entrar.** Si alguien se registra con email+password y después
   entra con Google usando el mismo email, Better Auth por defecto **vincula** la cuenta de
   Google al mismo `user` (mismo email = mismo usuario) siempre que el email esté marcado como
   verificado por Google (siempre lo está). No hace falta config extra para esto.
2. **Testing vs. Published**: mientras el consent screen esté en "Testing", **solo loguean las
   cuentas que agreguen a mano como test users** (máx. 100). Antes de mostrarle la app a un
   cliente real, publicar la app en Google Cloud Console.
3. **Verificación de Google (para apps públicas)**: si en el futuro se piden scopes
   "sensitive" (hoy no es el caso: solo email/profile), Google exige un proceso de
   verificación que puede tardar días. No aplica todavía.
4. **Redirect URI por entorno**: cada dominio nuevo (preview de Vercel, dominio propio) necesita
   su propia entrada en "Authorized redirect URIs" en Google Cloud Console — no es automático.
   Los previews de Vercel tienen URL distinta por PR, así que en la práctica el login de Google
   **no va a andar en previews** salvo que se agregue un dominio fijo de preview o se pruebe
   solo en local/producción. Tenerlo presente al planear QA.
5. **Secrets**: `GOOGLE_CLIENT_SECRET` es secreto real (a diferencia del `NEXT_PUBLIC_*` de
   Firebase que se descartó) — nunca exponerlo al cliente, solo se usa en `src/lib/auth.ts`
   (server-side). Cargarlo en Vercel → Environment Variables cuando se deploye.

---

## Impacto en el backlog

- Se agrega como parte de la tarea de **Auth** de la Épica 0 en [`backlog.md`](./backlog.md)
  (login con email+password + Google). No suma una tarea nueva, extiende la existente — el
  costo real fue bajo porque el esquema de `account` ya lo soportaba.
