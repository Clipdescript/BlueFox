import { useEffect, useState } from 'react';
import { FaDiscord, FaGithub, FaGlobe, FaUsers } from 'react-icons/fa6';
import {
  MdAutoAwesome,
  MdCheckCircle,
  MdCircle,
  MdDarkMode,
  MdDownload,
  MdArrowUpward,
  MdLightMode,
  MdNorthEast,
  MdAutorenew,
  MdPayment,
  MdShield,
  MdSpeed,
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

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem('bluefox-site-theme-v2');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return 'light';
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [downloadUrl, setDownloadUrl] = useState(RELEASES_PAGE);
  const [downloadLabel, setDownloadLabel] = useState('Télécharger BlueFox');
  const [downloadStatus, setDownloadStatus] = useState('Recherche de la dernière version…');
  const [isReleaseReady, setIsReleaseReady] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bluefox-site-theme-v2', theme);
  }, [theme]);

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
            <h1>Prenez enfin le pouvoir sur votre navigation</h1>
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
              <a href={RELEASES_PAGE}>Voir les versions précédentes <MdNorthEast aria-hidden="true" /></a>
            </div>
          </div>
          <div className="browser-preview browser-capture-frame reveal reveal-delay" aria-label="Capture de l’interface BlueFox Browser">
            <img className="browser-capture" src={theme === 'dark' ? darkCaptureUrl : captureUrl} alt="Interface de BlueFox Browser" />
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
              <a className="text-link" href="#features">Voir les fonctionnalités <MdNorthEast aria-hidden="true" /></a>
            </div>
            <div className="feature-story-media"><img src={theme === 'dark' ? darkParametreUrl : parametreUrl} alt="Page des paramètres de BlueFox Browser" /></div>
          </article>
          <article className="feature-story feature-story-reverse reveal">
            <div className="feature-story-copy">
              <p className="section-label">Foxy intégré</p>
              <h2>Réfléchir, chercher et avancer au même endroit.</h2>
              <p>Le mode IA accompagne votre navigation quand vous en avez besoin, tout en restant désactivable quand vous préférez une expérience classique.</p>
              <a className="text-link" href="#download">Télécharger BlueFox <MdNorthEast aria-hidden="true" /></a>
            </div>
            <div className="feature-story-media"><img src={theme === 'dark' ? iaSombreUrl : iaClairUrl} alt="Mode IA de BlueFox Browser" /></div>
          </article>
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
              <ul>{advantages.map((item) => <li key={item}><span className="list-mark">✓</span>{item}</li>)}</ul>
            </article>
            <article className="pros-cons-card cons-card">
              <span className="card-kicker">Bon à savoir</span>
              <h3>Une expérience qui évolue avec vous.</h3>
              <ul>{tradeoffs.map((item) => <li key={item}><span className="list-mark">i</span>{item}</li>)}</ul>
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
                <td className="bluefox-column"><span className={`comparison-status ${row.availability.bluefox ? 'is-available' : 'is-unavailable'}`}>{row.availability.bluefox ? '✓' : '×'}</span>{row.bluefox}</td>
                <td><span className={`comparison-status ${row.availability.chrome ? 'is-available' : 'is-unavailable'}`}>{row.availability.chrome ? '✓' : '×'}</span>{row.chrome}</td>
                <td><span className={`comparison-status ${row.availability.firefox ? 'is-available' : 'is-unavailable'}`}>{row.availability.firefox ? '✓' : '×'}</span>{row.firefox}</td>
                <td><span className={`comparison-status ${row.availability.edge ? 'is-available' : 'is-unavailable'}`}>{row.availability.edge ? '✓' : '×'}</span>{row.edge}</td>
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

        <section className="comments-section section-shell reveal" id="comments" aria-labelledby="comments-title">
          <div className="content-heading comments-heading">
            <p className="section-label">Ils parlent de BlueFox</p>
            <h2 id="comments-title">Commentaires</h2>
          </div>
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
        </section>

        <section className="final-cta section-shell reveal">
          <h2>Le navigateur qui respecte votre espace.</h2>
          <a className="primary-button" href="#download"><MdDownload className="button-icon" aria-hidden="true" /> Télécharger BlueFox</a>
        </section>
      </main>

      <footer className="big-footer">
        <div className="footer-content section-shell">
          <div className="footer-main">
            <div className="footer-brand-section">
              <Brand />
              <p className="footer-tagline">Plus d'autonomie, moins de pistage, et une IA qui sait rester facultative.</p>
              <div className="footer-socials">
                <a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer"><FaGithub /></a>
                <a href="https://discord.gg/z3bUt3hCya" target="_blank" rel="noreferrer"><FaDiscord /></a>
              </div>
            </div>
            
            <div className="footer-links-grid">
              <div className="footer-column">
                <h4>Produit</h4>
                <a href="#features">Fonctionnalités</a>
                <a href="#comments">Commentaires</a>
                <a href="#download">Téléchargement</a>
                <a href={RELEASES_PAGE}>Notes de version</a>
              </div>
              <div className="footer-column">
                <h4>Ressources</h4>
                <a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer">Open Source</a>
                <a href="https://discord.gg/z3bUt3hCya" target="_blank" rel="noreferrer">Support Discord</a>
                <a href="#privacy">Confidentialité</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-bottom-info">
              <span>© {new Date().getFullYear()} BlueFox Browser</span>
              <span className="dot">·</span>
              <span>Fait avec passion pour le Web</span>
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
      </footer>
    </>
  );
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'version disponible';
  return `${Math.round(bytes / 1024 / 1024)} Mo`;
}

export default App;
