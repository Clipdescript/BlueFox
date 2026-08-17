import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { IconType } from 'react-icons';
import {
  MdAdd,
  MdArrowOutward,
  MdAutoAwesome,
  MdCheckCircle,
  MdClose,
  MdCode,
  MdDarkMode,
  MdDownload,
  MdExtension,
  MdFilterList,
  MdLightMode,
  MdSearch,
  MdSecurity,
  MdStar,
  MdTranslate,
  MdTune,
} from 'react-icons/md';

type ThemeMode = 'light' | 'dark';
type Category = 'Tous' | 'Productivité' | 'Confidentialité' | 'Personnalisation' | 'Outils';

type AddOn = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Exclude<Category, 'Tous'>;
  version: string;
  author: string;
  users: string;
  rating: string;
  color: string;
  icon: IconType;
  featured?: boolean;
  permissions: string[];
};

const categories: Category[] = ['Tous', 'Productivité', 'Confidentialité', 'Personnalisation', 'Outils'];

const LOGO_URL = '/Logo.ico';

const addOns: AddOn[] = [
  {
    id: 'foxy-tools',
    name: 'Foxy Tools',
    tagline: 'Foxy, quand vous en avez besoin.',
    description: 'Résumez une page, reformulez une sélection et gardez vos recherches au même endroit. Foxy reste discret et s’ouvre seulement quand vous le décidez.',
    category: 'Productivité',
    version: '0.1.0',
    author: 'BlueFox',
    users: 'Extension officielle',
    rating: '4,9',
    color: '#8b6bff',
    icon: MdAutoAwesome,
    featured: true,
    permissions: ['Texte sélectionné', 'Onglet actif', 'Foxy IA'],
  },
  {
    id: 'bluefox-dark',
    name: 'BlueFox Dark',
    tagline: 'Un web plus doux, sans détour.',
    description: 'Adaptez les pages claires à vos yeux, avec un contraste maîtrisé et des réglages qui restent simples.',
    category: 'Personnalisation',
    version: '0.1.0',
    author: 'BlueFox',
    users: 'Extension officielle',
    rating: '4,8',
    color: '#5967d9',
    icon: MdDarkMode,
    featured: true,
    permissions: ['Styles des pages', 'Préférences locales'],
  },
  {
    id: 'privacy-guard',
    name: 'Privacy Guard',
    tagline: 'Votre navigation, sous votre contrôle.',
    description: 'Réduisez les éléments de suivi connus et consultez clairement les règles appliquées. Rien n’est activé sans vous l’expliquer.',
    category: 'Confidentialité',
    version: '0.1.0',
    author: 'BlueFox',
    users: 'Bientôt disponible',
    rating: '—',
    color: '#28a879',
    icon: MdSecurity,
    permissions: ['Requêtes web', 'Règles de blocage'],
  },
  {
    id: 'quick-translate',
    name: 'Quick Translate',
    tagline: 'Comprendre sans changer d’onglet.',
    description: 'Sélectionnez un passage, choisissez votre langue et poursuivez votre lecture. Une action courte, sans alourdir la page.',
    category: 'Outils',
    version: '0.1.0',
    author: 'Communauté BlueFox',
    users: 'Bientôt disponible',
    rating: '—',
    color: '#e2714d',
    icon: MdTranslate,
    permissions: ['Texte sélectionné', 'Réseau'],
  },
  {
    id: 'tab-organizer',
    name: 'Tab Organizer',
    tagline: 'Des onglets clairs, même quand tout s’ouvre.',
    description: 'Classez vos pages par espace et retrouvez votre travail sans perdre le fil.',
    category: 'Productivité',
    version: '0.1.0',
    author: 'Communauté BlueFox',
    users: 'Bientôt disponible',
    rating: '—',
    color: '#3978d8',
    icon: MdTune,
    permissions: ['Onglets', 'Stockage local'],
  },
  {
    id: 'developer-kit',
    name: 'Developer Kit',
    tagline: 'Les essentiels pour créer sur le Web.',
    description: 'Inspectez, copiez et testez vos pages depuis des outils réunis au même endroit, sans multiplier les fenêtres.',
    category: 'Outils',
    version: '0.1.0',
    author: 'Communauté BlueFox',
    users: 'Bientôt disponible',
    rating: '—',
    color: '#c28a25',
    icon: MdCode,
    permissions: ['Onglet actif', 'Presse-papiers'],
  },
];

function BrandMark() {
  return <img className="brand-logo" src={LOGO_URL} alt="" aria-hidden="true" />;
}

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem('bluefox-add-ons-theme');
  return savedTheme === 'dark' ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Tous');
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bluefox-add-ons-theme', theme);
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
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedAddOn(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredAddOns = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return addOns.filter((addOn) => {
      const matchesCategory = activeCategory === 'Tous' || addOn.category === activeCategory;
      const searchableText = `${addOn.name} ${addOn.tagline} ${addOn.description} ${addOn.category}`.toLocaleLowerCase('fr');
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeCategory, query]);

  const ModalIcon = selectedAddOn?.icon ?? MdExtension;

  return (
    <>
      <div className="page-glow page-glow-one" aria-hidden="true" />
      <div className="page-glow page-glow-two" aria-hidden="true" />

      <header className="site-header section-shell">
        <a className="brand" href="#top" aria-label="BlueFox Add Ons, accueil">
          <span className="brand-mark"><BrandMark /></span>
          <span>BlueFox <strong>Add Ons</strong></span>
        </a>
        <nav className="header-nav" aria-label="Navigation principale">
          <a href="#extensions">Extensions</a>
          <a href="#about">À propos</a>
          <a className="header-link" href="https://bluefoxbrowser.pages.dev/" target="_blank" rel="noreferrer">BlueFox Browser <MdArrowOutward aria-hidden="true" /></a>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            aria-label={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
          >
            {theme === 'dark' ? <MdLightMode aria-hidden="true" /> : <MdDarkMode aria-hidden="true" />}
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero section-shell reveal">
          <div className="hero-badge"><span className="status-dot" /> Le catalogue BlueFox est en préparation</div>
          <h1>Les extensions qui rendent <span>BlueFox unique.</span></h1>
          <p className="hero-text">Découvrez des outils pensés pour votre navigateur : plus utiles, plus clairs et parfaitement intégrés à votre espace.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#extensions"><MdExtension aria-hidden="true" /> Explorer les extensions</a>
            <a className="secondary-button" href="#about">Comment ça marche <MdArrowOutward aria-hidden="true" /></a>
          </div>
          <div className="hero-proof">
            <span><MdCheckCircle aria-hidden="true" /> Extensions pensées pour BlueFox</span>
            <span><MdSecurity aria-hidden="true" /> Permissions transparentes</span>
            <span><MdCode aria-hidden="true" /> Écosystème en construction</span>
          </div>
        </section>

        <section className="catalogue section-shell reveal" id="extensions" aria-labelledby="catalogue-title">
          <div className="section-heading">
            <div>
              <p className="section-label">Catalogue</p>
              <h2 id="catalogue-title">Trouvez votre prochaine extension.</h2>
            </div>
            <span className="catalogue-count">{filteredAddOns.length} extension{filteredAddOns.length > 1 ? 's' : ''}</span>
          </div>

          <div className="catalogue-toolbar">
            <label className="search-box">
              <MdSearch aria-hidden="true" />
              <span className="sr-only">Rechercher une extension</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une extension…" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche"><MdClose aria-hidden="true" /></button>}
            </label>
            <div className="filter-label"><MdFilterList aria-hidden="true" /> Filtrer</div>
            <div className="category-list" role="list" aria-label="Catégories d’extensions">
              {categories.map((category) => (
                <button
                  className={`category-chip${activeCategory === category ? ' is-active' : ''}`}
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredAddOns.length > 0 ? (
            <div className="addon-grid">
              {filteredAddOns.map((addOn) => {
                const AddOnIcon = addOn.icon;
                return (
                  <article className={`addon-card reveal${addOn.featured ? ' is-featured' : ''}`} key={addOn.id}>
                    <div className="addon-card-top">
                      <div className="addon-icon" style={{ '--addon-color': addOn.color } as CSSProperties}><AddOnIcon aria-hidden="true" /></div>
                      <span className="addon-category">{addOn.category}</span>
                    </div>
                    <h3>{addOn.name}</h3>
                    <p className="addon-tagline">{addOn.tagline}</p>
                    <p className="addon-description">{addOn.description}</p>
                    <div className="addon-meta"><span>{addOn.author}</span><span>v{addOn.version}</span><span>{addOn.rating !== '—' ? `★ ${addOn.rating}` : addOn.users}</span></div>
                    <div className="addon-card-actions">
                      <button className="addon-details" type="button" onClick={() => setSelectedAddOn(addOn)}>Voir les détails <MdArrowOutward aria-hidden="true" /></button>
                      <button className="addon-install" type="button" onClick={() => setSelectedAddOn(addOn)} aria-label={`Découvrir ${addOn.name}`}><MdAdd aria-hidden="true" /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><MdSearch aria-hidden="true" /><h3>Aucune extension trouvée</h3><p>Essayez un autre mot-clé ou choisissez une autre catégorie.</p></div>
          )}
        </section>

        <section className="trust-section section-shell reveal" aria-labelledby="trust-title">
          <div className="trust-heading">
            <p className="section-label">La promesse BlueFox</p>
            <h2 id="trust-title">Des extensions vérifiées, utiles et respectueuses.</h2>
            <p>Avant d’être publiée, chaque extension BlueFox devra être examinée pour protéger votre navigation et garder des permissions compréhensibles.</p>
          </div>
          <div className="trust-grid">
            <article className="trust-card reveal">
              <span className="trust-icon"><MdSecurity aria-hidden="true" /></span>
              <div><h3>Vérifiées avant publication</h3><p>Les extensions sont examinées avant d’entrer dans le catalogue. Les contenus malveillants, trompeurs ou inutiles n’ont pas leur place ici.</p></div>
            </article>
            <article className="trust-card reveal">
              <span className="trust-icon blue-icon"><MdCheckCircle aria-hidden="true" /></span>
              <div><h3>Permissions transparentes</h3><p>Vous voyez ce qu’une extension peut utiliser : pages, onglets, stockage ou réseau. Rien ne doit être caché.</p></div>
            </article>
            <article className="trust-card reveal">
              <span className="trust-icon violet-icon"><MdCode aria-hidden="true" /></span>
              <div><h3>Une expérience plus sereine</h3><p>BlueFox privilégie des extensions simples, contrôlées et conçues pour respecter vos données personnelles.</p></div>
            </article>
          </div>
        </section>

        <section className="about-section section-shell reveal" id="about" aria-labelledby="about-title">
          <div className="about-card">
            <div className="about-copy">
              <p className="section-label">Un écosystème à construire</p>
              <h2 id="about-title">Des extensions simples à comprendre, agréables à utiliser.</h2>
              <p>BlueFox Add Ons accueillera progressivement des extensions officielles et communautaires. Chaque fiche expliquera son utilité, son auteur et les permissions nécessaires.</p>
              <button className="outline-button" type="button" onClick={() => window.alert('Le système de publication sera ajouté prochainement.')}>Proposer une extension <MdArrowOutward aria-hidden="true" /></button>
            </div>
            <div className="about-feature-grid">
              <article className="about-feature">
                <span className="about-feature-icon"><BrandMark /></span>
                <div><h3>Fait pour BlueFox</h3><p>Des outils conçus pour s’intégrer naturellement à votre navigateur.</p></div>
              </article>
              <article className="about-feature">
                <span className="about-feature-icon blue-icon"><MdSecurity aria-hidden="true" /></span>
                <div><h3>Permissions lisibles</h3><p>Chaque extension explique clairement ce qu’elle peut utiliser.</p></div>
              </article>
              <article className="about-feature">
                <span className="about-feature-icon violet-icon"><MdCheckCircle aria-hidden="true" /></span>
                <div><h3>Versions suivies</h3><p>Un catalogue propre, organisé et pensé pour évoluer avec BlueFox.</p></div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-content section-shell">
          <div><a className="brand" href="#top"><span className="brand-mark"><BrandMark /></span><span>BlueFox <strong>Add Ons</strong></span></a><p>Des extensions utiles, vérifiées et respectueuses de votre confidentialité.</p></div>
          <div className="footer-links"><a href="#extensions">Catalogue</a><a href="#about">À propos</a><a href="https://github.com/Clipdescript/BlueFox" target="_blank" rel="noreferrer">GitHub <MdArrowOutward aria-hidden="true" /></a></div>
          <span className="footer-copy">© {new Date().getFullYear()} BlueFox</span>
        </div>
      </footer>

      {selectedAddOn && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedAddOn(null)}>
          <section className="addon-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedAddOn(null)} aria-label="Fermer"><MdClose aria-hidden="true" /></button>
            <div className="modal-icon" style={{ '--addon-color': selectedAddOn.color } as CSSProperties}><ModalIcon aria-hidden="true" /></div>
            <p className="section-label">{selectedAddOn.category}</p>
            <h2 id="modal-title">{selectedAddOn.name}</h2>
            <p className="modal-tagline">{selectedAddOn.tagline}</p>
            <p className="modal-description">{selectedAddOn.description}</p>
            <div className="permission-box"><strong>Permissions prévues</strong><div>{selectedAddOn.permissions.map((permission) => <span key={permission}><MdCheckCircle aria-hidden="true" /> {permission}</span>)}</div></div>
            <button className="primary-button modal-button" type="button" onClick={() => window.alert('Cette extension sera installable lorsque le catalogue BlueFox sera connecté.')}>{selectedAddOn.users === 'Bientôt disponible' ? 'Bientôt disponible' : 'Installation prochaine'} <MdDownload aria-hidden="true" /></button>
          </section>
        </div>
      )}
    </>
  );
}

export default App;
