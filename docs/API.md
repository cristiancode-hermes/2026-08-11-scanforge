# Scanforge — API Reference

Base: `/api` · Auth: `Authorization: Bearer <jwt>` · Puerto dev: 3045 · Swagger: `/api/docs`

## Autenticación

### POST /auth/register
```json
{ "email": "ana@example.com", "password": "secret123", "name": "Ana" }
```
→ `201` `{ token, user: { id, email, name, createdAt } }` · `401` si el email ya existe.

### POST /auth/login
```json
{ "identifier": "ana@example.com", "password": "secret123" }
```
`identifier` acepta **email o nombre de usuario**.
→ `200` `{ token, user }` · `401` credenciales inválidas.

### GET /auth/me → `200` `{ id, email, name, createdAt }`
### PATCH /auth/profile → `200` `User`
```json
{ "name": "Ana G.", "email": "nuevo@example.com" }
```
### POST /auth/change-password → `200` `{ token }` (nuevo JWT, sesiones viejas inválidas)
```json
{ "currentPassword": "...", "newPassword": "..." }
```
### POST /auth/delete-account → `200`

## Códigos QR

### GET /qr-codes
Query: `search` (título/URL ILIKE), `tagId`, `sort=createdAt|scanCount`, `order=asc|desc`, `page`, `limit` (default 12).
→ `200` `{ items: QRCode[], total, page }` — `QRCode` incluye `tags: Tag[]` y `scanCount`.

### POST /qr-codes
```json
{
  "title": "Menú digital",
  "targetUrl": "https://cafeteria.example.com/menu",
  "slug": "menu_x8k2",            // opcional, 4-12 [a-z0-9]; auto 6 chars si se omite
  "foregroundColor": "#16181D",   // opcional
  "backgroundColor": "#FFFFFF",   // opcional
  "style": "classic|dots|rounded",// opcional
  "tagIds": ["uuid"]              // opcional
}
```
→ `201` `QRCode` · `409` slug ocupado · `400` contraste <3:1 o tag inexistente.

### GET /qr-codes/:id → `200` `QRCode` · `404`
### PATCH /qr-codes/:id → `200` `QRCode` (title, targetUrl, colores, style, isActive)
### DELETE /qr-codes/:id → `200`
### POST /qr-codes/:id/toggle-active → `201` `{ isActive }`
### POST /qr-codes/:id/duplicate → `201` `QRCode` (slug nuevo, título "(copia)", scanCount 0)
### POST /qr-codes/:id/tags → `201` `QRCode`
```json
{ "tagIds": ["uuid1", "uuid2"] }
```

## Descargas

### GET /qr-codes/:id/download/png?size=300|512|1024
→ `200` `image/png` con los colores del QR.
### GET /qr-codes/:id/download/svg
→ `200` `image/svg+xml`.

## Escaneos

### GET /qr-codes/:id/scans?page=1&limit=20
→ `200` `{ items: ScanEvent[], total, page }` ordenado por `scannedAt DESC`.
`ScanEvent`: `{ id, qrCodeId, scannedAt, referrer, userAgent, deviceType, locale, ipHash, metadata }`.

### GET /qr-codes/:id/stats?range=7|30|90
→ `200`
```json
{
  "total": 111,
  "perDay": [{ "date": "2026-08-11", "scans": 12 }],
  "topReferrers": [{ "referrer": "https://instagram.com/", "scans": 24 }],
  "byDevice": [{ "device": "mobile", "scans": 47 }],
  "byLocale": [{ "locale": "es-ES", "scans": 30 }]
}
```
`perDay` siempre tiene exactamente `range` buckets (días sin datos = 0). Referrers vacíos → `(directo)`.

### GET /qr-codes/:id/scans/export
→ `200` `text/csv` (`scannedAt,referrer,userAgent,deviceType,locale,ipHash`).

### DELETE /qr-codes/:id/scans → `200` (limpia historial y resetea scanCount)
### DELETE /scans/:id → `200` (elimina un escaneo)

## Etiquetas

### GET /tags → `200` `[{ id, userId, name, color, qrCount }]`
### POST /tags → `201` `Tag`
```json
{ "name": "Instagram", "color": "#E1306C" }
```
· `409` si ya existe para el usuario.
### PATCH /tags/:id → `200` `Tag` (`{ name?, color? }`)
### DELETE /tags/:id → `200`

## Dashboard

### GET /dashboard/stats → `200`
```json
{
  "totalCodes": 6,
  "totalScans": 231,
  "scansLast7d": 77,
  "avgPerDay7d": 11.0,
  "topCodes": [{ "id": "...", "title": "...", "slug": "...", "scans": 111 }]
}
```

## Redirect público (sin auth)

### GET /r/:slug
- QR existe y activo → `302` a `targetUrl`, registra `ScanEvent` (device detectado por UA, referrer, locale, IP hasheada SHA-256).
- `?preview=1` → `200` JSON `{ title, targetUrl, foregroundColor, backgroundColor, style }` **sin** registrar escaneo.
- QR inexistente o inactivo → `404`.

## Errores
Formato NestJS estándar: `{ statusCode, message, error }`. `message` en inglés (los mensajes de negocio clave: `Slug 'x' is already taken`, `Email already registered`, `Tag 'x' already exists`, `Low contrast between colors (n.n:1)`, `Invalid credentials`, `Current password is incorrect`).

## Modelo de datos (resumen)
- **User**: id (uuid), email único, name, passwordHash, createdAt.
- **QRCode**: id, userId FK, title, targetUrl, slug único global, fg/bg color, style, isActive, scanCount, createdAt, updatedAt.
- **ScanEvent**: id, qrCodeId FK, scannedAt (default now), referrer, userAgent, deviceType, locale, ipHash, metadata JSON.
- **Tag**: id, userId FK, name (único por usuario), color.
- **QRCode↔Tag**: N:N vía JoinTable.
