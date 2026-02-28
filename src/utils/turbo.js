
// Ce script est injecté dans chaque page pour accélérer le chargement et réduire la consommation
export const turboScript = `
(function() {
  // 0. Injection CSS pour blocage instantané (évite le Reflow/Layout Thrashing)
  const style = document.createElement('style');
  style.textContent = \`
    .ad, .ads, .advertisement, [id^="google_ads"], [class^="google_ads"], 
    div[class*="sponsored"], div[id*="sponsored"],
    iframe[src*="doubleclick.net"], iframe[src*="googlesyndication.com"],
    iframe[src*="adnxs.com"], iframe[src*="criteo.com"] {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      pointer-events: none !important;
    }
  \`;
  document.head.appendChild(style);

  // 1. DNS Prefetching & Preconnect Aggressif
  const prefetchDomain = (url) => {
    try {
      const domain = new URL(url, document.baseURI).hostname; // Support relative URLs
      if (!domain || domain === window.location.hostname) return;
      
      // DNS Prefetch
      if (!document.querySelector('link[rel="dns-prefetch"][href="//' + domain + '"]')) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = '//' + domain;
        document.head.appendChild(link);
      }
      
      // Preconnect (plus coûteux mais plus rapide pour les connexions imminentes)
      if (!document.querySelector('link[rel="preconnect"][href="https://' + domain + '"]')) {
         const link = document.createElement('link');
         link.rel = 'preconnect';
         link.href = 'https://' + domain;
         link.crossOrigin = 'anonymous';
         document.head.appendChild(link);
      }
    } catch (e) {}
  };

  // Preconnect vers les CDNs communs
  const commonCDNs = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://ajax.googleapis.com',
    'https://cdnjs.cloudflare.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com'
  ];
  commonCDNs.forEach(url => {
      if (!document.querySelector('link[rel="preconnect"][href="' + url + '"]')) {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = url;
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
      }
  });

  // Observer les liens pour précharger les DNS au survol ou à l'apparition
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.href) {
        // Utiliser requestIdleCallback pour ne pas bloquer le thread principal
        window.requestIdleCallback(() => prefetchDomain(entry.target.href), { timeout: 1000 });
      }
    });
  });

  // 2. Optimisation des Images et Médias (Réduit RAM/GPU)
  const optimizeMedia = () => {
    document.querySelectorAll('img, iframe, video').forEach(el => {
      if (!el.hasAttribute('loading') && el.tagName !== 'VIDEO') {
        el.setAttribute('loading', 'lazy'); // Chargement différé natif
      }
      // Bloquer l'autoplay des vidéos pour économiser la bande passante/CPU
      if (el.tagName === 'VIDEO' && el.autoplay) {
          el.pause();
          el.autoplay = false;
          el.preload = 'none'; // Ne charge rien tant que l'utilisateur ne clique pas
      }
    });
  };
  
  // 3. Nettoyage agressif du DOM
  const cleanupHeavyElements = () => {
    // Le CSS s'occupe de l'affichage, ici on supprime du DOM pour libérer la RAM
    const selector = '.ad, .ads, .advertisement, [id^="google_ads"], [class^="google_ads"]';
    const ads = document.querySelectorAll(selector);
    ads.forEach(ad => {
        ad.remove(); // Suppression réelle du DOM
    });
  };

  // Exécution initiale
  window.requestIdleCallback(() => {
      optimizeMedia();
      cleanupHeavyElements();
      document.querySelectorAll('a').forEach(a => observer.observe(a));
  });

  // Observer les changements DOM pour les applications dynamiques (SPA)
  const mutationObserver = new MutationObserver((mutations) => {
    // Debounce pour éviter trop d'appels
    if (window.turboTimeout) clearTimeout(window.turboTimeout);
    window.turboTimeout = setTimeout(() => {
        optimizeMedia();
        cleanupHeavyElements();
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'A') observer.observe(node);
                if (node.querySelectorAll) node.querySelectorAll('a').forEach(a => observer.observe(a));
            });
        });
    }, 500);
  });
  
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  console.log('🚀 Turbo Mode V2 Activé : Optimisations Ultra Rapides');
})();
`;
