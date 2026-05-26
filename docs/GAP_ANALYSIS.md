# Shiftlink Gap Analysis / Abarbeitungsliste

Stand: Diese Liste übersetzt das fachliche Zielbild in konkrete Umsetzungsblöcke.

## Status-Legende
- [x] erledigt
- [~] teilweise
- [ ] offen

---

## 1. Plattform-/Rechtsmodell sauber einhalten
- [x] Keine Arbeitgeberrolle / keine Zeitarbeit in Produkt- und Architekturtexten klarziehen
- [x] Plattformgebühr statt Lohn-/Payroll-Logik in Billing-Sprache
- [ ] Technische Guardrails prüfen, dass neue Features nicht versehentlich Payroll/Zeiterfassung einführen

## 2. Verifizierung & Freischaltung
- [x] Examen-/Dokumenten-Upload-Grundlage vorhanden
- [x] Fachweiterbildungen als verifizierbare Dokumente/Artefakte sauber ergänzen
- [x] Arbeitsmedizinische Nachweise modellieren (OCCUPATIONAL_HEALTH_CLEARANCE)
- [x] Echte Verifizierungsprüfung/Freigabe-Logik im Backend (Superadmin Review)
- [x] Nur verifizierte Pflegekräfte für Angebote/Matching freischalten (isReleasedForMatching Gate)
- [x] Verifizierungsstatus für Krankenhaus sichtbar machen (Dossier + Admin Verification)

## 3. Digitale Personalakte / Dossier
- [x] Vollständiges Klinik-Dossier aus verifizierten Dokumenten/Stammdaten definieren
- [x] Gesicherter Dossier-Zugriff für berechtigte Klinikseite (signed URLs)
- [x] Dossier-Übersicht statt nur einzelner Dokumentzugriffe

## 4. Vertragsengine
- [x] Match-/Sign-Flow vorhanden
- [x] Dynamische Vertragsdatenstruktur definieren (ContractSnapshot mit JSON)
- [x] Vertrags-PDF-Generierung implementieren (generateContractPdfArtifact)
- [x] `contractPdfUrl` real anbinden
- [x] Vertragsversionierung / unveränderliche Snapshots definieren

## 5. eSignatur
- [ ] Signaturmodell fachlich präzisieren (wer signiert was, wann, womit)
- [ ] rechtsgültigen eSignatur-Flow technisch auswählen und anbinden
- [ ] Audit-Trail für Signaturen speichern

## 6. No-Refund / Post-Signature Policy
- [~] Plattformrechnung bei Signatur vorhanden
- [ ] No-Refund-/No-Show-/Krankheits-Policy explizit modellieren
- [ ] Statusmodell nach Signatur erweitern, falls fachlich nötig
- [ ] klare Regeln für Plattformrechnung trotz Ausfall dokumentieren und technisch absichern

## 7. HR-/Payroll-Export sauber abgrenzen
- [x] Billing-/CSV-Export-Grundlage vorhanden
- [x] Payroll-Export Endpoint mit vereinbarten Daten (Nurse, Contract, Shift, Invoice)
- [x] Keine implizite Zeiterfassung/Payroll-Logik in Exporten
- [~] Klinik-kompatiblen HR-/Payroll-Export (DATEV/SAP-Vorstufe) — CSV-Grundlage vorhanden
- [ ] Falls nötig: Import externer Ist-Daten aus Kliniksystem statt Eigen-Erfassung

## 8. Krankenhaus-Integrationsreife
- [x] Idempotenter Shift-Import
- [x] Read-/Status-API
- [x] Webhook-Outbox + signierte Delivery-Pipeline
- [x] Webhook-Admin/Retry-API (Retry-Button im Dashboard)
- [x] webhookUrl/webhookSecret Verwaltungs-Endpoints (PATCH /webhook-config)
- [~] Import-/Export-Doku mit Payload-Beispielen — DEPLOYMENT.md vorhanden

---

## Empfohlene Abarbeitungsreihenfolge
1. Verifizierung & Freischaltung
2. Digitale Personalakte / Dossier
3. Vertragsengine
4. eSignatur
5. No-Refund / Post-Signature Policy
6. HR-/Payroll-Export sauber abgrenzen
7. Restliche Krankenhaus-Integrationsreife
