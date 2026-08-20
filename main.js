const { app, BrowserWindow, ipcMain, session, Menu, dialog, nativeTheme, shell } = require('electron');
const path = require('path');
const os = require('os');
const http = require('http');
const { randomBytes, randomUUID } = require('crypto');
const { pathToFileURL, fileURLToPath } = require('url');
const fs = require('fs');
const net = require('net');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

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
}

loadLocalEnv();

// Configure logging for auto-updater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.verifyUpdateCodeSignature = false; // Important pour les applis non signées
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let updateCheckInProgress = false;
let updateDialogOpen = false;

const logUpdate = (message) => log.info(`[UPDATE] ${message}`);

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
  log.error(`[UPDATE] Error: ${err.stack || err.message || err}`);
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
const APP_USER_MODEL_ID = 'com.bluefox.browser';
const DISCORD_CLIENT_ID = '1539666175699583077';
const DISCORD_REDIRECT_URI = 'http://127.0.0.1:42813/discord/callback';
const DISCORD_RPC_PIPES = Array.from({ length: 10 }, (_value, index) => `\\\\?\\pipe\\discord-ipc-${index}`);
const BLUEFOX_RICH_PRESENCE = Object.freeze({
  details: 'Utilise cette pépite',
  state: 'Navigateur français • privé • rapide',
  large_image: 'bluefox-logo',
  large_text: 'BlueFox Browser — le navigateur français privé et rapide',
  small_image: 'bluefox-logo',
  small_text: 'Recherche sur Internet avec Foxy'
});

class DiscordRichPresence {
  constructor() {
    this.socket = null;
    this.connectionPromise = null;
    this.retryTimer = null;
    this.activity = BLUEFOX_RICH_PRESENCE;
  }

  setActivity(activity = {}) {
    this.activity = { ...BLUEFOX_RICH_PRESENCE, ...activity };
    if (this.socket?.writable) {
      this.sendActivity();
      return;
    }
    this.connect();
  }

  sendPacket(opcode, payload) {
    if (!this.socket?.writable) return false;
    const body = Buffer.from(JSON.stringify(payload));
    const header = Buffer.alloc(8);
    header.writeInt32LE(opcode, 0);
    header.writeInt32LE(body.length, 4);
    this.socket.write(Buffer.concat([header, body]));
    return true;
  }

  sendActivity() {
    this.sendPacket(1, {
      cmd: 'SET_ACTIVITY',
      args: { pid: process.pid, activity: this.activity },
      nonce: randomUUID()
    });
  }

  handleSocketClosed(socket) {
    if (this.socket !== socket) return;
    this.socket = null;
    if (!this.retryTimer) {
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.connect();
      }, 5000);
    }
  }

  connectFromPipe(index) {
    if (index >= DISCORD_RPC_PIPES.length) return Promise.resolve();

    return new Promise((resolve) => {
      const socket = net.createConnection(DISCORD_RPC_PIPES[index]);
      let connected = false;
      const tryNextPipe = () => {
        if (connected) return;
        connected = true;
        socket.destroy();
        this.connectFromPipe(index + 1).then(resolve);
      };

      socket.once('connect', () => {
        if (connected) return;
        connected = true;
        this.socket = socket;
        socket.on('error', () => this.handleSocketClosed(socket));
        socket.on('close', () => this.handleSocketClosed(socket));
        this.sendPacket(0, { v: 1, client_id: DISCORD_CLIENT_ID });
        this.sendActivity();
        log.info('[DISCORD RPC] Rich Presence connected.');
        resolve();
      });
      socket.once('error', tryNextPipe);
    });
  }

  connect() {
    if (this.socket?.writable || this.connectionPromise) return;
    this.connectionPromise = this.connectFromPipe(0).finally(() => {
      this.connectionPromise = null;
    });
  }

  disconnect() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    const socket = this.socket;
    this.socket = null;
    if (socket && !socket.destroyed) socket.end();
  }
}

const discordRichPresence = new DiscordRichPresence();
let discordLoginServer = null;
let discordAuthWindow = null;
if (process.platform === 'win32') app.setAppUserModelId(APP_USER_MODEL_ID);

const toBase64Url = (value) => Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const createDiscordAvatarUrl = (user) => user?.avatar
  ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
  : 'https://cdn.discordapp.com/embed/avatars/0.png';

const closeDiscordLoginServer = () => {
  if (!discordLoginServer) return;
  discordLoginServer.close();
  discordLoginServer = null;
};

const closeDiscordAuthWindow = () => {
  const authWindow = discordAuthWindow;
  discordAuthWindow = null;
  if (authWindow && !authWindow.isDestroyed()) authWindow.close();
};

const isDiscordCallbackUrl = (url) => String(url || '').startsWith(`${DISCORD_REDIRECT_URI}?`);
const forwardDiscordCallback = (url) => {
  if (!isDiscordCallbackUrl(url)) return false;
  void fetch(url)
    .catch((error) => log.warn(`[DISCORD] Callback forwarding failed: ${error.message}`))
    .finally(() => closeDiscordAuthWindow());
  return true;
};

ipcMain.on('discord-rich-presence-update', (_event, activity) => {
  discordRichPresence.setActivity(activity && typeof activity === 'object' ? activity : {});
});

ipcMain.handle('discord-login', async () => {
  if (discordLoginServer) return { ok: false, error: 'Une connexion Discord est déjà en cours.' };

  const state = toBase64Url(randomBytes(24));
  const authorizationUrl = new URL('https://discord.com/oauth2/authorize');
  authorizationUrl.search = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: 'identify',
    state
  }).toString();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      closeDiscordLoginServer();
      closeDiscordAuthWindow();
      resolve(result);
    };
    const server = http.createServer(async (request, response) => {
      const callbackUrl = new URL(request.url || '/', DISCORD_REDIRECT_URI);
      if (callbackUrl.pathname !== '/discord/callback') {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><meta charset="utf-8"><title>BlueFox</title><p>Connexion Discord terminée. Vous pouvez fermer cette fenêtre.</p>');
      if (callbackUrl.searchParams.get('state') !== state) {
        finish({ ok: false, error: 'La vérification Discord a échoué.' });
        return;
      }
      if (callbackUrl.searchParams.get('error')) {
        finish({ ok: false, error: 'La connexion Discord a été annulée.' });
        return;
      }

      try {
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        if (!clientSecret) throw new Error('DISCORD_CLIENT_SECRET is missing from .env');
        const tokenBody = new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: callbackUrl.searchParams.get('code') || '',
          redirect_uri: DISCORD_REDIRECT_URI
        });
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenBody
        });
        if (!tokenResponse.ok) {
          const errorBody = (await tokenResponse.text()).slice(0, 240);
          throw new Error(`Discord token exchange failed: ${tokenResponse.status} ${errorBody}`);
        }
        const tokenData = await tokenResponse.json();
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `${tokenData.token_type || 'Bearer'} ${tokenData.access_token}` }
        });
        if (!userResponse.ok) throw new Error(`Discord profile request failed: ${userResponse.status}`);
        const user = await userResponse.json();
        finish({ ok: true, profile: {
          id: user.id,
          username: user.username,
          globalName: user.global_name || user.username,
          avatarUrl: createDiscordAvatarUrl(user)
        } });
      } catch (error) {
        log.warn(`[DISCORD] Login failed: ${error.message}`);
        finish({ ok: false, error: isDev ? `Connexion Discord impossible : ${error.message}` : 'La connexion Discord est indisponible pour le moment.' });
      }
    });

    discordLoginServer = server;
    server.once('error', (error) => {
      log.warn(`[DISCORD] Callback server failed: ${error.message}`);
      finish({ ok: false, error: 'Le retour de connexion Discord ne peut pas être ouvert.' });
    });
    server.listen(42813, '127.0.0.1', () => {
      discordAuthWindow = new BrowserWindow({
        width: 520,
        height: 760,
        minWidth: 420,
        minHeight: 600,
        show: true,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'public/Logo.ico'),
        title: 'Connexion Discord — BlueFox',
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      });
      let callbackForwarded = false;
      const handleAuthNavigation = (event, url) => {
        if (!isDiscordCallbackUrl(url)) return;
        event.preventDefault();
        if (callbackForwarded) return;
        callbackForwarded = true;
        forwardDiscordCallback(url);
      };
      discordAuthWindow.webContents.on('will-redirect', handleAuthNavigation);
      discordAuthWindow.webContents.on('will-navigate', handleAuthNavigation);
      void discordAuthWindow.loadURL(authorizationUrl.toString());
    });
    setTimeout(() => finish({ ok: false, error: 'La connexion Discord a expiré.' }), 180000);
  });
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();
const initialJumpListArgs = process.argv;

const JUMP_LIST_ICON = path.join(__dirname, 'public/Logo.ico');

const sanitizeHomeShortcuts = (shortcuts) => (Array.isArray(shortcuts) ? shortcuts : [])
  .map((shortcut) => ({
    title: String(shortcut?.title || '').trim().slice(0, 80),
    url: String(shortcut?.url || '').trim(),
    iconUrl: String(shortcut?.iconUrl || '').trim()
  }))
  .filter((shortcut) => shortcut.title && /^https?:\/\//i.test(shortcut.url))
  .slice(0, 20);

const createJumpListTask = (title, args) => ({
  type: 'task',
  title,
  program: process.execPath,
  args: isDev ? `${JSON.stringify(path.join(__dirname, 'main.js'))} ${args}` : args,
  iconPath: JUMP_LIST_ICON,
  iconIndex: 0
});

const updateJumpList = (shortcuts = []) => {
  if (process.platform !== 'win32' || typeof app.setJumpList !== 'function') return;

  const tasks = [
    createJumpListTask('Ouvrir', '--bluefox-action=open'),
    createJumpListTask('Nouvel onglet', '--bluefox-action=new-tab'),
    createJumpListTask('Nouvelle fenêtre', '--bluefox-action=new-window'),
    createJumpListTask('Nouvelle fenêtre privée', '--bluefox-action=private-window')
  ];
  const shortcutItems = sanitizeHomeShortcuts(shortcuts).map((shortcut) => createJumpListTask(
    shortcut.title,
    `--bluefox-action=shortcut --bluefox-url=${encodeURIComponent(shortcut.url)}`
  ));

  try {
    app.setJumpList([
      { type: 'tasks', name: 'BlueFox', items: tasks },
      { type: 'custom', name: 'Accès rapide', items: shortcutItems }
    ]);
  } catch (error) {
    log.warn(`[JUMP_LIST] Unable to update Windows taskbar menu: ${error.message}`);
  }
};

const normalizePdfArgument = (argument) => {
  if (typeof argument !== 'string' || argument.startsWith('-')) return '';
  let filePath = argument;
  if (/^file:\/\//i.test(argument)) {
    try { filePath = fileURLToPath(argument); } catch { return ''; }
  }
  return /\.pdf$/i.test(filePath) && fs.existsSync(filePath) ? filePath : '';
};

const findPdfFilePath = (commandLine = []) => commandLine.map(normalizePdfArgument).find(Boolean) || '';

const parseJumpListAction = (commandLine = []) => {
  const actionArgument = commandLine.find((argument) => argument.startsWith('--bluefox-action='));
  if (!actionArgument) return null;

  const action = actionArgument.slice('--bluefox-action='.length);
  const urlArgument = commandLine.find((argument) => argument.startsWith('--bluefox-url='));
  const url = urlArgument ? decodeURIComponent(urlArgument.slice('--bluefox-url='.length)) : '';
  return { action, url };
};

const sendJumpListAction = (action) => {
  const targetWindow = BrowserWindow.getAllWindows()[0];
  if (!targetWindow || targetWindow.isDestroyed()) return;

  const deliver = () => {
    if (!targetWindow.isDestroyed()) {
      // Handle URLs passed from external sources
      if (action.type === 'open-url' && action.url) {
        targetWindow.webContents.send('open-url-in-new-tab', action.url);
      } else {
        targetWindow.webContents.send('jump-list-action', action);
      }
    }
  };
  if (targetWindow.webContents.isLoading()) {
    targetWindow.webContents.once('did-finish-load', deliver);
  } else {
    deliver();
  }
};

const sendPdfFile = (filePath) => {
  const targetWindow = BrowserWindow.getAllWindows()[0];
  if (!targetWindow || targetWindow.isDestroyed()) return;

  const deliver = () => {
    if (!targetWindow.isDestroyed()) targetWindow.webContents.send('open-pdf-file', filePath);
  };
  if (targetWindow.webContents.isLoading()) targetWindow.webContents.once('did-finish-load', deliver);
  else deliver();
};

const focusMainWindow = () => {
  const targetWindow = BrowserWindow.getAllWindows()[0];
  if (!targetWindow || targetWindow.isDestroyed()) return;
  if (targetWindow.isMinimized()) targetWindow.restore();
  targetWindow.show();
  targetWindow.focus();
};

function handleJumpListAction(commandLine) {
  const action = parseJumpListAction(commandLine);
  if (!action) return;

  if (action.action === 'open') {
    focusMainWindow();
  } else if (action.action === 'new-tab') {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    sendJumpListAction({ type: 'new-tab' });
  } else if (action.action === 'new-window') {
    createWindow();
  } else if (action.action === 'private-window') {
    createWindow({ privateMode: true });
  } else if (action.action === 'shortcut' && action.url) {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    sendJumpListAction({ type: 'open-shortcut', url: action.url });
  }
}

if (hasSingleInstanceLock) {
  app.on('second-instance', (_event, commandLine) => {
    const pdfFilePath = findPdfFilePath(commandLine);
    if (pdfFilePath) {
      log.info(`[PDF] Second instance opened with file: ${pdfFilePath}`);
      focusMainWindow();
      sendPdfFile(pdfFilePath);
      return;
    }

    // OAuth callbacks can be routed back through BlueFox when it is the
    // default browser. Forward them to the temporary local Discord server.
    const discordCallbackUrl = commandLine.find(isDiscordCallbackUrl);
    if (discordCallbackUrl) {
      log.info('[DISCORD] Forwarding OAuth callback to the login server.');
      focusMainWindow();
      forwardDiscordCallback(discordCallbackUrl);
      return;
    }

    // Check if there's a URL passed in the command line (from external browser link)
    const urlArg = commandLine.find(arg => /^https?:\/\//i.test(arg));
    if (urlArg) {
      log.info(`[PROTOCOL] Second instance opened with URL: ${urlArg}`);
      focusMainWindow();
      sendJumpListAction({ type: 'open-url', url: urlArg });
      return;
    }
    
    const action = parseJumpListAction(commandLine);
    if (action?.action === 'new-window') {
      createWindow();
      return;
    }
    if (action?.action === 'private-window') {
      createWindow({ privateMode: true });
      return;
    }
    focusMainWindow();
    handleJumpListAction(commandLine);
  });
} else {
  app.quit();
}

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

const measureNetworkPing = async () => {
  const startedAt = Date.now();
  try {
    const response = await fetch(`https://www.google.com/generate_204?bluefox_metrics=${Date.now()}`, { cache: 'no-store' });
    return response.ok || response.status === 204 ? Date.now() - startedAt : null;
  } catch {
    return null;
  }
};

ipcMain.handle('get-performance-metrics', async () => {
  const processes = app.getAppMetrics();
  const appMemoryKb = processes.reduce((total, metric) => total + Number(metric.memory?.workingSetSize || 0), 0);
  const cpuPercent = processes.reduce((total, metric) => total + Number(metric.cpu?.percentCPUUsage || 0), 0);
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const pingMs = await measureNetworkPing();
  const networkInterfaces = Object.values(os.networkInterfaces()).flat().filter((entry) => entry && !entry.internal);

  return {
    appMemoryMb: Math.round(appMemoryKb / 1024),
    appMemoryPercent: totalMemory ? (appMemoryKb * 1024 / totalMemory) * 100 : null,
    systemMemoryUsedPercent: totalMemory ? ((totalMemory - freeMemory) / totalMemory) * 100 : null,
    cpuPercent: Math.round(cpuPercent * 10) / 10,
    processCount: processes.length,
    cpuCores: os.cpus().length,
    totalMemoryGb: Math.round((totalMemory / 1024 ** 3) * 10) / 10,
    freeMemoryGb: Math.round((freeMemory / 1024 ** 3) * 10) / 10,
    networkInterfaceCount: networkInterfaces.length,
    pingMs,
    processes: processes.map((metric) => ({
      pid: metric.pid,
      type: metric.type || 'Unknown',
      name: metric.name || metric.type || 'Processus Chromium',
      memoryMb: Math.round(Number(metric.memory?.workingSetSize || 0) / 1024),
      cpuPercent: Math.round(Number(metric.cpu?.percentCPUUsage || 0) * 10) / 10
    })).sort((first, second) => second.memoryMb - first.memoryMb),
    measuredAt: Date.now()
  };
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-electron-runtime-info', () => ({
  electron: process.versions.electron,
  chromium: process.versions.chrome,
  node: process.versions.node,
  v8: process.versions.v8,
  platform: process.platform,
  arch: process.arch
}));

ipcMain.handle('get-default-browser-status', () => {
  const supported = process.platform === 'win32' || process.platform === 'darwin' || process.platform === 'linux';
  const httpDefault = app.isDefaultProtocolClient('http');
  const httpsDefault = app.isDefaultProtocolClient('https');
  return { supported, isDefault: httpDefault && httpsDefault };
});

ipcMain.handle('open-default-browser-settings', async () => {
  const settingsUrl = process.platform === 'win32'
    ? 'ms-settings:defaultapps'
    : process.platform === 'darwin'
      ? 'x-apple.systempreferences:com.apple.preference.general'
      : '';
  if (!settingsUrl) return { opened: false };
  await shell.openExternal(settingsUrl);
  return { opened: true };
});

const readPdfFile = async (filePath) => {
  if (typeof filePath !== 'string' || path.extname(filePath).toLowerCase() !== '.pdf') {
    throw new Error('Le fichier sélectionné n’est pas un PDF.');
  }

  const data = await fs.promises.readFile(filePath);
  return {
    fileName: path.basename(filePath),
    filePath,
    url: pathToFileURL(filePath).toString(),
    data: new Uint8Array(data)
  };
};

ipcMain.handle('open-pdf', async (event) => {
  const ownerWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(ownerWindow, {
    title: 'Ouvrir un PDF',
    properties: ['openFile'],
    filters: [{ name: 'Documents PDF', extensions: ['pdf'] }]
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return readPdfFile(result.filePaths[0]);
});

ipcMain.handle('load-pdf', async (_event, filePath) => readPdfFile(filePath));

const toPdfBuffer = (value) => {
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (Array.isArray(value)) return Buffer.from(value);
  if (value?.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data);
  throw new Error('Les données PDF sont invalides.');
};

ipcMain.handle('save-pdf', async (event, payload = {}) => {
  const ownerWindow = BrowserWindow.fromWebContents(event.sender);
  const rawName = String(payload.suggestedName || 'document-bluefox.pdf').trim();
  const safeName = (rawName.replace(/[<>:"/\\|?*]/g, '_').replace(/\.pdf$/i, '') || 'document-bluefox') + '.pdf';
  const result = await dialog.showSaveDialog(ownerWindow, {
    title: 'Enregistrer le PDF modifié',
    defaultPath: safeName,
    filters: [{ name: 'Documents PDF', extensions: ['pdf'] }]
  });

  if (result.canceled || !result.filePath) return null;

  const filePath = result.filePath.toLowerCase().endsWith('.pdf') ? result.filePath : `${result.filePath}.pdf`;
  await fs.promises.writeFile(filePath, toPdfBuffer(payload.data));
  return { fileName: path.basename(filePath), filePath };
});

ipcMain.handle('search-youtube', async (_event, rawQuery) => {
  const query = String(rawQuery || '').trim().slice(0, 160);
  if (!query) return { ok: false, error: 'Écris un titre ou un artiste à rechercher.' };

  try {
    const youtubeSearch = await import('youtube-search-without-api-key');
    const results = await youtubeSearch.search(query);
    return {
      ok: true,
      results: (results || []).slice(0, 12).map((result) => ({
        id: result.id?.videoId || '',
        title: result.title || result.snippet?.title || 'Vidéo YouTube',
        description: result.description || '',
        duration: result.duration_raw || result.snippet?.duration || '',
        channel: result.snippet?.channelTitle || result.author?.name || '',
        thumbnail: result.snippet?.thumbnails?.high?.url || result.snippet?.thumbnails?.default?.url || (result.id?.videoId ? `https://i.ytimg.com/vi/${result.id.videoId}/hqdefault.jpg` : ''),
        url: result.url || (result.id?.videoId ? `https://www.youtube.com/watch?v=${result.id.videoId}` : '')
      })).filter((result) => result.id)
    };
  } catch (error) {
    log.warn(`YouTube search unavailable: ${error.message}`);
    return { ok: false, error: 'La recherche YouTube est indisponible pour le moment.' };
  }
});

ipcMain.on('update-home-shortcuts', (_event, shortcuts) => {
  updateJumpList(sanitizeHomeShortcuts(shortcuts));
});

ipcMain.handle('check-for-updates', async () => {
  const currentVersion = app.getVersion();
  if (!app.isPackaged) return { status: 'development', currentVersion };

  const result = await checkForUpdates();
  if (!result) return { status: 'error', currentVersion };

  const availableVersion = result.updateInfo?.version || '';
  if (!availableVersion || availableVersion === currentVersion) {
    return { status: 'latest', currentVersion };
  }
  return { status: 'available', currentVersion, availableVersion };
});

ipcMain.handle('fetch-nature-background', async () => {
  try {
    return await fetchUnusedNatureImage();
  } catch (error) {
    log.warn(`Bing Wallpaper unavailable: ${error.message}`);
    return null;
  }
});

ipcMain.handle('generate-ai-questions', async (_event, rawContext = {}) => {
  const mistralApiKey = process.env.MISTRAL_API_KEY;
  if (!mistralApiKey) return { ok: false, error: 'MISTRAL_API_KEY n’est pas configurée.' };

  const pageUrl = String(rawContext.url || '').trim().slice(0, 500);
  const pageTitle = String(rawContext.title || '').trim().slice(0, 240);
  const pageDescription = String(rawContext.description || '').trim().slice(0, 1000);
  const pageText = String(rawContext.text || '').trim().slice(0, 6000);
  if (!/^https?:\/\//i.test(pageUrl) || (!pageTitle && !pageDescription && !pageText)) {
    return { ok: false, error: 'Le contenu de la page est insuffisant.' };
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        temperature: 0.35,
        max_tokens: 320,
        messages: [
          {
            role: 'system',
            content: 'Tu génères des suggestions de questions pour la sidebar IA Foxy. Analyse uniquement le contenu fourni de la page web. Retourne exactement un tableau JSON contenant 3 chaînes en français, sans Markdown, sans introduction et sans réponses. Chaque chaîne doit être une vraie question directement liée au titre, au sujet ou aux informations visibles de cette page. Ne produis jamais des questions génériques comme « Résume cette page » si tu peux poser une question précise. Adapte la demande au type de page : vidéo, musique, boutique, article, documentation, réseau social ou autre. N’invente aucun produit, prix, personne, fait ou contenu absent des éléments fournis. Les trois questions doivent être différentes, naturelles et utiles.'
          },
          {
            role: 'user',
            content: `URL : ${pageUrl}\nTitre : ${pageTitle || 'inconnu'}\nDescription : ${pageDescription || 'indisponible'}\nContenu visible :\n${pageText || 'indisponible'}`
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`Mistral a répondu ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const rawContent = Array.isArray(content) ? content.map((part) => part.text || '').join('') : String(content || '');
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Réponse de questions invalide.');

    const questions = [...new Set(JSON.parse(jsonMatch[0])
      .filter((question) => typeof question === 'string')
      .map((question) => question.replace(/^[-•\\s]+/, '').trim().slice(0, 180))
      .filter((question) => question.length > 12))]
      .slice(0, 3);
    if (questions.length !== 3) throw new Error('Mistral n’a pas généré trois questions.');
    return { ok: true, questions };
  } catch (error) {
    log.warn(`Foxy question generation unavailable: ${error.message}`);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('ask-ai', async (event, rawRequest) => {
  const request = typeof rawRequest === 'string' ? { prompt: rawRequest } : (rawRequest || {});
  const mode = request.mode === 'document' ? 'document' : 'web';
  const prompt = String(request.prompt || '').trim().slice(0, 4000);
  const documentText = String(request.documentText || '').trim().slice(0, 24000);
  const exaApiKey = process.env.EXA_API_KEY;
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  if (!prompt) return { ok: false, error: 'Écris une question pour Foxy.' };
  if (!mistralApiKey || (mode !== 'document' && !exaApiKey)) {
    return {
      ok: false,
      error: 'Les clés EXA_API_KEY et MISTRAL_API_KEY ne sont pas configurées dans BlueFox.'
    };
  }

  if (mode === 'document') {
    try {
      event.sender.send('ai-search-progress', { status: 'document' });
      const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
          temperature: 0.1,
          max_tokens: 2600,
          messages: [
            {
              role: 'system',
              content: 'Tu es Foxy, l’assistant PDF de BlueFox. Travaille exclusivement à partir du document fourni, sans recherche Internet, sans sources externes et sans inventer. Avant de répondre, vérifie la prémisse sans la déformer. Si l’utilisateur dit « je suis un poisson » ou se présente comme un animal, traite cela comme une hypothèse, une blague ou un jeu de rôle : ne le prends pas littéralement et ne dis pas qu’un poisson doit adopter une forme humaine. Réponds simplement « si tu parles d’un vrai poisson… » puis donne le fait utile. Pour une question de troll, reste bref et ne transforme pas la réponse en long exposé. Si le contexte est ambigu, demande une précision. Ne rejette pas une question originale simplement parce qu’elle est inhabituelle. Pour une demande de résumé, donne d’abord un résumé clair et fidèle, puis les idées importantes. Pour une demande de modification, propose une version réécrite prête à insérer et explique brièvement ce qui a changé. Réponds en français avec des paragraphes courts et du Markdown. Ne donne jamais de tutoriel, d’étapes ou de conseils pratiques pour pêcher, hameçonner, attirer, ferrer ou blesser un animal. Distingue toujours la possibilité physique du danger : un poisson peut happer ou mordre un appât, mais cela ne rend pas l’action sûre. Réponds seulement au fait général, recommande d’éviter la souffrance animale et n’affirme pas qu’une espèce ou un appât est « naturel » sans preuve. N’invente jamais de réglementation, d’espèces, de chiffres ou de citations ; n’ajoute une citation numérotée que si un extrait fourni la soutient précisément. Utilise `**...**` avec modération et `==...==` uniquement pour une information essentielle. Termine par exactement quatre questions de suivi courtes dans des balises <foxy_followup>question</foxy_followup>.'
            },
            {
              role: 'user',
              content: `Demande : ${prompt}\n\nTexte du document PDF :\n${documentText || 'Le texte du document est indisponible.'}`
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
      return { ok: true, answer, followUps, sources: [] };
    } catch (error) {
      event.sender.send('ai-search-progress', { status: 'error' });
      log.warn(`Foxy PDF unavailable: ${error.message}`);
      return { ok: false, error: `Foxy ne peut pas analyser ce PDF pour le moment : ${error.message}` };
    }
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
        temperature: 0.1,          max_tokens: 2600,
        messages: [
          {
            role: 'system',
            content: 'Tu es Foxy, l’assistant de BlueFox. Réponds en français, directement et honnêtement. Avant de répondre, vérifie la prémisse sans la déformer. Si l’utilisateur dit « je suis un poisson » ou se présente comme un animal, traite cela comme une hypothèse, une blague ou un jeu de rôle : ne le prends pas littéralement et ne dis pas qu’un poisson doit adopter une forme humaine. Réponds simplement « si tu parles d’un vrai poisson… » puis donne le fait utile. Pour une question de troll, reste bref et ne transforme pas la réponse en long exposé. Si le contexte est ambigu, demande une précision. Ne rejette pas une question originale simplement parce qu’elle est inhabituelle. Pour les faits récents ou vérifiables, utilise exclusivement les extraits web numérotés fournis : ne complète jamais avec une supposition et ne fabrique aucun fait, nom, chiffre, citation ou lien. Si les extraits ne permettent pas de répondre, dis clairement que l’information n’est pas vérifiable avec les éléments disponibles. N’écris jamais de section « Sources », ne dis pas « selon les sources » et ne mentionne pas Exa. Ajoute uniquement des citations numérotées au format [1], [2] après les affirmations réellement soutenues par l’extrait correspondant ; n’invente jamais de numéro. Structure la réponse avec Markdown : réponse directe d’abord, paragraphes courts, titres utiles et listes à puces quand plusieurs éléments sont nécessaires. Ne donne jamais de tutoriel, d’étapes ou de conseils pratiques pour pêcher, hameçonner, attirer, ferrer ou blesser un animal. Distingue toujours la possibilité physique du danger : un poisson peut happer ou mordre un appât, mais cela ne rend pas l’action sûre. Réponds seulement au fait général, recommande d’éviter la souffrance animale et n’affirme pas qu’une espèce ou un appât est « naturel » sans preuve. N’invente jamais de réglementation, d’espèces, de chiffres ou de citations ; n’ajoute une citation numérotée que si un extrait fourni la soutient précisément. Utilise `**...**` pour un mot ou une expression en gras quand c’est utile, mais pas pour toute une phrase ni pour tous les noms. Utilise `==...==` uniquement pour une ou deux informations vraiment essentielles à retenir ; ce sera affiché avec un petit surlignage bleu doux. Laisse le texte ordinaire sans surlignage. Sois suffisamment détaillé pour terminer correctement ta réponse et ne coupe pas une explication en cours ; évite seulement les répétitions. Termine par exactement quatre questions de suivi courtes et directement liées à la question, chacune dans une balise <foxy_followup>question</foxy_followup>, sans répondre à ces questions et sans ajouter d’information nouvelle.'
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
  // Native Windows controls use a true black surface in dark mode.
  titleBar: '#000000',
  background: '#15171b',
  symbol: '#ffffff'
};

const getWindowColors = (theme) => theme === 'dark' ? DARK_WINDOW_COLORS : LIGHT_WINDOW_COLORS;
const isValidWindowColor = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

// Dark mode keeps the native Windows controls on a true black surface;
// the selected tab accent is used only by the in-app tab strip.
const getWindowSurfaceColor = (theme, color) => {
  if (theme === 'dark') return '#000000';
  return color;
};

const getWindowSymbolColor = (color) => {
  if (!isValidWindowColor(color)) return '#ffffff';
  const channels = color.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16));
  const luminance = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
  return luminance > 155 ? '#000000' : '#ffffff';
};

function createWindow({ privateMode = false } = {}) {
  const initialWindowColors = nativeTheme.shouldUseDarkColors ? DARK_WINDOW_COLORS : LIGHT_WINDOW_COLORS;
  let currentTabColor = initialWindowColors.titleBar;
  const mainWindow = new BrowserWindow({
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
    show: false,
    webPreferences: {
        ...(privateMode ? { partition: `bluefox-private-${Date.now()}` } : {}),
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

  let currentTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  const guestContentsSet = new Set();
  const guestSelectionCssKeys = new Map();

  const applyGuestSelectionTheme = async (guestContents) => {
    if (!guestContents || guestContents.isDestroyed()) return;
    const previousKey = guestSelectionCssKeys.get(guestContents);
    if (previousKey) {
      try { await guestContents.removeInsertedCSS(previousKey); } catch { /* already removed */ }
    }

    const selectionColor = currentTheme === 'dark' ? '#8b5cf6' : '#0078d4';
    const scrollbarThumb = currentTheme === 'dark' ? 'rgba(255, 255, 255, .30)' : 'rgba(70, 78, 95, .28)';
    const scrollbarThumbHover = currentTheme === 'dark' ? 'rgba(255, 255, 255, .48)' : 'rgba(70, 78, 95, .46)';
    try {
      const key = await guestContents.insertCSS(`
        *::selection,
        ::selection {
          background: ${selectionColor} !important;
          color: #ffffff !important;
        }
        *::-moz-selection,
        ::-moz-selection {
          background: ${selectionColor} !important;
          color: #ffffff !important;
        }
        html {
          scrollbar-width: thin !important;
          scrollbar-color: ${scrollbarThumb} transparent !important;
        }
        *::-webkit-scrollbar {
          width: 7px !important;
          height: 7px !important;
        }
        *::-webkit-scrollbar-track {
          background: transparent !important;
        }
        *::-webkit-scrollbar-thumb {
          min-height: 28px !important;
          border: 2px solid transparent !important;
          border-radius: 999px !important;
          background: ${scrollbarThumb} !important;
          background-clip: padding-box !important;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: ${scrollbarThumbHover} !important;
          background-clip: padding-box !important;
        }
        *::-webkit-scrollbar-corner {
          background: transparent !important;
        }
      `);
      if (!guestContents.isDestroyed()) guestSelectionCssKeys.set(guestContents, key);
    } catch {
      // Protected pages may reject style insertion; leave their native selection intact.
    }
  };

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'dist-react/index.html')}`;
  const loadApplicationContent = async () => {
    if (mainWindow.isDestroyed()) return;
    if (!isDev) {
      try {
        await mainWindow.loadURL(startUrl);
        if (!mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      } catch {
        if (!mainWindow.isDestroyed()) mainWindow.show();
      }
      return;
    }

    // Keep the native window hidden while Vite starts. BlueFox appears once,
    // directly on its real interface, without an intermediate loading page.
    for (let attempt = 0; attempt < 100 && !mainWindow.isDestroyed(); attempt += 1) {
      try {
        await mainWindow.loadURL(startUrl);
        if (!mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!mainWindow.isDestroyed()) mainWindow.show();
  };

  const routeNewWindowToTab = (url) => {
    if (forwardDiscordCallback(url)) return { action: 'deny' };
    if (/^https?:\/\//i.test(url)) {
      mainWindow.webContents.send('open-url-in-new-tab', url);
    }
    return { action: 'deny' };
  };

  const showContextMenu = (targetContents, params) => {
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
        label: 'Demander à Foxy',
        visible: params.selectionText.trim().length > 0,
        click: () => {
          const selection = params.selectionText.trim().slice(0, 4000);
          if (selection && !mainWindow.isDestroyed()) mainWindow.webContents.send('ask-foxy-selection', selection);
        }
      },
      { type: 'separator' },
      { role: 'reload', label: 'Actualiser' },
      { role: 'forceReload', label: 'Forcer l\'actualisation' },
      { role: 'toggleDevTools', label: 'Inspecter' }
    ]);
    menu.popup(mainWindow);
  };

  // Keep target=_blank and window.open inside BlueFox as a new tab, never a popup.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => routeNewWindowToTab(url));

  const sendBrowserNavigation = (direction) => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send('browser-navigation', direction);
  };

  const handleAltHistoryShortcut = (event, input, targetContents = null) => {
    if (input.type !== 'keyDown' || !input.alt || input.control || input.meta || input.shift) return;

    const key = input.key || input.keyCode;
    const direction = key === 'ArrowLeft' || key === 'Left'
      ? 'back'
      : key === 'ArrowRight' || key === 'Right'
        ? 'forward'
        : null;
    if (!direction) return;

    event.preventDefault();
    if (targetContents && !targetContents.isDestroyed()) {
      if (direction === 'back' && targetContents.canGoBack()) targetContents.goBack();
      if (direction === 'forward' && targetContents.canGoForward()) targetContents.goForward();
      return;
    }

    sendBrowserNavigation(direction);
  };

  mainWindow.webContents.on('before-input-event', (event, input) => {
    handleAltHistoryShortcut(event, input);
  });

  // Windows exposes mouse buttons 4 and 5 as browser app commands. Forward
  // them to the active tab and cancel Electron's automatic window navigation.
  mainWindow.on('app-command', (event, command) => {
    if (command !== 'browser-backward' && command !== 'browser-forward') return;
    event.preventDefault();
    sendBrowserNavigation(command === 'browser-backward' ? 'back' : 'forward');
  });

  mainWindow.webContents.on('did-attach-webview', (_event, guestContents) => {
    guestContentsSet.add(guestContents);
    guestContents.setWindowOpenHandler(({ url }) => routeNewWindowToTab(url));
    guestContents.on('dom-ready', () => { void applyGuestSelectionTheme(guestContents); });
    guestContents.on('destroyed', () => {
      guestContentsSet.delete(guestContents);
      guestSelectionCssKeys.delete(guestContents);
    });
    guestContents.on('context-menu', (_event, params) => showContextMenu(guestContents, params));
    guestContents.on('before-input-event', (event, input) => {
      handleAltHistoryShortcut(event, input, guestContents);
    });
  });

  void loadApplicationContent();

  // Window Controls
  ipcMain.on('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on('window-maximize', (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) return;
    if (targetWindow.isMaximized()) {
      targetWindow.unmaximize();
    } else {
      targetWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => app.quit());
  ipcMain.on('window-print', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.webContents.print({
      silent: false,
      printBackground: true
    });
  });
  ipcMain.on('window-tab-color', (event, color) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow || !isValidWindowColor(color) || typeof targetWindow.setTitleBarOverlay !== 'function') return;
    currentTabColor = color;
    const titleBarColor = getWindowSurfaceColor(currentTheme, color);
    targetWindow.setTitleBarOverlay({
      color: titleBarColor,
      symbolColor: getWindowSymbolColor(titleBarColor),
      height: WINDOW_TITLE_BAR_HEIGHT
    });
  });
  ipcMain.on('window-theme', (event, theme) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) return;
    const windowColors = getWindowColors(theme);
    if (typeof targetWindow.setTitleBarOverlay === 'function') {
      // Electron owns these controls. Matching the TabBar surface keeps the
      // native area continuous; Windows supplies the hover highlight itself.
      currentTabColor = currentTabColor || windowColors.titleBar;
      const titleBarColor = getWindowSurfaceColor(theme, currentTabColor);
      targetWindow.setTitleBarOverlay({
        color: titleBarColor,
        symbolColor: getWindowSymbolColor(titleBarColor),
        height: WINDOW_TITLE_BAR_HEIGHT
      });
    }
    targetWindow.setBackgroundColor(windowColors.background);
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    guestContentsSet.forEach((guestContents) => { void applyGuestSelectionTheme(guestContents); });
  });
  
  // Close immediately with the native Windows close control; no confirmation popup.
  mainWindow.on('close', () => {
    mainWindow.removeAllListeners('close');
  });

  ipcMain.on('app-force-close', () => app.quit());

  // Context Menu Implementation
  mainWindow.webContents.on('context-menu', (_event, params) => {
    showContextMenu(mainWindow.webContents, params);
  });
}

ipcMain.on('window-new', () => {
  createWindow();
});
ipcMain.on('window-new-private', () => {
  createWindow({ privateMode: true });
});

// HTTP/HTTPS protocol registration. The packaged installer registers the .pdf file association.
if (!isDev) {
    app.setAsDefaultProtocolClient('http');
    app.setAsDefaultProtocolClient('https');
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;

  log.info(`[APP] BlueFox ${app.getVersion()} started; packaged=${app.isPackaged}`);
  discordRichPresence.setActivity(BLUEFOX_RICH_PRESENCE);
  if (app.isPackaged) {
    try {
      logUpdate(`Log file: ${log.transports.file.getFile().path}`);
    } catch {
      logUpdate('Log file path unavailable');
    }
  }

  // Allow microphone access only to BlueFox's own renderer for voice search.
  // External webviews must not receive microphone permission automatically.
  const isBlueFoxOrigin = (origin, webContents) => {
    const candidate = String(origin || webContents?.getURL?.() || '');
    return /^file:\/\//i.test(candidate)
      || /^http:\/\/localhost(?::\d+)?/i.test(candidate)
      || /^http:\/\/127\.0\.0\.1(?::\d+)?/i.test(candidate);
  };
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    callback(permission === 'media' && isBlueFoxOrigin(details?.requestingOrigin, webContents));
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => (
    permission === 'media' && isBlueFoxOrigin(requestingOrigin, webContents)
  ));

  // Fix User-Agent globally for all sessions to prevent ERR_ABORTED on some sites
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
  
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    if (/^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\//i.test(details.url)) {
      // YouTube Error 153 is returned when Electron's file:// production page has no referrer.
      details.requestHeaders.Referer = 'https://www.youtube.com/';
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Check if app was opened with a URL or a PDF file association.
  const startupUrl = initialJumpListArgs.find(arg => /^https?:\/\//i.test(arg));
  const startupPdfPath = findPdfFilePath(initialJumpListArgs);
  
  const initialAction = parseJumpListAction(initialJumpListArgs);
  createWindow({ privateMode: initialAction?.action === 'private-window' });
  updateJumpList();
  
  // Handle startup URL if present
  if (startupUrl) {
    log.info(`[PROTOCOL] App started with URL: ${startupUrl}`);
    setTimeout(() => {
      sendJumpListAction({ type: 'open-url', url: startupUrl });
    }, 1000);
  } else if (startupPdfPath) {
    log.info(`[PDF] App started with associated file: ${startupPdfPath}`);
    setTimeout(() => {
      sendPdfFile(startupPdfPath);
    }, 1000);
  } else if (initialAction?.action !== 'new-window' && initialAction?.action !== 'private-window') {
    handleJumpListAction(initialJumpListArgs);
  }

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

app.on('before-quit', () => {
  discordRichPresence.disconnect();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
