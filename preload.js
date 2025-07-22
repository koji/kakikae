const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFiles: () => ipcRenderer.invoke("select-files"),
  convertFiles: (files) => ipcRenderer.invoke("convert-files", files),
  validateFiles: (filePaths) => ipcRenderer.invoke("validate-files", filePaths),

  // Listen for conversion progress
  onConversionProgress: (callback) => {
    ipcRenderer.on("conversion-progress", (event, data) => callback(data));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
