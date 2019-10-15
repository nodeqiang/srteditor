'use strict'

import { app, BrowserWindow, Menu } from 'electron'
const { ipcMain } = require('electron')
const fs = require('fs')

const gphoto2 = require('gphoto2')
const GPhoto = new gphoto2.GPhoto2()
GPhoto.setLogLevel(1)
GPhoto.on('log', function (level, domain, message) {
  console.log(domain, message)
})

let camera, lastfile
ipcMain.on('previewpath', (event, arg) => {
  console.log('receive preview request ...')
  if (lastfile) {
    setTimeout(() => {
      fs.unlink(lastfile)
    }, 1000)
  }
  if (!camera) {
    GPhoto.list(function (list) {
      if (list.length === 0) {
        console.log('no camera found!')
        return
      }
      camera = list[0]
      console.log('Found', camera.model)
      camera.takePicture({
        preview: true,
        targetPath: '/tmp/foo.XXXXXX'
      }, function (er, tmpname) {
        lastfile = tmpname
        event.returnValue = tmpname
        console.log(tmpname)
      })
    })
  } else {
    camera.takePicture({
      preview: true,
      targetPath: '/tmp/foo.XXXXXX'
    }, function (er, tmpname) {
      event.returnValue = tmpname
      console.log(tmpname)
    })
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
