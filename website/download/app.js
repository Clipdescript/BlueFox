(() => {
  const repo = 'Clipdescript/BlueFox';
  const releasesApi = `https://api.github.com/repos/${repo}/releases/latest`;
  const downloadBtn = document.getElementById('downloadBtn');
  const versionInfo = document.getElementById('versionInfo');
  const fallback = document.getElementById('fallback');

  async function init() {
    try {
      downloadBtn.textContent = 'Recherche de la dernière version…';
      const res = await fetch(releasesApi, { headers: { 'Accept': 'application/vnd.github+json' } });
      if (!res.ok) throw new Error('API GitHub indisponible');
      const json = await res.json();

      const assets = Array.isArray(json.assets) ? json.assets : [];
      const exe = assets.find(a =>
        /setup|installer/i.test(a.name) && /\.exe$/i.test(a.name)
      ) || assets.find(a => /\.exe$/i.test(a.name));

      if (exe && exe.browser_download_url) {
        downloadBtn.href = exe.browser_download_url;
        downloadBtn.setAttribute('download', exe.name);
        downloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          downloadBtn.textContent = 'Téléchargement…';
          window.location.href = exe.browser_download_url;
          setTimeout(() => {
            downloadBtn.textContent = 'Télécharger BlueFox pour Windows';
          }, 1500);
        }, { once: true });
        downloadBtn.textContent = 'Télécharger BlueFox pour Windows';
        versionInfo.textContent = `Version ${json.tag_name || json.name || ''}`.trim();
      } else {
        downloadBtn.href = `https://github.com/${repo}/releases`;
        downloadBtn.textContent = 'Ouvrir la page des Releases';
        fallback.classList.remove('hidden');
      }
    } catch (e) {
      downloadBtn.href = `https://github.com/${repo}/releases`;
      downloadBtn.textContent = 'Ouvrir la page des Releases';
      fallback.classList.remove('hidden');
    }
  }

  init();
})();
