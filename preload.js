const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded successfully');

contextBridge.exposeInMainWorld('electronAPI', {
  updateHistory: (data) => ipcRenderer.invoke('update-history', data),
  saveImage: async (id, file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const fileExtension = file.name.split('.').pop();
        const fileName = `${id}.${fileExtension}`;
        ipcRenderer
          .invoke('save-image', { fileName, content: Buffer.from(arrayBuffer) })
          .then(resolve)
          .catch(reject);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  },
  deleteImage: (imgPath) => ipcRenderer.invoke('delete-image', { imgPath }),
  updateQuestion: async ({ title, type, isCorrect }) => {
    return ipcRenderer.invoke('update-question', { title, type, isCorrect });
  },
  updateQuestions: (questions) => ipcRenderer.invoke('update-questions-file', questions),
  exportQuestions: (questions) => ipcRenderer.invoke("export-questions", questions),
  extractZip: async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const arrayBuffer = reader.result;
        ipcRenderer
          .invoke("extract-zip", {
            fileName: file.name,
            content: Buffer.from(arrayBuffer),
          })
          .then(resolve)
          .catch(reject);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  },
  readQuestionsCSV: () => ipcRenderer.invoke('read-questions-csv'),
  readHistoryCSV: () => ipcRenderer.invoke('read-history-csv'),
  readAppPath:() => ipcRenderer.invoke('read-app-path'),
}
)