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
- [~] Examen-/Dokumenten-Upload-Grundlage vorhanden
- [ ] Fachweiterbildungen als verifizierbare Dokumente/Artefakte sauber ergänzen
- [ ] arbeitsmedizinische Nachweise modellieren
- [ ] echte Verifizierungsprüfung/Freigabe-Logik im Backend
- [ ] nur verifizierte Pflegekräfte für Angebote/Matching freischalten
- [ ] Verifizierungsstatus für Krankenhaus sichtbar machen

## 3. Digitale Personalakte / Dossier
- [ ] vollständiges Klinik-Dossier aus verifizierten Dokumenten/Stammdaten definieren
- [ ] gesicherter Dossier-Zugriff für berechtigte Klinikseite
- [ ] Dossier-Übersicht statt nur einzelner Dokumentzugriffe

## 4. Vertragsengine
- [~] Match-/Sign-Flow vorhanden
- [ ] dynamische Vertragsdatenstruktur definieren
- [ ] Vertrags-PDF-Generierung implementieren
- [ ] `contractPdfUrl` real anbinden
- [ ] Vertragsversionierung / unveränderliche Snapshots definieren

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
- [~] Billing-/CSV-Export-Grundlage vorhanden
- [ ] Export in „vereinbarte Daten“ vs. „tatsächlich geleistete Daten“ trennen
- [ ] keine implizite Zeiterfassung/Payroll-Logik in Exporte hineinrutschen lassen
- [ ] Klinik-kompatiblen HR-/Payroll-Export sauber definieren (z. B. DATEV/SAP-Vorstufe)
- [ ] falls nötig: Import externer Ist-Daten aus Kliniksystem statt Eigen-Erfassung

## 8. Krankenhaus-Integrationsreife
- [x] idempotenter Shift-Import
- [x] Read-/Status-API
- [x] Webhook-Outbox + signierte Delivery-Pipeline
- [ ] Webhook-Admin/Retry-API
- [ ] webhookUrl/webhookSecret Verwaltungs-Endpoints
- [ ] Import-/Export-Doku mit Payload-Beispielen schärfen

---

## Empfohlene Abarbeitungsreihenfolge
1. Verifizierung & Freischaltung
2. Digitale Personalakte / Dossier
3. Vertragsengine
4. eSignatur
5. No-Refund / Post-Signature Policy
6. HR-/Payroll-Export sauber abgrenzen
7. Restliche Krankenhaus-Integrationsreife
