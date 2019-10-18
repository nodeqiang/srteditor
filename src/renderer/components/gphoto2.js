const gphoto2 = require('gphoto2')

class AsyncGPhoto {
  constructor () {
    this.GPhoto = new gphoto2.GPhoto2()
    this.GPhoto.setLogLevel(1)
    this.GPhoto.on('log', function (level, domain, message) {
      console.log(domain, message)
    })
  }

  async list () {
    return new Promise(resolve => {
      this.GPhoto.list((list) => { resolve(list) })
    })
  }
  async setConfig (camera, key, value) {
    return new Promise((resolve, reject) => {
      camera.setConfigValue(key, value, (err) => { if (err) reject(err); else resolve() })
    })
  }
  async takePicture (camera, opts) {
    return new Promise((resolve, reject) => {
      camera.takePicture(opts, (err, path) => { if (err) reject(err); else resolve(path) })
    })
  }
  async sleep (ms) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }
}

export default AsyncGPhoto
