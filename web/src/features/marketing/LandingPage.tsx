import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-mark">S</span>
            <span className="landing-logo-text">ShiftLink</span>
          </div>
          <div className="landing-nav-links">
            <a href="#problem" className="landing-nav-link">Problem</a>
            <a href="#loesung" className="landing-nav-link">Lösung</a>
            <a href="#einrichtungen" className="landing-nav-link">Für Einrichtungen</a>
            <a href="#pflegekraefte" className="landing-nav-link">Für Pflegekräfte</a>
            <a href="#warteliste" className="landing-nav-link">Pilot</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">
            <span className="landing-badge-dot" />
            04:12 Uhr · Krankmeldung Frühdienst · Berlin
          </div>
          <h1 className="landing-hero-title">
            Wenn ein Dienst ausfällt,<br />
            <span className="landing-hero-highlight">zählt Verfügbarkeit.</span>
          </h1>
          <p className="landing-hero-subtitle">
            ShiftLink verbindet Berliner Pflegeeinrichtungen mit qualifizierten Pflegekräften,
            die kurzfristig einspringen können. Einrichtungen stellen offene Dienste ein,
            Pflegekräfte sehen Zeit, Ort, Fachbereich, Vergütung und Vertragsbedingungen –
            und können passende Schichten direkt anfragen.
          </p>
          <div className="landing-hero-actions">
            <a href="#warteliste-einrichtung" className="landing-btn landing-btn-primary">
              Offenen Dienst melden
            </a>
            <a href="#warteliste-pflegekraft" className="landing-btn landing-btn-secondary">
              Als Pflegekraft verfügbar werden
            </a>
          </div>
          <div className="landing-hero-usps">
            <div className="landing-hero-usp">
              <span className="landing-usp-icon">⟳</span>
              Akute Ausfälle in Minuten sichtbar
            </div>
            <div className="landing-hero-usp">
              <span className="landing-usp-icon">◉</span>
              Matching nach Qualifikation & Radius
            </div>
            <div className="landing-hero-usp">
              <span className="landing-usp-icon">👁</span>
              Konditionen vor Annahme sichtbar
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="landing-section landing-section-problem">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Das Problem</span>
            <h2>Ein Ausfall reicht, und der Dienstplan kippt.</h2>
            <p className="landing-section-desc">
              Akute Personalausfälle gehören zum Pflegealltag. Was fehlt, ist kein weiteres
              Recruiting-Tool – sondern ein schneller Weg, offene Dienste mit verfügbaren
              Kräften zusammenzubringen.
            </p>
          </div>
          <div className="landing-problem-grid">
            <div className="landing-problem-card">
              <div className="landing-problem-icon">📵</div>
              <h3>Krankmeldung kurz vor Dienstbeginn</h3>
              <p>Eine Nachricht – und der Schichtplan bricht.</p>
            </div>
            <div className="landing-problem-card">
              <div className="landing-problem-icon">📞</div>
              <h3>PDL und WBL telefonieren hektisch herum</h3>
              <p>Telefonketten, WhatsApp-Gruppen, Vertretungslisten.</p>
            </div>
            <div className="landing-problem-card">
              <div className="landing-problem-icon">👥</div>
              <h3>Das Stammteam wird wieder belastet</h3>
              <p>Doppeldienste und Holen aus dem Frei – auf Kosten der Bindung.</p>
            </div>
            <div className="landing-problem-card">
              <div className="landing-problem-icon">💰</div>
              <h3>Zeitarbeit ist teuer und träge</h3>
              <p>Lange Vorlauf, hohe Aufwandsentschädigungen, wenig Transparenz.</p>
            </div>
            <div className="landing-problem-card">
              <div className="landing-problem-icon">⚠</div>
              <h3>Versorgungssicherheit gerät unter Druck</h3>
              <p>Im Worst Case bleiben Dienste unbesetzt – mit allen Folgen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lösung */}
      <section id="loesung" className="landing-section landing-section-solution">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Die Lösung</span>
            <h2>ShiftLink macht verfügbare Pflegekräfte sichtbar.</h2>
            <p className="landing-section-desc">
              Statt Recruiting-Prozess: ein operatives Werkzeug für den Moment,
              in dem ein Dienst kurzfristig besetzt werden muss.
            </p>
          </div>
          <div className="landing-solution-grid">
            <div className="landing-solution-card">
              <div className="landing-solution-icon">📋</div>
              <h3>Einrichtungen stellen offene Dienste ein</h3>
              <p>Dienstzeit, Fachbereich, Qualifikation, Einsatzort, Vergütung und Vertragsbedingungen werden klar definiert.</p>
            </div>
            <div className="landing-solution-card">
              <div className="landing-solution-icon">⟳</div>
              <h3>Pflegekräfte aktivieren ihre Verfügbarkeit</h3>
              <p>Pflegekräfte aktivieren ihre Verfügbarkeit, damit zeitlich und fachlich passende Schichtanfragen im Berliner Radius vorgeschlagen werden.</p>
            </div>
            <div className="landing-solution-card">
              <div className="landing-solution-icon">◉</div>
              <h3>Matching nach Qualifikation, Fachbereich, Radius & Zeit</h3>
              <p>Kein Streuen, keine Blindbewerbung – nur passende Vorschläge.</p>
            </div>
            <div className="landing-solution-card">
              <div className="landing-solution-icon">👁</div>
              <h3>Konditionen vor Anfrage sichtbar</h3>
              <p>Vergütung, Zeit, Einsatzort und Vertragsbedingungen – alles transparent, bevor angefragt wird.</p>
            </div>
            <div className="landing-solution-card">
              <div className="landing-solution-icon">✓</div>
              <h3>Direkte schichtbezogene Vereinbarung</h3>
              <p>Kommt eine Schicht zustande, wird die Vereinbarung direkt zwischen Pflegekraft und Einrichtung geschlossen. ShiftLink stellt die digitale Infrastruktur bereit.</p>
            </div>
            <div className="landing-solution-card">
              <div className="landing-solution-icon">⚡</div>
              <h3>Anfrage und Zusage digital</h3>
              <p>Ein Tap statt Telefonkette. Beide Seiten haben sofort Klarheit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Für Einrichtungen */}
      <section id="einrichtungen" className="landing-section landing-section-hospitals">
        <div className="landing-section-inner landing-two-col">
          <div className="landing-card landing-card-visual">
            <div className="landing-card-header">
              <span className="landing-card-dot dot-red" />
              <span className="landing-card-title">Live · Offene Dienste in Berlin</span>
            </div>
            <div className="landing-card-body">
              <div className="landing-shift-card">
                <div className="landing-shift-header">
                  <span className="landing-shift-tag landing-shift-tag-acute">AKUT</span>
                  <div>
                    <div className="landing-shift-title">Frühdienst · Innere Medizin</div>
                    <div className="landing-shift-sub">Examinierte Pflegefachkraft · Krankenhaus</div>
                  </div>
                  <div className="landing-shift-rate">
                    <span className="landing-shift-rate-label">Vergütung</span>
                    <span className="landing-shift-rate-value">42 € / h</span>
                  </div>
                </div>
                <div className="landing-shift-details">
                  <span>🕐 Heute 06:00–14:00</span>
                  <span>📍 3,8 km · Berlin-Mitte</span>
                  <span>👥 1 von 1 offen</span>
                </div>
                <div className="landing-shift-actions">
                  <button className="landing-btn landing-btn-primary">Schicht anfragen</button>
                  <button className="landing-btn landing-btn-secondary">Details</button>
                </div>
              </div>
              <div className="landing-shift-card">
                <div className="landing-shift-header">
                  <span className="landing-shift-tag landing-shift-tag-today">HEUTE</span>
                  <div>
                    <div className="landing-shift-title">Spätdienst · Intensivstation</div>
                    <div className="landing-shift-sub">Fachpflegekraft Anästhesie & Intensiv</div>
                  </div>
                  <div className="landing-shift-rate">
                    <span className="landing-shift-rate-label">Vergütung</span>
                    <span className="landing-shift-rate-value">58 € / h</span>
                  </div>
                </div>
                <div className="landing-shift-details">
                  <span>🕐 14:00–22:00</span>
                  <span>📍 7,4 km · Berlin-Neukölln</span>
                  <span>👥 1 von 2 offen</span>
                </div>
              </div>
              <div className="landing-notification-toast">
                <span>🔔</span>
                <div>
                  <strong>Verfügbare Kräfte im Berliner Radius sichtbar</strong>
                  <p>Beispiel: verfügbare Pflegekräfte im Umkreis</p>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-section-text">
            <div className="landing-section-eyebrow">Für Einrichtungen</div>
            <h2>Offene Dienste einstellen statt herumtelefonieren.</h2>
            <p className="landing-section-desc">
              Melden Sie kurzfristige Ausfälle, definieren Sie Qualifikation, Zeitraum,
              Einsatzort und Konditionen. ShiftLink zeigt den Dienst passenden Pflegekräften,
              die aktuell verfügbar sind.
            </p>
            <ul className="landing-feature-list">
              <li>Weniger Telefonketten und WhatsApp-Chaos</li>
              <li>Schnellere Reaktion bei akuten Ausfällen</li>
              <li>Transparente Konditionen statt Verhandlung im Stress</li>
              <li>Nur passende Qualifikationen werden vorgeschlagen</li>
              <li>Direkte Vertragsbeziehung: Die Einrichtung schließt die vereinbarte Schicht direkt mit der Pflegekraft ab. ShiftLink ist nicht Arbeitgeber, sondern Plattform und Prozessinfrastruktur.</li>
            </ul>
            <a href="#warteliste-einrichtung" className="landing-btn landing-btn-primary">
              Einrichtung vormerken
            </a>
          </div>
        </div>
      </section>

      {/* Für Pflegekräfte */}
      <section id="pflegekraefte" className="landing-section landing-section-nurses">
        <div className="landing-section-inner landing-two-col">
          <div className="landing-section-text">
            <div className="landing-section-eyebrow">Für Pflegekräfte</div>
            <h2>Schichten anfragen, wenn du wirklich verfügbar bist.</h2>
            <p className="landing-section-desc">
              Pflegekräfte entscheiden selbst, wann sie verfügbar sind. Sie sehen passende
              Dienste mit Zeit, Ort, Fachbereich und Konditionen und können Schichten direkt anfragen.
            </p>
            <ul className="landing-feature-list">
              <li>Keine Blindbewerbung – nur passende Schichten</li>
              <li>Keine endlosen Vermittlungsgespräche</li>
              <li>Zusätzliche Schichten exakt nach eigener Verfügbarkeit</li>
              <li>Qualifikationen einmal hinterlegen, wiederverwenden</li>
              <li>Klare Vertragsbedingungen vor Anfrage: Einsatzort, Zeit, Vergütung, Fachbereich — alles sichtbar. Die Vereinbarung erfolgt direkt mit der Einrichtung.</li>
            </ul>
            <a href="#warteliste-pflegekraft" className="landing-btn landing-btn-primary">
              Schicht anfragen
            </a>
          </div>
          <div className="landing-card landing-card-visual">
            <div className="landing-card-header">
              <span className="landing-card-dot dot-green" />
              <span className="landing-card-title">Pflegekraft — Verfügbarkeiten</span>
            </div>
            <div className="landing-card-body">
              <div className="landing-availability-block">
                <strong>Frühdienst · Montag–Freitag</strong>
                <span>Berlin-Mitte · 25 km Radius</span>
                <span>06:00–14:00 · Ab 42 €/h</span>
                <span className="landing-availability-status status-active">● Verfügbar</span>
              </div>
              <div className="landing-availability-block">
                <strong>Wochenenden · Flexibel</strong>
                <span>Berlin · 30 km Radius</span>
                <span> variabel · Ab 48 €/h</span>
                <span className="landing-availability-status status-active">● Verfügbar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section id="ablauf" className="landing-section landing-section-flow">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Ablauf</span>
            <h2>Zwei Seiten, ein klarer Weg zum besetzten Dienst.</h2>
          </div>
          <div className="landing-flow-grid">
            <div className="landing-flow-col">
              <h3>Für Einrichtungen</h3>
              <div className="landing-flow-steps">
                <div className="landing-flow-step">
                  <span className="landing-step-num">01</span>
                  <div>
                    <strong>Dienst einstellen</strong>
                    <p>Zeit, Fachbereich, Qualifikation, Einsatzort, Vergütung und Vertragsbedingungen festlegen.</p>
                  </div>
                </div>
                <div className="landing-flow-step">
                  <span className="landing-step-num">02</span>
                  <div>
                    <strong>Passende Kräfte werden informiert</strong>
                    <p>Nur verfügbare, qualifizierte Pflegekräfte im Berliner Radius sehen den Dienst.</p>
                  </div>
                </div>
                <div className="landing-flow-step">
                  <span className="landing-step-num">03</span>
                  <div>
                    <strong>Einrichtung bestätigt die Pflegekraft</strong>
                    <p>Wenn eine Pflegekraft die Schicht anfragt, bestätigt die Einrichtung die passende Kraft. Eine direkte schichtbezogene Vereinbarung entsteht.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-flow-col">
              <h3>Für Pflegekräfte</h3>
              <div className="landing-flow-steps">
                <div className="landing-flow-step">
                  <span className="landing-step-num">01</span>
                  <div>
                    <strong>Profil anlegen</strong>
                    <p>Kontaktdaten und Stammangaben einmal hinterlegen.</p>
                  </div>
                </div>
                <div className="landing-flow-step">
                  <span className="landing-step-num">02</span>
                  <div>
                    <strong>Qualifikationen hinterlegen</strong>
                    <p>Berufserlaubnis, Fachbereiche, Spezialisierungen.</p>
                  </div>
                </div>
                <div className="landing-flow-step">
                  <span className="landing-step-num">03</span>
                  <div>
                    <strong>Verfügbarkeit aktivieren</strong>
                    <p>Selbst entscheiden, wann ShiftLink Dienste vorschlagen darf.</p>
                  </div>
                </div>
                <div className="landing-flow-step">
                  <span className="landing-step-num">04</span>
                  <div>
                    <strong>Schicht anfragen</strong>
                    <p>Konditionen prüfen und passende Schichten direkt anfragen. Nach Bestätigung durch die Einrichtung entsteht eine direkte schichtbezogene Vereinbarung.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Abgrenzung */}
      <section className="landing-section landing-section-differentiation">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Abgrenzung</span>
            <h2>Nicht Jobbörse. Nicht klassische Zeitarbeit. Nicht Recruiting.</h2>
            <p className="landing-section-desc">
              ShiftLink ist Infrastruktur für kurzfristige Pflege-Dienste. Die Plattform bringt
              verfügbare Pflegekräfte und Einrichtungen zusammen. Die konkrete schichtbezogene
              Vereinbarung wird direkt zwischen Pflegekraft und Einrichtung geschlossen.
            </p>
          </div>
          <div className="landing-differentiation-grid">
            <div className="landing-diff-card">
              <h3>Keine Jobbörse</h3>
              <p>Es geht nicht um Lebensläufe, Bewerbungsmappen oder langfristige Jobsuche.</p>
            </div>
            <div className="landing-diff-card">
              <h3>Keine klassische Zeitarbeit</h3>
              <p>ShiftLink tritt nicht als Arbeitgeber der Pflegekraft auf. Die schichtbezogene Vereinbarung entsteht direkt zwischen Pflegekraft und Einrichtung.</p>
            </div>
            <div className="landing-diff-card">
              <h3>Kein Recruiting-Portal</h3>
              <p>Wir besetzen keine Festanstellungen. Wir machen kurzfristig offene Dienste sichtbar und anfragbar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section id="warteliste" className="landing-section landing-section-cta">
        <div className="landing-cta-inner">
          <span className="landing-cta-badge">PILOT · BERLIN</span>
          <h2>Pilotregion Berlin vormerken</h2>
          <p className="landing-cta-desc">
            ShiftLink startet in Berlin mit ausgewählten Krankenhäusern, Pflegeeinrichtungen
            und qualifizierten Pflegekräften. Ziel ist ein funktionierendes Matching bei echten
            kurzfristigen Dienstausfällen.
          </p>
          <div className="landing-cta-actions">
            <a href="#warteliste-einrichtung" className="landing-btn landing-btn-primary">
              Einrichtung vormerken
            </a>
            <a href="#warteliste-pflegekraft" className="landing-btn landing-btn-secondary">
              Als Pflegekraft vormerken
            </a>
          </div>
          <p className="landing-cta-footer">
            ShiftLink verkauft keine Jobs. ShiftLink hilft, offene Dienste schnell sichtbar zu machen
            und direkt zwischen Einrichtung und Pflegekraft zu vereinbaren.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo">
            <span className="landing-logo-mark">S</span>
            <span className="landing-logo-text">ShiftLink</span>
          </div>
          <p className="landing-footer-text">
            Operative Infrastruktur für akute Pflege-Dienste — Pilot Berlin.
          </p>
        </div>
      </footer>
    </div>
  );
}
