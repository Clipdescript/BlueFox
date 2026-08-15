const { app, BrowserWindow, ipcMain, session, Menu, shell, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

function loadLocalEnv(extraPaths = []) {
  const envPaths = [
    path.join(__dirname, '.env'),
    process.resourcesPath ? path.join(process.resourcesPath, '.env') : null,
    path.join(path.dirname(process.execPath), '.env'),
    ...extraPaths
  ].filter(Boolean);

  for (const envPath of [...new Set(envPaths)]) {
    if (!fs.existsSync(envPath)) continue;

    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['\"]|['\"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
    return envPath;
  }

  return null;
}

let loadedEnvPath = loadLocalEnv();

// Configure logging for auto-updater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.verifyUpdateCodeSignature = false; // Important pour les applis non signées
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;
let updateCheckInProgress = false;
let updateDialogOpen = false;
const productionLogBuffer = [];

const logProduction = (level, message) => {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString()
  };
  productionLogBuffer.push(entry);
  if (productionLogBuffer.length > 100) productionLogBuffer.shift();

  if (level === 'error') log.error(message);
  else if (level === 'warn') log.warn(message);
  else log.info(message);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('production-log', entry);
  }
};

const logUpdate = (message, level = 'info') => logProduction(level, `[UPDATE] ${message}`);

ipcMain.handle('get-production-logs', () => productionLogBuffer);

// Check for updates only in an installed build and never overlap requests.
async function checkForUpdates() {
  if (!app.isPackaged || updateCheckInProgress) return null;

  logUpdate(`Checking from version ${app.getVersion()}`);
  updateCheckInProgress = true;
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    logUpdate(`Check failed: ${error.message}`);
    return null;
  } finally {
    updateCheckInProgress = false;
  }
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  logUpdate('Checking for update');
});
autoUpdater.on('update-available', (info) => {
  logUpdate(`Update available: ${info.version}`);
});
autoUpdater.on('update-not-available', (info) => {
  logUpdate(`No update available; current version: ${info.version}`);
});
autoUpdater.on('error', (err) => {
  logUpdate(`Error: ${err.stack || err.message || err}`, 'error');
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  logUpdate(`Download progress: ${log_message}`);
});
autoUpdater.on('update-downloaded', (info) => {
  if (updateDialogOpen) return;
  updateDialogOpen = true;
  logUpdate(`Update downloaded and ready to install: ${info.version}`);
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de BlueFox Browser a été téléchargée. Voulez-vous redémarrer l\'application pour l\'installer maintenant ?',
    buttons: ['Redémarrer', 'Plus tard']
  }).then((returnValue) => {
    if (returnValue.response === 0) {
      logUpdate(`User confirmed installation of ${info.version}`);
      autoUpdater.quitAndInstall();
      return;
    }
    logUpdate(`User postponed installation of ${info.version}`);
  }).catch((error) => {
    logUpdate(`Update dialog failed: ${error.message}`);
  }).finally(() => {
    updateDialogOpen = false;
  });
});

const isDev = !app.isPackaged;
// Bing Wallpaper's official daily archive. It provides real places and nature
// photography selected by Microsoft, without relying on a preselected local list.
const NATURE_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=fr-FR';
const usedNatureImages = new Set();

const getNatureImageKey = (imageUrl) => {
  try {
    const parsedUrl = new URL(imageUrl);
    return `${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return imageUrl;
  }
};

const getBingWallpaperUrl = (image) => {
  const sourceUrl = image.urlbase || image.url;
  if (!sourceUrl) return '';
  const absoluteUrl = sourceUrl.startsWith('http') ? sourceUrl : `https://www.bing.com${sourceUrl}`;
  const separator = absoluteUrl.includes('?') ? '&' : '?';
  return `${absoluteUrl}${separator}w=2400&h=1400&c=7&rs=1&qlt=100`;
};

async function fetchUnusedNatureImage() {
  const response = await fetch(NATURE_API, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'BlueFox Browser/1.0'
    }
  });
  if (!response.ok) throw new Error(`Bing Wallpaper returned ${response.status}`);

  const data = await response.json();
  const availableImages = (data.images || [])
    .map(getBingWallpaperUrl)
    .filter(Boolean)
    .filter((imageUrl) => !usedNatureImages.has(getNatureImageKey(imageUrl)));

  if (availableImages.length === 0) {
    log.info('All currently available Bing wallpapers have already been used.');
    return null;
  }

  const imageUrl = availableImages[Math.floor(Math.random() * availableImages.length)];
  usedNatureImages.add(getNatureImageKey(imageUrl));
  return imageUrl;
}

ipcMain.handle('fetch-nature-background', async () => {
  try {
    return await fetchUnusedNatureImage();
  } catch (error) {
    log.warn(`Bing Wallpaper unavailable: ${error.message}`);
    return null;
  }
});

ipcMain.handle('ask-ai', async (event, rawPrompt) => {
  const prompt = String(rawPrompt || '').trim().slice(0, 4000);
  const exaApiKey = process.env.EXA_API_KEY;
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  if (!prompt) return { ok: false, error: 'Écris une question pour Foxy.' };
  if (!exaApiKey || !mistralApiKey) {
    return {
      ok: false,
      error: 'Les clés EXA_API_KEY et MISTRAL_API_KEY ne sont pas configurées. Ajoute un fichier .env à côté de BlueFox Browser.exe ou dans le dossier de données indiqué dans les DevTools.'
    };
  }

  try {
    event.sender.send('ai-search-progress', { status: 'searching' });
    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': exaApiKey
      },
      body: JSON.stringify({
        query: prompt,
        type: 'auto',
        numResults: 30,
        contents: { highlights: true }
      })
    });
    if (!exaResponse.ok) throw new Error(`Exa a répondu ${exaResponse.status}`);

    const exaData = await exaResponse.json();
    const sources = (exaData.results || [])
      .filter((result) => result.url)
      .map((result) => ({
        title: result.title || result.url,
        url: result.url,
        image: result.image || result.thumbnail || '',
        text: (result.highlights || []).join(' ') || result.text || '',
        publishedDate: result.publishedDate || result.published_at || ''
      }));

    event.sender.send('ai-search-progress', {
      status: 'sources',
      sources: sources.map(({ title, url, image }) => ({ title, url, image }))
    });

    const context = sources.slice(0, 12).map((source, index) => `[${index + 1}] ${source.title}\n${source.url}\n${source.text}`).join('\n\n');
    event.sender.send('ai-search-progress', { status: 'analyzing' });
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        temperature: 0.1,
        max_tokens: 1400,
        messages: [
          {
            role: 'system',
            content: 'Tu es Foxy, l’assistant de BlueFox. Réponds en français, directement et honnêtement. Pour les faits récents ou vérifiables, utilise exclusivement les extraits web numérotés fournis : ne complète jamais avec une supposition et ne fabrique aucun fait, nom, chiffre, citation ou lien. Si les extraits ne permettent pas de répondre, dis clairement que l’information n’est pas vérifiable avec les éléments disponibles. N’écris jamais de section « Sources », ne dis pas « selon les sources » et ne mentionne pas Exa. Ajoute uniquement des citations numérotées au format [1], [2] après les affirmations réellement soutenues par l’extrait correspondant ; n’invente jamais de numéro. Structure la réponse avec Markdown : réponse directe d’abord, paragraphes courts, titres utiles et listes à puces quand plusieurs éléments sont nécessaires. Utilise `**...**` pour un mot ou une expression en gras quand c’est utile, mais pas pour toute une phrase ni pour tous les noms. Utilise `==...==` uniquement pour une ou deux informations vraiment essentielles à retenir ; ce sera affiché avec un petit surlignage bleu doux. Laisse le texte ordinaire sans surlignage et n’ajoute aucune mise en forme si elle n’apporte rien. Ne produis jamais un gros pavé. Termine par exactement quatre questions de suivi courtes et directement liées à la question, chacune dans une balise <foxy_followup>question</foxy_followup>, sans répondre à ces questions et sans ajouter d’information nouvelle.'
          },
          {
            role: 'user',
            content: `Question : ${prompt}\n\nExtraits web numérotés :\n${context || 'Aucun extrait exploitable.'}`
          }
        ]
      })
    });
    if (!mistralResponse.ok) throw new Error(`Mistral a répondu ${mistralResponse.status}`);

    const mistralData = await mistralResponse.json();
    const content = mistralData.choices?.[0]?.message?.content;
    const rawAnswer = Array.isArray(content) ? content.map((part) => part.text || '').join('') : content;
    if (!rawAnswer) throw new Error('Mistral n’a pas renvoyé de réponse.');

    const followUps = [...rawAnswer.matchAll(/<foxy_followup>\s*(.*?)\s*<\/foxy_followup>/gis)]
      .map((match) => match[1].trim())
      .filter(Boolean)
      .slice(0, 4);
    const answer = rawAnswer.replace(/\s*<foxy_followup>.*?<\/foxy_followup>/gis, '').trim();

    event.sender.send('ai-search-progress', { status: 'done' });
    return { ok: true, answer, followUps, sources: sources.map(({ title, url, image, text, publishedDate }) => ({ title, url, image, text, publishedDate })) };
  } catch (error) {
    event.sender.send('ai-search-progress', { status: 'error' });
    log.warn(`Foxy AI unavailable: ${error.message}`);
    return { ok: false, error: `Foxy ne peut pas répondre pour le moment : ${error.message}` };
  }
});

// Performance Optimization: Enable GPU and other speed hacks
app.commandLine.appendSwitch('enable-gpu-rasterization'); // Force GPU for rendering
app.commandLine.appendSwitch('enable-zero-copy'); // Faster memory copying
app.commandLine.appendSwitch('ignore-gpu-blacklist'); // Force GPU on older hardware
// app.commandLine.appendSwitch('disable-http-cache'); // Use Chromium's disk cache for speed
app.commandLine.appendSwitch('disk-cache-size', '1073741824'); // 1GB Cache
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,CanvasOopRasterization'); // Video/Canvas acceleration

// app.disableHardwareAcceleration(); // DO NOT DISABLE THIS for speed!

const WINDOW_TITLE_BAR_HEIGHT = 48;
const LIGHT_WINDOW_COLORS = {
  titleBar: '#f3f2f0',
  background: '#f7f7f9',
  symbol: '#000000'
};
const DARK_WINDOW_COLORS = {
  // This must match the dark TabBar surface, otherwise the native controls
  // leave a visible vertical seam at the right edge of the tab strip.
  titleBar: '#1d2026',
  background: '#15171b',
  symbol: '#ffffff'
};

const getWindowColors = (theme) => theme === 'dark' ? DARK_WINDOW_COLORS : LIGHT_WINDOW_COLORS;

function createWindow() {
  const initialWindowColors = nativeTheme.shouldUseDarkColors ? DARK_WINDOW_COLORS : LIGHT_WINDOW_COLORS;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: initialWindowColors.titleBar,
      symbolColor: initialWindowColors.symbol,
      height: WINDOW_TITLE_BAR_HEIGHT
    },
    backgroundColor: initialWindowColors.background,
    icon: path.join(__dirname, 'public/Logo.ico'),
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      backgroundThrottling: false, // Keep background tabs active (faster switching)
      offscreen: false,
      spellcheck: false, // Disable spellcheck for speed
      experimentalFeatures: true, // Enable experimental web features for speed
      webSecurity: true, // Keep security but optimize
      javascript: true,
      images: true,
      textAreasAreResizable: false,
      webgl: true,
      // Disable autofill to prevent console errors
      disableHtmlFullscreenWindowResize: true,
      autofill: false 
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'dist-react/index.html')}`;

  const routeNewWindowToTab = (url) => {
    if (/^https?:\/\//i.test(url)) {
      mainWindow.webContents.send('open-url-in-new-tab', url);
    }
    return { action: 'deny' };
  };

  // Keep target=_blank and window.open inside BlueFox as a new tab, never a popup.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => routeNewWindowToTab(url));
  mainWindow.webContents.on('did-attach-webview', (_event, guestContents) => {
    guestContents.setWindowOpenHandler(({ url }) => routeNewWindowToTab(url));
  });

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.focus();
  });

  // Window Controls
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    } else {
      app.quit();
    }
  });
  ipcMain.on('window-theme', (_event, theme) => {
    const windowColors = getWindowColors(theme);
    if (typeof mainWindow.setTitleBarOverlay === 'function') {
      // Electron owns these controls. Matching the TabBar surface keeps the
      // native area continuous; Windows supplies the hover highlight itself.
      mainWindow.setTitleBarOverlay({
        color: windowColors.titleBar,
        symbolColor: windowColors.symbol,
        height: WINDOW_TITLE_BAR_HEIGHT
      });
    }
    mainWindow.setBackgroundColor(windowColors.background);
  });
  
  // Close immediately with the native Windows close control; no confirmation popup.
  mainWindow.on('close', () => {
    mainWindow.removeAllListeners('close');
  });

  ipcMain.on('app-force-close', () => app.quit());

  // Context Menu Implementation
  mainWindow.webContents.on('context-menu', (e, params) => {
    const menu = Menu.buildFromTemplate([
      { role: 'undo', label: 'Annuler' },
      { role: 'redo', label: 'Rétablir' },
      { type: 'separator' },
      { role: 'cut', label: 'Couper' },
      { role: 'copy', label: 'Copier' },
      { role: 'paste', label: 'Coller' },
      { role: 'selectAll', label: 'Tout sélectionner' },
      { type: 'separator' },
      { 
        label: 'Rechercher avec Google', 
        visible: params.selectionText.trim().length > 0, 
        click: () => {
          shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
        }
      },
      { type: 'separator' },
      { role: 'reload', label: 'Actualiser' },
      { role: 'forceReload', label: 'Forcer l\'actualisation' },
      { role: 'toggleDevTools', label: 'Inspecter' }
    ]);
    menu.popup(mainWindow);
  });
}

// Set as Default Browser & PDF Reader (Best effort)
if (!isDev) {
    app.setAsDefaultProtocolClient('http');
    app.setAsDefaultProtocolClient('https');
}

app.whenReady().then(() => {
  const userDataEnvPath = path.join(app.getPath('userData'), '.env');
  if (!loadedEnvPath) loadedEnvPath = loadLocalEnv([userDataEnvPath]);

  logProduction('info', `[APP] BlueFox ${app.getVersion()} started; packaged=${app.isPackaged}`);
  if (loadedEnvPath) {
    logProduction('info', `[AI] Environment loaded from ${loadedEnvPath}; secret values hidden`);
  } else {
    logProduction('warn', `[AI] No .env file found. Configure EXA_API_KEY and MISTRAL_API_KEY in ${userDataEnvPath} or beside the executable`);
  }
  if (app.isPackaged) {
    try {
      logUpdate(`Log file: ${log.transports.file.getFile().path}`);
    } catch {
      logUpdate('Log file path unavailable');
    }
  }

  // Fix User-Agent globally for all sessions to prevent ERR_ABORTED on some sites
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.224 Safari/537.36';
  
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  createWindow();

  // Check for updates (only in production)
  if (!isDev) {
    setTimeout(() => {
        void checkForUpdates();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
