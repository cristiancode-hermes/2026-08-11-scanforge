# Scanforge — Arquitectura

Generador de códigos QR con analítica de escaneos. Monorepo npm workspaces con Angular 22 (frontend) y NestJS 11 (API).

## Visión general

```
apps/
├── web/   → Angular 22 SPA (standalone, zoneless, Tailwind v4 pre-compilado)
└── api/   → NestJS 11 + TypeORM (SQLite local / Neon Postgres en prod)
```

**Flujo principal:** el usuario crea un QR con una URL destino → obtiene un slug corto (`/api/r/<slug>`) → imprime el QR → cada escaneo redirige a la URL y registra un `ScanEvent` (device, referrer, locale, IP hasheada) → el panel muestra estadísticas por día, referrers y dispositivos.

## Backend (`apps/api`)

### Stack
- **NestJS 11** con `@nestjs/typeorm`, `@nestjs/jwt`, `@nestjs/passport` (JWT strategy).
- **TypeORM 1.1** con driver **better-sqlite3** (dev) y **pg** (Neon Postgres, prod).
- **qrcode** (generación PNG/SVG server-side), **bcryptjs** (hash de contraseñas).
- Swagger en `GET /api/docs`.

### Módulos

| Módulo | Responsabilidad |
|---|---|
| `auth` | Register / Login (username **o** email) / me / updateProfile / changePassword / deleteAccount. JWT Bearer. |
| `qr-codes` | CRUD de códigos, slug único (6 chars, retry 5), colores con validación de contraste (≥3:1), estilos (classic/dots/rounded), toggle active, duplicate, setTags. |
| `qr-download` | PNG (`?size=` 300/512/1024) y SVG del QR con sus colores. |
| `scans` | Registro de escaneos (fire-and-forget), paginado, stats (perDay 7/30/90, top referrers, byDevice, byLocale), export CSV, clearForQr, remove. |
| `redirect` | `GET /r/:slug` público: valida QR activo, registra escaneo, 302 a la URL destino. `?preview=1` devuelve JSON para el frontend. |
| `tags` | CRUD de etiquetas con contador de códigos asociados. |
| `dashboard` | KPIs globales: total codes, total scans, últimos 7 días, media/día, top 5 códigos. |
| `seed` | Datos demo (usuario + 4 QRs + 3 tags + ~260 escaneos distribuidos en 90 días) con `SEED_DB=true`. |

### Entidades

```
User ──1:N── QRCode ──1:N── ScanEvent
  │              │
  │              └── N:N (JoinTable) ── Tag
  └──1:N── Tag
```

- `User`: email único, name, passwordHash.
- `QRCode`: title, targetUrl, slug único, foregroundColor/backgroundColor, style, isActive, scanCount (desnormalizado).
- `ScanEvent`: scannedAt, referrer, userAgent, deviceType (detectDevice), locale, ipHash (SHA-256 de IP), metadata JSON.
- `Tag`: name + userId (único compuesto), color hex.

### Decisiones clave

- **`scannedAt` es `@Column` con default** (no `@CreateDateColumn`) para permitir fechas simuladas en el seed — `CreateDateColumn` sobreescribía el timestamp con "ahora".
- **Contador desnormalizado** `QRCode.scanCount` incrementado atómicamente (`repository.increment`) en cada escaneo — evita COUNT(*) en cada listado.
- **`@HttpCode(200)`** en login/me — el default de `@Post` es 201.
- **Doble AS en selects raw rompe SQLite**: usar `select("expr AS alias")` sin segundo argumento (TypeORM añade `AS "alias"` duplicado).
- **Login por username-or-email**: `findOne({ where: [{ email }, { name }] })`.
- **Build con tsc directo**: el CLI de NestJS deja `dist/` vacío silenciosamente con TypeScript 6.0.3. Script: `node ../../node_modules/typescript/bin/tsc -p tsconfig.json`.

## Frontend (`apps/web`)

Angular 22 **standalone + zoneless** (`provideZonelessChangeDetection`), routing lazy, HTTP con `withFetch()` + interceptor de auth (Bearer token de localStorage).

### Design system "Optic Ink"
- Monocromo tinta/papel + acento cian-láser único.
- Light y dark mode vía CSS variables (`:root` / `.dark`), toggle persistido en `localStorage` (`sf_theme`), respeta `prefers-color-scheme`.
- Tokens Tailwind v4 en `@theme` (styles.css), **pre-compilados a CSS puro** con `scripts/build-css.cjs` porque el build de Angular 22 no procesa `@import "tailwindcss"`.
- Tipografía: Inter (UI) + JetBrains Mono (datos/slugs), tabular-nums en métricas.

### Páginas
| Ruta | Componente |
|---|---|
| `/login`, `/register` | Auth shell + formularios |
| `/codes` | Listado con KPIs globales, búsqueda (debounce 300ms), filtro por tag, orden, paginación, acciones por fila |
| `/codes/new` | Form create con preview en vivo del QR y warning de contraste |
| `/codes/:id` | Detalle: QR + descargas PNG/SVG, KPIs, gráfica 7/30/90d, referrers, dispositivos, escaneos recientes (modal de detalle), export CSV |
| `/codes/:id/edit` | Form edit (slug inmutable) |
| `/tags` | CRUD de etiquetas con color picker |
| `/settings` | Perfil, cambio de contraseña (regenera token), zona de peligro |

### Servicios (signals)
`AuthService` (token+user signals, persistencia en localStorage), `QrCodesService` (listado cacheado en signal con toggle optimista), `TagsService`, `ScansService` (stats por rango), `DashboardService`, `ThemeService`, `ToastService`.

## Configuración de despliegue

### API
```bash
# Local (SQLite)
cd apps/api && rm -f data/scanforge.db*
DATABASE_TYPE=better-sqlite3 DATABASE_PATH=data/scanforge.db SEED_DB=true JWT_SECRET=<secret> PORT=3045 node dist/main.js

# Producción (Neon Postgres)
DATABASE_TYPE=postgres DATABASE_URL=postgres://... SEED_DB=false JWT_SECRET=<secret> PORT=3045 node dist/main.js
```

### Frontend
```bash
cd apps/web && npm run build   # pre-compila Tailwind v4 y ejecuta ng build
# dist/web/browser/ → sirve estático con proxy /api al backend
```

## Testing
```bash
cd apps/api && ../../node_modules/.bin/jest   # 43 tests unitarios (auth, qr-codes, scans, tags, dashboard)
```
- `tsconfig.spec.json` añade `types: ["jest", "node"]` (ts-jest no hereda el tsconfig de build).
- Los repositorios se mockean con estado en memoria que respeta `where { id, userId }` (scoping por usuario).

## Puertos
- API: **3045** (público solo `/api/r/:slug` y `/api/docs`)
- Preview local: 3105 (preview-server.mjs, proxy /api → 3045)
