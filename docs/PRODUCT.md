# Produktvision und Geschäftslogik

## Produktvision

Shiftlink ist ein digitaler Matching-Marktplatz für kurzfristige Pflegeeinsätze in Krankenhäusern. Startmarkt ist Berlin. Das Modell ist eine Direktvermittlung zwischen Krankenhaus und Pflegekraft, ohne den klassischen Umweg über Zeitarbeitsfirmen.

Benchmark für Nutzererlebnis und API-Geschwindigkeit ist die App "InSitu".

## Kern-Geschäftslogik

### 1. Kein Zahlungsfluss-Intermediär
Krankenhäuser schließen einen direkten kurzfristigen Arbeitsvertrag mit der Pflegekraft. Der Stundenlohn wird direkt vom Krankenhaus an die Pflegekraft ausgezahlt. Die Plattform fasst dieses Gehalt nie an.

### 2. Monetarisierung
Die Plattform berechnet dem Krankenhaus eine Vermittlungsgebühr, z. B. 3 € pro vereinbarter Stunde.

### 3. Sofortige Fakturierung
Die Plattformrechnung wird ausgelöst, sobald der Match-/Vertragsabschluss im Plattformprozess bestätigt wurde. Ob der Einsatz später tatsächlich angetreten wird, ist für die Plattformrechnung zunächst nicht relevant. Diese Rechnung betrifft ausschließlich die Plattform-/Vermittlungsgebühr, nicht die Vergütung der Pflegekraft.

### 4. Mindeststundenlohn im Profil
Pflegekräfte bestimmen ihren Preis selbst. Jedes Profil muss zwingend einen Mindeststundenlohn hinterlegen. Vorgesehener Default bzw. Empfehlungswert: 42 €/h.

### 5. Datenschutzrahmen
Es werden keine Patientendaten verarbeitet. Allerdings werden sensible Personaldaten verarbeitet, insbesondere Examen und Berufsurkunden. Diese Daten sind besonders schützenswert.

## Geschäftliche Konsequenzen

- Revenue hängt direkt an Match + Vertragsbestätigung.
- Das System muss Vertragsstatus und Rechnungs-Trigger absolut sauber modellieren.
- Dokumenten- und Rollenrechte sind nicht nur Feature-Themen, sondern Kern des Produkts.
- Vertrauen und Verifikation sind zentrale Bestandteile des MVP, nicht spätere Extras.

## Benachrichtigungslogik (aktuell)

- Pflegekräfte sollen vorerst genau **eine WhatsApp beim neuen Angebot** erhalten.
- Inhalt: kurze Einsatzdetails + Link zum Login / zur Angebotsansicht.
- Keine zusätzliche WhatsApp bei Signierung oder Ablehnung im MVP.

- Die Angebots-WhatsApp enthält kurze Einsatzdetails (Klinik, Ort, Zeitraum) plus Login-Link.


## Krankenhaus-Schnittstellen v1

- Shift-Import mit externer Referenz (`externalJobShiftId`)
- Status-/Listen-API für offene und bearbeitete Bedarfe
- Webhook-Outbox als Grundlage für Rückmeldungen ins Krankenhaus-System


## Abgrenzung zu Zeitarbeit / Arbeitgeberrolle

- Shiftlink ist **keine Zeitarbeitsfirma**.
- Shiftlink ist **nicht Arbeitgeber** der Pflegekraft.
- Die Vergütung der Pflegekraft erfolgt **direkt durch das Krankenhaus**.
- Shiftlink stellt nur die **Vermittlungs- und Matching-Plattform** bereit.
- Rechnungen in Shiftlink betreffen ausschließlich die **Plattform-/Vermittlungsgebühr** gegenüber dem Krankenhaus.
- Es gibt in Shiftlink **keine Payroll-, Payout- oder Lohnabrechnungslogik** für Pflegekräfte.


## Aktueller Contract Lifecycle

Die Plattform modelliert den Vertragsprozess inzwischen explizit und mehrstufig:

1. **Match Offer**
   - Krankenhaus erstellt ein Angebot an eine bereits verifizierte und für Matching freigegebene Pflegekraft.
   - Nur `PENDING` Offers sind weiter bearbeitbar.

2. **Contract Snapshot**
   - Bei relevanten Übergängen wird ein unveränderlicher Snapshot des vereinbarten Zustands erzeugt.
   - Damit hängen spätere Nachweise nicht an mutierbaren Profil-/Schichtdaten.

3. **Contract PDF Artifact**
   - Aus dem Snapshot wird ein Vertragsartefakt erzeugt und privat gespeichert.
   - Dieses Artefakt ist Grundlage für Audit, Abruf und spätere Signaturschichten.

4. **Execution Signatures**
   - Die eigentliche Ausführung wird getrennt vom Offer-/Match-Status erfasst.
   - Signaturereignisse werden mit Rolle, Intent und Evidence gespeichert.
   - Status: `DRAFT`, `PENDING_HOSPITAL_SIGNATURE`, `PENDING_NURSE_SIGNATURE`, `FULLY_EXECUTED`, `VOIDED`.

5. **Voiding statt History Rewrite**
   - Bereits entstandene Vertrags-/Signaturhistorie wird nicht rückwirkend gelöscht.
   - Nicht vollständig ausgeführte Verträge können kontrolliert voided werden, mit Begründung und Audit-Spur.

## Dossier- und Verifikationslogik

- Pflegekräfte müssen vor Marketplace-/Offer-Sichtbarkeit fachlich geprüft und freigegeben werden.
- Pflichtdokumente für die Freigabe sind aktuell `EXAMEN` und `OCCUPATIONAL_HEALTH_CLEARANCE`.
- Berechtigte Kliniken erhalten nur eine enge Dossier-Sicht mit verifizierten Dokumenten und signed URLs, nicht das gesamte Pflegekraft-Profil als Rohdump.

## Krankenhaus-Schnittstellen v2 (aktuell im Backend-Fundament)

Zusätzlich zu Shift-Import und Statuslisten existieren inzwischen fachliche Lifecycle-Schnittstellen für Verträge:

- Contract Snapshot Read
- Contract PDF Download
- Contract Execution Overview + Signature Intent
- Contract Void Overview + Voiding Flow
- Contract Lifecycle Audit Overview

## Webhook-Events für Integrationen

Die Outbox liefert inzwischen nicht nur Shift-Events, sondern auch Contract-Lifecycle-Events:

- `match.offer.signed`
- `contract.pdf.generated`
- `contract.execution.signed`
- `contract.execution.fully-executed`
- `contract.voided`

Das ermöglicht Krankenhaus-Integrationen mit sauberer, retrybarer Statussynchronisierung ohne direkte Kopplung der Produktlogik an externe Zielsysteme.
