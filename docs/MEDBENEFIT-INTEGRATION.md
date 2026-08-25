# MedBenefit × ShiftLink — Integrationskonzept

**Stand:** 25.08.2026 · Status: Konzept (nicht implementiert)

## Was MedBenefit bereits ist (in MOS-Core, live)

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

## Integrationsstufen

### Stufe A — Deal-Vitrine im Nurse-Dashboard (empfohlener Start)

- Neuer Abschnitt „MedBenefit Vorteile" auf dem Pflegekraft-Dashboard.
- Datenquelle: MOS-Core. Da tRPC (kein REST), zwei Wege:
  - **a1) Service-Token-Endpoint in MOS** (wie QualiPass-Status): `GET /api/v1/mos/deals/active`
    mit `x-mos-service-token` → ShiftLink cached die Liste (gleiche Cache-Mechanik wie
    `getQualipassStatus`). Empfohlen: sauber, kein Nutzer-Login nötig.
  - a2) SSO-Bridge: Nutzer klickt „Bei MOS ansehen" → bestehender SSO-Flow (Stufe 3)
    loggt ihn in MOS ein, Deals werden dort angezeigt. Kein neuer Endpoint nötig,
    aber keine Inline-Anzeige in ShiftLink.
- Anzeige: Karten mit Titel, Partner, Rabatt-Text, Kategorie-Badge (MOS-Designsystem).
- Klick → „Einlösen in MOS" (leitet in MOS, SSO) ODER direkt redeem via Service-API.

### Stufe B — Einlösen direkt aus ShiftLink

- `POST /api/v1/mos/deals/redeem` (service-token, mosUserId + dealId) in MOS ergänzen;
  MOS prüft QualiPass intern und erzeugt den Code.
- ShiftLink zeigt den Code direkt in der App („Dein Code: ABC123").
- Voraussetzung: ShiftLink kennt `mosUserId` — vorhanden sobald MOS-Konto verbunden.

### Stufe C — Kontextuelle Deals (später)

- Nach Vertragsabschluss: gezielte Vorschläge (z. B. EQUIPMENT-Deals vor dem ersten Einsatz).
- Nach X absolvierten Schichten: FORTBILDUNG-Rabatt als Belohnung.
- Benachrichtigungskanal WhatsApp/Mail (Infrastruktur existiert).

## Geschäftsmodell-Sicherheit

- Shiftlink bleibt reine Vermittlungsplattform; Deals gehören MOS/MedBenefit.
- KEINE Provisionsflüsse über ShiftLink. Deal-Partnern vertraglich in MOS regeln.
- `requiresVerifiedProfile=true` macht den QualiPass zum Werterzeuger — stärkt das
  ganze Ökosystem (mehr Verifizierung = mehr Vertrauen im Matching).

## Aufwandsschätzung

| Stufe | Umfang | Aufwand |
|---|---|---|
| A (a1) | MOS-Endpoint + ShiftLink-Service/Cache + Dashboard-Abschnitt | ~0,5–1 Tag |
| B | Redeem-Endpoint + Code-Anzeige | ~0,5 Tag |
| C | Kontextlogik + Notifications | offen |

## Nächster konkreter Schritt

1. In MOS-Core: `GET /api/v1/mos/deals/active` (service-token) — analog zum bestehenden
   QualiPass-Status-Endpoint, ~20 Zeilen.
2. In ShiftLink: `medbenefit.service.ts` (Cache nach qualipass.service-Vorbild),
   Dashboard-Abschnitt „MedBenefit" unterhalb der Onboarding-Karte.
