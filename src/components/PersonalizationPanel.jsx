import React, { useState } from 'react';
import { MdArrowBack, MdCheck, MdClose, MdImage, MdPalette, MdUpload } from 'react-icons/md';
import '../styles/personalization.css';

const LIGHT_DEFAULT_TAB_COLOR = '#f3f2f0';
const DARK_DEFAULT_TAB_COLOR = '#1d2026';
const DARK_TAB_SURFACE = '#252932';

const TAB_STYLES = [
  { label: 'Bleu clair', color: '#e8f1ff', accent: '#2563eb' },
  { label: 'Gris clair', color: '#f1f3f4', accent: '#8a919a' },
  { label: 'Blanc', color: '#ffffff', accent: '#c6cbd2' },
  { label: 'Sable', color: '#fff4df', accent: '#d79b43' },
  { label: 'Jaune doux', color: '#fff9cf', accent: '#d6b31e' },
  { label: 'Pêche', color: '#fff0e8', accent: '#e58d67' },
  { label: 'Rose clair', color: '#fceff3', accent: '#d77c9b' },
  { label: 'Corail clair', color: '#ffe8e6', accent: '#e36f68' },
  { label: 'Vert clair', color: '#eaf7ef', accent: '#69ad83' },
  { label: 'Menthe', color: '#e5f8f2', accent: '#51ab9a' },
  { label: 'Bleu ciel', color: '#e5f6ff', accent: '#55a8d2' },
  { label: 'Lavande claire', color: '#f1edff', accent: '#8d7bc8' }
];

const image = (label, id) => ({
  label,
  url: `url("https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=90")`
});

const IMAGE_CATEGORIES = [
  {
    label: 'Artistes des îles du Pacifique et d’Asie',
    cover: image('Artistes des îles du Pacifique et d’Asie', 'photo-1531058020387-3be344556be6'),
    images: [
      image('Couleurs océaniques', 'photo-1507525428034-b723cf961d3e'),
      image('Art polynésien', 'photo-1544551763-46a013bb70d5'),
      image('Lumière tropicale', 'photo-1516690561799-46d8f74f9abf'),
      image('Sable et ciel', 'photo-1500530855697-b586d89ba3ee'),
      image('Jardin exotique', 'photo-1497250681960-ef046c08a56e'),
      image('Peinture colorée', 'photo-1549490349-8643362247b5')
    ]
  },
  {
    label: 'Artistes amérindiens',
    cover: image('Artistes amérindiens', 'photo-1549490349-8643362247b5'),
    images: [
      image('Motifs rouges et noirs', 'photo-1513364776144-60967b0f800f'),
      image('Formes traditionnelles', 'photo-1547891654-e66ed7ebb968'),
      image('Couleurs graphiques', 'photo-1541701494587-cb58502866ab'),
      image('Dessin contemporain', 'photo-1561214115-f2f134cc4912'),
      image('Art abstrait', 'photo-1579783902614-a3fb3927b6a5'),
      image('Texture artistique', 'photo-1549490349-8643362247b5')
    ]
  },
  {
    label: 'Illustrations contemporaines',
    cover: image('Artistes LGBTQ+', 'photo-1531058020387-3be344556be6'),
    images: [
      image('Expression colorée', 'photo-1531058020387-3be344556be6'),
      image('Portrait artistique', 'photo-1534528741775-53994a69daeb'),
      image('Lumières pastel', 'photo-1518709268805-4e9042af9f23'),
      image('Art vivant', 'photo-1500530855697-b586d89ba3ee'),
      image('Fleurs et couleurs', 'photo-1490750967868-88aa4486c946'),
      image('Création moderne', 'photo-1561214115-f2f134cc4912')
    ]
  },
  {
    label: 'Artistes latino',
    cover: image('Artistes latino', 'photo-1490750967868-88aa4486c946'),
    images: [
      image('Fleurs graphiques', 'photo-1490750967868-88aa4486c946'),
      image('Couleurs chaudes', 'photo-1500530855697-b586d89ba3ee'),
      image('Peinture solaire', 'photo-1541701494587-cb58502866ab'),
      image('Illustration florale', 'photo-1518709268805-4e9042af9f23'),
      image('Jardin de couleurs', 'photo-1497250681960-ef046c08a56e'),
      image('Art populaire', 'photo-1513364776144-60967b0f800f')
    ]
  },
  {
    label: 'Artistes noirs',
    cover: image('Artistes noirs', 'photo-1541701494587-cb58502866ab'),
    images: [
      image('Formes végétales', 'photo-1541701494587-cb58502866ab'),
      image('Art abstrait coloré', 'photo-1579783902614-a3fb3927b6a5'),
      image('Peinture contemporaine', 'photo-1549490349-8643362247b5'),
      image('Motifs organiques', 'photo-1513364776144-60967b0f800f'),
      image('Couleurs profondes', 'photo-1561214115-f2f134cc4912'),
      image('Composition moderne', 'photo-1547891654-e66ed7ebb968')
    ]
  },
  {
    label: 'Paysages',
    cover: image('Paysages', 'photo-1464822759023-fed622ff2c3b'),
    images: [
      image('Arche dans le désert', 'photo-1474044159687-1ee9f3a51722'),
      image('Montagnes bleues', 'photo-1464822759023-fed622ff2c3b'),
      image('Lac de montagne', 'photo-1500534623283-312aade485b7'),
      image('Vallée lumineuse', 'photo-1501785888041-af3ef285b470'),
      image('Désert rouge', 'photo-1509316785289-025f5b846b35'),
      image('Côte sauvage', 'photo-1507525428034-b723cf961d3e')
    ]
  },
  {
    label: 'Textures',
    cover: image('Textures', 'photo-1518005020951-eccb494ad742'),
    images: [
      image('Texture géométrique', 'photo-1518005020951-eccb494ad742'),
      image('Texture minérale', 'photo-1531058020387-3be344556be6'),
      image('Motif bleu', 'photo-1557682250-33bd709cbe85'),
      image('Surface abstraite', 'photo-1557682260-967a4f6a9c6b'),
      image('Papier coloré', 'photo-1549490349-8643362247b5'),
      image('Lignes graphiques', 'photo-1513364776144-60967b0f800f')
    ]
  },
  {
    label: 'Vie',
    cover: image('Vie', 'photo-1535378917042-10a22c95931a'),
    images: [
      image('Détail naturel', 'photo-1535378917042-10a22c95931a'),
      image('Lumière dorée', 'photo-1500530855697-b586d89ba3ee'),
      image('Matière chaude', 'photo-1518709268805-4e9042af9f23'),
      image('Nature abstraite', 'photo-1497250681960-ef046c08a56e'),
      image('Écorce', 'photo-1448375240586-882707db888b'),
      image('Feuillage', 'photo-1473445361085-b9a07f55608b')
    ]
  },
  {
    label: 'Terre',
    cover: image('Terre', 'photo-1446776811953-b23d57bd21aa'),
    images: [
      image('Horizon terrestre', 'photo-1446776811953-b23d57bd21aa'),
      image('Jupiter', 'photo-1614728263952-84ea256f9679'),
      image('Lune', 'photo-1534791547706-6c9c8c8e0e31'),
      image('Nébuleuse', 'photo-1462331940025-496dfbfc7564'),
      image('Espace profond', 'photo-1502134249126-9f3755a50d78'),
      image('Carte naturelle', 'photo-1500534623283-312aade485b7')
    ]
  },
  {
    label: 'Art',
    cover: image('Art', 'photo-1541701494587-cb58502866ab'),
    images: [
      image('Peinture abstraite', 'photo-1541701494587-cb58502866ab'),
      image('Couleurs éclatantes', 'photo-1513364776144-60967b0f800f'),
      image('Encre', 'photo-1561214115-f2f134cc4912'),
      image('Composition', 'photo-1579783902614-a3fb3927b6a5'),
      image('Formes libres', 'photo-1549490349-8643362247b5'),
      image('Atelier', 'photo-1518005020951-eccb494ad742')
    ]
  },
  {
    label: 'Paysages urbains',
    cover: image('Paysages urbains', 'photo-1477959858617-67f85cf4f1df'),
    images: [
      image('Ville au soleil', 'photo-1477959858617-67f85cf4f1df'),
      image('Rue sous la pluie', 'photo-1519608487953-e999c86e7455'),
      image('Architecture moderne', 'photo-1487958449943-2429e8be8625'),
      image('Gratte-ciel', 'photo-1480714378408-67cf0d13bc1b'),
      image('Nuit urbaine', 'photo-1519501025264-65ba15a82390'),
      image('Lumières de la ville', 'photo-1494526585095-c41746248156')
    ]
  },
  {
    label: 'Formes géométriques',
    cover: image('Formes géométriques', 'photo-1557682250-33bd709cbe85'),
    images: [
      image('Polygones', 'photo-1557682250-33bd709cbe85'),
      image('Dégradé géométrique', 'photo-1557682260-967a4f6a9c6b'),
      image('Formes pastel', 'photo-1550859492-d5da9d8e45f3'),
      image('Architecture abstraite', 'photo-1518005020951-eccb494ad742'),
      image('Lignes et volumes', 'photo-1487958449943-2429e8be8625'),
      image('Composition colorée', 'photo-1541701494587-cb58502866ab')
    ]
  }
];

const formatBackground = (value) => `${value} center / cover no-repeat`;

const PersonalizationPanel = ({ isOpen, homeBackground, setHomeBackground, tabColor, onTabColorChange, resolvedTheme = 'light', onClose }) => {
  const [activeSection, setActiveSection] = useState('tabs');
  const [activeCategory, setActiveCategory] = useState(null);

  const selectBackgroundImage = (event) => {
    const [file] = event.target.files || [];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setHomeBackground(`url("${reader.result}") center / cover no-repeat`);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const selectedCategory = IMAGE_CATEGORIES.find((category) => category.label === activeCategory);
  const defaultTabColor = resolvedTheme === 'dark' ? DARK_DEFAULT_TAB_COLOR : LIGHT_DEFAULT_TAB_COLOR;
  const previewSurface = resolvedTheme === 'dark' ? DARK_TAB_SURFACE : '#f7f8fa';

  return (
    <div className={`bluefox-personalization-panel ${isOpen ? 'is-open' : 'is-closed'}`} role="presentation">
      <aside className="bluefox-personalization-sidebar" aria-hidden={!isOpen} aria-label="Personnaliser la page d’accueil">
        <header className="bluefox-personalization-header">
          <div className="bluefox-personalization-heading">
            {selectedCategory ? <button type="button" className="bluefox-personalization-back" onClick={() => setActiveCategory(null)} aria-label="Retour aux catégories"><MdArrowBack /></button> : <MdPalette aria-hidden="true" />}
            <span>{selectedCategory ? selectedCategory.label : 'Personnaliser'}</span>
          </div>
          <button type="button" onClick={onClose} className="bluefox-personalization-close" aria-label="Fermer la personnalisation" title="Fermer"><MdClose aria-hidden="true" /></button>
        </header>

        <div className="bluefox-personalization-content">
          {!selectedCategory ? (
            <>
              <h1 className="bluefox-personalization-title">Apparence</h1>
              <p className="bluefox-personalization-intro">Choisissez les couleurs du navigateur et le fond de votre page Nouvel onglet.</p>
              <div className="bluefox-personalization-tabs" role="tablist" aria-label="Options de personnalisation">
                <button type="button" role="tab" aria-selected={activeSection === 'tabs'} className={activeSection === 'tabs' ? 'is-active' : ''} onClick={() => setActiveSection('tabs')}><MdPalette aria-hidden="true" /> Onglets</button>
                <button type="button" role="tab" aria-selected={activeSection === 'images'} className={activeSection === 'images' ? 'is-active' : ''} onClick={() => setActiveSection('images')}><MdImage aria-hidden="true" /> Fonds de page</button>
              </div>

              {activeSection === 'tabs' ? (
                <section className="bluefox-personalization-section" role="tabpanel">
                  <div className="bluefox-section-heading"><h2>Choisir un style d’onglet</h2><p>La couleur s’applique à la barre des onglets et aux contrôles de la fenêtre.</p></div>
                  <div className="bluefox-tab-style-grid">
                    {TAB_STYLES.map((style) => (
                      <button key={style.label} type="button" className={`bluefox-tab-style-choice ${tabColor === style.color ? 'is-selected' : ''}`} onClick={() => onTabColorChange(style.color)} aria-label={`Choisir le style ${style.label}`}>
                        <div className="bluefox-tab-style-browser" style={{ '--preview-tab-color': resolvedTheme === 'dark' ? `color-mix(in srgb, ${style.color} 34%, #1d2026 66%)` : style.color, '--preview-tab-color-accent': style.color, '--preview-accent': style.accent, '--preview-surface': previewSurface }}>
                          <div className="bluefox-tab-style-strip"><span className="bluefox-mini-tab is-active"><i /> Nouvel onglet <b>×</b></span><span className="bluefox-mini-tab"><i /> Google <b>×</b></span><strong>+</strong></div>
                          <div className="bluefox-tab-style-address" />
                        </div>
                        <span className="bluefox-tab-style-label">{style.label}</span>
                        {tabColor === style.color && <MdCheck className="bluefox-tab-style-check" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="bluefox-reset-control" onClick={() => onTabColorChange(defaultTabColor)}>Réinitialiser les onglets</button>
                </section>
              ) : (
                <section className="bluefox-personalization-section" role="tabpanel">
                  <div className="bluefox-section-heading"><h2>Fond de la page d’accueil</h2><p>Choisissez une collection puis une image de haute qualité pour votre nouvel onglet.</p></div>
                  <div className="bluefox-category-grid">
                    {IMAGE_CATEGORIES.map((category) => (
                      <button key={category.label} type="button" className="bluefox-category-choice" onClick={() => setActiveCategory(category.label)} aria-label={`Ouvrir la catégorie ${category.label}`}>
                        <span className="bluefox-category-cover" style={{ backgroundImage: category.cover.url }} />
                        <span className="bluefox-category-label">{category.label}</span>
                      </button>
                    ))}
                  </div>
                  <label className="bluefox-import-background"><MdUpload aria-hidden="true" /><span>Importer une image</span><input type="file" accept="image/*" onChange={selectBackgroundImage} /></label>
                  <button type="button" className="bluefox-reset-control" onClick={() => setHomeBackground('')}>Réinitialiser le fond de la page</button>
                </section>
              )}
            </>
          ) : (
            <section className="bluefox-gallery-section" role="tabpanel">
              <div className="bluefox-gallery-heading"><div><h2>{selectedCategory.label}</h2><p>Actualisé quotidiennement</p></div><span className="bluefox-gallery-toggle" aria-hidden="true"><i /></span></div>
              <div className="bluefox-gallery-grid">
                {selectedCategory.images.map((item) => (
                  <button key={item.label} type="button" className={`bluefox-gallery-choice ${homeBackground === formatBackground(item.url) ? 'is-selected' : ''}`} onClick={() => setHomeBackground(formatBackground(item.url))} aria-label={`Choisir ${item.label}`}>
                    <span style={{ backgroundImage: item.url }} />
                    {homeBackground === formatBackground(item.url) && <MdCheck aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
};

export default PersonalizationPanel;
