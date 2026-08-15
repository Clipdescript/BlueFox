const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  setTheme: (theme) => ipcRenderer.send('window-theme', theme),
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
