export function NurseDashboardPage() {
  return (
    <section className="stack">
      <div className="hero panel">
        <h1>Pflegekraft-Dashboard</h1>
        <p>
          Fokus für den ersten Frontend-Schritt: Verifikationsstatus verstehen, sichtbare Einsätze prüfen und Offers sauber beantworten.
        </p>
      </div>
      <div className="grid two">
        <article className="panel">
          <h2>Status</h2>
          <ul>
            <li>Verifikation & Freigabe</li>
            <li>Offene Einsätze</li>
            <li>Eigene Angebote</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Produktgedanke</h2>
          <p>
            Shiftlink vermittelt direkt an das Krankenhaus. Kein Payroll- oder Arbeitgeber-Frontend, sondern Matching, Vertrag und Nachweisfluss.
          </p>
        </article>
      </div>
    </section>
  );
}
