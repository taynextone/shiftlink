# shiftlink

Digitale Vermittlungs- und Matching-Plattform für kurzfristige Pflegeeinsätze in Krankenhäusern, mit Fokus auf Direktvermittlung statt Zeitarbeit.

## Projektstatus

Das Repo ist nicht mehr nur Konzept oder Doku. Es enthält bereits ein erstes lauffähiges Backend-Fundament mit:
- Node.js + TypeScript + Express
- Prisma + PostgreSQL-Grundlage
- Redis + BullMQ-Grundlage
- Registrierung mit Rollenlogik
- Login / Logout
- JWT im `httpOnly`-Cookie
- RBAC- und erste Ownership-Checks
- Match-Offer-Flow für Pflegekräfte mit WhatsApp-Angebots-Trigger
- Verification-/Release-Gating für Pflegekräfte vor Marketplace/Offerability
- hospitalseitige Dossier-Sicht mit strikt berechtigtem Dokumentenzugriff
- immutable Contract Snapshots + Contract-PDF-Artefakte
- Contract Execution Signatures, Voiding-Policy und Audit-Lifecycle-Read-Model
- Match-Signing mit Platform-Fee Triggern für Plattformgebühren-Rechnungen
- persistierte Contract-/Hospital-Webhooks über Outbox + Queue
- erste Tests für Registration, Auth, Matching, Contract Lifecycle und Platform-Fee Billing

## Was in diesem Repo liegt

- `docs/PRODUCT.md` – Produktvision und Geschäftslogik
- `docs/ARCHITECTURE.md` – technisches Zielbild, Ist-Stand und Architekturleitplanken
- `docs/IMPLEMENTATION_PLAN.md` – erledigte Schritte und nächste Prioritäten
- `docs/AI_INSTRUCTIONS.md` – Arbeitsanweisung für KI-/Coding-Agents
- `docs/API_CONTRACTS.md` – konkrete API- und Webhook-Verträge des aktuellen Backends

## Lokaler Einstieg

### Voraussetzungen
- Node.js 22+
- Docker + Docker Compose

### Setup
1. `.env.example` nach `.env` kopieren
2. Dependencies installieren:
   - `npm install`
3. Lokale Infrastruktur starten:
   - `docker compose up -d postgres redis minio`
4. Prisma Client generieren:
   - `npm run prisma:generate`
5. Dev-Server starten:
   - `npm run dev`

### Nützliche Befehle
- Build prüfen: `npm run build`
- Tests ausführen: `npm test`

## Kurzfazit

Das Projekt hat eine gute, klar monetarisierbare Grundidee: Die Plattform verdient am erfolgreichen Match, ohne selbst in den Lohnfluss zu geraten. Das vereinfacht Regulierung und operativen Aufwand deutlich.

Die kritischen Punkte sind aus meiner Sicht:
- Vertrauen auf beiden Seiten schnell genug aufbauen
- Dokumente und Identitäten sauber verifizieren
- Matching/Vertrag/Fakturierung wasserdicht und einfach halten
- nicht zu früh zu viel Produktbreite bauen

## Meine Meinung

Ich halte die Richtung für stark, vor allem weil die Monetarisierung direkt an ein klares Ereignis gekoppelt ist: den bestätigten Match.

Was ich gut finde:
- kein eigener Zahlungsabwicklungsapparat nötig
- klare B2B-Einnahmelogik
- enger Startmarkt ist vernünftig
- die Sicherheits- und Compliance-Sensibilität ist schon früh mitgedacht

Worauf ich achten würde:
- Der eigentliche Engpass ist wahrscheinlich nicht das Backend, sondern Marktvertrauen, Verfügbarkeit von Pflegekräften und die operative Qualität der ersten Vermittlungen.
- "Uber für Pflege" klingt stark, aber der echte Produktkern ist eher: schneller, verlässlicher, rechtssicherer Match + sauberer Vertrags- und Nachweisprozess.
- Ich würde MVP-seitig sehr bewusst klein starten: Profile, Verifikation, Schichten, Match, Vertrag, Rechnung, Notifications. Nicht viel mehr.

## Nächste sinnvolle Schritte

1. Prisma-Migrationen anlegen
2. geschützten Dokumenten-Download mit echtem Storage verbinden
3. Worker/API für Produktion sauberer trennen
4. Integrations- und DB-nahe Tests ausbauen
5. API-/Produktdoku der Contract Lifecycle Surface weiter schärfen


## WhatsApp-Angebote

Aktuell ist genau eine WhatsApp beim neu erstellten Angebot vorgesehen.
Konfiguration per Env:
- `WHATSAPP_PROVIDER=mock|twilio`
- `NURSE_LOGIN_URL=https://...`
- bei Twilio zusätzlich: `WHATSAPP_FROM_NUMBER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`


## Hospital Integration v1

Aktuell vorgesehen bzw. umgesetzt:
- idempotenter Shift-Import über `POST /api/v1/job-shifts/import` mit `externalJobShiftId`
- Hospital Read-API über `GET /api/v1/job-shifts`
- Nurse-Dossier-Zugriff für berechtigte Kliniken über `GET /api/v1/documents/dossier/:id`
- Contract Lifecycle APIs über:
  - `GET /api/v1/matches/contract/:id`
  - `GET /api/v1/matches/contract/:id/pdf`
  - `GET /api/v1/matches/contract/:id/lifecycle`
  - `GET /api/v1/matches/contract/:id/execution`
  - `POST /api/v1/matches/contract/:id/execution/sign`
  - `GET /api/v1/matches/contract/:id/void`
  - `POST /api/v1/matches/contract/:id/void`
- Webhook-Outbox für Status-/Lifecycle-Events wie `shift.created`, `shift.imported`, `match.offer.signed`, `contract.execution.signed`, `contract.execution.fully-executed`, `contract.pdf.generated`, `contract.voided`


## Wichtige Abgrenzung

Shiftlink ist **keine Zeitarbeitsfirma** und **nicht Arbeitgeber der Pflegekräfte**.

- Das Krankenhaus schließt den Einsatz bzw. Vertrag direkt mit der Pflegekraft.
- Das Krankenhaus zahlt die Pflegekraft direkt.
- Shiftlink übernimmt Matching, Vermittlungsprozess, Dokumenten-/Statusfluss und die Abrechnung der **Plattformgebühr** an das Krankenhaus.
- Shiftlink wickelt **keine Lohnzahlung** an Pflegekräfte ab.
