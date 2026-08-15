import React, { useEffect, useState } from 'react';
import { MdArrowOutward, MdChevronLeft, MdChevronRight, MdHeadphones, MdMusicNote, MdOutlineSecurity, MdPublic } from 'react-icons/md';

const HERO_TITLE = 'La musique que vous aimez, au même endroit.';

const MUSIC_SERVICES = [
  { name: 'Spotify', description: 'Playlists et artistes', url: 'https://open.spotify.com', favicon: 'https://open.spotify.com/favicon.ico', color: '#1ed760' },
  { name: 'Deezer', description: 'Albums et favoris', url: 'https://www.deezer.com', favicon: 'https://www.deezer.com/favicon.ico', color: '#a238ff' },
  { name: 'YouTube Music', description: 'Clips et morceaux', url: 'https://music.youtube.com', favicon: 'https://music.youtube.com/favicon.ico', color: '#ff0033' },
  { name: 'Apple Music', description: 'Votre bibliothèque', url: 'https://music.apple.com', favicon: 'https://music.apple.com/favicon.ico', color: '#fa2d48' },
  { name: 'SoundCloud', description: 'Nouveaux artistes', url: 'https://soundcloud.com', favicon: 'https://soundcloud.com/favicon.ico', color: '#ff5500' },
  { name: 'Amazon Music', description: 'Écoute et podcasts', url: 'https://music.amazon.com', favicon: 'https://music.amazon.com/favicon.ico', color: '#20a8e0' },
];

const FEATURED_TRACKS = [
  { title: 'Billie Jean', artist: 'Michael Jackson', image: 'https://i.ytimg.com/vi/Zi_XLOBDo_Y/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y' },
  { title: 'Shape of You', artist: 'Ed Sheeran', image: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
  { title: 'Bohemian Rhapsody', artist: 'Queen', image: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
  { title: 'Get Lucky', artist: 'Daft Punk', image: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I' },
  { title: 'Take On Me', artist: 'a-ha', image: 'https://i.ytimg.com/vi/djV11Xbc914/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=djV11Xbc914' },
];

const MusicPage = () => {
  const [typedTitle, setTypedTitle] = useState('');
  const [activeTrack, setActiveTrack] = useState(0);

  useEffect(() => {
    let position = 0;
    const timer = window.setInterval(() => {
      position += 2;
      setTypedTitle(HERO_TITLE.slice(0, position));
      if (position >= HERO_TITLE.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveTrack((current) => (current + 1) % FEATURED_TRACKS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll('.bluefox-music-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bluefox-music-page relative h-full w-full overflow-y-auto">
      <header className="bluefox-music-header relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <MdMusicNote className="bluefox-music-page-icon text-[29px]" aria-hidden="true" />
          <span className="bluefox-music-brand text-[17px] font-medium tracking-[-0.04em]">BlueMusic</span>
        </div>
        <span className="bluefox-music-overline hidden text-[10px] font-medium uppercase tracking-[0.22em] sm:block">BlueFox / musique</span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-6 sm:px-10">
        <section className="bluefox-music-hero grid min-h-[420px] items-center gap-12 py-16 lg:grid-cols-[.92fr_1.08fr] lg:gap-16 lg:py-20">
          <div>
            <p className="bluefox-music-kicker bluefox-music-reveal mb-5 text-[11px] font-medium uppercase tracking-[0.2em]">Vos services musicaux</p>
            <h1 className="bluefox-music-title bluefox-music-reveal max-w-[650px] text-[clamp(38px,5.5vw,70px)] font-normal leading-[.98] tracking-[-0.07em]">
              {typedTitle}<span className="bluefox-music-caret" aria-hidden="true" />
            </h1>
            <p className="bluefox-music-lead bluefox-music-reveal mt-7 max-w-[545px] text-[16px] leading-7" style={{ transitionDelay: '120ms' }}>
              BlueMusic ne crée aucun compte et ne fabrique aucun profil musical. Cliquez simplement sur un service pour ouvrir son site officiel : la connexion et votre musique restent chez lui.
            </p>
            <div className="bluefox-music-reveal mt-9 flex flex-wrap gap-x-5 gap-y-3" style={{ transitionDelay: '200ms' }}>
              <span className="bluefox-music-trust"><MdOutlineSecurity /> Aucun profil créé</span>
              <span className="bluefox-music-trust"><MdPublic /> Liens officiels</span>
              <span className="bluefox-music-trust"><MdHeadphones /> Simple et rapide</span>
            </div>          </div>

          <section className="bluefox-music-carousel bluefox-music-reveal" aria-roledescription="carrousel" aria-label="Sélection musicale" style={{ transitionDelay: '120ms' }}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="bluefox-music-kicker text-[10px] font-medium uppercase tracking-[0.18em]">À découvrir</p>
                <h2 className="bluefox-music-carousel-heading mt-1 text-[22px] font-medium tracking-[-0.04em]">Quelques classiques</h2>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setActiveTrack((current) => (current - 1 + FEATURED_TRACKS.length) % FEATURED_TRACKS.length)} className="bluefox-music-carousel-control" aria-label="Morceaux précédents"><MdChevronLeft /></button>
                <button type="button" onClick={() => setActiveTrack((current) => (current + 1) % FEATURED_TRACKS.length)} className="bluefox-music-carousel-control" aria-label="Morceaux suivants"><MdChevronRight /></button>
              </div>
            </div>
            <div className="bluefox-music-carousel-track">
              {(() => {
                const track = FEATURED_TRACKS[activeTrack];
                return (
                  <a key={`${track.title}-${activeTrack}`} href={track.url} target="_blank" rel="noreferrer" className="bluefox-music-track-card">
                    <img src={track.image} alt={track.title} loading="eager" />
                    <span className="bluefox-music-track-copy"><strong>{track.title}</strong><small>{track.artist}</small></span>
                  </a>
                );
              })()}
            </div>
            <div className="bluefox-music-carousel-dots" aria-label="Position dans la sélection">
              {FEATURED_TRACKS.map((track, index) => <button key={track.title} type="button" className={index === activeTrack ? 'is-active' : ''} onClick={() => setActiveTrack(index)} aria-label={`Afficher ${track.title}`} />)}
            </div>
          </section>
        </section>

        <section className="bluefox-music-services-section bluefox-music-reveal border-t py-20 sm:py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="bluefox-music-kicker text-[11px] font-medium uppercase tracking-[0.2em]">Vos plateformes préférées</p>
              <h2 className="bluefox-music-title mt-3 text-[clamp(29px,4vw,48px)] font-normal leading-tight tracking-[-0.06em]">Ouvrez les services que vous utilisez déjà.</h2>
            </div>
            <p className="bluefox-music-section-note max-w-[250px] text-[13px] leading-5">BlueMusic est gratuite. Chaque service possède ses propres offres gratuites ou payantes.</p>
          </div>

          <div className="bluefox-music-service-list mt-14 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
            {MUSIC_SERVICES.map(({ name, description, url, favicon, color }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="bluefox-music-service group flex min-w-0 flex-col items-start"
                style={{ '--service-color': color }}
                title={`Ouvrir ${name}`}
              >
                <img
                  src={favicon}
                  alt={`${name} favicon`}
                  className="bluefox-music-service-favicon h-12 w-12 object-contain"
                  onError={(event) => {
                    if (event.currentTarget.dataset.fallback) return;
                    event.currentTarget.dataset.fallback = 'true';
                    event.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
                  }}
                />
                <strong className="bluefox-music-service-name mt-4 text-[14px] font-medium">{name}</strong>
                <span className="bluefox-music-service-description mt-1 text-[11px] leading-4">{description}</span>
                <span className="bluefox-music-service-open mt-3 inline-flex items-center gap-1 text-[11px] font-medium">Ouvrir <MdArrowOutward /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="bluefox-music-reveal border-t py-20 sm:py-24">
          <p className="bluefox-music-kicker text-[11px] font-medium uppercase tracking-[0.2em]">Comment ça marche ?</p>
          <h2 className="bluefox-music-title mt-3 max-w-[650px] text-[clamp(30px,4vw,48px)] font-normal leading-tight tracking-[-0.06em]">BlueMusic ne remplace aucun service.</h2>
          <div className="bluefox-music-steps mt-12 grid gap-10 md:grid-cols-3">
            <article className="bluefox-music-step bluefox-music-reveal" style={{ transitionDelay: '80ms' }}>
              <span className="bluefox-music-step-number">01</span>
              <h3 className="bluefox-music-step-title mt-6 text-[18px] font-medium">Choisissez un logo</h3>
              <p className="bluefox-music-step-copy mt-3 text-[13px] leading-6">Ouvrez Spotify, Deezer, YouTube Music ou un autre service depuis cette page.</p>
            </article>
            <article className="bluefox-music-step bluefox-music-reveal" style={{ transitionDelay: '160ms' }}>
              <span className="bluefox-music-step-number">02</span>
              <h3 className="bluefox-music-step-title mt-6 text-[18px] font-medium">Connectez-vous seulement si vous le souhaitez</h3>
              <p className="bluefox-music-step-copy mt-3 text-[13px] leading-6">Si vous avez déjà un compte, la connexion se fait uniquement sur le site officiel. BlueMusic ne voit jamais vos identifiants.</p>
            </article>
            <article className="bluefox-music-step bluefox-music-reveal" style={{ transitionDelay: '240ms' }}>
              <span className="bluefox-music-step-number">03</span>
              <h3 className="bluefox-music-step-title mt-6 text-[18px] font-medium">Lancez votre musique</h3>
              <p className="bluefox-music-step-copy mt-3 text-[13px] leading-6">Retrouvez vos playlists et votre écoute habituelle sans créer de profil supplémentaire.</p>
            </article>
          </div>
        </section>

        <section className="bluefox-music-reveal bluefox-music-privacy-panel mb-8 rounded-[26px] border px-7 py-10 sm:px-10 sm:py-12">
          <div className="flex max-w-[800px] items-start gap-4">
            <MdOutlineSecurity className="bluefox-music-privacy-icon mt-1 shrink-0 text-[27px]" />
            <div>
              <p className="bluefox-music-kicker text-[11px] font-medium uppercase tracking-[0.2em]">Important</p>
              <h2 className="bluefox-music-title mt-2 text-[27px] font-normal leading-tight tracking-[-0.05em]">BlueMusic ne gère pas vos comptes.</h2>
              <p className="bluefox-music-lead mt-3 text-[14px] leading-6">Pas d’inscription, pas de compte BlueMusic, pas de profil musical et pas de stockage de vos données. Ce sont les plateformes choisies qui gèrent votre connexion et votre abonnement.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bluefox-music-footer relative z-10 mx-auto flex w-full max-w-[1120px] items-center gap-2 border-t px-6 py-4 text-[11px] sm:px-10">
        <MdOutlineSecurity className="text-[16px]" />
        <span>BlueMusic est un accès rapide aux services officiels, rien de plus.</span>
      </footer>
    </div>
  );
};

export default MusicPage;
