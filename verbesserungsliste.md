# Shiftlink — Verbesserungsliste

> Basis: vollständiger Code-Review am 2026-06-04. 294 Commits, 174 Tests green, Phase 1–6 complete, Phase 7 (QA/Browser) blocked.

## 1. Kritisch — Produkt kann nicht live gehen

### 1.1 Kein Production-Server / Deployment
- ~~Es gibt keinen produktionsfähigen Server~~ ✅
- Multi-stage Dockerfile mit non-root user, HEALTHCHECK, production CMD
- nginx-Config vorhanden (HTTP + HTTPS-Template)
- docker-compose.dev.yml mit db, redis, minio, app
- DEPLOYMENT.md vorhanden
- **Erledigt:** 2026-06-06

### 1.2 Vite base path nicht gesetzt ✅
- `base` in vite.config.ts gesetzt (default `/`, über `VITE_BASE_PATH` konfigurierbar)
- **Erledigt:** 2026-06-06

### 1.3 API-Basis-URL hardcodet / nicht produktions-tauglich ✅
- `VITE_API_BASE_URL` Env-Variable wird von Vite automatisch exposed
- Fallback auf `/api/v1` für Production (same-origin hinter nginx)
- **Erledigt:** 2026-06-06

### 1.4 Keine Datenbank-Migration-Strategy
- `prisma:generate` existiert, aber es gibt kein Migrations-Script für Production
- **Fix:** `prisma migrate deploy` in Deployment-Pipeline, Seed-Script für initiales Setup

### 1.5 Kein Health-Check Endpoint ✅
- `/api/v1/health` vorhanden mit DB, Redis, Queue checks
- Gibt 200/503 zurück mit Latency-Info
- **Erledigt:** 2026-06-06

## 2. Wichtig — UX/UI Probleme

### 2.1 Nameless/unnamed Design
- Landing Page ist generisch ("Direct staffing marketplace"). Kein Marken-Gefühl, kein USP, keine Tonalität.
- **Fix:** Überarbeitete Landing Page mit klarer Botschaft, Shiftlink als Marke positionieren

### 2.2 AppShell zeigt rohes Session-User-ID ✅
- Zeigt jetzt E-Mail oder Rollenname statt roher User ID
- **Erledigt:** 2026-06-06

### 2.3 Kein Mobile-Responsive Design
- `AppShell` hat Sidebar-Layout ohne Mobile-Breakpoints
- Alle Feature-Pages sind Desktop-only
- **Fix:** Responsive CSS, Mobile-Nav (Hamburger), Viewport-aware Layout

### 2.4 Keine Ladezustände / Skeletons
- `AsyncState` existiert aber ist rudimentär — keine Skeletonskeletons, keine Loading-Spinner
- **Fix:** Konsistente Loading-States überall

### 2.5 Keine Error-Seite (404/500) ✅
- `ErrorBoundary` Komponente + 404 NotFoundPage
- ErrorBoundary wrappt die gesamte App
- Wildcard-Route zeigt NotFoundPage
- **Erledigt:** 2026-06-06

### 2.6 Kein Logout-Redirect ✅
- Logout führt jetzt zu `window.location.href = '/login'`
- **Erledigt:** 2026-06-06

### 2.7 `NurseContractsPage` fehlt in Navigation ✅
- Nav-Eintrag "Verträge" hinzugefügt unter Pflegekraft
- **Erledigt:** 2026-06-06

## 3. Wichtig — Code-Qualität / Architektur

### 3.1 Fehlende TypeScript Strictness ✅
- Backend: `strict: true` (war bereits gesetzt)
- Frontend: `strict: true` (war bereits gesetzt)
- **Erledigt:** 2026-06-06 (bereits vorhanden)

### 3.2 Keine API Error-Handling Strategie
- API-Calls haben kein einheitliches Error-Handling
- **Fix:** Globaler Error Handler, Retry-Logic, Timeout-Handling

### 3.3 AuthContext erntet User separat
- `setAuthenticatedUser` + `refreshSession` — doppelter State für Auth/User
- **Fix:** Konsolidieren, User in AuthState inkludieren

### 3.4 Tailwind ohne Konfiguration
- CSS-Klassen wie `app-shell`, `sidebar`, `content` — wo ist die Tailwind-Config? Wird nicht gefunden.
- **Fix:** `tailwind.config.js` prüfen/erstellen, Custom-Klassen als `@layer` definieren oder auf Tailwind-Standard setzen

### 3.5 `register` Route ohne Registrierungsflow für Krankenhäuser
- Registrierung ist nur für Nurses — Hospital-Registrierung fehlt
- **Fix:** Shared Register-Page mit Role-Auswahl oder separate Hospital-Registrierung

## 4. Nice-to-have — Shipquality

### 4.1 SEO / Meta Tags ✅
- `index.html` mit Title, description, og:title, og:description, theme-color
- **Erledigt:** 2026-06-06

### 4.2 Favicon / Branding ✅
- Inline SVG Favicon (blauer Kreis mit "S") in index.html
- **Erledigt:** 2026-06-06

### 4.3 Lokalisation UI ist gemischt — Teils Deutsch (Navigation: "Pflegekraft", "Einsätze"), Teils Englisch (Session Card: "Workspace", "Operations Console")
- **Fix:** Durchgängig Deutsch ODER Englisch

### 4.4 Konnte kein Print-Stylesheet finden
- Für PDF-Druck von Verträgen/Billing-Seiten
- **Fix:** `@media print` Styles

### 4.5 Keine Keyboard-Navigation / A11y
- Sidebar-Links might not be fully keyboard accessible
- **Fix:** `tabindex`, `aria-label`s, skip-links

### 4.6 Unused Imports Found
- `HybridStatusCard` imported but unlucky sure if used
- `StatCard` / `KpiCard` / `MetricList` — verify all used
- **Fix:** Cleanup unused exports

## 5. Tests — Lücken

### 5.1 Keine Frontend-Tests
- 174 Tests aber alles Backend. Kein einziger React/Vitest-Test.
- **Fix:** Vitest + React Testing Library setup + Component-Tests

### 5.2 Keine E2E-Tests
- Jest + etwas Code für Browser-QA aber kein Playwright/Puppeteer
- **Fix:** Playwright setup für Core-Flows (Login, Dashboard, Offer-Flow)

### 5.3 Keine API-Integration-Tests
- Controller-Tests Mock alles. kein Supertest/Integration-Test gegen echte API
- **Fix:** Supertest + test-DB für kritische Endpunkte

## 6. Sicherheit — Vor Produktion

### 6.1 CORS muss eingeschränkt werden ✅
- CORS erlaubt localhost (dev) + `APP_ORIGIN` + `ALLOWED_ORIGINS` (prod)
- Production: nur whitelisted Origins
- **Erledigt:** 2026-06-06

### 6.2 Rate Limiting fehlt ✅
- General API rate limiter (100 req/15min default)
- Auth rate limiter (10 req/15min, bereits vorhanden)
- **Erledigt:** 2026-06-06

### 6.3 Helmet / Security Headers ✅
- Helmet mit CSP, COEP, COOP, CORP, Referrer-Policy
- HSTS nur in Production
- **Erledigt:** 2026-06-06

### 6.4 Session/Cookie Config für Production ✅
- `secure: true` nur in Production, `sameSite: 'lax'`
- **Erledigt:** 2026-06-06 (bereits korrekt)

---

Priorisierung:

1. **Sofort** (kann nicht shippen): 1.1–1.5, 6.1–6.4
2. **Vor Launch** (2): 2.1–2.7, 3.1–3.5
3. **Kurz nach Launch** (3–5): 4.1–4.6, 5.1–5.3
