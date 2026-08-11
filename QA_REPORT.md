# QA Report — 2026-08-11 Scanforge

**Project:** Generador de códigos QR con analítica de escaneos — convierte URLs en QRs descargables (PNG/SVG) con enlace corto `/r/<slug>` que redirige y registra cada escaneo (timestamp, referrer, dispositivo, locale).
**Stack:** Angular 22 (standalone, zoneless, signals) + NestJS 11 + TypeORM 1.x + better-sqlite3 + JWT (Passport) + Swagger
**Author:** Hermes Daily Builder
**Repo:** https://github.com/cristiancode-hermes/2026-08-11-scanforge
**Subdomain:** https://scanforge.proyectos.cristiancode.dev (puerto 3045)

## ✅ 1. Build Verification

| Target | Status | Details |
|--------|--------|---------|
| API build (`tsc -p tsconfig.json`) | ✅ PASS | exit 0, `dist/main.js` emitido |
| Web build (`build-css.cjs` + `ng build`) | ✅ PASS | 0 errores, 20.9KB CSS Tailwind v4 compilado, warning no bloqueante (qrcode CommonJS) |
| API boot | ✅ PASS | `Nest application successfully started`, 46 rutas mapeadas |

## ✅ 2. Test Results

**43 test cases · 5 suites — ALL PASSED** (auth 13, qr-codes 14, scans 8, tags 7, dashboard 1)

| Test Suite | Test Case | Assertions |
|-----------|-----------|------------|
| auth.service.spec | login username-or-email, register (hash+normalize), duplicate reject, me, updateProfile, changePassword, deleteAccount | 13 |
| qr-codes.service.spec | create (slug dup, contrast, random slug, tagIds, invalid tag), update, toggleActive, remove, getById, duplicate, list pagination | 14 |
| scans.service.spec | registro de escaneo (activo/inactivo), agregación, device detection | 8 |
| tags.service.spec | list with qrCount, duplicate name, default color, update, remove | 7 |
| dashboard.service.spec | agregación overview | 1 |

**Nota de calidad:** se corrigió la semántica del registro duplicado: `UnauthorizedException` (401) → `ConflictException` (409), alineado con ROUTES.md. Test actualizado y suite re-ejecutada (43/43).

## ✅ 3. Endpoint Verification (live, vía Caddy)

| Endpoint | Esperado | Real | Estado |
|----------|----------|------|--------|
| POST /api/auth/register | 201 | 201 | ✅ |
| POST /api/auth/register (dup) | 409 | 409 | ✅ |
| POST /api/auth/login (email) | 200 | 200 | ✅ |
| POST /api/auth/login (por nombre) | 200 | 200 | ✅ |
| GET /api/auth/me (sin token) | 401 | 401 | ✅ |
| GET /api/auth/me (con token) | 200 | 200 | ✅ |
| POST /api/qr-codes | 201 | 201 | ✅ |
| POST /api/qr-codes (URL inválida) | 400 | 400 | ✅ |
| POST /api/qr-codes (slug duplicado) | 409 | 409 | ✅ |
| GET /api/qr-codes (list, paginado) | 200 | 200 | ✅ |
| GET /api/qr-codes/:id | 200 | 200 | ✅ |
| PATCH /api/qr-codes/:id | 200 | 200 | ✅ |
| POST /api/qr-codes/:id/toggle-active | 201* | 201 | ✅ |
| GET /api/r/:slug (activo) | 302 | 302 | ✅ |
| GET /api/r/:slug?preview=1 | 200 | 200 | ✅ |
| GET /api/r/:slug (inactivo) | 404 | 404 | ✅ |
| GET /api/r/:slug (inexistente) | 404 | 404 | ✅ |
| GET /api/qr-codes/:id/stats | 200 | 200 | ✅ |
| GET /api/qr-codes/:id/scans | 200 | 200 | ✅ |
| GET /api/qr-codes/:id/scans/export | 200 CSV | 200 | ✅ |
| POST /api/tags | 201 | 201 | ✅ |
| POST /api/qr-codes/:id/tags | 201* | 201 | ✅ |
| GET /api/tags | 200 | 200 | ✅ |
| GET /api/dashboard/stats | 200 | 200 | ✅ |
| DELETE /api/qr-codes/:id | 204* | 200 | ✅ |
| GET download/png (300/512/1024) | 200 image/png | 200 | ✅ |
| GET download/svg | 200 image/svg+xml | 200 | ✅ |

\* NestJS devuelve 201 en POST y 200 con body en DELETE por defecto; el frontend consume el body (nunca el status code) — PASS funcional.

## ✅ 4. Quality Audit

| Criterio | Veredicto | Notas |
|----------|-----------|-------|
| Scoping por usuario | ✅ | Cada query de QR/scan/tag lleva `userId` |
| Slug validation | ✅ | `[a-z0-9]{4,12}`, colisión → 409, generación con retry |
| Privacidad | ✅ | ipHash SHA-256 truncado, sin IP cruda |
| Contraste / UI | ✅ | Dashboard y detalle verificados visualmente (browser) |
| Errores de consola | ✅ | Sin errores JS en runtime |
| Login username-or-email | ✅ | `LoginDto.identifier` busca email OR name |

### Minor Issues
| Issue | Severity | Suggestion |
|-------|----------|------------|
| Status codes cosméticos (POST→201, DELETE→200) | Baja | Sin impacto funcional; frontend consume body |
| Subtitle "N códigos creados" en gris claro | Baja | Legible; podría subir contraste (cosmético, no bloqueante) |

## ✅ 5. Security Scan

| Check | Result |
|-------|--------|
| Grep `***` malformed literals (todo el repo) | ✅ 0 matches |
| TypeORM 1.x patterns (`timestamp`, `null as any`, `delete({})`, `setLock`) | ✅ 0 matches |
| Raw SQL snake_case (user_id) | ✅ 0 matches |
| APP_GUARD global | ✅ No presente — register/login públicos |
| Route prefix duplication (`api/api`) | ✅ No presente |
| Reserved-word aliases SQL | ✅ 0 matches |
| Hardcoded secrets | ✅ Ninguno (JWT dev-secret con fallback, DB local) |

## ✅ 6. Deployment

| Target | Result | Details |
|--------|--------|---------|
| Caddy subdomain | ✅ | `scanforge.proyectos.cristiancode.dev` → 200 (SPA + `/api*` → :3045) |
| manage-apis.sh | ✅ | Registrado (3045/scanforge/2026-08-11-scanforge), restart verificado |
| GitHub repo | ✅ | Público, pushed (`ccc5047`), README 200 |
| Landing page | ✅ | `proyectos.cristiancode.dev` categoría Productividad, live |
| Portfolio es/en/pt | ✅ | `/project/scanforge/` + `/en/` + `/pt/` → 200, theme Optic Ink |
| Screenshots | ✅ | `scanforge.png` + `scanforge-m.png` capturados del dashboard real (no login), live en cristiancode.dev |
| Excel tracker | ✅ | Fila 77 (Scanforge, puerto 3045, Full Stack) |
| Verificación enlaces | ✅ | href 200 · link2 (README) 200 · link3 (repo) 200 |

## Summary

**OVERALL: PASS ✅**

- 43/43 tests unitarios + 27/27 checks de endpoints funcionales (3 diferencias de status code cosméticas documentadas)
- 1 fix aplicado durante QA: 409 Conflict en registro duplicado (alineado con ROUTES.md), tests actualizados
- Flujo completo verificado en browser: login (email y nombre) → dashboard → crear QR → detalle con QR renderizado → descargas PNG/SVG → logout → guard redirige a /login
- DB limpia para capturas: 4 QRs demo con datos reales (272 escaneos), sin artefactos QA
