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
- Passwort-Hashing mit `argon2`
- JWT in `httpOnly`-Cookies
- Zod-Validierung für eingehende Requests
- Profilanlage für Nurse/Hospital mit Rollenlogik
- erste Auth-/RBAC-Basis ergänzt

### Schritt 4 – Matching & Trigger ✅
- Signing-Flow für MatchContract implementiert
- Wechsel auf `SIGNED` modelliert
- asynchrones Billing und WhatsApp-Queueing angestoßen

### Schritt 5 – Testing ✅
- erste Tests für Auth
- erste Tests für Matching
- erste Tests für Billing-Flow

## Nächste Prioritäten

### Priorität 1 – Stabilität & Korrektheit
1. Prisma-Migrationen anlegen
2. Login / Logout ergänzen
3. Ownership-Prüfungen auf Ressourcenebene einführen
4. Idempotenz beim Signing / Billing härten

### Priorität 2 – Sicherheitskritische Lücken schließen
5. Dokumentenzugriff absichern
6. Examen-/PDF-Storage sauber anbinden
7. Auditierbarkeit / Event-Historie mitdenken

### Priorität 3 – Produktionsfähigkeit ausbauen
8. Worker und API-Prozess sauberer trennen
9. echte WhatsApp-Integration ergänzen
10. PDF-Generierung integrieren
11. DB-nahe Integrations-/E2E-Tests ausbauen

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
