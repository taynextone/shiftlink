export function HospitalDashboardPage() {
  return (
    <section className="stack">
      <div className="hero panel">
        <h1>Hospital Dashboard</h1>
        <p>
          Fokus dieses ersten Hospital-Frontends: Bedarfe sichtbar machen, Imports auslösen und Contract-Lifecycle kontrolliert einsehen.
        </p>
      </div>
      <div className="grid two">
        <article className="panel">
          <h2>Operative Kernflächen</h2>
          <ul>
            <li>Schichten / Bedarfe</li>
            <li>Offers pro Schicht</li>
            <li>Contract Lifecycle</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Fachliche Leitplanke</h2>
          <p>
            Hospital-UI zeigt Matching-, Vertrags- und Plattformgebühren-Status. Keine Arbeitgeber- oder Payroll-Oberfläche für Shiftlink.
          </p>
        </article>
      </div>
    </section>
  );
}
