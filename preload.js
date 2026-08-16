const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  newWindow: () => ipcRenderer.send('window-new'),
  print: () => ipcRenderer.send('window-print'),
  setTheme: (theme) => ipcRenderer.send('window-theme', theme),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  updateHomeShortcuts: (shortcuts) => ipcRenderer.send('update-home-shortcuts', shortcuts),
  onJumpListAction: (callback) => {
    const subscription = (_event, action) => callback(action);
    ipcRenderer.on('jump-list-action', subscription);
    return () => ipcRenderer.removeListener('jump-list-action', subscription);
  },
  onCloseRequest: (callback) => {
    // Wrap callback to ensure it's called safely
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('app-close-request', subscription);
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('app-close-request', subscription);
  },
  forceClose: () => ipcRenderer.send('app-force-close'),
  getNatureBackground: () => ipcRenderer.invoke('fetch-nature-background'),
  askAi: (prompt) => ipcRenderer.invoke('ask-ai', prompt),
  onAiSearchProgress: (callback) => {
    const subscription = (_event, progress) => callback(progress);
    ipcRenderer.on('ai-search-progress', subscription);
    return () => ipcRenderer.removeListener('ai-search-progress', subscription);
  },
  onOpenUrlInNewTab: (callback) => {
    const subscription = (_event, url) => callback(url);
    ipcRenderer.on('open-url-in-new-tab', subscription);
    return () => ipcRenderer.removeListener('open-url-in-new-tab', subscription);
  },
  onBrowserNavigation: (callback) => {
    const subscription = (_event, direction) => callback(direction);
    ipcRenderer.on('browser-navigation', subscription);
    return () => ipcRenderer.removeListener('browser-navigation', subscription);
  },
});
