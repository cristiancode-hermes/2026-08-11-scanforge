# Scanforge — Frontend (Angular 22)

## Stack
- **Angular 22**: standalone components, zoneless (`provideZonelessChangeDetection`), lazy routes, signals-first.
- **HTTP**: `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))`. Interceptor añade `Authorization: Bearer` desde `localStorage['sf_token']` a todas las llamadas `/api/*` excepto login/register.
- **Tailwind v4**: tokens en `@theme` dentro de `src/styles.css`, pre-compilados a CSS puro por `scripts/build-css.cjs` (Angular 22 no resuelve `@import "tailwindcss"` en producción). El build (`npm run build`) ejecuta `build:css` antes de `ng build`.
- **qrcode** (npm): render del QR en canvas en el componente `QrPreviewComponent`.

## Design system "Optic Ink"

Superficie monocroma tinta/papel con un único acento cian-láser. Elevación por luminancia en dark mode.

### Tokens (CSS variables, `:root` + `.dark`)
| Token | Light | Dark |
|---|---|---|
| `--color-background` | `#F6F7F9` | `#0B0E13` |
| `--color-surface` | `#FFFFFF` | `#12161D` |
| `--color-ink` (texto) | `#16181D` | `#EDEFF3` |
| `--color-graphite` | `#5A6472` | `#A6B0BE` |
| `--color-muted` | `#8A93A0` | `#6E7887` |
| `--color-border` | `#E3E6EA` | `rgba(255,255,255,.07)` |
| `--color-accent` | `#0E7490` | `#22D3EE` |
| `--color-accent-strong` | `#155E75` | `#67E8F9` |
| `--color-accent-soft` | `#DDF1F7` | `rgba(34,211,238,.12)` |

- **Contraste verificado**: ink sobre surface ≥ 12:1; graphite ≥ 5:1; muted ≥ 3:1 (solo metadatos). El botón primario en dark usa `--color-accent-foreground: #062A33` (tinta oscura sobre cian) para mantener ≥ 7:1.
- **QR preview**: siempre se muestra con sus propios colores (fg/bg del código) sobre marco blanco — nunca invertido por el theme, para que la vista previa sea fiel al print.
- **Tipografía**: Inter (UI) + JetBrains Mono (slugs, métricas, timestamps) con `font-variant-numeric: tabular-nums`. Headings con `text-wrap: balance`.
- **Motion**: transiciones 100-200ms ease-out; modal/toast con `slide-up` cubic-bezier(0.22,1,0.36,1); `prefers-reduced-motion: reduce` desactiva todo.
- **Dark mode**: clase `.dark` en `<html>`, persistida en `localStorage['sf_theme']`, inicial desde `prefers-color-scheme` vía `ThemeService`.

## Estructura

```
src/
├── main.ts / index.html / styles.css
├── app/
│   ├── app.config.ts          # providers (zoneless, router, http+interceptor)
│   ├── app.routes.ts          # lazy routes + guards
│   ├── guards/auth.guard.ts   # authGuard / guestGuard (CanActivateFn)
│   ├── interceptors/auth.interceptor.ts
│   ├── interfaces/models.ts   # User, Tag, QRCode, QrStats, ScanEventItem, DashboardStats…
│   ├── layouts/
│   │   ├── app-shell.component.ts   # sidebar + topbar + theme toggle + logout
│   │   └── auth-layout.component.ts # centrado para login/register
│   ├── pages/
│   │   ├── login/ register/ codes/ qr-create/ qr-detail/ qr-edit/ tags/ settings/
│   ├── services/              # auth, qr-codes, tags, scans, dashboard, download, theme, toast
│   └── shared/
│       ├── qr-form.component.ts      # form create/edit reutilizable + preview + contraste
│       ├── qr-preview.component.ts   # canvas qrcode
│       ├── scan-chart.component.ts   # SVG bars propio con tooltips
│       ├── breakdown-list.component.ts
│       ├── color-picker.component.ts # presets + input color
│       ├── badge / empty-state / skeleton / confirm-modal / toast-container
```

## Estado (signals)

- `AuthService`: `token`, `user`, `isAuthenticated` (computed). Persistencia en localStorage → **la sesión sobrevive al reload** (requisito del proyecto). `loadProfile()` en app-shell.
- `QrCodesService`: cache `codes[]` + `total` + `loading`; `toggleActive` con **actualización optimista y revert**.
- `ScansService`: `stats` + `range` (7/30/90); `loadScans` paginado.
- `ThemeService`: `isDark` con `effect()` que aplica clase + persistencia.
- `ToastService`: cola de toasts auto-dismiss 3.5s.

## Decisiones de UX

1. **Slug inmutable en edit** — los QR impresos apuntan al slug; cambiarlo rompería código ya impreso. Se explica en el subtitle.
2. **Preview en vivo en create** — el formulario regenera el QR con debounce y avisa con warning si el contraste fg/bg < 3:1 (el API lo rechaza igualmente, mejor UX avisar antes).
3. **KPI header en /codes** — el listado sirve de dashboard de un vistazo (total códigos, escaneos, 7d, media/día) sin ruta extra.
4. **Estados completos** — skeleton en cargas, empty states con CTA, error con retry, confirm modals para destructivas.
5. **Accesibilidad** — focus visible con focus-ring en todos los controles, aria-labels en icon buttons, la gráfica tiene `role="img"` + tooltips con valores exactos (no depende solo del color), toggle de contraseña visible.

## Build & preview

```bash
cd apps/web
npm run build                     # build:css + ng build → dist/web/browser/
# Preview same-origin con API (skill preview-server.mjs):
node /opt/data/skills/software-development/angular-nestjs-fullstack/scripts/preview-server.mjs dist/web/browser 3045 3105
# → http://localhost:3105  (login demo: demo@scanforge.app / demo1234)
```

## Deps clave
`@angular/core@22`, `@angular/router`, `@angular/common/http`, `qrcode@1.5`, `tailwindcss@4`, `@tailwindcss/postcss`, `postcss`, `zone.js`.
