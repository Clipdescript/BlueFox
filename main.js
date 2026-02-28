const { app, BrowserWindow, ipcMain, session, Menu, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging for auto-updater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.verifyUpdateCodeSignature = false; // Important pour les applis non signées

// Check for updates and notify
function checkForUpdates() {
  autoUpdater.checkForUpdates();
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de BlueFox Browser a été téléchargée. Voulez-vous redémarrer l\'application pour l\'installer maintenant ?',
    buttons: ['Redémarrer', 'Plus tard']
  }).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

const isDev = !app.isPackaged;

// Performance Optimization: Enable GPU and other speed hacks
app.commandLine.appendSwitch('enable-gpu-rasterization'); // Force GPU for rendering
app.commandLine.appendSwitch('enable-zero-copy'); // Faster memory copying
app.commandLine.appendSwitch('ignore-gpu-blacklist'); // Force GPU on older hardware
// app.commandLine.appendSwitch('disable-http-cache'); // Use Chromium's disk cache for speed
app.commandLine.appendSwitch('disk-cache-size', '1073741824'); // 1GB Cache
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,CanvasOopRasterization'); // Video/Canvas acceleration

// app.disableHardwareAcceleration(); // DO NOT DISABLE THIS for speed!

let splashWindow;

function createSplashWindow() {
  console.log('Creating splash window...');
  splashWindow = new BrowserWindow({
    width: 300,
    height: 350,
    transparent: false,
    backgroundColor: '#f5f7fa',
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: true, // Force show immediately
    skipTaskbar: true,
    icon: path.join(__dirname, 'public/Logo.ico'),
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
    }
  });

  const splashPath = `file://${path.join(__dirname, 'splash.html')}`;
  console.log('Loading splash from:', splashPath);
  splashWindow.loadURL(splashPath);
  
  // Force focus
  splashWindow.focus();

  // Create main window immediately but keep it hidden
  createWindow();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: '#dee1e6',
        symbolColor: '#000000',
        height: 40
    },
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'public/Logo.ico'),
    show: false,
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

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    // Artificial delay to show splash for at least 2 seconds if load is too fast
    setTimeout(() => {
        if(splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }
        mainWindow.show();
        mainWindow.focus();
    }, 2000);
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
  
  // Intercept close event
  let forceQuit = false;
  mainWindow.on('close', (e) => {
    if (!forceQuit) {
      e.preventDefault();
      // Ensure the window is focused and visible so the popup can be seen
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('app-close-request');
    }
  });

  ipcMain.on('window-close', () => {
      mainWindow.webContents.send('app-close-request');
  });

  ipcMain.on('app-force-close', () => {
      forceQuit = true;
      app.quit();
  });

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
  // Fix User-Agent globally for all sessions to prevent ERR_ABORTED on some sites
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  createSplashWindow();

  // Check for updates (only in production)
  if (!isDev) {
    setTimeout(() => {
        checkForUpdates();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
