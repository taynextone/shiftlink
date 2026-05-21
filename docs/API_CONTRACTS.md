# API Contracts & Webhook Schemas

Diese Datei beschreibt die aktuell implementierten fachlichen API- und Event-Verträge des Backends.

Ziel:
- Integrationen stabilisieren
- Drift zwischen Code, Doku und Gegenstellen reduzieren
- implizites Verhalten in explizite Verträge überführen

## Grundsatz

Shiftlink ist eine Vermittlungs- und Matching-Plattform.

Wichtig:
- Shiftlink ist **nicht Arbeitgeber** der Pflegekraft.
- Shiftlink ist **keine Zeitarbeitsfirma**.
- Rechnungen und Billing-Events betreffen ausschließlich die **Plattform-/Vermittlungsgebühr** gegenüber dem Krankenhaus.
- Arbeits- und Vergütungsverhältnis bestehen zwischen Krankenhaus und Pflegekraft.

---

## 1. Nurse Verification & Release

### GET `/api/v1/nurse-profile/me/verification`

**Auth:** `NURSE`

**Response 200**

```json
{
  "verification": {
    "isReleasedForMatching": true,
    "releasedAt": "2026-05-20T10:00:00.000Z",
    "documents": [
      {
        "id": "doc_1",
        "documentType": "EXAMEN",
        "status": "VERIFIED",
        "reviewedAt": "2026-05-20T09:00:00.000Z"
      }
    ]
  }
}
```

### POST `/api/v1/nurse-profile/verification/review`

**Auth:** `SUPER_ADMIN`

**Request**

```json
{
  "documentId": "doc_1",
  "status": "VERIFIED"
}
```

**Response 200**

```json
{
  "document": {
    "id": "doc_1",
    "status": "VERIFIED"
  }
}
```

---

## 2. Hospital Nurse Dossier

### GET `/api/v1/documents/dossier/:id`

**Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`

Nur für berechtigte Kliniken mit zulässigem Vertrags-/Match-Bezug.

**Response 200**

```json
{
  "dossier": {
    "nurseProfileId": "nurse_1",
    "publicId": "NUR-AB12CD34",
    "displayName": "NurseNova",
    "firstName": "Nina",
    "lastName": "Care",
    "phoneNumber": "+491701234567",
    "minHourlyRate": "49.00",
    "preferredShiftType": "FLEXIBLE",
    "isReleasedForMatching": true,
    "releasedAt": "2026-05-20T10:00:00.000Z",
    "specializations": ["intensivstation"],
    "verifiedDocuments": [
      {
        "id": "doc_1",
        "documentType": "EXAMEN",
        "status": "VERIFIED",
        "reviewedAt": "2026-05-20T09:00:00.000Z",
        "objectKey": "examen.pdf",
        "signedUrl": "https://signed.example.com/...",
        "expiresIn": 900
      }
    ],
    "signedAssignments": [
      {
        "matchContractId": "contract_1",
        "jobShiftId": "shift_1",
        "startTime": "2026-06-16T06:00:00.000Z",
        "endTime": "2026-06-20T18:00:00.000Z",
        "locationCity": "Berlin",
        "hospitalProfileId": "hospital_1",
        "clinicName": "Clinic One"
      }
    ]
  }
}
```

---

## 3. Match Offer & Nurse Marketplace

### GET `/api/v1/matches/visible-job-shifts`

**Auth:** `NURSE`

Unreleased Nurses erhalten bewusst eine leere Liste.

### GET `/api/v1/matches/me`

**Auth:** `NURSE`

Eigene Match-/Offer-Liste.

### GET `/api/v1/matches/hospital-offers?jobShiftId=...`

**Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`

Hospital-Übersicht über Offer-Status zu einer Schicht.

### POST `/api/v1/matches/offer`

**Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`

**Request**

```json
{
  "jobShiftId": "shift_1",
  "nurseProfileId": "nurse_1"
}
```

**Besonderheiten**
- nur für `OPEN` Job Shifts
- nur für released Nurses
- Duplicate-/Race-Fälle werden defensiv behandelt
- in MVP genau eine WhatsApp beim neu erzeugten Angebot

### POST `/api/v1/matches/respond`

**Auth:** `NURSE`

**Request**

```json
{
  "matchContractId": "contract_1",
  "action": "ACCEPT"
}
```

Mögliche `action`-Werte:
- `ACCEPT`
- `DECLINE`

---

## 4. Contract Snapshot & PDF Surface

### GET `/api/v1/matches/contract/:id`

**Auth:** beteiligte Nurse, beteiligtes Hospital, `SUPER_ADMIN`

**Response 200**

```json
{
  "contractSnapshot": {
    "id": "snapshot_2",
    "version": 2,
    "summaryText": "Pflegekraft: NurseNova | Einrichtung: Clinic One | ...",
    "snapshot": {
      "matchContractId": "contract_1",
      "version": 2,
      "platform": {
        "role": "vermittlung-und-matching-plattform",
        "isEmployer": false,
        "isStaffingAgency": false,
        "handlesPayroll": false,
        "platformFeePerHour": "3.00"
      },
      "commercialTerms": {
        "invoiceTrigger": "digital-signature",
        "noRefundPolicy": true,
        "hospitalPaysNurseDirectly": true,
        "platformIssuesServiceFeeInvoiceOnly": true
      }
    }
  }
}
```

### GET `/api/v1/matches/contract/:id/pdf`

**Auth:** beteiligte Nurse, beteiligtes Hospital, `SUPER_ADMIN`

**Response 200**

```json
{
  "contractPdf": {
    "url": "https://signed.example.com/download?...",
    "expiresIn": 900,
    "objectKey": "contracts/contract_1/v2.pdf"
  }
}
```

---

## 5. Contract Execution

### GET `/api/v1/matches/contract/:id/execution`

**Auth:** beteiligte Nurse, beteiligtes Hospital, `SUPER_ADMIN`

**Response 200**

```json
{
  "execution": {
    "matchContractId": "contract_1",
    "executionStatus": "PENDING_NURSE_SIGNATURE",
    "fullyExecutedAt": null,
    "signatureEvents": [
      {
        "id": "sig_1",
        "signerUserId": "hospital_owner_1",
        "signerRole": "HOSPITAL_ADMIN",
        "signatureIntent": "EXECUTE_CONTRACT",
        "createdAt": "2026-05-20T12:00:00.000Z"
      }
    ]
  }
}
```

### POST `/api/v1/matches/contract/:id/execution/sign`

**Auth:** beteiligte Nurse, beteiligtes Hospital, `SUPER_ADMIN`

Kein separater Request-Body erforderlich.

**Response 200**

```json
{
  "execution": {
    "executionStatus": "FULLY_EXECUTED",
    "fullyExecutedAt": "2026-05-20T12:05:00.000Z",
    "signatureEvent": {
      "id": "sig_2",
      "signerRole": "NURSE",
      "createdAt": "2026-05-20T12:05:00.000Z"
    },
    "signatureCount": 2
  }
}
```

### Execution Status Werte

- `DRAFT`
- `PENDING_HOSPITAL_SIGNATURE`
- `PENDING_NURSE_SIGNATURE`
- `FULLY_EXECUTED`
- `VOIDED`

---

## 6. Contract Voiding

### GET `/api/v1/matches/contract/:id/void`

**Auth:** beteiligte Nurse, beteiligtes Hospital, `SUPER_ADMIN`

### POST `/api/v1/matches/contract/:id/void`

**Auth:** `HOSPITAL_ADMIN`, `SUPER_ADMIN`

**Request**

```json
{
  "reason": "Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen."
}
```

**Regeln**
- fully executed Contracts dürfen hier nicht mehr voided werden
- bereits bezahlte Plattformrechnungen blockieren diesen Flow
- Historie wird nicht zurückgeschrieben, sondern als Void fortgeschrieben

**Response 200**

```json
{
  "voiding": {
    "matchContractId": "contract_1",
    "status": "CANCELED",
    "executionStatus": "VOIDED",
    "voidedAt": "2026-05-20T12:20:00.000Z",
    "reason": "Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen."
  }
}
```

---

## 7. Contract Lifecycle Audit Overview

### GET `/api/v1/matches/contract/:id/lifecycle`

**Auth:** beteiligte Nurse, beteiligtes Hospital, `SUPER_ADMIN`

**Response 200**

```json
{
  "lifecycle": {
    "matchContractId": "contract_1",
    "status": "CANCELED",
    "executionStatus": "VOIDED",
    "createdAt": "2026-05-20T10:00:00.000Z",
    "updatedAt": "2026-05-20T12:20:00.000Z",
    "expiresAt": "2026-05-21T10:00:00.000Z",
    "respondedAt": "2026-05-20T11:00:00.000Z",
    "signedAt": "2026-05-20T11:05:00.000Z",
    "fullyExecutedAt": null,
    "contractPdf": {
      "available": true,
      "fileUrl": "s3://shiftlink-private/contracts/contract_1/v2.pdf"
    },
    "snapshotSummary": {
      "currentSnapshotId": "snapshot_2",
      "currentSnapshotVersion": 2,
      "totalSnapshots": 2,
      "versions": [
        {
          "id": "snapshot_1",
          "version": 1,
          "summaryText": "Offer snapshot"
        }
      ]
    },
    "signatureSummary": {
      "totalSignatures": 1,
      "events": [
        {
          "id": "sig_1",
          "signerRole": "HOSPITAL_ADMIN",
          "signatureIntent": "EXECUTE_CONTRACT"
        }
      ]
    },
    "voidSummary": {
      "id": "void_1",
      "actorRole": "HOSPITAL_ADMIN",
      "reason": "Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen."
    }
  }
}
```

---

## 8. Hospital Webhook Events

Die Event-Auslieferung erfolgt über persistierte Outbox + Queue mit Retry/Backoff.

### Gemeinsame Header

- `content-type: application/json`
- `x-shiftlink-event-type: <eventType>`
- `x-shiftlink-event-id: <webhookEventId>`
- `x-shiftlink-signature: <hmac-sha256>`

---

### `shift.created`

```json
{
  "jobShiftId": "shift_1"
}
```

### `shift.imported`

```json
{
  "jobShiftId": "shift_1",
  "externalJobShiftId": "ext-123"
}
```

### `match.offer.signed`

```json
{
  "matchContractId": "contract_1",
  "jobShiftId": "shift_1",
  "nurseProfileId": "nurse_1",
  "status": "SIGNED",
  "executionStatus": "DRAFT",
  "signedAt": "2026-05-20T11:05:00.000Z",
  "snapshotId": "snapshot_2",
  "snapshotVersion": 2
}
```

### `contract.pdf.generated`

```json
{
  "matchContractId": "contract_1",
  "jobShiftId": "shift_1",
  "nurseProfileId": "nurse_1",
  "status": "SIGNED",
  "executionStatus": "FULLY_EXECUTED",
  "snapshotId": "snapshot_3",
  "snapshotVersion": 3,
  "contractPdfUrl": "s3://shiftlink-private/contracts/contract_1/v3.pdf"
}
```

### `contract.execution.signed`

```json
{
  "matchContractId": "contract_1",
  "jobShiftId": "shift_1",
  "nurseProfileId": "nurse_1",
  "status": "SIGNED",
  "executionStatus": "PENDING_NURSE_SIGNATURE",
  "signerUserId": "hospital_owner_1",
  "signerRole": "HOSPITAL_ADMIN",
  "snapshotId": "snapshot_2",
  "snapshotVersion": 2
}
```

### `contract.execution.fully-executed`

```json
{
  "matchContractId": "contract_1",
  "jobShiftId": "shift_1",
  "nurseProfileId": "nurse_1",
  "status": "SIGNED",
  "executionStatus": "FULLY_EXECUTED",
  "fullyExecutedAt": "2026-05-20T12:05:00.000Z",
  "snapshotId": "snapshot_3",
  "snapshotVersion": 3
}
```

### `contract.voided`

```json
{
  "matchContractId": "contract_1",
  "jobShiftId": "shift_1",
  "nurseProfileId": "nurse_1",
  "status": "CANCELED",
  "executionStatus": "VOIDED",
  "voidedAt": "2026-05-20T12:20:00.000Z",
  "voidReason": "Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.",
  "snapshotId": "snapshot_2",
  "snapshotVersion": 2
}
```

---

## 9. Fehlerbilder / wichtige Konflikte

Typische fachliche Konfliktfälle:

- `409 Nurse profile is not released for matching yet`
- `409 Offers can only be created for open job shifts`
- `409 This nurse already closed the current offer. Create a new shift or explicitly reopen later.`
- `409 This match offer can no longer be changed`
- `409 Only pending match offers can be signed`
- `409 Contract must be signed before execution signatures can be recorded`
- `409 This signer already recorded a signature for the current contract execution`
- `409 Fully executed contracts cannot be voided through this flow`
- `409 Contracts with paid platform invoices cannot be voided through this flow`

---

## 10. Stand der Formalisierung

Diese Datei beschreibt den **aktuellen Implementierungsstand**.
Sie ist bewusst näher am laufenden Backend als an einem generischen Ideal-API-Entwurf.

Nächste sinnvolle Ausbaustufen:
- OpenAPI-Spezifikation
- JSON-Schemas für Webhook-Payloads
- Versionierung / Kompatibilitätsregeln für Event-Verträge
