<template>
  <div id='app'
       style='width:100vwheight:100vh'
       class='d-flex flex-column align-items-center justify-content-center'>
       <!-- <div :style="{left, top}" style="z-index:100;width:10px;height:10px;background-color:green;position:absolute;" /> -->
       <b-img :id="`img_${idx}`" @drag="imgdraging($event, slide, idx)" @dragstart="imgdragstart($event, slide, idx)" @dragend="imgdragstop($event, slide)" v-for="(slide, idx) in sortedslider" :key="idx" :src="slide.img" :style="{width: `${slide.width}px`, height: `${slide.height}px`, left: `${slide.left}px`, bottom: `${slide.bottom}px`, zIndex: slide.zIndex || 0}" style="position:absolute;" />
    <div>
      <span style="position:absolute;left:10px;top:10px;font-size:50px;color:red;"> {{ recordLen }} </span>
      <b-button v-if="!capture.capturing" @click='startrecord' class='m-5'>开始录制</b-button>
      <b-button v-if="capture.capturing" @click='stoprecord' class='m-5'>停止录制</b-button>
      <b-button @click='savecapture' class='m-5'>导出视频</b-button>
    </div>

    <div>
      <b-button @click='clearZone' class='m-5'>清理视频区</b-button>
    </div>

    <span>{{position}}</span>
    <canvas width="1920" height="1080" id='preview' style='position:absolute;left:10px;bottom:10px;width:1920px;height:1080px;border:1px solid black' />
    <canvas width="1920" height="1080" @mouseup="stopDraw" @mousemove="drawLine" @mousedown="startDraw" id='cover' :style="{display: coverdisplay}" style='position:absolute;left:10px;bottom:10px;width:1920px;height:1080px;border:1px solid black;z-index:10000;' />
  </div>
</template>

<script>
const { dialog } = require('electron').remote
const moment = require('moment')
const fs = require('fs')
const GPhoto2 = require('./gphoto2').default
let GP2 = new GPhoto2()
let camera

const fileUsed = []
function stoprecord () {
  if (camera) {
    GP2.setConfig(camera, 'movie', 0)
    console.log('done!')
  } else {
    console.log('No Camera!')
  }
}

async function startrecord () {
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
      targetPath: '/Volumes/Ramdisk/foo.XXXXXX'
    })
    fileUsed.push(path)
    return path
  } else {
    console.log('No Camera!')
  }
}

async function preview () {
  if (camera) {
    const path = await GP2.takePicture(camera, {
      preview: true,
      targetPath: '/Volumes/Ramdisk/foo.XXXXXX'
    })
    fileUsed.push(path)
    if (fileUsed.length >= 2) {
      const nousedfile = fileUsed.shift()
      fs.unlink(nousedfile, () => {})
    }
    return path
  } else {
    console.log('No Camera!')
  }
}

const { ImageLayer, CanvasLayer, Capture } = require('./capture')
const ConnectToGphoto2 = true
export default {
  data: () => ({
    position: '',
    left: 0,
    top: 0,
    activeSlide: null,
    maxZIndex: 0,
    recordLen: '00:00:00',
    capture: new Capture({ width: 1920, height: 1080 }),
    coverdisplay: 'inline',
    slides: [
      {img: '/static/images/img1.png', width: 1145, height: 809, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img3.png', width: 1136, height: 515, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img2.png', width: 1140, height: 601, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img4.png', width: 1144, height: 692, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img5.png', width: 1131, height: 759, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img6.png', width: 1136, height: 771, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img7.png', width: 1133, height: 1005, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img8.png', width: 1132, height: 980, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img9.png', width: 1127, height: 979, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img10.png', width: 1135, height: 988, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img11.png', width: 1133, height: 1006, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img12.png', width: 1143, height: 990, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img13.png', width: 1135, height: 976, left: 1940, bottom: 10, zIndex: 0},
      {img: '/static/images/img14.png', width: 1133, height: 1010, left: 1940, bottom: 10, zIndex: 0}
    ]
  }),
  computed: {
    sortedslider () {
      return this.slides.reverse()
    }
  },
  mounted () {
    this.slides.forEach((slider, idx) => {
      const id = `img_${idx}`
      const elem = document.getElementById(id)
      const target = document.getElementById('preview')
      const left = elem.offsetLeft - target.offsetLeft
      const top = elem.offsetTop - target.offsetTop
      slider.layer = this.capture.addLayer(new ImageLayer(`image_${idx}`, 0, slider.img, left, top, slider.width, slider.height))
    })
    this.canvasLayer = this.capture.addLayer(new CanvasLayer('canvas', 10000, 0, 0, 1920, 1080))
    this.canvas = document.getElementById('cover')
    this.context = this.canvas.getContext('2d')
    this.context.lineWidth = 5
    this.context.strokeStyle = '#ff0000'
  },
  methods: {
    updateRecordLen () {
      const utc = moment.utc
      if (!this.capture.startTick) this.recordLen = '00:00:00'
      else if (!this.capture.capturing && this.capture.stopTick) this.recordLen = utc(this.capture.stopTick - this.capture.startTick).format('HH:mm:ss')
      else this.recordLen = utc(new Date().getTime() - this.capture.startTick).format('HH:mm:ss')
    },
    clearZone () {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.slides.forEach((slider, idx) => {
        if ((slider.left < 1920 && slider.bottom < 1080) || (slider.bottom > 1090)) {
          slider.left = 100 * idx
          slider.bottom = 1100
          slider.zIndex = -1
          slider.layer.setPos(slider.left - 10, -slider.height - 10)
        }
      })
      this.canvasLayer.clear()
    },
    startDraw (e) {
      this.lineStart = [e.offsetX, e.offsetY]
      this.context.beginPath()
      this.context.moveTo(e.offsetX, e.offsetY)
      this.canvasLayer.move([e.offsetX, e.offsetY])
    },
    stopDraw (e) {
      this.lineStart = null
    },
    drawLine (e) {
      if (this.lineStart) {
        this.context.lineTo(e.offsetX, e.offsetY)
        this.context.stroke()
        this.canvasLayer.line([e.offsetX, e.offsetY])
      }
    },
    imgdragstart (e, slider, idx) {
      e.dataTransfer.setDragImage(e.target, e.offsetX, e.offsetY)
      this.startPos = [e.offsetX, e.offsetY]

      const id = `img_${idx}`
      const elem = document.getElementById(id)
      const target = document.getElementById('preview')
      const left = elem.offsetLeft - target.offsetLeft
      const top = elem.offsetTop - target.offsetTop
      this.startOffset = [left, top]
    },
    imgdraging (e, slider, idx) {
      if (e.screenX === 0) return
      const left = this.startOffset[0] + e.offsetX - this.startPos[0]
      const top = this.startOffset[1] + e.offsetY - this.startPos[1]
      slider.layer.setPos(left, top)
      slider.layer.setZIndex(this.maxZIndex + 1)
    },
    imgdragstop (e, slider) {
      slider.left += e.offsetX - this.startPos[0]
      slider.bottom -= e.offsetY - this.startPos[1]
      slider.zIndex = ++this.maxZIndex
    },
    startcapture () {
      this.capture.start()
      this.timerid = setInterval(() => {
        this.updateRecordLen()
      }, 1000)
    },
    stopcapture () {
      clearInterval(this.timerid)
      this.capture.stop()
    },
    async savecapture () {
      const cpath = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      })
      console.log(cpath)
      if (!cpath || cpath.length === 0) return
      const basepath = cpath[0]
      console.log('start save ...', basepath)
      let lastsecs
      this.capture.save(async (frame, ext, buffer) => {
        if (Number.isInteger(frame)) {
          const secs = Math.floor(frame / 30)
          if (secs !== lastsecs) {
            console.log(secs)
            lastsecs = secs
            await this.capture.sleep(10) // so we got console output
          }
        } else {
          console.log(frame, ext)
        }
        const fs = require('fs')
        const path = `${basepath}/${frame}.${ext}`
        fs.writeFileSync(path, buffer)
        return path
      })
    },
    stoprecord () {
      this.stopcapture()
      this.previewing = false
      if (ConnectToGphoto2) {
        stoprecord()
      }
    },
    async startrecord () {
      if (this.capture.startTick && !this.capture.exportTick) {
        dialog.showMessageBox({
          title: '提示',
          message: '请先保存录制的内容'
        })
        return
      }
      const canvas = document.getElementById('preview')
      const context = canvas.getContext('2d')
      const image = new Image()
      this.previewing = true
      let startat = new Date().getTime()
      let lastsecs
      let reloadcheck
      if (ConnectToGphoto2) {
        let imgpath = await startrecord()
        image.onload = async () => {
          if (reloadcheck) {
            clearTimeout(reloadcheck)
            reloadcheck = null
          }
          const delta = new Date().getTime() - startat
          const secs = moment.utc(delta).format('HH:mm:ss')
          if (secs !== lastsecs) {
            console.log(secs, 'image onload ...')
          }
          if (this.previewing) {
            try {
              context.drawImage(image, 0, 0, canvas.width, canvas.height)
            } catch (ex) {
            }
            const tmppath = await preview()
            if (secs !== lastsecs) {
              console.log(secs, 'change src to', tmppath)
              lastsecs = secs
            }
            reloadcheck = setTimeout(() => {
              reloadcheck = null
              image.onload()
            }, 1000)
            image.src = `file://${tmppath}`
          }
        }
        image.src = `file://${imgpath}`
      }
      this.startcapture()
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

.active {
  border: 3px solid red;
}

</style>
