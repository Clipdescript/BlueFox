import React, { useEffect, useRef, useState } from 'react';
import { MdArrowBack, MdArrowOutward, MdDarkMode, MdLightMode, MdMusicNote } from 'react-icons/md';
import { useTheme } from '../utils/theme.js';
import { FaDeezer } from 'react-icons/fa6';
import { SiSpotify, SiYoutube, SiYoutubemusic } from 'react-icons/si';

const MUSIC_SERVICES = [
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    description: 'Clips, albums et playlists',
    url: 'https://music.youtube.com',
    color: '#ff0033',
    icon: SiYoutubemusic
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Vidéos et concerts en direct',
    url: 'https://www.youtube.com',
    color: '#ff0000',
    icon: SiYoutube
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Musique et podcasts',
    url: 'https://open.spotify.com',
    color: '#1ed760',
    icon: SiSpotify
  },
  {
    id: 'deezer',
    name: 'Deezer',
    description: 'Écoute et recommandations',
    url: 'https://www.deezer.com',
    color: '#a238ff',
    icon: FaDeezer
  }
];

function MusicPage({ musicTabId = null, onPlaybackChange = () => {} }) {
  const [activeService, setActiveService] = useState(null);
  const { resolvedTheme, toggleTheme } = useTheme();
  const webviewRef = useRef(null);

  useEffect(() => {
    if (!activeService) {
      onPlaybackChange(musicTabId, null);
      return undefined;
    }

    onPlaybackChange(musicTabId, {
      service: activeService.name,
      title: activeService.name,
      tabTitle: activeService.name
    });

    const webview = webviewRef.current;
    if (!webview) return undefined;

    const handlePageTitle = (event) => {
      const title = String(event.title || '').trim();
      if (!title) return;
      onPlaybackChange(musicTabId, {
        service: activeService.name,
        title,
        tabTitle: activeService.name
      });
    };

    webview.addEventListener('page-title-updated', handlePageTitle);
    return () => webview.removeEventListener('page-title-updated', handlePageTitle);
  }, [activeService, musicTabId, onPlaybackChange]);

  if (activeService) {
    return (
      <div className="bluefox-music-site-view h-full w-full">
        <div className="bluefox-music-site-toolbar">
          <button type="button" onClick={() => setActiveService(null)} aria-label="Revenir à BlueMusic">
            <MdArrowBack />
            <span>BlueMusic</span>
          </button>
          <span className="bluefox-music-site-name">{activeService.name}</span>
          <button type="button" onClick={toggleTheme} aria-label={`Passer en mode ${resolvedTheme === 'dark' ? 'clair' : 'sombre'}`}>
            {resolvedTheme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
          </button>
        </div>
        <webview
          ref={webviewRef}
          className="bluefox-music-site-webview"
          src={activeService.url}
          partition="persist:bluefox-music"
          allowpopups="true"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
        />
      </div>
    );
  }

  return (
    <div className="bluefox-music-picker h-full w-full overflow-y-auto">
      <header className="bluefox-music-picker-header">
        <div className="bluefox-music-picker-header-brand">
          <span><MdMusicNote /></span>
          <strong>BlueMusic</strong>
        </div>
        <div className="bluefox-music-picker-header-actions">
          <span>Services de musique</span>
          <button type="button" onClick={toggleTheme} aria-label={`Passer en mode ${resolvedTheme === 'dark' ? 'clair' : 'sombre'}`}>
            {resolvedTheme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
          </button>
        </div>
      </header>
      <main className="bluefox-music-picker-main">
        <h1>Choisissez <span>votre musique</span></h1>
        <p className="bluefox-music-picker-intro">Sélectionnez un service. Il s’ouvrira ici, dans BlueFox, sans quitter votre onglet.</p>

        <section className="bluefox-music-service-grid" aria-label="Services de musique">
          {MUSIC_SERVICES.map((service) => {
            const ServiceIcon = service.icon;
            return (
            <button
              type="button"
              key={service.id}
              className="bluefox-music-service-choice"
              onClick={() => setActiveService(service)}
              style={{ '--music-accent': service.color }}
            >
              <span className="bluefox-music-service-choice-icon"><ServiceIcon /></span>
              <span className="bluefox-music-service-choice-copy">
                <strong>{service.name}</strong>
                <small>{service.description}</small>
              </span>
              <MdArrowOutward className="bluefox-music-service-choice-arrow" />
            </button>
            );
          })}
        </section>

        <p className="bluefox-music-picker-note">Le service reste ouvert dans cet onglet. Tu peux revenir ici à tout moment ; la lecture du site peut continuer en arrière-plan pendant que tu navigues dans BlueFox.</p>
      </main>
      <footer className="bluefox-music-picker-footer">
        <div className="bluefox-music-picker-footer-main">
          <div className="bluefox-music-picker-footer-brand">
            <div className="bluefox-music-picker-header-brand"><span><MdMusicNote /></span><strong>BlueMusic</strong></div>
            <p>Votre espace musique intégré à BlueFox. Choisissez un service et restez dans votre navigateur.</p>
          </div>
          <div className="bluefox-music-picker-footer-column">
            <strong>Services</strong>
            <span>YouTube Music</span>
            <span>YouTube</span>
            <span>Spotify</span>
            <span>Deezer</span>
          </div>
          <div className="bluefox-music-picker-footer-column">
            <strong>BlueFox</strong>
            <span>Lecture en arrière-plan</span>
            <span>Onglets séparés</span>
            <span>Retour instantané</span>
          </div>
        </div>
        <div className="bluefox-music-picker-footer-bottom">
          <span>© {new Date().getFullYear()} BlueFox Browser</span>
          <span>BlueMusic reste dans votre espace BlueFox.</span>
        </div>
      </footer>
    </div>
  );
}

export default MusicPage;
