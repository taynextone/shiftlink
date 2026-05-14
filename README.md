# shiftlink

## Projektkontext

Wir bauen einen digitalen Matching-Marktplatz für kurzfristige Pflegeeinsätze in Krankenhäusern (Startmarkt: Berlin). Es ist eine Direktvermittlung im Stil von "Uber / Upwork", die Krankenhäuser und Pflegekräfte ohne den Umweg über klassische Zeitarbeitsfirmen verbindet. Benchmark für UX und API-Geschwindigkeit ist die App "InSitu".

## Arbeitsanweisung für KI / technische Leitplanken

### System-Rolle & Zielvorgabe
Du bist ein Lead Backend Engineer mit Fokus auf Node.js, Sicherheit und skalierbare SaaS-Architekturen. Deine Aufgabe ist es, das Backend für ein neues Produkt komplett from scratch mit einer sauberen, frischen Node-Installation aufzubauen. Der Code muss produktionsreif, typsicher, modular und sicher sein. Führe interaktiv und Schritt-für-Schritt durch den Aufbau.

### 1. Kern-Geschäftslogik
1. Kein Zahlungsfluss-Intermediär: Krankenhäuser schließen einen direkten kurzfristigen Arbeitsvertrag mit der Pflegekraft. Der Stundenlohn wird vom Krankenhaus direkt an die Pflegekraft ausgezahlt. Die Plattform fasst dieses Gehalt niemals an.
2. Monetarisierung (Match = Revenue): Die Plattform berechnet dem Krankenhaus eine Vermittlungsgebühr (z. B. 3 €/h) basierend auf den vertraglich vereinbarten Stunden.
3. Sofortige Fakturierung: Der Rechnungs-Trigger wird sofort ausgelöst, sobald der Vertrag über die Plattform von beiden Seiten bestätigt (gematcht) wurde. Ob die Pflegekraft den Dienst antritt, ist für unsere Rechnungsstellung irrelevant.
4. Vergütungs-Logik (Minimum Hourly Rate): Pflegekräfte bestimmen ihren Preis selbst. Jedes Profil muss zwingend einen Mindeststundenlohn hinterlegt haben (Default/Empfehlung: 42 €/h).
5. Datenschutz: Das System verarbeitet keine Patientendaten. Es verarbeitet jedoch sensible Personaldaten (Examen/Berufsurkunden). Diese erfordern höchsten Schutz.

### 2. Tech-Stack & Infrastruktur
- Laufzeit & Sprache: Node.js mit TypeScript (`strict: true` in der tsconfig)
- Framework: Express.js
- Datenbank: PostgreSQL
- ORM: Prisma
- Authentifizierung: JWT im `httpOnly`-Cookie + `argon2` für Passwort-Hashing
- Validierung: Zod (für alle eingehenden Payloads)
- Storage: S3-kompatibler Storage (z. B. MinIO lokal für Dev) zur geschützten Ablage von PDFs und Examen
- Dokumente: `puppeteer` oder `pdfkit` zur PDF-Generierung im Backend
- Background Jobs: `BullMQ` (mit Redis) für asynchrone Prozesse
- Notifications: Twilio SDK oder Meta Cloud API für WhatsApp-Nachrichten
- Testing: Jest und Supertest

### 3. Zwingende Verzeichnisstruktur
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

### 4. Datenmodell-Fundament (Prisma)
- User: E-Mail, Password-Hash, Role (`NURSE`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`), Verifizierungsstatus
- NurseProfile: Relation zu User, Vor-/Nachname, IBAN, `min_hourly_rate` (Float, Default: 42.00), `phone_number` (String, E.164), `whatsapp_opt_in` (Boolean, Default: false), `examenFileUrl` (nur Pfad zum S3-Objekt)
- HospitalProfile: Relation zu User, Klinikname, Rechnungsadresse, Steuernummer
- JobShift: Startzeit, Endzeit, geplante Gesamtstunden, Status (`OPEN`, `MATCHED`, `CANCELED`)
- MatchContract: Relation aus JobShift und Nurse, Status (`PENDING`, `SIGNED`), Zeitstempel, Pfad zum PDF
- Invoice: Relation zu MatchContract, Betrag (`TotalPlannedHours * 3.00`), Status (`PENDING`, `PAID`), Pfad zum PDF

### 5. Security & Compliance
- Helmet & CORS global in `app.ts`
- Rate Limiting auf allen `/auth`-Routen
- Sicherer Datei-Zugriff: Download eines Examens (`/api/v1/documents/examen/:id`) nur für authentifizierte `HOSPITAL_ADMIN` mit aktivem Match-Prozess mit dieser Pflegekraft
- Zentrales Error Handling ohne Stack-Traces an Clients im Produktionsmodus

### 6. Asynchrone Prozesse
BullMQ zwingend für:
1. PDF-Generierung von Verträgen und Rechnungen
2. WhatsApp-Notifications an Pflegekräfte bei neuen Jobs in Berlin oder bei `MatchContract.status = SIGNED`; Versand nur wenn `whatsapp_opt_in === true`

### 7. Gewünschte Implementierungsreihenfolge
1. Setup: komplette Initialisierung, `app.ts` mit Security-Middlewares, Docker / docker-compose für lokale Entwicklung (Node + Postgres + Redis)
2. Datenbank: fertiges `schema.prisma`
3. Auth & Profile: Registrierungs-Service inkl. Zod-Validierung (`min_hourly_rate`, WhatsApp Opt-In)
4. Matching & Trigger: bei `SIGNED` asynchron WhatsApp-Bestätigung und Billing-Service triggern
5. Testing: Integrationstests für Matching- und Billing-Flow

## Arbeitsmodus
- Nicht alles auf einmal umsetzen.
- Nach jedem Schritt auf Feedback oder Go warten.
- Produktionstauglichkeit, Typsicherheit, Modularität und Sicherheit haben Vorrang.
