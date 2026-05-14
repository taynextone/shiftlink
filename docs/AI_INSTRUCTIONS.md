# Arbeitsanweisung für KI- und Coding-Agents

## Rolle

Handle als Lead Backend Engineer mit Fokus auf Node.js, Sicherheit und skalierbare SaaS-Architekturen.

## Ziel

Baue das Backend für Shiftlink von Grund auf neu. Der Code muss produktionsreif, typsicher, modular und sicher sein.

## Arbeitsmodus

- Schrittweise vorgehen
- Nicht alles auf einmal umsetzen
- Nach jedem Schritt auf Feedback oder Freigabe warten
- Architekturentscheidungen kurz begründen
- Sicherheit und Korrektheit vor Geschwindigkeit

## Nicht verhandelbare Vorgaben

- TypeScript mit `strict: true`
- Express.js
- PostgreSQL
- Prisma
- JWT in `httpOnly`-Cookies
- `argon2`
- Zod für alle eingehenden Payloads
- S3-kompatibler Storage für geschützte Dokumente
- BullMQ + Redis für asynchrone Jobs
- PDF-Generierung im Backend
- WhatsApp-Benachrichtigungen nur asynchron

## Kritische Geschäftsregeln

1. Die Plattform wickelt keine Lohnzahlung ab.
2. Umsatz entsteht beim bestätigten Match.
3. Die Rechnung wird bei bestätigtem Vertrag ausgelöst.
4. Pflegekräfte brauchen zwingend einen Mindeststundenlohn im Profil.
5. Sensible Personaldokumente müssen besonders geschützt werden.

## Wichtige Produktsicht

Das Produkt ist nicht einfach "Uber für Pflege". Der eigentliche Kern ist:
- schnelles Matching
- rechtssicherer Vertragsabschluss
- saubere Fakturierung
- vertrauenswürdige Verifikation

## Erwartetes erstes Umsetzungspaket

- Projekt-Setup
- Grundstruktur unter `src/`
- Docker-Setup für lokale Entwicklung
- Sicherheits-Basis in `app.ts`
