# MOS ↔ ShiftLink Integration & Einheitlicher Login (Langzeit-Architektur)

Stand: 23.08.2026 (Early SSO live) · Status: BESCHLOSSEN (Umsetzung in Phasen)

## 1. Zielbild (das, worauf alles zuläuft)

**MOS Core ist die zentrale Identität.** Egal ob sich jemand bei MedBenefit,
QualiPass oder ShiftLink anmeldet — es gibt genau einen Login (E-Mail +
Passwort), genau einen Account, und jedes Produkt holt sich die Rechte und
den Verifikationsstatus aus MOS.

```
                    ┌──────────────────────────┐
                    │   MOS Core (Identität)    │
                    │  users, profiles, audit    │
                    │  QualiSafe / QualiPass     │
                    │  MedBenefit Deals          │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       MedBenefit Web      QualiPass UI        ShiftLink App
       (Teil von MOS)      (Teil von MOS)      (eigene App, nutzt MOS-Identity)
```

## 2. Ist-Zustand (ehrlich)

> **Update 25.08.2026:** Stufe 1 ✅, Stufe 2 ✅, Stufe 3 ✅ (SSO live seit 23.08.).
> Zusätzlich live: **MedBenefit Stufe A** (Deal-Vitrine im Nurse-Dashboard, siehe
> docs/MEDBENEFIT-INTEGRATION.md) und **MOS-Audit-Events**
> (MOS_CONNECT/MOS_DISCONNECT in ShiftLink `/admin/audit-logs`).

| Aspekt | MOS Core | ShiftLink |
|---|---|---|
| Auth | E-Mail/Passwort (bcrypt), Session-Cookie `kimi_sid` mit JWT `{userId}` | E-Mail/Passwort (bcrypt), eigener JWT (`Authorization: Bearer`) |
| User-Tabelle | MySQL `users` (id serial, email unique) | Postgres `User` (cuid, email unique) |
| Verifikation | QualiSafe-Dokumente + Prüfer → `personProfiles.verificationStatus` | Eigene VerificationDocuments + `User.verificationStatus` |
| Deployment | Docker Compose (MySQL, Port 8000→3000) | Docker Compose (Postgres, Port 80 via nginx) |

Zwei getrennte Systeme, zwei Logins — funktional gleich, technisch unabhängig.

## 3. Die drei Stufen zum Ziel

### Stufe 1 — „Gleiche Mechanik" (JETZT, teils fertig)
Beide Systeme nutzen E-Mail+Passwort mit identischen Regeln:
- Passwort-Mindestlänge 12 Zeichen ✅ (beide)
- bcrypt cost ≥ 12 ✅ (beide)
- Session als httpOnly-JWT-Cookie bzw. Bearer-Token ✅

**Was noch zu tun ist:** Nichts Technisches. Nur Kommunikation: dem Nutzer
sagen „Du brauchst pro Produkt einen Account, aber es sind dieselben Daten".

### Stufe 2 — „Account-Verknüpfung" (nächste 1–2 Sessions)
Nutzer verknüpfen ihre beiden Accounts einmalig manuell:

**Konkret:**
1. ShiftLink bekommt ein Feld `mosUserId` (nullable) in der `User`-Tabelle.
2. In ShiftLink gibt es unter „Einstellungen → MOS verbinden" ein Formular:
   „E-Mail + Passwort deines MOS-Accounts".
3. ShiftLink ruft eine **neue MOS-Route** auf:
   ```
   POST /api/v1/auth/verify-credentials   (service-to-service)
   Header: x-mos-service-token: <MOS_SERVICE_TOKEN>
   Body: { email, password }
   Response: { userId, email, verificationStatus } oder 401
   ```
4. Bei Erfolg speichert ShiftLink `mosUserId` lokal. Ab dann weiß ShiftLink:
   *Dieser* ShiftLink-Account gehört zu *jenem* MOS-Account.

**Vorteil:** Kein Bruch im Bestand. Nutzer können jederzeit verbinden.
ShiftLink bleibt voll nutzbar ohne MOS.

### Stufe 3 — „Echter Single Sign-On" (langfristig)
Wenn beide Produkte öffentlich laufen, bauen wir echtes SSO:

**Option A (empfohlen): Shared-JWT mit Audience-Claim**
- Beide Systeme teilen denselben `APP_SECRET` (oder besser: RSA-Key-Pair).
- MOS signiert Tokens mit `aud: ["medbenefit","qualipass","shiftlink"]`.
- ShiftLink akzeptiert Tokens mit passendem Audience-Claim.
- Login passiert auf einer MOS-Domain (`auth.mos.example.de`), alle
  Produkte leiten dorthin um.

**Option B (später, sauberer): MOS als echter OIDC-Provider**
- MOS implementiert `/oauth/authorize`, `/oauth/token`, `/userinfo`.
- ShiftLink wird OIDC-Client (wie jeder andere auch).
- Aufwändiger, aber Standard-kompatibel.

Empfehlung: **Stufe 3A zuerst**, 3B nur wenn Dritte (z. B. Kliniken) eigene
Integrationen bauen wollen.

## 3.5 Frühe Implementierung von Stufe 3 (Live seit 23.08.2026)

Stufe 3 wurde **vorzeitig** umgesetzt, weil der Nutzen (keine Passwörter mehr im ShiftLink-Frontend, zentraler Login) bereits jetzt hoch ist:

- MOS als Identity Provider: `/api/v1/sso/authorize`, `/api/v1/sso/exchange-login`, `/api/v1/sso/token`
- Einmalige 60s Codes + state + redirect-Whitelist
- ShiftLink-Client: `/api/v1/auth/mos/sso/start|callback` + UI-Button "Mit MOS anmelden (SSO)"
- Rate-Limit auf dem Start-Endpoint (20 req / 10 min in Prod)
- QualiPass-Status wird direkt mit dem Token zurückgegeben

Das ist **kein volles OIDC**, aber ein sauberer, auditable Service-Auth-Code-Flow, der exakt den Anforderungen von ShiftLink entspricht.

## 4. Verifikations-Bridge (der fachliche Kern)

Sobald Stufe 2 umgesetzt ist:

```
ShiftLink fragt beim Matching:
  "Hat dieser Nurse einen verifizierten QualiPass?"
       ↓ (Service-Token-Aufruf, gecacht für 24h in Redis)
  GET /api/v1/mos/qualipass/status/:publicId   ← existiert bereits!
       ↓
  Wenn VERIFIED → isReleasedForMatching = true (kein doppelter Upload)
```

**Regel:** ShiftLinks eigene Verification bleibt als Fallback für Leute
ohne MOS-Konto. Aber: wer QualiPass hat, muss nichts mehr hochladen.
Das ist das eigentliche Produktversprechen („Einmal verifizieren, überall
verwenden").

## 5. Konkrete Umsetzungs-Reihenfolge

| # | Was | Wo | Aufwand |
|---|-----|-----|---------|
| 1 | MOS: Route `/api/v1/auth/verify-credentials` (Service-Token-geschützt) | mos-core/app/api | ~1 h |
| 2 | ShiftLink: Prisma-Feld `mosUserId` + Migration | shiftlink/prisma | ~30 min |
| 3 | ShiftLink: UI „MOS verbinden" + API-Endpoint | shiftlink/web + src/routes | ~2 h |
| 4 | ShiftLink: Beim Matching QualiPass-Status abfragen (mit Cache) | src/services/match.service.ts | ~1–2 h |
| 5 | Tests + E2E (Verbinden → Status-Sync → Matching-Gate) | beide Repos | ~2 h |

Gesamt: ca. 1 Arbeitstag. Danach funktioniert der Kern der Vision.

Stufe 3 (echtes SSO) kommt erst, wenn beide Produkte öffentlich sind —
vorher lohnt der Aufwand nicht.

## 6. Sicherheits-Prinzipien (nicht verhandelbar)

1. **Keine Passwörter über die Grenze**: Das verify-credentials-Endpoint
   bekommt E-Mail+Passwort NUR über HTTPS im Request-Body, speichert sie
   nirgendwo, loggt sie nie. ShiftLink merkt sich nur die `mosUserId`.
2. **Service-Token bleibt Service-Token**: `MOS_SERVICE_TOKEN` ist ein
   langes Zufalls-Token, liegt in `.env` beider Seiten, läuft nie durchs
   Frontend.
3. **Verifikationsstatus wird nicht vertraut, sondern geprüft**: Bei jedem
   Match-Vorgang frisch abfragen (bzw. kurz cachen), nie dauerhaft
   speichern — sonst riskieren wir, dass ein zwischenzeitlich entzogener
   QualiPass weiter genutzt wird.
4. **Audience-Claim ab Stufe 3**: Tokens gelten immer nur für bestimmte
   Produkte, nie global.
