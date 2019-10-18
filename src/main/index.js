'use strict'

import { app, BrowserWindow, Menu } from 'electron'
const { ipcMain } = require('electron')

const GPhoto2 = require('./gphoto2').default

let GP2 = new GPhoto2()
let camera

ipcMain.on('stoprecord', async (event, arg) => {
  if (camera) {
    GP2.setConfig(camera, 'movie', 0)
    console.log('done!')
  } else {
    console.log('No Camera!')
  }
})

ipcMain.on('startrecord', async (event, arg) => {
  if (!camera) {
    const cameras = await GP2.list()
    if (cameras.length > 0) {
      camera = cameras[0]
    }  
  }
  if (camera) {
    await GP2.setConfig(camera, 'movie', 1)
    const path = await GP2.takePicture(camera, {
      preview: true,
      targetPath: '/tmp/foo.XXXXXX'
    })
    event.returnValue = path
  } else {
    console.log('No Camera!')
    event.returnValue = null
  }
})

ipcMain.on('preview', async (event, arg) => {
  if (camera) {
    const path = await GP2.takePicture(camera, {
      preview: true,
      targetPath: '/tmp/foo.XXXXXX'
    })
    event.returnValue = path
  } else {
    console.log('No Camera!')
  }
})

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  if (process.env.NODE_ENV !== 'development') {
    if (process.platform === 'darwin') {
      const template = [
        {
          label: 'Application',
          submenu: [
            { label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit() } }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
          ]
        }
      ]
      Menu.setApplicationMenu(Menu.buildFromTemplate(template))
    } else {
      Menu.setApplicationMenu(null)
    }
  }

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 2000,
    useContentSize: true,
    width: 2000,
    webPreferences: {
      webSecurity: false
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
