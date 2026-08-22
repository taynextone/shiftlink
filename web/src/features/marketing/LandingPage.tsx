import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

// MOS ecosystem cross-product links. Configure via Vite env when the sibling
// products ship their own frontends; fall back to in-app placeholders.
const MOS_PRODUCT_URLS = {
  qualipass: import.meta.env.VITE_QUALIPASS_URL as string | undefined,
  medbenefit: import.meta.env.VITE_MEDBENEFIT_URL as string | undefined,
};

const CSS = `
.ld{--ivory:#F7F5F0;--graphite:#0C1220;--indigo:#6157FF;--indigo-hover:#4F45E8;--slate:#667085;--emerald:#18A874;--amber:#F2B04A;--border:rgba(12,18,32,.09)}
.ld{background:var(--ivory);color:var(--graphite);line-height:1.6;font-family:'Inter',system-ui,sans-serif}
.ld h1,.ld h2,.ld h3,.ld .font-manrope{font-family:'Manrope',sans-serif;letter-spacing:-.025em;line-height:1.08}
.ld a{color:inherit;text-decoration:none}
.ld .container{max-width:1320px;margin:0 auto;padding:0 clamp(20px,4.5vw,56px)}
.ld .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--slate)}
.ld .eyebrow::before{content:"";width:26px;height:2px;background:var(--indigo);border-radius:2px}
.ld .section{padding:clamp(100px,12vw,176px) 0}
.ld .reveal{opacity:0;transform:translateY(26px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
.ld .reveal.in{opacity:1;transform:none}
.ld .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:15px 30px;font-size:15.5px;font-weight:600;border-radius:12px;border:1px solid transparent;transition:transform .25s,background .25s,box-shadow .25s,border-color .25s}
.ld .btn-primary{background:var(--indigo);color:#fff}
.ld .btn-primary:hover{background:var(--indigo-hover);transform:translateY(-2px);box-shadow:0 12px 28px rgba(97,87,255,.3)}
.ld .btn-secondary{background:transparent;color:var(--graphite);border-color:rgba(12,18,32,.22)}
.ld .btn-secondary:hover{border-color:var(--graphite);transform:translateY(-2px)}
.ld .nav{position:fixed;top:0;left:0;right:0;z-index:50;transition:background .35s,box-shadow .35s,backdrop-filter .35s}
.ld .nav.scrolled{background:rgba(247,245,240,.85);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--border)}
.ld .nav-inner{display:flex;align-items:center;justify-content:space-between;height:80px}
.ld .logo{font-family:'Manrope';font-weight:800;font-size:22px;letter-spacing:-.03em;display:flex;align-items:center;gap:9px}
.ld .logo-mark{width:27px;height:27px;border-radius:8px;background:var(--indigo);display:grid;place-items:center;color:#fff;font-size:14px;font-weight:800}
.ld .nav-links{display:flex;align-items:center;gap:38px;list-style:none;margin:0;padding:0}
.ld .nav-links a{font-size:15px;font-weight:500;opacity:.75}
.ld .nav-links a:hover{opacity:1}
.ld .nav-cta{display:flex;align-items:center;gap:20px}
.ld .nav-cta .btn{min-height:44px;padding:11px 22px;font-size:14.5px}
.ld .login-link{font-size:15px;font-weight:600;opacity:.8}
.ld .burger{display:none;background:none;border:none;width:44px;height:44px}
.ld .burger span{display:block;width:22px;height:2px;background:var(--graphite);margin:5px auto;border-radius:2px}
.ld .mobile-menu{position:fixed;inset:80px 0 0 0;background:var(--ivory);z-index:49;padding:32px 24px;display:flex;flex-direction:column;gap:8px}
.ld .mobile-menu a{font-family:'Manrope';font-size:26px;font-weight:800;padding:16px 0;border-bottom:1px solid var(--border)}
.ld .mobile-menu .btn{margin-top:28px;border-bottom:none}
.ld .hero{padding:190px 0 130px;overflow:hidden}
.ld .hero-grid{display:grid;grid-template-columns:1fr .92fr;gap:clamp(48px,6vw,96px);align-items:center}
.ld .hero h1{font-size:clamp(52px,6.4vw,92px);font-weight:800;letter-spacing:-.035em;line-height:1.02;margin:26px 0 28px}
.ld .hero h1 em{font-style:normal;color:var(--indigo)}
.ld .hero .sub{font-size:clamp(17px,1.5vw,20px);color:var(--slate);max-width:42ch;margin-bottom:42px}
.ld .hero-actions{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px}
.ld .hero-actions .btn{min-height:56px;padding:16px 34px;font-size:16px}
.ld .trust-note{display:flex;align-items:center;gap:9px;font-size:14px;color:var(--slate);font-weight:500}
.ld .hero-visual img{border-radius:32px;width:100%;aspect-ratio:1/1.08;object-fit:cover;object-position:68% center;box-shadow:0 44px 90px -36px rgba(12,18,32,.4)}
.ld .hero-visual figure{position:relative;margin:0}
.ld .hero-caption{margin-top:20px;display:flex;align-items:baseline;gap:14px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate);font-weight:600}
.ld .hero-caption::before{content:"";width:36px;height:1px;background:var(--graphite);flex:none;transform:translateY(-4px)}
.ld .section-head{max-width:680px;margin-bottom:clamp(56px,6vw,88px)}
.ld .section-head h2{font-size:clamp(36px,4vw,56px);font-weight:800;margin:20px 0 18px}
.ld .section-head p{color:var(--slate);font-size:18px;margin:0}
.ld .benefit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.ld .benefit-card{background:#fff;border:1px solid var(--border);border-radius:24px;overflow:hidden;transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s}
.ld .benefit-card:hover{transform:translateY(-8px);box-shadow:0 30px 56px -24px rgba(12,18,32,.2)}
.ld .benefit-card img{width:100%;aspect-ratio:16/10;object-fit:cover}
.ld .benefit-body{padding:32px 30px 36px}
.ld .benefit-body h3{font-size:24px;font-weight:800;margin:0 0 10px}
.ld .benefit-body p{font-size:15.5px;color:var(--slate);margin:0}
.ld .mhub{background:var(--graphite);color:var(--ivory);padding:clamp(72px,9vw,110px) 0}
.ld .mhub h2{font-size:clamp(32px,3.6vw,48px);font-weight:800;color:#fff;margin:18px 0 0;letter-spacing:-.02em}
.ld .mhub-grid{display:grid;grid-template-columns:1.1fr 1.1fr .9fr;gap:24px;margin-top:clamp(40px,5vw,56px)}
.ld .mhub-tile{border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:36px 30px;background:rgba(255,255,255,.04);display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;transition:transform .35s,background .35s,border-color .35s}
.ld .mhub-tile:hover{background:rgba(255,255,255,.07);transform:translateY(-4px);border-color:rgba(97,87,255,.4)}
.ld .mhub-tile.soon{opacity:.55;cursor:default}
.ld .mhub-tile.soon:hover{transform:none;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12)}
.ld .mhub-tag{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9A93FF}
.ld .mhub-tag.em{color:#3ED598}
.ld .mhub-tag.am{color:#F2B04A}
.ld .mhub-tile h3{font-size:23px;font-weight:800;color:#fff;margin:4px 0 0}
.ld .mhub-tile p{font-size:14.5px;color:rgba(247,245,240,.55);margin:0;line-height:1.55}
.ld .mhub-link{margin-top:auto;padding-top:18px;color:#9A93FF;font-size:14.5px;font-weight:600;display:inline-flex;align-items:center;gap:8px}
.ld .mhub-badge{display:inline-flex;align-self:flex-start;margin-top:auto;padding:6px 12px;border-radius:99px;background:rgba(242,176,74,.12);border:1px solid rgba(242,176,74,.35);color:#F2B04A;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.ld .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.ld .step{background:#fff;border:1px solid var(--border);border-radius:24px;padding:32px 28px}
.ld .step-num{width:52px;height:52px;border-radius:14px;background:var(--graphite);color:#fff;display:grid;place-items:center;font-family:'Manrope';font-weight:800;font-size:19px;margin-bottom:20px}
.ld .step h3{font-size:20px;font-weight:800;margin:0 0 8px}
.ld .step p{color:var(--slate);margin:0;font-size:15px}
.ld footer{background:var(--graphite);color:rgba(247,245,240,.65);border-top:1px solid rgba(255,255,255,.08)}
.ld .footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:44px;padding:88px 0 56px}
.ld footer .logo{color:#fff;margin-bottom:16px}
.ld .footer-desc{font-size:14.5px;max-width:32ch;margin:0}
.ld footer h4{font-family:'Manrope';color:#fff;font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 20px;font-weight:700}
.ld footer ul{list-style:none;display:flex;flex-direction:column;gap:12px;margin:0;padding:0}
.ld footer ul a{font-size:15px}
.ld footer ul a:hover{color:#fff}
.ld .footer-bottom{border-top:1px solid rgba(255,255,255,.08);padding:28px 0;display:flex;justify-content:space-between;align-items:center;font-size:13.5px;flex-wrap:wrap;gap:12px}
.ld .cookie{position:fixed;left:20px;bottom:20px;z-index:60;max-width:400px;background:var(--graphite);color:var(--ivory);border-radius:18px;padding:26px;box-shadow:0 24px 60px -18px rgba(12,18,32,.5)}
.ld .cookie p{font-size:13.5px;color:rgba(247,245,240,.75);margin:0 0 18px}
.ld .cookie strong{color:#fff}
.ld .cookie-btns{display:flex;gap:10px}
.ld .cookie-btns .btn{min-height:42px;padding:10px 16px;font-size:13.5px;flex:1}
.ld .cookie .btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.25);color:var(--ivory)}
.ld .cookie .btn-light{background:var(--ivory);color:var(--graphite)}
@media(max-width:1023px){.ld .hero{padding:150px 0 100px}.ld .hero-grid{grid-template-columns:1fr;gap:56px}.ld .mhub-grid{grid-template-columns:1fr}.ld .footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:767px){.ld .nav-links,.ld .nav-cta .login-link,.ld .nav-cta .btn{display:none}.ld .burger{display:block}.ld .hero{padding:128px 0 84px}}
`;

export function LandingPage() {
  const { session } = useAuth();
  const isAuthenticated = !!session;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookie, setCookie] = useState(false);

  const ctaTarget = isAuthenticated ? "/nurse" : "/register"; // default to nurse register
  const hospitalCta = "/register?role=HOSPITAL_ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".ld .reveal").forEach((el) => io.observe(el));

    if (!localStorage.getItem("shiftlink-consent")) {
      const t = setTimeout(() => setCookie(true), 1600);
      return () => {
        window.removeEventListener("scroll", onScroll);
        io.disconnect();
        clearTimeout(t);
      };
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  const setConsent = (v: string) => {
    localStorage.setItem("shiftlink-consent", v);
    setCookie(false);
  };

  return (
    <div className="ld">
      <style>{CSS}</style>

      {/* NAV */}
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link to="/" className="logo" aria-label="Shiftlink Startseite">
            <span className="logo-mark">S</span>
            <span>Shiftlink</span>
          </Link>

          <nav aria-label="Hauptnavigation">
            <ul className="nav-links">
              <li><a href="#wie">Wie es funktioniert</a></li>
              <li><a href="#vorteile">Vorteile</a></li>
              <li><a href="#mos">Im MOS-Ökosystem</a></li>
            </ul>
          </nav>

          <div className="nav-cta">
            <Link to="/login" className="login-link">{isAuthenticated ? "Zur App" : "Login"}</Link>
            <Link to={ctaTarget} className="btn btn-primary">
              {isAuthenticated ? "Zum Member-Bereich" : "Jetzt starten"}
            </Link>
            <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#wie" onClick={() => setMenuOpen(false)}>Wie es funktioniert</a>
          <a href="#vorteile" onClick={() => setMenuOpen(false)}>Vorteile</a>
          <a href="#mos" onClick={() => setMenuOpen(false)}>Im MOS-Ökosystem</a>
          <Link to={ctaTarget} className="btn btn-primary" onClick={() => setMenuOpen(false)}>
            Jetzt starten
          </Link>
        </div>
      )}

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Ein Produkt von MOS</span>
              <h1>Kurzfristige<br />Pflegeeinsätze.<br />Direkt vermittelt.</h1>
              <p className="sub">
                Verifizierte Pflegekräfte und Einrichtungen finden sich direkt. 
                Kein Umweg über Zeitarbeit. Klare Konditionen. Schnelle Zusagen.
              </p>
              <div className="hero-actions">
                <Link to={ctaTarget} className="btn btn-primary">
                  {isAuthenticated ? "Einsätze ansehen" : "Als Pflegekraft starten"}
                </Link>
                <Link to={hospitalCta} className="btn btn-secondary">
                  Für Einrichtungen
                </Link>
                <a href="#wie" className="btn btn-secondary">Wie es funktioniert</a>
              </div>
              <p className="trust-note">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#18A874" strokeWidth="1.5"/>
                  <path d="M5.2 8.2l1.9 1.9 3.7-4" stroke="#18A874" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Nur für verifizierte medizinische Fachkräfte
              </p>
            </div>

            <div className="hero-visual">
              <figure>
                <img 
                  src="https://picsum.photos/id/1015/800/800" 
                  alt="Pflegekraft und Klinik im direkten Austausch" 
                />
                <figcaption className="hero-caption">
                  Verifiziert im MOS · Bereit für Einsätze
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* MEMBER HUB (wenn eingeloggt) */}
        {isAuthenticated && (
          <section className="mhub">
            <div className="container">
              <span className="eyebrow" style={{ color: "rgba(247,245,240,.55)" }}>Dein MOS-Bereich</span>
              <h2>Willkommen zurück.<br />Spring direkt rein.</h2>

              <div className="mhub-grid">
                <Link to="/nurse" className="mhub-tile">
                  <span className="mhub-tag">Shiftlink</span>
                  <h3>Einsätze &amp; Matching</h3>
                  <p>Verfügbare Dienste sehen, Angebote annehmen und Verträge abschließen.</p>
                  <span className="mhub-link">Zum Dashboard →</span>
                </Link>

                <Link to={MOS_PRODUCT_URLS.qualipass ?? "/"} className="mhub-tile" {...(MOS_PRODUCT_URLS.qualipass ? { target: "_blank", rel: "noopener" } : {})}>
                  <span className="mhub-tag em">QualiPass</span>
                  <h3>Dein verifizierter Nachweis</h3>
                  <p>QualiPass ansehen, Freigaben erstellen und deinen Status nutzen.</p>
                  <span className="mhub-link">QualiPass öffnen →</span>
                </Link>

                <Link to={MOS_PRODUCT_URLS.medbenefit ?? "/"} className="mhub-tile" {...(MOS_PRODUCT_URLS.medbenefit ? { target: "_blank", rel: "noopener" } : {})}>
                  <span className="mhub-tag">MedBenefit</span>
                  <h3>Deine Vorteile</h3>
                  <p>Exklusive Deals für verifizierte Fachkräfte.</p>
                  <span className="mhub-link">Zu MedBenefit →</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* WIE ES FUNKTIONIERT */}
        <section id="wie" className="section">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">So einfach geht's</span>
              <h2>Einmal verifiziert.<br />Sofort einsatzbereit.</h2>
              <p>Dein MOS-Account ist der Schlüssel. Ein Verifizierungsprozess – Zugang zu allem.</p>
            </div>

            <div className="steps-grid">
              {[
                { num: "01", title: "Verifizieren", text: "Lade deine Nachweise hoch. Ein Prüfer bestätigt sie einmalig im MOS." },
                { num: "02", title: "Profil freischalten", text: "Nach erfolgreicher Verifizierung wirst du für Matching freigegeben." },
                { num: "03", title: "Einsätze finden", text: "Sieh passende kurzfristige Dienste und sage direkt zu – mit klaren Konditionen." },
              ].map((s, i) => (
                <div key={i} className="step reveal">
                  <div className="step-num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VORTEILE */}
        <section id="vorteile" className="section">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Warum Shiftlink</span>
              <h2>Direkt. Transparent.<br />Fair.</h2>
            </div>

            <div className="benefit-grid">
              {[
                { title: "Direktvermittlung", text: "Du verhandelst direkt mit der Einrichtung. Keine Zeitarbeitsfirma dazwischen." },
                { title: "Konditionen vorab klar", text: "Stundenlohn, Zeiten, Anforderungen – alles sichtbar, bevor du zusagst." },
                { title: "Dein QualiPass zählt", text: "Einmal verifiziert im MOS – und du bist sofort für alle Produkte bereit." },
              ].map((b, i) => (
                <div key={i} className="benefit-card reveal">
                  <div className="benefit-body">
                    <h3>{b.title}</h3>
                    <p>{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MOS ÖKOSYSTEM */}
        <section id="mos" className="section" style={{ background: "#fff" }}>
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Ein Account. Drei Produkte.</span>
              <h2>Willkommen im MOS.</h2>
              <p>
                Egal wo du einsteigst – dein Account gilt für alles. 
                Shiftlink, QualiPass und MedBenefit gehören zusammen.
              </p>
            </div>

            <div className="mhub-grid" style={{ marginTop: 40 }}>
              <div className="mhub-tile" style={{ cursor: "default" }}>
                <span className="mhub-tag em">QualiPass</span>
                <h3>Dein digitaler Berufsnachweis</h3>
                <p>Zertifikate, Examina und Nachweise zentral verwalten und freigeben.</p>
              </div>
              <div className="mhub-tile" style={{ cursor: "default" }}>
                <span className="mhub-tag">Shiftlink</span>
                <h3>Kurzfristige Einsätze</h3>
                <p>Der Matching-Marktplatz für direkte Vermittlung zwischen Pflegekräften und Einrichtungen.</p>
              </div>
              <div className="mhub-tile" style={{ cursor: "default" }}>
                <span className="mhub-tag">MedBenefit</span>
                <h3>Exklusive Vorteile</h3>
                <p>Deals und Benefits für verifizierte medizinische Fachkräfte.</p>
              </div>
            </div>

            <p style={{ textAlign: "center", marginTop: 48, color: "var(--slate)", fontSize: 15 }}>
              Ein Verifizierungsprozess. Zugang zu allen drei Produkten.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="section" style={{ background: "var(--graphite)", color: "var(--ivory)" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ color: "#fff", fontSize: "clamp(36px,5vw,56px)" }}>
              Bereit für den nächsten Einsatz?
            </h2>
            <p style={{ maxWidth: 520, margin: "20px auto 40px", color: "rgba(247,245,240,.7)", fontSize: 18 }}>
              Starte mit deiner Verifizierung im MOS und nutze Shiftlink sofort.
            </p>
            <Link to={ctaTarget} className="btn btn-primary" style={{ minWidth: 260 }}>
              {isAuthenticated ? "Jetzt Einsätze ansehen" : "Jetzt kostenlos starten"}
            </Link>
            <Link to={hospitalCta} className="btn btn-secondary" style={{ minWidth: 200, marginLeft: 12, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Für Einrichtungen
            </Link>
            <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
              Ein Account für QualiPass, Shiftlink und MedBenefit.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="container footer-grid">
          <div>
            <Link to="/" className="logo" style={{ color: "#fff" }}>
              <span className="logo-mark">S</span>Shiftlink
            </Link>
            <p className="footer-desc">
              Der direkte Matching-Marktplatz für kurzfristige Pflegeeinsätze.
            </p>
          </div>

          <div>
            <h4>Produkte</h4>
            <ul>
              <li><a href="#">Shiftlink</a></li>
              <li><a href="#">QualiPass</a></li>
              <li><a href="#">MedBenefit</a></li>
            </ul>
          </div>

          <div>
            <h4>Unternehmen</h4>
            <ul>
              <li><a href="#">Über MOS</a></li>
              <li><a href="#">Kontakt</a></li>
              <li><a href="#">Für Einrichtungen</a></li>
            </ul>
          </div>

          <div>
            <h4>Rechtliches</h4>
            <ul>
              <li><a href="#">Datenschutz</a></li>
              <li><a href="#">Impressum</a></li>
              <li><a href="#">AGB</a></li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 Shiftlink · Ein Produkt von MOS</span>
          <span>Dein Account gilt für QualiPass, Shiftlink und MedBenefit.</span>
        </div>
      </footer>

      {cookie && (
        <div className="cookie" role="dialog">
          <p><strong>Cookies.</strong> Wir nutzen Cookies für eine bessere Nutzererfahrung.</p>
          <div className="cookie-btns">
            <button className="btn btn-ghost" onClick={() => setConsent("essential")}>Nur notwendige</button>
            <button className="btn btn-light" onClick={() => setConsent("all")}>Alle akzeptieren</button>
          </div>
        </div>
      )}
    </div>
  );
}
