import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../../resources/icon.png')
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Interceptar alertas en la ventana principal
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents
      .executeJavaScript(
        `
      // Guardar referencia al alert original
      window._originalAlert = window.alert;
      
      // Sobrescribir alert
      window.alert = function(message) {
        // Enviar al proceso principal de Electron
        window.ipcRenderer.send('custom-alert', message);
      };
    `
      )
      .catch(console.error)
  })

  // Manejo de ventanas hijas (modales)
  mainWindow.webContents.setWindowOpenHandler((details) => {
    const childWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true
      },
      icon: path.join(__dirname, '../../resources/icon.png')
    })

    // Interceptar alertas en ventanas hijas
    childWindow.webContents.on('did-finish-load', () => {
      childWindow.webContents
        .executeJavaScript(
          `
        window._originalAlert = window.alert;
        window.alert = function(message) {
          window.ipcRenderer.send('custom-alert', message);
        };
      `
        )
        .catch(console.error)
    })

    childWindow.loadURL(details.url)
    childWindow.once('ready-to-show', () => {
      childWindow.show()
    })

    return { action: 'deny' }
  })

  mainWindow.loadURL(import.meta.env.VITE_URL)
}

// Manejador para alertas personalizadas
ipcMain.on('custom-alert', (event, message) => {
  dialog.showMessageBoxSync({
    type: 'info',
    message: message,
    buttons: ['OK'],
    title: import.meta.env.VITE_TITLE
  })
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ipcMain.on('ping', () => console.log('pong'))
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
