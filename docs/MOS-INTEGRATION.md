# MOS-Ökosystem Integration (Stand: 23.08.2026)

Quelle: `Kimi_Agent_Website-Feedback und Anpassungen für MedBenefit(1).zip`
(`~/Downloads/`, enthält `Projekt-Handover-MOS-MedBenefit.md`, `mos-modell/`
Style-Guide und das laufende MOS-Core-Frontend unter `app/`).

## 1. Klare Produktrolen (aus dem Handover, verbindlich)

| Produkt | Rolle | Technischer Stand |
|---|---|---|
| **MOS Core** | Betriebssystem-Fundament (Konto, Profil, Audit, Notifications) | Läuft (React 19 + Hono/tRPC + MySQL/Drizzle, Kimi-OAuth), Port 3000 |
| **QualiSafe** | Prüf-Seite: Nachweise hochladen + verifizieren lassen | Fertig, E2E-getestet (`/app/documents`, `/verifier`) |
| **QualiPass** | Anzeige-Seite: verifizierter digitaler Nachweis | Fertig (`/app/pass`), PDF/Wallet fehlt |
| **MedBenefit** | B2C-Mitgliedschaft mit Deals für verifizierte Fachkräfte | **Landing verkauft es, Deals-Modul FEHLT** (Roadmap #1 im Handover!) |
| **ShiftLink** | Direktvermittlung kurzer Einsätze (unser Repo) | Backend weit, wird im MOS-Frontend als „In Arbeit"-Placeholder geführt |

**Wichtig:** „MedBenefit" ist keine eigene App mit eigenem Backend — die
Landing UND der Member-Bereich sind dieselbe MOS-Core-Anwendung. Das
Deals-Modul ist dort die offiziell empfohlene nächste Baustein.

## 2. Auth-Realität

- MOS Core nutzt **Kimi-OAuth** (OpenID Connect), Session = httpOnly-JWT-Cookie
  (`kimi_sid`, Payload `{unionId, clientId}`).
- ShiftLink nutzt eigenes JWT-Auth (E-Mail/Passwort).
- **Es gibt aktuell KEINEN gemeinsamen Login.** „Ein Account für alles" ist
  heute nur Marketing-Wahrheit, nicht Technik.

## 3. Integrationsplan (realistisch, priorisiert)

### Phase A — Sofort umsetzbar (ShiftLink-seitig)
1. `VITE_MEDBENEFIT_URL` / `VITE_QUALIPASS_URL` auf die MOS-Core-Domain
   zeigen lassen, sobald diese öffentlich erreichbar ist (Env-only,
   Landing-Kacheln funktionieren dann ohne Code-Change).
2. QualiPass-Signal-API nutzen (bereits gebaut):
   `GET /api/v1/mos/qualipass/status/:publicId` mit `x-mos-service-token`.
   Damit kann MOS Core später ShiftLink-Freigaben abfragen.

### Phase B — Verifizierungs-Bridge (der eigentliche Hebel)
Zwei Richtungen möglich:
- **A) MOS führt**: MOS Core (QualiPass-Status `VERIFIED`) ist Source of
  Truth. ShiftLink fragt per Signal-API nach und setzt intern
  `isReleasedForMatching`. Kein doppelter Upload für Fachkräfte.
- **B) ShiftLink führt**: ShiftLink-Verifikation (EXAMEN etc.) wird per
  Webhook an MOS Core gemeldet (dort gibt es noch keinen Inbound — müsste
  gebaut werden).

Empfehlung: **A**. QualiSafe/Prüferbereich existiert und ist getestet;
ShiftLink sollte Verifikation NICHT duplizieren. Unser
Verification-Gate bleibt als Fallback für Nutzer ohne QualiPass.

### Phase C — Deals-Modul (in MOS Core bauen, NICHT in ShiftLink)
Gehört zur MedBenefit-Welt (Handover Roadmap #1): Deal-Liste im
Member-Hub, Kategorien (Fortbildung, Versicherungen, Equipment),
Einlösung gekoppelt an QualiPass-Status. Tech: Drizzle-Schema-Erweiterung
(`deals`, `deal_redemptions`) + tRPC-Router im MOS-Core-Repo.

### Phase D — Echter Single Sign-On
Langfristig: MOS Core als Identity-Provider (OIDC), ShiftLink akzeptiert
Kimi-OAuth-Session. Bis dahin bleiben zwei Logins — kommunizieren als
„MOS-Konto" vs. „ShiftLink-Zugang", nicht als ein Login verkaufen.

## 4. Design-Regeln (aus `mos-modell/`, strikt)

- Ivory `#F7F5F0`, Graphite `#0C1220`, Indigo `#6157FF` (primäre Aktionen)
- Emerald `#18A874` NUR für verifiziert-Zustände
- Amber `#F2B04A` / Text `#B97917` NUR für ShiftLink-/„In Arbeit"-Kontexte
- Manrope (Headlines) + Inter (Text); editorial, ruhig, Du-Form
- Unsere LandingPage.tsx folgt bereits diesem System ✅

## 5. Offene Punkte (für Jurica zu klären)

1. Wo wird MOS Core gehostet/gehostet werden (Plattform-Versionskarten vs.
   eigenes Hosting)? Davon hängt ab, wohin die Kacheln zeigen.
2. Kimi-OAuth ist plattformgebunden — für echtes Self-Hosting bräuchte
   MOS Core einen alternativen Login (Handover empfiehlt E-Mail/Passwort).
3. Soll ShiftLink-Verifikation langfristig ganz zu QualiSafe wandern?
