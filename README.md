# shiftlink

Digitaler Matching-Marktplatz für kurzfristige Pflegeeinsätze in Krankenhäusern, mit Fokus auf Direktvermittlung statt Zeitarbeit.

## Was in diesem Repo liegt

- `docs/PRODUCT.md` – Produktvision und Geschäftslogik
- `docs/ARCHITECTURE.md` – technisches Zielbild, Stack und Struktur
- `docs/IMPLEMENTATION_PLAN.md` – empfohlene Umsetzungsreihenfolge
- `docs/AI_INSTRUCTIONS.md` – Arbeitsanweisung für KI-/Coding-Agents

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

## Nächster sinnvoller Schritt

Als Nächstes sollte das technische Grundgerüst aus Schritt 1 umgesetzt werden: Node/TypeScript, Express, Docker, Postgres, Redis, Prisma und die Sicherheits-Basiskonfiguration.
