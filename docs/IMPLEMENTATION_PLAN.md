# Empfohlene Umsetzungsreihenfolge

## Prinzip

Nicht alles auf einmal bauen. Jeder Abschnitt soll klar abgeschlossen und reviewbar sein.

## Schritt 1 – Setup
- Node-Projekt initialisieren
- TypeScript konfigurieren (`strict: true`)
- Express-App anlegen
- Security-Basics einbauen (`helmet`, `cors`, Cookie-Parsing, zentrale Fehlerbehandlung)
- Docker / docker-compose für lokale Entwicklung aufsetzen
- Postgres und Redis lokal bereitstellen

## Schritt 2 – Datenbank
- Prisma initialisieren
- `schema.prisma` auf Basis des Fachmodells erstellen
- erste Migration anlegen

## Schritt 3 – Auth & Profile
- Registrierungs-Flow bauen
- Passwort-Hashing mit `argon2`
- JWT in `httpOnly`-Cookies
- Zod-Validierung für eingehende Requests
- Profilanlage für Nurse/Hospital mit sauberer Rollenlogik

## Schritt 4 – Matching & Trigger
- Matching-Logik implementieren
- Wechsel auf `SIGNED` modellieren
- bei `SIGNED` asynchron Billing und Benachrichtigungen triggern

## Schritt 5 – Testing
- Integrationstests für Auth
- Integrationstests für Matching
- Integrationstests für Billing-Flow

## MVP-Meinung

Der MVP sollte sich auf diese Kette konzentrieren:
1. Nutzer anlegen
2. Profile verifizieren
3. Schicht anlegen
4. Match erzeugen
5. Vertrag/PDF erzeugen
6. Rechnung erzeugen
7. Notification verschicken

Alles andere ist nachrangig, bis diese Kernkette stabil ist.
