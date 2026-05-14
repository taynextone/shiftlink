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
├── config/         # env-Variablen (Zod validiert), Prisma Client, Redis
├── controllers/    # Request/Response Handling (keine Geschäftslogik!)
├── middlewares/    # Auth, RBAC, Error Handling, Rate Limiting
├── routes/         # Express Router (z. B. /api/v1/jobs)
├── services/       # Kern-Logik (Matching, Billing, PDF, WhatsApp)
├── schemas/        # Zod-Schemas
├── utils/          # Helper (Logger, Crypto)
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
- `min_hourly_rate` (Float, Default: 42.00)
- `phone_number` (E.164)
- `whatsapp_opt_in` (Boolean, Default: false)
- `examenFileUrl` (nur Pfad zum S3-Objekt)

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

## Security by Design

- Helmet und CORS global in `app.ts`
- Rate Limiting auf allen `/auth`-Routen
- Geschützter Dokumentenzugriff nur für passende `HOSPITAL_ADMIN`
- Zentrales Error Handling ohne Stack-Traces an Clients im Produktionsmodus

## Asynchrone Prozesse

BullMQ ist Pflicht für:
1. PDF-Generierung von Verträgen und Rechnungen
2. WhatsApp-Notifications bei neuen Jobs in Berlin oder bei `MatchContract.status = SIGNED`

Vor Versand von WhatsApp-Nachrichten immer `whatsapp_opt_in === true` prüfen.
