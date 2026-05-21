# Architekturleitplanken

## Zielbild

Das Backend soll produktionsreif, modular, typsicher und sicher aufgebaut werden. Es wird von Grund auf neu mit Node.js und TypeScript erstellt.

## Tech-Stack

- Node.js
- TypeScript mit `strict: true`
- Express.js
- PostgreSQL
- Prisma
- JWT in `httpOnly`-Cookies
- `argon2` für Passwort-Hashing
- Zod für Payload-Validierung
- S3-kompatibler Storage (z. B. MinIO lokal)
- `puppeteer` oder `pdfkit` für PDF-Generierung
- BullMQ + Redis für Background Jobs
- Twilio SDK oder Meta Cloud API für WhatsApp-Nachrichten
- Jest + Supertest für Tests

## Zwingende Verzeichnisstruktur

```text
src/
├── config/         # env-Variablen (Zod validiert), Prisma Client, Redis, Queues, S3
├── controllers/    # Request/Response Handling (keine Geschäftslogik!)
├── middlewares/    # Auth, RBAC, Error Handling, Rate Limiting
├── routes/         # Express Router
├── services/       # Kern-Logik (Matching, Platform-Fee Billing, PDF, WhatsApp, Documents)
├── schemas/        # Zod-Schemas
├── types/          # Typ-Erweiterungen, z. B. Express Request
├── utils/          # Helper (JWT, Cookies, Async Handler)
├── workers/        # BullMQ Worker
└── app.ts          # Express App Konfiguration (Helmet, CORS)
```

## Datenmodell-Fundament

### User
- E-Mail
- Password-Hash
- Role: `NURSE`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`
- Verifizierungsstatus

### NurseProfile
- Relation zu User
- Vorname / Nachname
- IBAN
- `minHourlyRate` (**Decimal**, Default: 42.00)
- `phoneNumber` (E.164)
- `whatsappOptIn` (Boolean, Default: false)
- `examenFileUrl` (Pfad zum S3-Objekt)

### HospitalProfile
- Relation zu User
- Klinikname
- Rechnungsadresse
- Steuernummer

### JobShift
- Startzeit
- Endzeit
- geplante Gesamtstunden
- Status: `OPEN`, `MATCHED`, `CANCELED`

### MatchContract
- Relation zu JobShift und Nurse
- Offer-/Match-Status: `PENDING`, `DECLINED`, `SIGNED`, `EXPIRED`, `CANCELED`
- separater `executionStatus` für Vertragsausführung
- Zeitstempel (`respondedAt`, `signedAt`, `fullyExecutedAt`)
- Pfad zum Contract PDF Artifact
- Referenz auf aktuellen Contract Snapshot

### ContractSnapshot / Signature / Void
- `ContractSnapshot` als immutable Vertragsversion
- `ContractSignatureEvent` für Signatur-Intent + Evidence pro Akteur
- `ContractVoidEvent` für kontrollierte Vertragsaufhebung mit Begründung

### Invoice
- Relation zu MatchContract
- Betrag = `TotalPlannedHours * 3.00`
- Status: `PENDING`, `PAID`
- Pfad zum PDF

## Aktueller Implementierungsstand

Bereits umgesetzt:
- Security-Basis in `app.ts` (`helmet`, `cors`, Cookie-Parsing)
- Zod-validierte Env-Konfiguration
- Prisma- und Redis-Grundkonfiguration
- Registrierungs-Flow für `NURSE` und `HOSPITAL_ADMIN`
- Login / Logout
- Passwort-Hashing mit `argon2`
- JWT-Erstellung und `httpOnly`-Cookie
- Auth-, Rollen- und Ownership-Checks auf Match-/Hospital-/Contract-Ebene
- Verification-/Release-Gating für Pflegekräfte
- hospitalseitiger Dossier-Zugriff mit verifizierten Dokumenten
- Contract Snapshot Foundation
- Contract PDF Artifact Generation + Retrieval
- Contract Execution Signatures + Voiding Policy
- Contract Lifecycle Audit Read Model
- asynchrones Platform-Fee Billing-Queueing via BullMQ
- WhatsApp-Queueing aktuell gezielt für neue Pflegekraft-Angebote
- persistierte Outbox/Webhook-Events auch für Contract-Lifecycle-Meilensteine
- Tests für Auth, Match, Verification, Contract Lifecycle und Platform-Fee Billing

Noch offen bzw. bewusst unvollständig:
- Contract-PDF-Rendering von textuellem Artefakt auf finales Produktionsformat heben
- echte WhatsApp-Provider-Integration
- DB-Migrationen
- getrennte API-/Worker-Process-Strategie für Produktion
- Idempotenz- und Race-Condition-Härtung
- Doku-/Schema-Formalisation der neuen Contract-Lifecycle-Events

## Security by Design

- Helmet und CORS global in `app.ts`
- Rate Limiting auf allen `/auth`-Routen
- geschützter Dokumentenzugriff nur für passende `HOSPITAL_ADMIN`
- zentrales Error Handling ohne Stack-Traces an Clients im Produktionsmodus
- Auth per JWT im `httpOnly`-Cookie
- RBAC-Basis vorhanden
- Ownership-Prüfungen auf Match-/Hospital-Ebene teilweise vorhanden und weiter ausbaufähig

## Asynchrone Prozesse

BullMQ ist vorgesehen bzw. teilweise bereits genutzt für:
1. Delivery der persistierten Hospital-Webhooks (Outbox + Retry/Backoff)
2. WhatsApp-Notifications bei neu erstellten Pflegekraft-Angeboten mit Kurzdetails + Login-Link
3. Platform-Fee Erzeugung von Plattformgebühren-Rechnungen nach bestätigtem Match
4. perspektivisch weitere Artefakt-/PDF-Generierungsjobs

Vor Versand von WhatsApp-Nachrichten immer `whatsapp_opt_in === true` prüfen.


## WhatsApp-Adapter-Strategie

- interne Produktfunktion: `sendNewMatchOfferWhatsapp(...)`
- Providerwahl per Env (`mock`, vorbereitet für `twilio`)
- Worker kennt nur den fachlichen Offer-Job, nicht Produktentscheidungen für andere Statuswechsel
- `NURSE_LOGIN_URL` wird als Linkziel in die Angebotsnachricht eingebettet


## Hospital Integration v1

Zielbild für einfache Krankenhaus-Anbindung:
- REST-Import von Bedarfen/Schichten über `externalJobShiftId`
- idempotente Verarbeitung pro `hospitalProfileId + externalJobShiftId`
- persistierte Webhook-Outbox für Status-/Lifecycle-Events
- Read-API für operative Statusübersichten


## Fachliche Leitplanke: keine Arbeitgeber-/Payroll-Logik

Architektur und Datenmodell dürfen nicht in Richtung Arbeitgeber-, Zeitarbeits- oder Payroll-System abdriften.

Das bedeutet konkret:
- keine Lohnabrechnung der Pflegekraft in Shiftlink
- keine Auszahlungssysteme für Pflegekräfte
- keine Wallet-/Payout-Modelle
- Rechnungen und Exporte beziehen sich nur auf die **Plattformgebühr** gegenüber dem Krankenhaus
- Arbeits-/Vergütungsverhältnis liegt zwischen Krankenhaus und Pflegekraft


## Contract Lifecycle Surface (aktuell)

Wichtige Backend-Endpunkte für den Vertragslebenszyklus:

- `GET /api/v1/matches/contract/:id`
- `GET /api/v1/matches/contract/:id/pdf`
- `GET /api/v1/matches/contract/:id/lifecycle`
- `GET /api/v1/matches/contract/:id/execution`
- `POST /api/v1/matches/contract/:id/execution/sign`
- `GET /api/v1/matches/contract/:id/void`
- `POST /api/v1/matches/contract/:id/void`

## Contract Lifecycle Webhook Events (aktuell)

Persistiert und retrybar über Outbox/Queue:

- `match.offer.signed`
- `contract.pdf.generated`
- `contract.execution.signed`
- `contract.execution.fully-executed`
- `contract.voided`


## Formale Schnittstellen-Doku

Die aktuelle API- und Webhook-Vertragsbeschreibung liegt in `docs/API_CONTRACTS.md`.
Sie dient als operative Referenz für Integrationen, bis eine vollständige OpenAPI-/JSON-Schema-Ebene ergänzt wird.
