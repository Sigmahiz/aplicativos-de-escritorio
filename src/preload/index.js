import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('ipcRenderer', {
      send: (channel, data) => {
        // Lista blanca de canales permitidos
        const validChannels = ['custom-alert']
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data)
        }
      },
      on: (channel, func) => {
        const validChannels = [] // No exponemos canales de recepción por ahora
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args))
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
