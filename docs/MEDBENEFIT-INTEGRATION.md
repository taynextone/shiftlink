# MedBenefit × ShiftLink — Integrationskonzept

**Stand:** 25.08.2026 · **Stufe A: LIVE** (implementiert & deployed) · Stufen B/C: Konzept

## ✅ Was live ist (Stufe A, seit 25.08.2026)

### MOS-Core Seite

- **`GET /api/v1/mos/deals/active`** (app/api/deals-active.ts) — Service-to-Service
  Endpoint mit `x-mos-service-token`-Auth (gleiche Mechanik wie QualiPass-Status).
  Liefert alle aktiven, nicht abgelaufenen Deals:
  `{ deals: [{ id, title, partner, category, discountText, description, redemptionInfo?, validUntil? }] }`
- Commit `4290585` (lokal; kein Remote konfiguriert).

### ShiftLink Seite

- **`src/services/medbenefit.service.ts`** — holt die Deals und cached sie in Redis
  (10 min TTL; bei MOS-Ausfall 60 s Negativ-Cache, damit das Dashboard nicht blockiert).
- **`GET /api/v1/medbenefit/deals`** — authentifiziert, antwortet mit
  `{ deals: [...], available: boolean }`. `available=false` = MOS down/leer.
- **Nurse-Dashboard**: Abschnitt „MedBenefit Vorteile" unterhalb der Dokumenten-Karte —
  Deal-Karten mit Kategorie-Badge, Rabatt (Indigo #6157FF), Partner und
  Einlöse-Hinweis. Verschwindet automatisch, wenn keine Deals da sind.
- Commit `2b152cd`, deployed & E2E-verifiziert (3 Demo-Deals live).

### Einlösen funktioniert weiterhin in MOS

Die Vitrine zeigt nur an. Das eigentliche `deals.redeem` (mit QualiPass-Prüfung
und persönlichem Code) läuft wie bisher über MOS selbst — der Nutzer klickt sich
bei Bedarf dorthin durch (SSO existiert ja).

---

## Was MedBenefit bereits ist (in MOS-Core)

MOS-Core hat MedBenefit als **Deals-Modul** vollständig gebaut:

- **`deals`-Tabelle**: Titel, Partner, Beschreibung, Kategorie (FORTBILDUNG / VERSICHERUNG / EQUIPMENT / SONSTIGES), Rabatt-Text, `requiresVerifiedProfile`, Gültigkeit
- **`deal_redemptions`**: personalisierter Einlöse-Code pro Nutzer + Deal
- **tRPC-Router `deals`**:
  - `deals.list` — öffentlich (Marketing)
  - `deals.mine` — eigene Einlösungen
  - `deals.redeem` — Einlösung **gekoppelt an QualiPass**: nur VERIFIED/PARTIALLY_VERIFIED bekommen einen Code. Der QualiPass ist die „Eintrittskarte".
- Admin-Verwaltung der Deals existiert (`adminQuery`).

## Rolle von ShiftLink im Ökosystem

ShiftLink ist die **Arbeits-Ebene** (Matching + Verträge). MedBenefit ist die **Vorteils-Ebene**. Der natürliche Berührungspunkt:

> Die Pflegekraft arbeitet einen Shift → bekommt ihr Geld direkt vom Krankenhaus
> → und als „Danach" ihre Deals: Fortbildungsrabatte, Versicherung, Equipment.

MedBenefit verstärkt damit genau den Anreiz, über ShiftLink zu arbeiten — ohne dass
ShiftLink selbst Geldflüsse berührt (Geschäftsmodell: reine Direktvermittlung).

## Weitere Integrationsstufen

### Stufe B — Einlösen direkt aus ShiftLink (Konzept)

- `POST /api/v1/mos/deals/redeem` (service-token, mosUserId + dealId) in MOS ergänzen;
  MOS prüft QualiPass intern und erzeugt den Code.
- ShiftLink zeigt den Code direkt in der App („Dein Code: ABC123").
- Voraussetzung: ShiftLink kennt `mosUserId` — vorhanden sobald MOS-Konto verbunden.

### Stufe C — Kontextuelle Deals (später, Konzept)

- Nach Vertragsabschluss: gezielte Vorschläge (z. B. EQUIPMENT-Deals vor dem ersten Einsatz).
- Nach X absolvierten Schichten: FORTBILDUNG-Rabatt als Belohnung.
- Benachrichtigungskanal WhatsApp/Mail (Infrastruktur existiert).

## Geschäftsmodell-Sicherheit

- Shiftlink bleibt reine Vermittlungsplattform; Deals gehören MOS/MedBenefit.
- KEINE Provisionsflüsse über ShiftLink. Deal-Partnern vertraglich in MOS regeln.
- `requiresVerifiedProfile=true` macht den QualiPass zum Werterzeuger — stärkt das
  ganze Ökosystem (mehr Verifizierung = mehr Vertrauen im Matching).
