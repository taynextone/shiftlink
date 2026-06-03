import { FormEvent, useState } from 'react';

type WaitlistForm = {
  name: string;
  email: string;
  phone: string;
  org: string;
  orgType: string;
  region: string;
  details: string;
};

const emptyForm: WaitlistForm = {
  name: '',
  email: '',
  phone: '',
  org: '',
  orgType: '',
  region: '',
  details: '',
};

export function LandingPage() {
  const [hospitalForm, setHospitalForm] = useState<WaitlistForm>({ ...emptyForm });
  const [nurseForm, setNurseForm] = useState<WaitlistForm>({ ...emptyForm });
  const [hospitalSubmitted, setHospitalSubmitted] = useState(false);
  const [nurseSubmitted, setNurseSubmitted] = useState(false);

  const handleHospitalSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Wire up API endpoint
    setHospitalSubmitted(true);
  };

  const handleNurseSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Wire up API endpoint
    setNurseSubmitted(true);
  };

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <a href="#" className="landing-logo">
            <span className="landing-logo-mark">S</span>
            <span className="landing-logo-text">ShiftLink</span>
          </a>
          <div className="landing-nav-links">
            <a href="#problem" className="landing-nav-link">Problem</a>
            <a href="#loesung" className="landing-nav-link">Lösung</a>
            <a href="#ablauf" className="landing-nav-link">Ablauf</a>
            <a href="#pilot" className="landing-nav-link">Pilot</a>
            <a href="#pilot" className="landing-nav-cta">Mitmachen</a>
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
            die kurzfristig einspringen können. Offene Dienste werden sichtbar — mit Zeit, Ort,
            Fachbereich, Vergütung und Vertragsbedingungen. Ein Tap statt Telefonkette.
          </p>
          <div className="landing-hero-actions">
            <a href="#pilot" className="landing-btn landing-btn-primary">
              Als Einrichtung mitmachen
            </a>
            <a href="#pilot" className="landing-btn landing-btn-secondary">
              Als Pflegekraft verfügbar werden
            </a>
          </div>
          <div className="landing-hero-features">
            <div className="landing-hero-feature">
              <span className="landing-feature-icon">⚡</span>
              Akute Ausfälle in Minuten sichtbar
            </div>
            <div className="landing-hero-feature">
              <span className="landing-feature-icon">🎯</span>
              Matching nach Qualifikation &amp; Radius
            </div>
            <div className="landing-hero-feature">
              <span className="landing-feature-icon">👁</span>
              Konditionen vor Annahme sichtbar
            </div>
          </div>

          {/* Live Demo Card */}
          <div className="landing-hero-visual">
            <div className="landing-demo-card">
              <div className="landing-demo-header">
                <div className="landing-demo-header-left">
                  <span className="landing-dot-red" />
                  Live · Offene Dienste in Berlin
                </div>
                <div className="landing-demo-time">04:12 Uhr</div>
              </div>
              <div className="landing-demo-body">
                <div className="landing-demo-shift">
                  <div className="landing-demo-shift-top">
                    <div>
                      <span className="landing-tag landing-tag-acute">AKUT</span>
                      <div className="landing-demo-shift-title">Frühdienst · Innere Medizin</div>
                      <div className="landing-demo-shift-sub">Examinierte Pflegefachkraft · Krankenhaus</div>
                    </div>
                    <div className="landing-demo-rate">
                      <div className="landing-demo-rate-label">Vergütung</div>
                      <div className="landing-demo-rate-value">42 €/h</div>
                    </div>
                  </div>
                  <div className="landing-demo-shift-details">
                    <span>🕐 Heute 06:00–14:00</span>
                    <span>📍 3,8 km · Berlin-Mitte</span>
                    <span>👥 1 von 1 offen</span>
                  </div>
                  <div className="landing-demo-shift-actions">
                    <button className="landing-btn landing-btn-primary">Schicht anfragen</button>
                    <button className="landing-btn landing-btn-ghost">Details</button>
                  </div>
                </div>
                <div className="landing-demo-shift">
                  <div className="landing-demo-shift-top">
                    <div>
                      <span className="landing-tag landing-tag-today">HEUTE</span>
                      <div className="landing-demo-shift-title">Spätdienst · Intensivstation</div>
                      <div className="landing-demo-shift-sub">Fachpflegekraft Anästhesie &amp; Intensiv</div>
                    </div>
                    <div className="landing-demo-rate">
                      <div className="landing-demo-rate-label">Vergütung</div>
                      <div className="landing-demo-rate-value">58 €/h</div>
                    </div>
                  </div>
                  <div className="landing-demo-shift-details">
                    <span>🕐 14:00–22:00</span>
                    <span>📍 7,4 km · Berlin-Neukölln</span>
                    <span>👥 1 von 2 offen</span>
                  </div>
                </div>
              </div>
              <div className="landing-demo-toast">
                <span className="landing-toast-icon">🔔</span>
                <div>
                  <strong>3 verfügbare Kräfte im Radius</strong>
                  <p>Qualifikation und Verfügbarkeit geprüft</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="landing-section landing-section-problem">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-eyebrow">Das Problem</p>
            <h2>Ein Ausfall reicht, und der Dienstplan kippt.</h2>
            <p className="landing-section-desc">
              Akute Personalausfälle gehören zum Pflegealltag. Was fehlt, ist kein weiteres
              Recruiting-Tool — sondern ein schneller Weg, offene Dienste mit verfügbaren
              Kräften zusammenzubringen.
            </p>
          </div>
          <div className="landing-problem-grid">
            <div className="landing-problem-card">
              <span className="landing-card-emoji">📵</span>
              <h3>Krankmeldung kurz vor Dienstbeginn</h3>
              <p>Eine Nachricht — und der Schichtplan bricht.</p>
            </div>
            <div className="landing-problem-card">
              <span className="landing-card-emoji">📞</span>
              <h3>PDL und WBL telefonieren hektisch herum</h3>
              <p>Telefonketten, WhatsApp-Gruppen, Vertretungslisten.</p>
            </div>
            <div className="landing-problem-card">
              <span className="landing-card-emoji">👥</span>
              <h3>Das Stammteam wird wieder belastet</h3>
              <p>Doppeldienste und Holen aus dem Frei — auf Kosten der Bindung.</p>
            </div>
            <div className="landing-problem-card">
              <span className="landing-card-emoji">💰</span>
              <h3>Zeitarbeit ist teuer und träge</h3>
              <p>Lange Vorlauf, hohe Aufwandsentschädigungen, wenig Transparenz.</p>
            </div>
            <div className="landing-problem-card landing-problem-card-warn">
              <span className="landing-card-emoji">⚠️</span>
              <h3>Versorgungssicherheit gerät unter Druck</h3>
              <p>Im Worst Case bleiben Dienste unbesetzt — mit allen Folgen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lösung */}
      <section id="loesung" className="landing-section landing-section-solution">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-eyebrow">Die Lösung</p>
            <h2>ShiftLink macht verfügbare Pflegekräfte sichtbar.</h2>
            <p className="landing-section-desc">
              Statt Recruiting-Prozess: ein operatives Werkzeug für den Moment,
              in dem ein Dienst kurzfristig besetzt werden muss.
            </p>
          </div>
          <div className="landing-solution-grid">
            <div className="landing-solution-card">
              <span className="landing-solution-icon">📋</span>
              <h3>Einrichtungen stellen offene Dienste ein</h3>
              <p>Dienstzeit, Fachbereich, Qualifikation, Einsatzort, Vergütung und Vertragsbedingungen werden klar definiert.</p>
            </div>
            <div className="landing-solution-card">
              <span className="landing-solution-icon">🔄</span>
              <h3>Pflegekräfte aktivieren ihre Verfügbarkeit</h3>
              <p>Nur wer wirklich kann, sieht und erhält passende Schichtanfragen im Berliner Radius.</p>
            </div>
            <div className="landing-solution-card">
              <span className="landing-solution-icon">🎯</span>
              <h3>Matching nach Qualifikation, Fachbereich, Radius &amp; Zeit</h3>
              <p>Kein Streuen, keine Blindbewerbung — nur passende Vorschläge.</p>
            </div>
            <div className="landing-solution-card">
              <span className="landing-solution-icon">👁</span>
              <h3>Konditionen vor Anfrage sichtbar</h3>
              <p>Vergütung, Zeit, Einsatzort und Vertragsbedingungen — alles transparent, bevor angefragt wird.</p>
            </div>
            <div className="landing-solution-card">
              <span className="landing-solution-icon">🤝</span>
              <h3>Direkte Schichtvereinbarung</h3>
              <p>Die Vereinbarung entsteht direkt zwischen Pflegekraft und Einrichtung. ShiftLink stellt die digitale Infrastruktur.</p>
            </div>
            <div className="landing-solution-card">
              <span className="landing-solution-icon">⚡</span>
              <h3>Anfrage und Zusage digital</h3>
              <p>Ein Tap statt Telefonkette. Beide Seiten haben sofort Klarheit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Für Einrichtungen */}
      <section id="einrichtungen" className="landing-section landing-section-hospitals">
        <div className="landing-section-inner landing-two-col">
          <div className="landing-section-text">
            <p className="landing-eyebrow">Für Einrichtungen</p>
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
              <li>Direkte Vertragsbeziehung mit der Pflegekraft</li>
            </ul>
            <a href="#pilot" className="landing-btn landing-btn-primary">
              Einrichtung vormerken
            </a>
          </div>
          <div className="landing-card-visual">
            <div className="landing-card">
              <div className="landing-card-header">
                <span className="landing-card-dot dot-green" />
                <span className="landing-card-title">Charité · 2 offene Dienste</span>
              </div>
              <div className="landing-card-body">
                <div className="landing-progress">
                  <div className="landing-progress-step done">✅ Frühdienst Innere — besetzt</div>
                  <div className="landing-progress-step done">✅ Spätdienst Chirurgie — besetzt</div>
                  <div className="landing-progress-step active">⏳ Nachtdienst Intensiv — 1 Kandidat</div>
                  <div className="landing-progress-step">○ Frühdienst Gastro — suchen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Für Pflegekräfte */}
      <section id="pflegekraefte" className="landing-section landing-section-nurses">
        <div className="landing-section-inner landing-two-col">
          <div className="landing-card-visual">
            <div className="landing-card">
              <div className="landing-card-header">
                <span className="landing-card-dot dot-blue" />
                <span className="landing-card-title">Verfügbarkeit · Maria K.</span>
              </div>
              <div className="landing-card-body">
                <div className="landing-availability-block">
                  <strong>Frühdienste</strong>
                  <span>Mo–Fr, 06:00–14:00</span>
                  <span className="landing-availability-status status-active">● Aktiv</span>
                </div>
                <div className="landing-availability-block">
                  <strong>Radius</strong>
                  <span>Berlin, 15 km</span>
                </div>
                <div className="landing-stat-row">
                  <span className="landing-stat-label">Passende Dienste</span>
                  <span className="landing-stat-value">4</span>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-section-text">
            <p className="landing-eyebrow">Für Pflegekräfte</p>
            <h2>Dienste annehmen, wenn du wirklich verfügbar bist.</h2>
            <p className="landing-section-desc">
              Pflegekräfte entscheiden selbst, wann sie verfügbar sind. Sie sehen passende
              Dienste mit Zeit, Ort, Fachbereich und Konditionen — und können direkt zusagen.
            </p>
            <ul className="landing-feature-list">
              <li>Keine Blindbewerbung — nur passende Dienste</li>
              <li>Keine endlosen Vermittlungsgespräche</li>
              <li>Zusätzliche Dienste exakt nach eigener Verfügbarkeit</li>
              <li>Qualifikationen einmal hinterlegen, wiederverwenden</li>
              <li>Klare Vertragsbedingungen vor Zusage</li>
            </ul>
            <a href="#pilot" className="landing-btn landing-btn-primary">
              Als Pflegekraft vormerken
            </a>
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section id="ablauf" className="landing-section landing-section-flow">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <p className="landing-eyebrow">Ablauf</p>
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
                    <strong>Schichtvereinbarung abschließen</strong>
                    <p>Wenn eine Pflegekraft zusagt, entsteht die Vereinbarung direkt zwischen Einrichtung und Pflegekraft. ShiftLink dokumentiert den Prozess digital.</p>
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
                    <strong>Schicht anfragen oder zusagen</strong>
                    <p>Konditionen prüfen und passende Schichten direkt mit der Einrichtung vereinbaren.</p>
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
            <p className="landing-eyebrow">Abgrenzung</p>
            <h2>Nicht Jobbörse. Nicht klassische Zeitarbeit. Nicht Recruiting.</h2>
          </div>
          <div className="landing-diff-grid">
            <div className="landing-diff-card">
              <h3>Keine Jobbörse</h3>
              <p>Es geht nicht um Lebensläufe oder langfristige Jobsuche.</p>
            </div>
            <div className="landing-diff-card">
              <h3>Keine klassische Zeitarbeit</h3>
              <p>ShiftLink tritt nicht als Arbeitgeber auf. Die Schichtvereinbarung entsteht direkt.</p>
            </div>
            <div className="landing-diff-card">
              <h3>Kein Recruiting-Portal</h3>
              <p>Wir besetzen keine Festanstellungen. Wir machen kurzfristig offene Dienste sichtbar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section id="pilot" className="landing-section landing-section-cta">
        <div className="landing-cta-inner">
          <span className="landing-cta-badge">PILOT · BERLIN</span>
          <h2>Pilotregion Berlin — dabei sein.</h2>
          <p className="landing-cta-desc">
            ShiftLink startet in Berlin mit ausgewählten Krankenhäusern, Pflegeeinrichtungen
            und qualifizierten Pflegekräften. Tragen Sie sich ein — wir melden uns persönlich.
          </p>
        </div>
      </section>

      {/* Forms */}
      <section className="landing-section landing-section-forms">
        <div className="landing-section-inner">
          <div className="landing-forms-grid">
            {/* Hospital Form */}
            <div className="landing-form-card">
              <div className="landing-form-header">
                <span className="landing-form-icon">🏥</span>
                <h3>Für Einrichtungen</h3>
              </div>
              {hospitalSubmitted ? (
                <div className="landing-form-success">
                  <h4>✓ Vielen Dank!</h4>
                  <p>Wir melden uns persönlich, sobald der Pilot startet.</p>
                </div>
              ) : (
                <form onSubmit={handleHospitalSubmit} className="landing-form-fields">
                  <div className="landing-form-row">
                    <div className="landing-form-field">
                      <label>Name der Einrichtung <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="z. B. Charité Berlin"
                        required
                        value={hospitalForm.org}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, org: e.target.value })}
                      />
                    </div>
                    <div className="landing-form-field">
                      <label>Ansprechpartner:in <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="Vor- und Nachname"
                        required
                        value={hospitalForm.name}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="landing-form-row">
                    <div className="landing-form-field">
                      <label>Art der Einrichtung</label>
                      <input
                        type="text"
                        placeholder="Krankenhaus, Altenpflege, Reha …"
                        value={hospitalForm.orgType}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, orgType: e.target.value })}
                      />
                    </div>
                    <div className="landing-form-field">
                      <label>Region / Bezirk</label>
                      <input
                        type="text"
                        placeholder="z. B. Berlin-Mitte"
                        value={hospitalForm.region}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, region: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="landing-form-field">
                    <label>Typischer kurzfristiger Bedarf</label>
                    <textarea
                      placeholder="z. B. Frühdienst Krankenhaus, Nachtdienst Intensiv"
                      rows={3}
                      value={hospitalForm.details}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, details: e.target.value })}
                    />
                  </div>
                  <div className="landing-form-row">
                    <div className="landing-form-field">
                      <label>E-Mail <span className="required">*</span></label>
                      <input
                        type="email"
                        placeholder="name@einrichtung.de"
                        required
                        value={hospitalForm.email}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                      />
                    </div>
                    <div className="landing-form-field">
                      <label>Telefon (optional)</label>
                      <input
                        type="tel"
                        placeholder="+49 …"
                        value={hospitalForm.phone}
                        onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="landing-btn landing-btn-primary landing-btn-full">
                    Einrichtung vormerken
                  </button>
                  <p className="landing-form-hint">Wir nutzen Ihre Angaben ausschließlich zur Aufnahme in den Pilot.</p>
                </form>
              )}
            </div>

            {/* Nurse Form */}
            <div className="landing-form-card landing-form-card-dark">
              <div className="landing-form-header">
                <span className="landing-form-icon">👤</span>
                <h3>Für Pflegekräfte</h3>
              </div>
              {nurseSubmitted ? (
                <div className="landing-form-success">
                  <h4>✓ Vielen Dank!</h4>
                  <p>Wir melden uns mit den nächsten Schritten.</p>
                </div>
              ) : (
                <form onSubmit={handleNurseSubmit} className="landing-form-fields">
                  <div className="landing-form-row">
                    <div className="landing-form-field">
                      <label>Name <span className="required">*</span></label>
                      <input
                        type="text"
                        className="landing-input-dark"
                        placeholder="Vor- und Nachname"
                        required
                        value={nurseForm.name}
                        onChange={(e) => setNurseForm({ ...nurseForm, name: e.target.value })}
                      />
                    </div>
                    <div className="landing-form-field">
                      <label>Qualifikation <span className="required">*</span></label>
                      <input
                        type="text"
                        className="landing-input-dark"
                        placeholder="z. B. examinierte Pflegefachkraft"
                        required
                        value={nurseForm.orgType}
                        onChange={(e) => setNurseForm({ ...nurseForm, orgType: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="landing-form-row">
                    <div className="landing-form-field">
                      <label>Fachbereiche</label>
                      <input
                        type="text"
                        className="landing-input-dark"
                        placeholder="Intensiv, Anästhesie, Altenpflege …"
                        value={nurseForm.details}
                        onChange={(e) => setNurseForm({ ...nurseForm, details: e.target.value })}
                      />
                    </div>
                    <div className="landing-form-field">
                      <label>Region / Radius</label>
                      <input
                        type="text"
                        className="landing-input-dark"
                        placeholder="z. B. Berlin, 15 km"
                        value={nurseForm.region}
                        onChange={(e) => setNurseForm({ ...nurseForm, region: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="landing-form-field">
                    <label>Verfügbarkeit</label>
                    <textarea
                      className="landing-input-dark"
                      placeholder="z. B. Frühdienste ab 06:00, Wochenenden"
                      rows={3}
                      value={nurseForm.phone}
                      onChange={(e) => setNurseForm({ ...nurseForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="landing-form-row">
                    <div className="landing-form-field">
                      <label>E-Mail <span className="required">*</span></label>
                      <input
                        type="email"
                        className="landing-input-dark"
                        placeholder="name@email.de"
                        required
                        value={nurseForm.email}
                        onChange={(e) => setNurseForm({ ...nurseForm, email: e.target.value })}
                      />
                    </div>
                    <div className="landing-form-field">
                      <label>Telefon (optional)</label>
                      <input
                        type="tel"
                        className="landing-input-dark"
                        placeholder="+49 …"
                        value={nurseForm.org}
                        onChange={(e) => setNurseForm({ ...nurseForm, org: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="landing-btn landing-btn-primary landing-btn-full">
                    Als Pflegekraft vormerken
                  </button>
                  <p className="landing-form-hint">Du erhältst nur Dienste, die zu deiner Qualifikation und Verfügbarkeit passen.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-logo">
            <span className="landing-logo-mark">S</span>
            <span className="landing-logo-text">ShiftLink</span>
          </div>
          <p className="landing-footer-tagline">
            ShiftLink verkauft keine Jobs. ShiftLink hilft, offene Dienste schnell sichtbar zu machen
            und direkt zwischen Einrichtung und Pflegekraft zu vereinbaren.
          </p>
          <div className="landing-footer-links">
            <a href="#">Impressum</a>
            <a href="#">Datenschutz</a>
            <a href="#">Kontakt</a>
          </div>
          <p className="landing-footer-copy">ShiftLink © 2026 · Pilot</p>
        </div>
      </footer>
    </div>
  );
}
