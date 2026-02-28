const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onCloseRequest: (callback) => {
    // Wrap callback to ensure it's called safely
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('app-close-request', subscription);
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('app-close-request', subscription);
  },
  forceClose: () => ipcRenderer.send('app-force-close'),
});
