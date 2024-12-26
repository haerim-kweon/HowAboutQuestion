const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  updateQuestion: (data) => ipcRenderer.invoke('update-question', data),
  updateHistory: (data) => ipcRenderer.invoke('update-history', data),
});