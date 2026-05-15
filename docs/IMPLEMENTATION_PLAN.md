# Umsetzungsstand und nächste Prioritäten

## Bereits umgesetzt

### Schritt 1 – Setup ✅
- Node-Projekt initialisiert
- TypeScript konfiguriert (`strict: true`)
- Express-App angelegt
- Security-Basics eingebaut (`helmet`, `cors`, Cookie-Parsing, Fehlerbehandlung)
- Docker / docker-compose für lokale Entwicklung aufgesetzt
- Postgres, Redis und MinIO lokal vorgesehen

### Schritt 2 – Datenbank ✅
- Prisma initialisiert
- `schema.prisma` auf Basis des Fachmodells erstellt
- Kernmodelle und Enums definiert

### Schritt 3 – Auth & Profile ✅
- Registrierungs-Flow gebaut
- Login / Logout ergänzt
- Passwort-Hashing mit `argon2`
- JWT in `httpOnly`-Cookies
- Zod-Validierung für eingehende Requests
- Profilanlage für Nurse/Hospital mit Rollenlogik
- Auth-/RBAC-Basis ergänzt

### Schritt 4 – Matching & Trigger ✅
- Signing-Flow für MatchContract implementiert
- Wechsel auf `SIGNED` modelliert
- Ownership-Checks für Hospital-Admins ergänzt
- asynchrones Billing und WhatsApp-Queueing angestoßen

### Schritt 5 – Testing ✅
- erste Tests für Auth
- erste Tests für Matching
- erste Tests für Billing-Flow

### Zusätzlicher Sicherheitsbaustein ✅
- erster geschützter Dokumentenzugriffs-Flow vorgesehen
- Dokumentenzugriff an Match-/Hospital-Logik gekoppelt

## Nächste Prioritäten

### Priorität 1 – Stabilität & Korrektheit
1. Prisma-Migrationen anlegen
2. Idempotenz beim Signing / Billing härten
3. echten Storage-Zugriff für Dokumente anbinden

### Priorität 2 – Sicherheitskritische Lücken schließen
4. Dokumenten-Download mit S3/MinIO-Endpunkt vervollständigen
5. Auditierbarkeit / Event-Historie mitdenken
6. Dokumenten-/Verifikationsprozess fachlich schärfen

### Priorität 3 – Produktionsfähigkeit ausbauen
7. Worker und API-Prozess sauberer trennen
8. echte WhatsApp-Integration ergänzen
9. PDF-Generierung integrieren
10. DB-nahe Integrations-/E2E-Tests ausbauen

## MVP-Meinung

Der MVP sollte sich weiterhin auf diese Kette konzentrieren:
1. Nutzer anlegen
2. Profile verifizieren
3. Schicht anlegen
4. Match erzeugen
5. Vertrag/PDF erzeugen
6. Rechnung erzeugen
7. Notification verschicken

Alles andere ist nachrangig, bis diese Kernkette stabil und belastbar ist.
