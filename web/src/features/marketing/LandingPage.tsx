import { Link } from 'react-router-dom';
import { ActionBar } from '../../components/ActionBar';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';

export function LandingPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Healthcare Staffing"
        title="Shiftlink verbindet verifizierte Pflegekräfte mit operativ anschlussfähigen Klinikanfragen"
        description="Eine professionelle Staffing-Plattform für kurzfristige Besetzung, klare Prozesse und belastbare operative Übergaben – von der Registrierung bis zu Offer, Vertrag, Dossier und Billing."
        actions={
          <ActionBar>
            <Link className="selection-card" to="/register">
              <div>
                <strong>Als Pflegekraft registrieren</strong>
                <p>Profil anlegen und in den Verifikationsprozess starten.</p>
              </div>
            </Link>
            <Link className="selection-card" to="/login">
              <div>
                <strong>Bestehenden Zugang öffnen</strong>
                <p>Direkt in den jeweiligen Arbeitsbereich einloggen.</p>
              </div>
            </Link>
          </ActionBar>
        }
      />

      <div className="metric-list">
        <div className="metric-item">
          <span>Operativer Fokus</span>
          <strong>Matching, Offers, Verträge und Billing in einem Flow</strong>
        </div>
        <div className="metric-item">
          <span>Vertrauen</span>
          <strong>Verifikations- und Dossierlogik mit klaren Freigaben</strong>
        </div>
        <div className="metric-item">
          <span>Steuerbarkeit</span>
          <strong>Ops-Surface für Interventionen, Ausnahmen und Nachverfolgung</strong>
        </div>
        <div className="metric-item">
          <span>Ziel</span>
          <strong>Weniger Leerlauf in Kliniken, mehr planbare Einsätze für Pflegekräfte</strong>
        </div>
      </div>

      <div className="content-grid two-columns-equal">
        <SectionCard
          title="Für Pflegekräfte"
          description="Registrierung, Verifikation und ein klar lesbarer Weg zu passenden Einsätzen – ohne unstrukturierte Vermittlungsprozesse."
        >
          <div className="record-list compact-list">
            <div className="selection-card">
              <div>
                <strong>Professionelles Profil statt losem Bewerbungsverkehr</strong>
                <p>Verfügbarkeiten, Qualifikationen und Matching-Freigabe werden strukturiert geführt.</p>
              </div>
            </div>
            <div className="selection-card">
              <div>
                <strong>Verifizierte Einsatzlogik</strong>
                <p>Offers, Vertragsstatus und nächste Schritte bleiben nachvollziehbar im Produkt sichtbar.</p>
              </div>
            </div>
            <div className="selection-card">
              <div>
                <strong>Schneller Einstieg</strong>
                <p>Pflegekräfte können sich direkt registrieren und anschließend in ihren geschützten Bereich wechseln.</p>
              </div>
            </div>
          </div>
          <ActionBar>
            <Link to="/register">
              <button type="button">Jetzt als Pflegekraft starten</button>
            </Link>
            <Link to="/login">
              <button type="button" className="secondary">Bereits registriert</button>
            </Link>
          </ActionBar>
        </SectionCard>

        <SectionCard
          title="Für Kliniken und Krankenhäuser"
          description="Shiftlink bündelt Kandidatensuche, Angebotssteuerung, Dossierzugriff, Vertragslogik und Billing in einem operativen Arbeitskontext."
        >
          <div className="record-list compact-list">
            <div className="selection-card">
              <div>
                <strong>Operativ verwertbare Besetzungsprozesse</strong>
                <p>Schichtbedarfe, Kandidatenlage und Offer-Antworten bleiben in einem verbundenen Flow.</p>
              </div>
            </div>
            <div className="selection-card">
              <div>
                <strong>Kontrollierte Freigaben und Dokumentzugriffe</strong>
                <p>Verifizierte Dossiers, Vertragsstände und Ausnahmen sind nachvollziehbar steuerbar.</p>
              </div>
            </div>
            <div className="selection-card">
              <div>
                <strong>Koordiniertes Onboarding</strong>
                <p>Klinikzugänge werden begleitet eingerichtet, damit Prozesse, Rollen und Betriebsmodell sauber aufgesetzt sind.</p>
              </div>
            </div>
          </div>
          <ActionBar>
            <Link to="/login">
              <button type="button">Klinik-Onboarding anfragen</button>
            </Link>
            <Link to="/login">
              <button type="button" className="secondary">Bestehenden Klinikzugang öffnen</button>
            </Link>
          </ActionBar>
        </SectionCard>
      </div>

      <SectionCard
        title="Warum die Landing Page bewusst sachlich bleibt"
        description="Shiftlink verkauft keine generische Plattformästhetik, sondern operative Verlässlichkeit. Das Produkt muss für beide Seiten vertrauenswürdig, klar und anschlussfähig wirken."
      >
        <div className="metric-list">
          <div className="metric-item">
            <span>Pflegekräfte</span>
            <strong>Wissen, wie Verifikation, Matching und Angebotsannahme zusammenspielen.</strong>
          </div>
          <div className="metric-item">
            <span>Kliniken</span>
            <strong>Sehen, dass Staffing nicht bei einem Chatverlauf endet, sondern operativ geführt wird.</strong>
          </div>
          <div className="metric-item">
            <span>Operations</span>
            <strong>Kann Ausnahmen, Dokumente, Verträge und Billing zentral nachverfolgen.</strong>
          </div>
          <div className="metric-item">
            <span>Nächster Schritt</span>
            <strong>Registrierung für Pflegekräfte, koordiniertes Onboarding für Kliniken, Login für bestehende Nutzer.</strong>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Bereit für den nächsten Schritt"
        description="Wenn du Pflegekraft bist, kannst du direkt starten. Wenn du eine Klinik vertrittst, richten wir den Zugang koordiniert auf euren operativen Prozess aus."
        actions={
          <ActionBar>
            <Link to="/register">
              <button type="button">Pflegekraft registrieren</button>
            </Link>
            <Link to="/login">
              <button type="button" className="secondary">Login / Klinik-Onboarding</button>
            </Link>
          </ActionBar>
        }
      >
        <p className="hint">Die Landing Page führt beide Zielgruppen klar in den nächsten sinnvollen Registrierungs- oder Zugangspfad, ohne den operativen Anspruch des Produkts zu verwässern.</p>
      </SectionCard>
    </section>
  );
}
