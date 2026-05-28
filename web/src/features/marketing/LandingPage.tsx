import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-mark">S</span>
            <span className="landing-logo-text">Shiftlink</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">Login</Link>
            <Link to="/register" className="landing-nav-cta">Registrieren</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">Healthcare Staffing Platform</div>
          <h1 className="landing-hero-title">
            Verifizierte Pflegekräfte.<br />
            Operativ anschlussfähige Kliniken.
          </h1>
          <p className="landing-hero-subtitle">
            Shiftlink verbindet qualifizierte Pflegekräfte mit Kliniken, die kurzfristig Besetzung benötigen.
            Von der Verifikation über Matching bis zu Vertrag und Billing — alles in einem strukturierten Flow.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn landing-btn-primary">
              Als Pflegekraft starten
            </Link>
            <Link to="/login" className="landing-btn landing-btn-secondary">
              Zum Login
            </Link>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="landing-usps">
        <div className="landing-usps-inner">
          <div className="landing-usp">
            <div className="landing-usp-icon">✓</div>
            <h3>Verifiziert</h3>
            <p>Pflegekräfte durchlaufen einen strukturierten Verifikationsprozess. Kliniken erhalten nur qualifizierte Kandidaten.</p>
          </div>
          <div className="landing-usp">
            <div className="landing-usp-icon">⟳</div>
            <h3>Operativ</h3>
            <p>Offers, Verträge und Billing werden über einen zentralen Ops-Steuerungsbereich gesteuert und nachverfolgt.</p>
          </div>
          <div className="landing-usp">
            <div className="landing-usp-icon">◉</div>
            <h3>Kontrolliert</h3>
            <p>Matching-Freigaben, Freigabestellungen und Rollen sind klar definiert und nachvollziehbar.</p>
          </div>
        </div>
      </section>

      {/* For Nurses */}
      <section className="landing-section landing-section-nurses">
        <div className="landing-section-inner">
          <div className="landing-section-text">
            <h2>Für Pflegekräfte</h2>
            <p className="landing-section-desc">
              Strukturiertes Profil statt losem Bewerbungsverkehr. Du siehst passende Einsätze,
              beantwortet Offers und verwaltest Verträge — übersichtlich und planbar.
            </p>
            <ul className="landing-feature-list">
              <li>Verifikationsprozess mit klarem Status</li>
              <li>Matching-Freigabe als Sicherheits-Gate</li>
              <li>Vertrags- und Verfügbarekeitsoverview</li>
              <li>Alle Dokumente an einem Ort</li>
            </ul>
            <Link to="/register" className="landing-btn landing-btn-primary">Jetzt registrieren</Link>
          </div>
          <div className="landing-section-visual">
            <div className="landing-card">
              <div className="landing-card-header">
                <span className="landing-card-dot dot-green"></span>
                <span className="landing-card-title">Profil & Verifikation</span>
              </div>
              <div className="landing-card-body">
                <div className="landing-progress">
                  <div className="landing-progress-step done">✓ Profil</div>
                  <div className="landing-progress-step done">✓ Dokumente</div>
                  <div className="landing-progress-step done">✓ Verifiziert</div>
                  <div className="landing-progress-step active">● Matching</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Hospitals */}
      <section className="landing-section landing-section-hospitals">
        <div className="landing-section-inner">
          <div className="landing-section-visual">
            <div className="landing-card">
              <div className="landing-card-header">
                <span className="landing-card-dot dot-blue"></span>
                <span className="landing-card-title">Klinik-Dashboard</span>
              </div>
              <div className="landing-card-body">
                <div className="landing-stat-row">
                  <span className="landing-stat-value">12</span>
                  <span className="landing-stat-label">Offene Schichten</span>
                </div>
                <div className="landing-stat-row">
                  <span className="landing-stat-value">8</span>
                  <span className="landing-stat-label">Signierte Offers</span>
                </div>
                <div className="landing-stat-row">
                  <span className="landing-stat-value">5</span>
                  <span className="landing-stat-label">Aktive Verträge</span>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-section-text">
            <h2>Für Kliniken</h2>
            <p className="landing-section-desc">
              Schichtbedarfe, Kandidaten und Angebote in einem verbundenen Flow.
              Dossiers, Verträge und Billing zentral steuern.
            </p>
            <ul className="landing-feature-list">
              <li>Schichten importieren und verwalten</li>
              <li>Kandidaten suchen und Offers senden</li>
              <li>Verifizierte Dossiers einsehen</li>
              <li>Vertrags- und Billing-Overview</li>
            </ul>
            <Link to="/login" className="landing-btn landing-btn-primary">Klinik-Onboarding anfragen</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo">
            <span className="landing-logo-mark">S</span>
            <span className="landing-logo-text">Shiftlink</span>
          </div>
          <p className="landing-footer-text">
            Professionelles Healthcare Staffing — von der Verifikation bis zum Billing.
          </p>
        </div>
      </footer>
    </div>
  );
}
