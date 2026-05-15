# shiftlink

Digitaler Matching-Marktplatz für kurzfristige Pflegeeinsätze in Krankenhäusern, mit Fokus auf Direktvermittlung statt Zeitarbeit.

## Projektstatus

Das Repo ist nicht mehr nur Konzept oder Doku. Es enthält bereits ein erstes lauffähiges Backend-Fundament mit:
- Node.js + TypeScript + Express
- Prisma + PostgreSQL-Grundlage
- Redis + BullMQ-Grundlage
- Registrierung mit Rollenlogik
- JWT im `httpOnly`-Cookie
- erste RBAC-/Auth-Middleware
- Match-Signing mit Billing-/WhatsApp-Queue-Triggern
- erste Tests für Registration, Matching und Billing

## Was in diesem Repo liegt

- `docs/PRODUCT.md` – Produktvision und Geschäftslogik
- `docs/ARCHITECTURE.md` – technisches Zielbild, Ist-Stand und Architekturleitplanken
- `docs/IMPLEMENTATION_PLAN.md` – erledigte Schritte und nächste Prioritäten
- `docs/AI_INSTRUCTIONS.md` – Arbeitsanweisung für KI-/Coding-Agents

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
2. Login/Logout ergänzen
3. Ownership-Checks für Hospitals/Contracts härten
4. Dokumentenzugriff absichern
5. Idempotenz und Race-Condition-Schutz ergänzen
6. Worker/API für Produktion sauberer trennen
7. Integrations- und DB-nahe Tests ausbauen
