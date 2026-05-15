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
├── services/       # Kern-Logik (Matching, Billing, PDF, WhatsApp, Documents)
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
- Status: `PENDING`, `SIGNED`
- Zeitstempel
- Pfad zum PDF

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
- Auth-, Rollen- und erste Ownership-Middleware/-Checks
- Match-Signing-Endpoint
- asynchrones Billing-/WhatsApp-Queueing via BullMQ
- erster geschützter Dokumentenzugriffs-Flow im Backend
- erste Tests für Auth, Match und Billing

Noch offen bzw. bewusst unvollständig:
- geschützter Dokumentenzugriff an echten S3/MinIO-Download anbinden
- PDF-Generierung
- echte WhatsApp-Provider-Integration
- DB-Migrationen
- getrennte API-/Worker-Process-Strategie für Produktion
- Idempotenz- und Race-Condition-Härtung

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
1. PDF-Generierung von Verträgen und Rechnungen
2. WhatsApp-Notifications bei neuen Jobs in Berlin oder bei `MatchContract.status = SIGNED`
3. Billing-/Invoice-Erzeugung nach bestätigtem Match

Vor Versand von WhatsApp-Nachrichten immer `whatsapp_opt_in === true` prüfen.
