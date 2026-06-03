# Shiftlink — Verbesserungsliste

> Basis: vollständiger Code-Review am 2026-06-04. 294 Commits, 174 Tests green, Phase 1–6 complete, Phase 7 (QA/Browser) blocked.

## 1. Kritisch — Produkt kann nicht live gehen

### 1.1 Kein Production-Server / Deployment
- Es gibt keinen produktionsfähigen Server. `npm start` führt `dist/server.js` aus, aber es fehlt:
  - Reverse Proxy Konfiguration (nginx/Caddy)
  - SSL/TLS Setup
  - Environment-Management für Production
  - Prozessmanager (PM2/systemd)
- **Was fehlt:** `Dockerfile`, `docker-compose.yml`, nginx-Config, Deployment-Doku

### 1.2 Vite base path nicht gesetzt
- `web/vite.config.ts` hat kein `base` Attribut. In Produktion (z.B. hinter nginx-Subpath) brechen alle Assets und Routes.
- **Fix:** `base` konfigurieren oder sicherstellen dass Setup relativ funktioniert

### 1.3 API-Basis-URL hardcodet / nicht produktions-tauglich
- Die Web-App muss wissen wo das Backend läuft. Ohne Konfiguration geht das nicht live.
- **Fix:** `VITE_API_URL` Env-Variable durchgängig nutzen, Fallback für Dev

### 1.4 Keine Datenbank-Migration-Strategy
- `prisma:generate` existiert, aber es gibt kein Migrations-Script für Production
- **Fix:** `prisma migrate deploy` in Deployment-Pipeline, Seed-Script für initiales Setup

### 1.5 Kein Health-Check Endpoint
- Der Server hat keinen `/health` Endpoint für Monitoring/Loadbalancer
- **Fix:** `GET /health` der DB + Redis prüft und 200/503 zurückgibt

## 2. Wichtig — UX/UI Probleme

### 2.1 Nameless/unnamed Design
- Landing Page ist generisch ("Direct staffing marketplace"). Kein Marken-Gefühl, kein USP, keine Tonalität.
- **Fix:** Überarbeitete Landing Page mit klarer Botschaft, Shiftlink als Marke positionieren

### 2.2 AppShell zeigt rohes Session-User-ID
- In der Sidebar steht `User ID: 12345` — das ist ein UX-No-Go für Produktion
- **Fix:** Name/E-Mail anzeigen statt roher ID

### 2.3 Kein Mobile-Responsive Design
- `AppShell` hat Sidebar-Layout ohne Mobile-Breakpoints
- Alle Feature-Pages sind Desktop-only
- **Fix:** Responsive CSS, Mobile-Nav (Hamburger), Viewport-aware Layout

### 2.4 Keine Ladezustände / Skeletons
- `AsyncState` existiert aber ist rudimentär — keine Skeletonskeletons, keine Loading-Spinner
- **Fix:** Konsistente Loading-States überall

### 2.5 Keine Error-Seite (404/500)
- Kein `ErrorBoundary` in der App, keine 404-Seite
- **Fix:** React Error Boundary, 404-Seite, generische Error-Fallbacks

### 2.6 Kein Logout-Redirect
- Logout setzt State aber navigiert nicht zur Login-Seite
- **Fix:** Nach Logout → `/login` redirect

### 2.7 `NurseContractsPage` fehlt in Navigation
- Route existiert (`/nurse/contracts`) aber kein Nav-Eintrag im AppShell
- **Fix:** Nav-Eintrag hinzufügen oder Route entfernen wenn nicht gebraucht

## 3. Wichtig — Code-Qualität / Architektur

### 3.1 Fehlende TypeScript Strictness
- `tsconfig.json` hat vermutlich `strict: false`
- **Fix:** `strict: true` aktivieren, alle Errors fixen

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

### 4.1 SEO / Meta Tags
- Kein `<title>`, keine Meta-Descriptions, kein Open Graph
- **Fix:** `react-helmet-async` oder Vite-Plugin für Meta-Tags

### 4.2 Favicon / Branding Kein Favicon, kein Logo (nur "S" als Text-Brandmark)
- **Fix:** SVG-Logo, Favicon, App-Icons

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

### 6.1 CORS muss eingeschränkt werden
- Vermutlich `cors()` ohne Origin-Restriction im Dev-Modus
- **Fix:** Production-CORS whitelist

### 6.2 Rate Limiting fehlt
- Kein `express-rate-limit` sichtbar
- **Fix:** Rate-Limiter für Auth + API-Routes

### 6.3 Helmet / Security Headers
- Kein `express-helmet` sichtbar
- **Fix:** Helmet aktivieren, HSTS, CSP

### 6.4 Session/Cookie Config für Production
- `secure: true`, `sameSite` für Cookies?
- **Fix:** Production-Session-Config prüfen

---

Priorisierung:

1. **Sofort** (kann nicht shippen): 1.1–1.5, 6.1–6.4
2. **Vor Launch** (2): 2.1–2.7, 3.1–3.5
3. **Kurz nach Launch** (3–5): 4.1–4.6, 5.1–5.3
