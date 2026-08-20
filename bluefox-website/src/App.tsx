import { useEffect, useState } from 'react';
import { FaDiscord, FaGithub, FaGlobe, FaUsers } from 'react-icons/fa6';
import {
  MdArrowBack,
  MdAutoAwesome,
  MdCheck,
  MdCheckCircle,
  MdClose,
  MdDarkMode,
  MdDownload,
  MdExpandMore,
  MdArrowUpward,
  MdInfo,
  MdLightMode,
  MdLock,
  MdAutorenew,
  MdPayment,
  MdShield,
  MdSpeed,
  MdPictureAsPdf,
  MdEditNote,
  MdMenuBook,
} from 'react-icons/md';
import logoUrl from './assets/Logo.ico';
import captureUrl from './assets/captureclair1.png';
import darkCaptureUrl from './assets/capturesombre1.png';
import parametreUrl from './assets/parametreclair.png';
import darkParametreUrl from './assets/parametresombre.png';
import iaClairUrl from '../public/iaclair.png';
import iaSombreUrl from '../public/iasombre.png';

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type LatestRelease = {
  tag_name?: string;
  name?: string;
  assets?: ReleaseAsset[];
};

type GoogleTranslateWindow = Window & {
  google?: {
    translate?: {
      TranslateElement?: new (
        options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
        elementId: string,
      ) => unknown;
    };
  };
  googleTranslateElementInit?: () => void;
};

const RELEASES_API = 'https://api.github.com/repos/Clipdescript/BlueFox/releases/latest';
const RELEASES_PAGE = 'https://github.com/Clipdescript/BlueFox/releases/latest';

const features = [
  { number: '01', icon: MdSpeed, title: 'Rapide et fluide', text: 'Une interface légère, des onglets clairs et une navigation conçue pour rester agréable.' },
  { number: '02', icon: MdShield, title: 'Vos données restent à vous', text: 'Une expérience pensée pour limiter les traces locales inutiles et garder des choix lisibles.' },
  { number: '03', icon: MdAutoAwesome, title: 'Foxy, quand vous en avez besoin', text: 'Un mode IA intégré pour chercher, résumer et avancer sans quitter votre espace.' },
];

const advantages = [
  'Une expérience BlueFox simple, rapide et sans compte obligatoire.',
  'Foxy IA intégré directement dans le navigateur, sans changer d’application.',
  'Une page d’accueil claire, des raccourcis et des réglages faciles à retrouver.',
  'Des mises à jour distribuées depuis la release officielle BlueFox.'
];

const tradeoffs = [
  'BlueFox est plus jeune : certaines fonctions sont encore en évolution.',
  'L’expérience actuelle est optimisée en priorité pour Windows.',
  'Foxy peut parfois se tromper : les informations importantes doivent être vérifiées.',
  'Certaines fonctions IA dépendent de services web externes et de leur disponibilité.'
];

const comparisonRows = [
  { label: 'Assistant IA intégré', bluefox: 'Foxy IA natif et léger', chrome: 'Gemini selon version', firefox: 'Extensions tierces', edge: 'Copilot intrusif', availability: { bluefox: true, chrome: true, firefox: false, edge: true } },
  { label: 'Contrôle des données', bluefox: 'Zéro trace par défaut', chrome: 'Synchronisation forcée', firefox: 'Réglages avancés', edge: 'Collecte Microsoft', availability: { bluefox: true, chrome: true, firefox: true, edge: true } },
  { label: 'Page d’accueil', bluefox: 'Épurée et ultra-rapide', chrome: 'Saturée de widgets', firefox: 'Standard', edge: 'Publicités intégrées', availability: { bluefox: true, chrome: true, firefox: true, edge: true } },
  { label: 'Écosystème', bluefox: 'Simple et sans bruit', chrome: 'Lourd et complexe', firefox: 'Ouvert mais daté', edge: 'Verrouillé Microsoft', availability: { bluefox: true, chrome: true, firefox: true, edge: true } },
  { label: 'Optimisation', bluefox: 'Priorité performance Windows', chrome: 'Gourmand en RAM', firefox: 'Moyen', edge: 'Consommation élevée', availability: { bluefox: true, chrome: true, firefox: true, edge: true } },
];

function Logo({ className = '' }: { className?: string }) {
  return <img className={`logo-image ${className}`} src={logoUrl} alt="" aria-hidden="true" />;
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className="brand">
      <Logo className={small ? 'logo-small' : ''} />
      <span>BlueFox</span>
    </span>
  );
}

type ThemeMode = 'light' | 'dark';

function PrivacyPage({ theme, onToggleTheme }: { theme: ThemeMode; onToggleTheme: () => void }) {
  return (
    <div className="privacy-page">
      <header className="privacy-header section-shell">
        <a className="privacy-back-link" href="/">
          <MdArrowBack aria-hidden="true" /> Accueil
        </a>
        <div className="privacy-brand-row">
          <Brand />
          <button
            className="top-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
          >
            {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
          </button>
        </div>
      </header>

      <main className="privacy-main section-shell" aria-labelledby="privacy-title">
        <div className="privacy-hero">
          <p className="section-label">Confidentialité</p>
          <h1 id="privacy-title">Une confidentialité claire, sans promesse floue.</h1>
          <p className="privacy-intro">Notre éthique est simple : expliquer ce qui est utilisé, pourquoi cela l’est et vous laisser décider. BlueFox privilégie une navigation européenne, lisible et sans collecte inutile.</p>
          <p className="privacy-updated">Dernière mise à jour : 18 août 2026</p>
        </div>

        <div className="privacy-principles" aria-label="Les principes de confidentialité de BlueFox">
          <article className="privacy-principle">
            <span className="privacy-principle-number">01</span>
            <div className="privacy-principle-icon"><MdShield aria-hidden="true" /></div>
            <div>
              <h2>Vous gardez la main</h2>
              <p>Le site BlueFox ne demande pas de compte et ne contient pas de formulaire de collecte. Vous pouvez découvrir le projet et télécharger le navigateur sans fournir de données personnelles au site.</p>
            </div>
          </article>
          <article className="privacy-principle">
            <span className="privacy-principle-number">02</span>
            <div className="privacy-principle-icon"><MdLock aria-hidden="true" /></div>
            <div>
              <h2>La transparence avant tout</h2>
              <p>Nous expliquons les fonctions et les services utilisés sans cacher les dépendances externes. Vous savez ce qui se passe et pouvez faire vos choix en connaissance de cause.</p>
            </div>
          </article>
          <article className="privacy-principle">
            <span className="privacy-principle-number">03</span>
            <div className="privacy-principle-icon"><MdCheckCircle aria-hidden="true" /></div>
            <div>
              <h2>Pas de compte obligatoire</h2>
              <p>BlueFox reste accessible sans inscription pour commencer. Votre navigation doit rester un espace simple, direct et respectueux de votre autonomie.</p>
            </div>
          </article>
        </div>

        <section className="privacy-details" aria-labelledby="privacy-services-title">
          <div className="privacy-section-heading">
            <p className="section-label">Notre éthique en pratique</p>
            <h2 id="privacy-services-title">Des services utiles, expliqués avec leurs limites.</h2>
          </div>
          <div className="privacy-detail-list">
            <article className="privacy-detail-item">
              <h3>Choisir sa langue</h3>
              <p>Le sélecteur de langue utilise le widget Google Translate. Cette traduction est proposée pour rendre le site plus accessible, mais Google peut traiter le contenu de la page et déposer ses propres éléments techniques.</p>
            </article>
            <article className="privacy-detail-item">
              <h3>Une IA facultative</h3>
              <p>Foxy accompagne votre navigation uniquement lorsque vous en avez besoin. Certaines requêtes peuvent passer par Exa et Mistral, selon leurs règles et leur disponibilité.</p>
            </article>
            <article className="privacy-detail-item">
              <h3>Des partenaires identifiés</h3>
              <p>Les releases, le code source et le support Discord reposent sur des services tiers identifiés. Nous indiquons leur rôle pour que vous puissiez consulter leurs propres politiques.</p>
            </article>
          </div>
        </section>

        <section className="privacy-choice" aria-labelledby="privacy-choice-title">
          <div>
            <p className="section-label">Notre engagement</p>
            <h2 id="privacy-choice-title">Moins de collecte, plus de clarté.</h2>
            <p>Nous voulons construire un navigateur qui respecte votre espace : des choix compréhensibles, des fonctions facultatives et une collecte limitée. Vous pouvez refuser la traduction automatique, supprimer vos données locales ou nous contacter à tout moment.</p>
          </div>
          <a className="primary-button" href="https://discord.gg/rYaHfhgUJ4" target="_blank" rel="noreferrer">Contacter le support</a>
        </section>
      </main>

      <footer className="big-footer privacy-footer">
        <div className="footer-content section-shell">
          <div className="footer-main">
            <div className="footer-brand-section">
              <Brand />
              <p className="footer-tagline">Plus d’autonomie, moins de pistage, et une IA qui sait rester facultative.</p>
              <div className="footer-socials">
                <a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer" aria-label="BlueFox sur GitHub"><FaGithub /></a>
                <a href="https://discord.gg/rYaHfhgUJ4" target="_blank" rel="noreferrer" aria-label="Support Discord BlueFox"><FaDiscord /></a>
              </div>
            </div>
            <div className="footer-links-grid">
              <div className="footer-column">
                <h4>Produit</h4>
                <a href="/">Accueil</a>
                <a href="/#features">Fonctionnalités</a>
                <a href="/#faq">FAQ</a>
                <a href="/#download">Téléchargement</a>
              </div>
              <div className="footer-column">
                <h4>Ressources</h4>
                <a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer">Open Source</a>
                <a href="https://discord.gg/rYaHfhgUJ4" target="_blank" rel="noreferrer">Support Discord</a>
                <a href="/">Accueil</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-bottom-info">
              <span>© {new Date().getFullYear()} BlueFox Browser</span>
              <span className="dot">·</span>
              <span>Fait avec passion pour le Web</span>
            </div>
            <div className="footer-actions">
              <div className="language-switcher">
                <div className="language-switcher-heading">
                  <span className="language-switcher-label">Langue</span>
                </div>
                <div id="google_translate_element" aria-label="Choisir la langue" />
              </div>
              <button className="footer-theme-toggle" type="button" onClick={onToggleTheme}>
                {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
                <span>Mode {theme === 'dark' ? 'Clair' : 'Sombre'}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem('bluefox-site-theme-v2');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return 'light';
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isPrivacyPage] = useState(() => window.location.pathname.replace(/\/+$/, '') === '/confidentialite');
  const [downloadUrl, setDownloadUrl] = useState(RELEASES_PAGE);
  const [downloadLabel, setDownloadLabel] = useState('Télécharger BlueFox');
  const [downloadStatus, setDownloadStatus] = useState('Recherche de la dernière version…');
  const [isReleaseReady, setIsReleaseReady] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bluefox-site-theme-v2', theme);
  }, [theme]);

  useEffect(() => {
    const translateWindow = window as GoogleTranslateWindow;
    const initializeTranslator = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement;
      const target = document.getElementById('google_translate_element');
      if (!TranslateElement || !target || target.childElementCount > 0) return;

      new TranslateElement({
        pageLanguage: 'fr',
        includedLanguages: 'en,es,de,it,nl,pt,pl',
        autoDisplay: false,
      }, 'google_translate_element');
    };

    translateWindow.googleTranslateElementInit = initializeTranslator;
    if (translateWindow.google?.translate?.TranslateElement) {
      initializeTranslator();
      return;
    }

    const existingScript = document.getElementById('google-translate-script');
    if (existingScript) {
      existingScript.addEventListener('load', initializeTranslator);
      return () => existingScript.removeEventListener('load', initializeTranslator);
    }

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.addEventListener('load', initializeTranslator);
    document.head.appendChild(script);

    return () => script.removeEventListener('load', initializeTranslator);
  }, []);

  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const detectLatestRelease = async () => {
      try {
        const response = await fetch(`${RELEASES_API}?_=${Date.now()}`, {
          headers: { Accept: 'application/vnd.github+json' },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

        const release: LatestRelease = await response.json();
        const installer = release.assets?.find((asset) =>
          /\.exe$/i.test(asset.name) && !/blockmap|uninstaller/i.test(asset.name),
        );
        if (!installer) throw new Error('Installer not found');

        const version = String(release.tag_name ?? release.name ?? '').replace(/^v/i, '') || 'latest';
        setDownloadUrl(installer.browser_download_url);
        setDownloadLabel(`Télécharger BlueFox v${version}`);
        setDownloadStatus(`Dernière version détectée · ${formatSize(installer.size)}`);
        setIsReleaseReady(true);
      } catch (error) {
        console.warn('BlueFox release detection failed:', error);
        setDownloadUrl(RELEASES_PAGE);
        setDownloadLabel('Voir la dernière version');
        setDownloadStatus('Téléchargement disponible sur GitHub Releases');
      }
    };

    void detectLatestRelease();
  }, []);

  if (isPrivacyPage) {
    return <PrivacyPage theme={theme} onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')} />;
  }

  return (
    <>
      <div className="page-glow page-glow-one" aria-hidden="true" />
      <div className="page-glow page-glow-two" aria-hidden="true" />
      
      <div className="top-branding section-shell">
        <Brand />
        <button
          className="top-theme-toggle"
          type="button"
          onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
          aria-label={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
        >
          {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
        </button>
      </div>

      <main id="top" className="download-page fl26-content">
        <section className="hero section-shell fl-split-page-upper fl-hero">
          <div className="hero-copy reveal">
            <h1>
              Prenez enfin le{' '}
              <span className="hero-title-accent">
                {Array.from('pouvoir sur votre navigation').map((character, index) => character === ' '
                  ? ' '
                  : <span className="hero-title-letter" style={{ animationDelay: `${350 + index * 55}ms` }} key={`${character}-${index}`}>{character}</span>)}
              </span>
            </h1>
            <p className="hero-text">Plus rapide, plus léger et totalement transparent. BlueFox n'est pas juste un navigateur, c'est votre espace, sans compromis.</p>
            <div className="hero-actions" id="download">
              <a
                className={`primary-button download-button${isReleaseReady ? '' : ' is-loading'}`}
                href={downloadUrl}
                target={isReleaseReady ? '_self' : '_blank'}
                rel={isReleaseReady ? undefined : 'noreferrer'}
              >
                <MdDownload className="button-icon" aria-hidden="true" />
                <span>{downloadLabel}</span>
              </a>
              <span className="download-meta">{downloadStatus}</span>
            </div>
            <div className="hero-proof">
              <span><MdCheckCircle className="proof-icon proof-icon-green" aria-hidden="true" /> Windows</span>
              <span><MdCheckCircle className="proof-icon proof-icon-blue" aria-hidden="true" /> Gratuit pour commencer</span>
              <span><MdCheckCircle className="proof-icon proof-icon-green" aria-hidden="true" /> Sans inscription</span>
            </div>
            <div className="download-support">
              <span>Version officielle BlueFox pour Windows</span>
              <a href={RELEASES_PAGE}>Voir les versions précédentes</a>
            </div>
          </div>
          <div className="browser-preview browser-capture-frame reveal reveal-delay" aria-label="Capture de l’interface BlueFox Browser">
            <img className="browser-capture" src={theme === 'dark' ? darkCaptureUrl : captureUrl} alt="Interface de BlueFox Browser" />
          </div>
        </section>

        <section className="france-section section-shell reveal" aria-labelledby="france-title">
          <div className="france-copy">
            <p className="section-label">Confidentialité européenne</p>
            <h2 id="france-title">Un navigateur français, pensé pour vous.</h2>
            <p>BlueFox est pensé pour respecter les principes du RGPD et une vision européenne de la confidentialité. Votre navigation reste un espace où vous gardez la main.</p>
            <p>Nous expliquons ce qui est utilisé, pourquoi, et nous privilégions une expérience française, claire et sans collecte inutile.</p>
          </div>
          <div className="france-values" aria-label="Les valeurs de BlueFox">
            <article className="france-value-card">
              <span className="france-value-number">01</span>
              <div className="france-pixel-icon" aria-hidden="true"><MdShield /></div>
              <h3>Votre espace</h3>
              <p>Une interface qui vous laisse décider de ce qui compte pour vous. Profitez d’onglets clairs et de réglages faciles à retrouver, tout en gardant la main sur votre navigation.</p>
            </article>
            <article className="france-value-card">
              <span className="france-value-number">02</span>
              <div className="france-pixel-icon blue-pixel-icon" aria-hidden="true"><MdCheckCircle /></div>
              <h3>Des choix clairs</h3>
              <p>Des fonctions expliquées simplement, sans vous perdre dans les détails. Foxy reste facultatif, aucun réglage n’est caché et l’interface reste lisible.</p>
            </article>
            <article className="france-value-card">
              <span className="france-value-number">03</span>
              <div className="france-pixel-icon blue-pixel-icon" aria-hidden="true"><MdLock /></div>
              <h3>Confidentialité européenne</h3>
              <p>Pensé pour respecter le RGPD et vos choix. Vos préférences restent lisibles, la collecte est limitée et l’approche reste transparente.</p>
            </article>
          </div>
        </section>

        <section className="feature-grid section-shell fl-do-it-all" id="features">
          <div className="feature-grid-heading">
            <p className="section-label">Tout faire avec BlueFox</p>
            <h2>Les outils essentiels, au même endroit.</h2>
          </div>
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <article className={`feature-card reveal${index > 0 ? ` reveal-delay${index > 1 ? '-two' : ''}` : ''}`} key={feature.number}>
                <span className="feature-number">{feature.number}</span>
                <div className="feature-icon"><FeatureIcon aria-hidden="true" /></div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </section>

        <section className="feature-stories section-shell fl-split-page-lower" aria-label="Points forts de BlueFox">
          <article className="feature-story reveal">
            <div className="feature-story-copy">
              <p className="section-label">Contrôle total</p>
              <h2>Des paramètres clairs, un contrôle complet.</h2>
              <p>Personnalisez votre expérience en quelques clics. Confidentialité, apparence, fonctionnalités : tous les réglages sont accessibles et transparents.</p>
              <a className="text-link" href="#features">Voir les fonctionnalités</a>
            </div>
            <div className="feature-story-media"><img src={theme === 'dark' ? darkParametreUrl : parametreUrl} alt="Page des paramètres de BlueFox Browser" /></div>
          </article>
          <article className="feature-story feature-story-reverse reveal">
            <div className="feature-story-copy">
              <p className="section-label">Foxy intégré</p>
              <h2>Réfléchir, chercher et avancer au même endroit.</h2>
              <p>Le mode IA accompagne votre navigation quand vous en avez besoin, tout en restant désactivable quand vous préférez une expérience classique.</p>
              <a className="text-link" href="#download">Télécharger BlueFox</a>
            </div>
            <div className="feature-story-media"><img src={theme === 'dark' ? iaSombreUrl : iaClairUrl} alt="Mode IA de BlueFox Browser" /></div>
          </article>
        </section>

        <section className="foxy-capabilities-section section-shell reveal" id="foxy" aria-labelledby="foxy-capabilities-title">
          <div className="foxy-capabilities-heading">
            <p className="section-label">Foxy IA, quand vous le décidez</p>
            <h2 id="foxy-capabilities-title">Analysez, écrivez et avancez avec vos documents.</h2>
            <p>Foxy peut travailler avec vos PDF et les pages que vous lisez : comprendre un contenu, répondre à vos questions et vous aider à produire une version plus claire. L’IA reste toujours facultative.</p>
          </div>
          <div className="foxy-capabilities-grid">
            <article className="foxy-capability-card">
              <div className="foxy-capability-icon"><MdPictureAsPdf aria-hidden="true" /></div>
              <p className="foxy-capability-number">01</p>
              <h3>Analyser vos PDF</h3>
              <p>Importez un document, demandez un résumé ou posez une question. Foxy s’appuie sur le contenu du PDF pour vous répondre plus directement.</p>
            </article>
            <article className="foxy-capability-card">
              <div className="foxy-capability-icon"><MdEditNote aria-hidden="true" /></div>
              <p className="foxy-capability-number">02</p>
              <h3>Modifier et écrire</h3>
              <p>Corrigez, reformulez, résumez ou préparez un texte avec Foxy. Vous relisez toujours les propositions et gardez la décision finale.</p>
            </article>
            <article className="foxy-capability-card">
              <div className="foxy-capability-icon"><MdMenuBook aria-hidden="true" /></div>
              <p className="foxy-capability-number">03</p>
              <h3>Lire plus vite</h3>
              <p>Une interface claire et légère pour rester concentré sur l’essentiel. Foxy peut vous aider à comprendre, mais il ne s’impose jamais.</p>
            </article>
          </div>
          <a className="text-link foxy-capabilities-link" href="#download">Découvrir BlueFox</a>
        </section>

        <section className="pros-cons-section section-shell reveal" id="benefits" aria-labelledby="benefits-title">
          <div className="content-heading">
            <p className="section-label">BlueFox, en toute transparence</p>
            <h2 id="benefits-title">Tout ce qu’il faut savoir avant de choisir BlueFox.</h2>
          </div>
          <div className="pros-cons-grid">
            <article className="pros-cons-card pros-card">
              <span className="card-kicker">Les avantages</span>
              <h3>Un navigateur plus direct.</h3>
              <ul>{advantages.map((item) => <li key={item}><span className="list-mark"><MdCheck aria-hidden="true" /></span>{item}</li>)}</ul>
            </article>
            <article className="pros-cons-card cons-card">
              <span className="card-kicker">Bon à savoir</span>
              <h3>Une expérience qui évolue avec vous.</h3>
              <ul>{tradeoffs.map((item) => <li key={item}><span className="list-mark"><MdInfo aria-hidden="true" /></span>{item}</li>)}</ul>
            </article>
          </div>
        </section>

        <section className="comparison-section section-shell reveal" id="comparison" aria-labelledby="comparison-title">
          <div className="content-heading comparison-heading">
            <p className="section-label">Comparer simplement</p>
            <h2 id="comparison-title">BlueFox face aux navigateurs que vous connaissez.</h2>
            <p>Un aperçu honnête des grandes différences. Les fonctionnalités et les offres peuvent évoluer selon les versions et les régions.</p>
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead><tr><th>Fonction</th><th className="bluefox-column">BlueFox</th><th>Chrome</th><th>Firefox</th><th>Edge</th></tr></thead>
              <tbody>{comparisonRows.map((row) => <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="bluefox-column"><span className={`comparison-status ${row.availability.bluefox ? 'is-available' : 'is-unavailable'}`}>{row.availability.bluefox ? <MdCheck aria-hidden="true" /> : <MdClose aria-hidden="true" />}</span>{row.bluefox}</td>
                <td><span className={`comparison-status ${row.availability.chrome ? 'is-available' : 'is-unavailable'}`}>{row.availability.chrome ? <MdCheck aria-hidden="true" /> : <MdClose aria-hidden="true" />}</span>{row.chrome}</td>
                <td><span className={`comparison-status ${row.availability.firefox ? 'is-available' : 'is-unavailable'}`}>{row.availability.firefox ? <MdCheck aria-hidden="true" /> : <MdClose aria-hidden="true" />}</span>{row.firefox}</td>
                <td><span className={`comparison-status ${row.availability.edge ? 'is-available' : 'is-unavailable'}`}>{row.availability.edge ? <MdCheck aria-hidden="true" /> : <MdClose aria-hidden="true" />}</span>{row.edge}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="comparison-note">* Les descriptions sont indicatives et ne remplacent pas les paramètres propres à chaque navigateur.</p>
        </section>

        <section className="transparency-section section-shell reveal" aria-labelledby="transparency-title">
          <div className="transparency-heading">
            <p className="section-label">Tout est plus clair</p>
            <h2 id="transparency-title">Un navigateur qui évolue avec vous.</h2>
          </div>
          <div className="transparency-grid">
            <article className="transparency-card">
              <div className="transparency-icon"><MdAutorenew aria-hidden="true" /></div>
              <div>
                <h3>Mises à jour automatiques</h3>
                <p>BlueFox vérifie les nouvelles versions, télécharge la mise à jour officielle et vous propose de redémarrer. Vous gardez toujours le choix.</p>
              </div>
            </article>
            <article className="transparency-card">
              <div className="transparency-icon"><MdPayment aria-hidden="true" /></div>
              <div>
                <h3>Foxy IA, en toute transparence</h3>
                <p>Foxy peut utiliser Exa et Mistral. Ces fournisseurs peuvent facturer leur API selon leur offre. BlueFox n’ajoute pas de frais cachés au site.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="faq-section section-shell reveal" id="faq" aria-labelledby="faq-title">
          <div className="content-heading faq-heading">
            <p className="section-label">Questions fréquentes</p>
            <h2 id="faq-title">Pourquoi télécharger BlueFox ?</h2>
            <p>Les réponses aux questions que vous pouvez vous poser avant de commencer.</p>
          </div>
          <div className="faq-list">
            <details className="faq-item">
              <summary>Pourquoi télécharger BlueFox ? <MdExpandMore className="faq-expand-icon" aria-hidden="true" /></summary>
              <div className="faq-answer"><p>BlueFox offre une navigation rapide, légère et claire, avec Foxy IA intégré, des réglages accessibles et aucune inscription obligatoire pour commencer.</p></div>
            </details>
            <details className="faq-item">
              <summary>BlueFox est-il gratuit ? <MdExpandMore className="faq-expand-icon" aria-hidden="true" /></summary>
              <div className="faq-answer"><p>Oui, BlueFox est gratuit pour commencer. Vous pouvez télécharger le navigateur et découvrir ses fonctions essentielles sans créer de compte.</p></div>
            </details>
            <details className="faq-item">
              <summary>Foxy IA est-il obligatoire ? <MdExpandMore className="faq-expand-icon" aria-hidden="true" /></summary>
              <div className="faq-answer"><p>Non. Foxy reste facultatif et peut être désactivé lorsque vous préférez utiliser une expérience de navigation classique.</p></div>
            </details>
            <details className="faq-item">
              <summary>Sur quel système BlueFox fonctionne-t-il ? <MdExpandMore className="faq-expand-icon" aria-hidden="true" /></summary>
              <div className="faq-answer"><p>L’expérience actuelle est optimisée en priorité pour Windows. Les nouvelles compatibilités pourront évoluer avec les prochaines versions.</p></div>
            </details>
            <details className="faq-item">
              <summary>Ai-je besoin de créer un compte ? <MdExpandMore className="faq-expand-icon" aria-hidden="true" /></summary>
              <div className="faq-answer"><p>Non, aucune inscription n’est obligatoire pour commencer à utiliser BlueFox. Vous gardez ainsi une expérience simple et directe.</p></div>
            </details>
            <details className="faq-item">
              <summary>Comment obtenir la dernière version ? <MdExpandMore className="faq-expand-icon" aria-hidden="true" /></summary>
              <div className="faq-answer"><p>Le bouton de téléchargement recherche automatiquement la dernière release officielle de BlueFox. Si elle n’est pas détectée, vous pouvez la retrouver directement sur GitHub Releases.</p></div>
            </details>
          </div>
        </section>

        <section className="comments-section section-shell reveal" id="comments" aria-labelledby="comments-title">
          <div className="content-heading comments-heading">
            <p className="section-label">Ils parlent de BlueFox</p>
            <h2 id="comments-title">Commentaires</h2>
          </div>
          <div className="comments-list">
            <article className="comment-card">
              <header className="comment-header">
              <div className="comment-avatar" aria-hidden="true">𝖅</div>
              <div>
                <h3>𝖅𝖔𝖚𝖟𝖟</h3>
                <p className="comment-subtitle">Fondateur de GetHost</p>
                <div className="comment-rating" aria-label="5 étoiles">⭐️⭐️⭐️⭐️⭐️</div>
              </div>
            </header>
            <div className="comment-body">
              <p>́Bluefox est extrêmement simple à prendre en main, tout en offrant des outils poussés et une personnalisation avancée pour les utilisateurs plus exigeants.</p>
              <p>L'intégration de l'IA apporte un vrai plus au quotidien.</p>
              <p>Le point fort reste le service client : ultra réactif, à l'écoute et capable de corriger les bugs signalés rapidement !<br />Le fondateur est très accessible et sympathique.</p>
              <p>De nouvelles fonctionnalités, interfaces et améliorations sont ajoutées régulièrement. Le service est continu, fluide et d'une latence irréprochable.</p>
              <p>Un immense merci à Bluefox d'exister et de m'accompagner dans mes recherches au quotidien. ❤️</p>
              <p>Je recommande !</p>
            </div>
            <nav className="comment-links" aria-label="Liens de 𝖅𝖔𝖚𝖟𝖟">
              <a href="https://discord.com/users/1521079154135666699" target="_blank" rel="noreferrer" aria-label="Ajouter 𝖅𝖔𝖚𝖟𝖟 sur Discord" title="Profil Discord de 𝖅𝖔𝖚𝖟𝖟"><FaDiscord aria-hidden="true" /></a>
              <a href="https://gethost.cloud/" target="_blank" rel="noreferrer" aria-label="Visiter GetHost" title="Site GetHost"><FaGlobe aria-hidden="true" /></a>
              <a href="https://discord.gg/bz4Adyb95r" target="_blank" rel="noreferrer" aria-label="Rejoindre la communauté Discord de 𝖅𝖔𝖚𝖟𝖟" title="Communauté Discord de 𝖅𝖔𝖚𝖟𝖟"><FaUsers aria-hidden="true" /></a>
            </nav>
            </article>

            <article className="comment-card">
              <header className="comment-header">
                <div className="comment-avatar" aria-hidden="true">u</div>
                <div>
                  <h3>ughgnttyfgzs</h3>
                  <div className="comment-rating" aria-label="4 étoiles sur 5">⭐️⭐️⭐️⭐️</div>
                </div>
              </header>
              <div className="comment-body">
                <p>Les pages chargent assez vites. Et j'ai regardé quelque vidéos yt. Honnêtement j'aimerais bien voir une bar de recherche, à la place d'un truc pour l'URL ET les recherches. Sinon, je kiffe.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="partners-section section-shell reveal" id="partners" aria-labelledby="partners-title">
          <div className="content-heading partners-heading">
            <p className="section-label">Nos partenaires</p>
            <h2 id="partners-title">Des projets que nous sommes heureux de vous faire découvrir.</h2>
            <p>Retrouvez les sites et communautés qui partagent notre envie de créer une expérience web simple et accessible.</p>
          </div>
          <div className="partners-grid">
            <a
              className="partner-card"
              href="https://gamehubsocial-neos.web.app/login"
              target="_blank"
              rel="noreferrer"
              aria-label="Visiter GameHub Social"
            >
              <span className="partner-favicon-wrap" aria-hidden="true">
                <img
                  className="partner-favicon"
                  src="https://gamehubsocial-neos.web.app/logo.png"
                  alt=""
                  loading="lazy"
                />
              </span>
              <span className="partner-card-content">
                <span className="partner-card-topline">Partenaire</span>
                <strong>GameHub Social</strong>
                <span className="partner-url">https://gamehubsocial-neos.web.app/login</span>
                <span className="partner-visit">Visiter le site</span>
              </span>
            </a>
          </div>
        </section>

        <section className="final-cta section-shell reveal">
          <h2 className="final-cta-title">
            {Array.from('Le navigateur qui respecte votre espace.').map((character, index) => character === ' '
              ? ' '
              : <span className="final-title-letter" style={{ animationDelay: `${350 + index * 45}ms` }} key={`${character}-${index}`}>{character}</span>)}
          </h2>
          <a className="primary-button" href="#download"><MdDownload className="button-icon" aria-hidden="true" /> Télécharger BlueFox</a>
        </section>
      </main>

      <footer className="big-footer">
        <div className="footer-content section-shell">
          <div className="footer-main">
            <div className="footer-brand-section">
              <div className="footer-brand-logo">
                <Logo />
                <span>BlueFox</span>
              </div>
              <p className="footer-tagline">Plus d'autonomie, moins de pistage, et une IA qui sait rester facultative.</p>
              <div className="footer-socials">
                <a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer"><FaGithub /></a>
                <a href="https://discord.gg/rYaHfhgUJ4" target="_blank" rel="noreferrer"><FaDiscord /></a>
              </div>
            </div>
            
            <div className="footer-links-grid">
              <div className="footer-column">
                <h4>Produit</h4>
                <a href="#features">Fonctionnalités</a>
                <a href="#comments">Commentaires</a>
                <a href="#faq">FAQ</a>
                <a href="#download">Téléchargement</a>
                <a href={RELEASES_PAGE}>Notes de version</a>
              </div>
              <div className="footer-column">
                <h4>Ressources</h4>
                <a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer">Open Source</a>
                <a href="https://discord.gg/rYaHfhgUJ4" target="_blank" rel="noreferrer">Support Discord</a>
                <a href="#partners">Nos partenaires</a>
                <a href="/confidentialite">Confidentialité</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-bottom-info">
              <span>© {new Date().getFullYear()} BlueFox Browser</span>
              <span className="dot">·</span>
              <span>Fait avec passion pour le Web</span>
            </div>
            <div className="footer-actions">
              <div className="language-switcher">
                <div className="language-switcher-heading">
                  <span className="language-switcher-label">Langue</span>
                </div>
                <div id="google_translate_element" aria-label="Choisir la langue" />
              </div>
              <button
                className="footer-theme-toggle"
                type="button"
                onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
                <span>Mode {theme === 'dark' ? 'Clair' : 'Sombre'}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'version disponible';
  return `${Math.round(bytes / 1024 / 1024)} Mo`;
}

export default App;
