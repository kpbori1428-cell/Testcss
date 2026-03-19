const { app, BrowserWindow } = require('electron');
const path = require('path');

const express = require('express');
const server = express();
const PORT = 3000;

server.use(express.static(__dirname));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true // Habilitar <webview> para el navegador
    }
  });

  // Load the index.html from the local express server to avoid CORS/file:// issues with fetch()
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    mainWindow.loadURL(`http://localhost:${PORT}/index.html`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});