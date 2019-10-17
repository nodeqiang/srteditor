<template>
  <div id='app'
       style='width:100vwheight:100vh'
       class='d-flex flex-column align-items-center justify-content-center'>
       <div :style="{left, top}" style="z-index:100;width:10px;height:10px;background-color:green;position:absolute;" />
       <b-img :id="`img_${idx}`" @drag="imgdraging($event, slide, idx)" @dragstart="imgdragstart($event, slide, idx)" @dragend="imgdragstop($event, slide)" v-for="(slide, idx) in sortedslider" :key="idx" :src="slide.img" :style="{width: `${slide.width}px`, height: `${slide.height}px`, left: `${slide.left}px`, bottom: `${slide.bottom}px`, zIndex: slide.zIndex || 0}" style="position:absolute;" />
    <div>
      <b-button @click='startrecord' class='m-5'>开始录制</b-button>
      <b-button @click='stoprecord' class='m-5'>停止录制</b-button>
      <b-button @click='startcapture' class='m-5'>开始捕获</b-button>
      <b-button @click='stopcapture' class='m-5'>停止捕获</b-button>
      <b-button @click='savecapture' class='m-5'>导出视频</b-button>
    </div>

    <span>{{position}}</span>
    <canvas width="1920" height="1080" id='preview' style='position:absolute;left:10px;bottom:10px;width:1920px;height:1080px;border:1px solid black' />
    <canvas width="1920" height="1080" @mouseup="stopDraw" @mousemove="drawLine" @mousedown="startDraw" id='cover' :style="{display: coverdisplay}" style='position:absolute;left:10px;bottom:10px;width:1920px;height:1080px;border:1px solid black;z-index:10000;' />
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')
const { ImageLayer, CanvasLayer, Capture } = require('./capture')

export default {
  data: () => ({
    position: '',
    left: 0,
    top: 0,
    activeSlide: null,
    maxZIndex: 0,
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
    this.capture = new Capture({width: 1920, height: 1080})
    this.slides.forEach((slider, idx) => {
      const id = `img_${idx}`
      const elem = document.getElementById(id)
      const target = document.getElementById('preview')
      const left = elem.offsetLeft - target.offsetLeft
      const top = elem.offsetTop - target.offsetTop
      slider.layer = this.capture.addLayer(new ImageLayer(0, slider.img, left, top, slider.width, slider.height))
    })
    this.canvasLayer = this.capture.addLayer(new CanvasLayer(10000, 0, 0, 1920, 1080))
    this.canvas = document.getElementById('cover')
    this.context = this.canvas.getContext('2d')
    this.context.lineWidth = 5
    this.context.strokeStyle = '#ff0000'
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c') {
        console.log('clear')
        this.coverdisplay = 'none'
      } else if (e.key === 'd') {
        this.coverdisplay = 'inline'
        console.log('draw')
      }
    })
  },
  methods: {
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
    },
    stopcapture () {
      this.capture.stop()
    },
    savecapture () {
      this.capture.save((frame, ext, buffer) => {
        console.log(frame, ext)
        const fs = require('fs')
        const path = `/Users/wesleywang/Desktop/dump/${frame}.${ext}`
        fs.writeFileSync(path, buffer)
        return path
      })
    },
    stoprecord () {
      ipcRenderer.sendSync('stoprecord')
      this.previewing = false
    },
    startrecord () {
      const canvas = document.getElementById('preview')
      const context = canvas.getContext('2d')
      const image = new Image()
      this.previewing = true
      let imgpath = ipcRenderer.sendSync('startrecord')
      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        if (this.previewing) image.src = `file://${ipcRenderer.sendSync('preview')}`
      }
      image.src = `file://${imgpath}`
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
