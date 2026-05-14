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
Die Rechnung wird sofort ausgelöst, sobald der Vertrag über die Plattform von beiden Seiten bestätigt wurde. Ob der Einsatz später tatsächlich angetreten wird, ist für die Plattformrechnung zunächst nicht relevant.

### 4. Mindeststundenlohn im Profil
Pflegekräfte bestimmen ihren Preis selbst. Jedes Profil muss zwingend einen Mindeststundenlohn hinterlegen. Vorgesehener Default bzw. Empfehlungswert: 42 €/h.

### 5. Datenschutzrahmen
Es werden keine Patientendaten verarbeitet. Allerdings werden sensible Personaldaten verarbeitet, insbesondere Examen und Berufsurkunden. Diese Daten sind besonders schützenswert.

## Geschäftliche Konsequenzen

- Revenue hängt direkt an Match + Vertragsbestätigung.
- Das System muss Vertragsstatus und Rechnungs-Trigger absolut sauber modellieren.
- Dokumenten- und Rollenrechte sind nicht nur Feature-Themen, sondern Kern des Produkts.
- Vertrauen und Verifikation sind zentrale Bestandteile des MVP, nicht spätere Extras.
