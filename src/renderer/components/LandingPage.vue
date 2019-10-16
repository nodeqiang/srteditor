<template>
  <div id='app'
       style='width:100vwheight:100vh'
       class='d-flex flex-column align-items-center justify-content-center'>
       <div :style="{left, top}" style="z-index:100;width:10px;height:10px;background-color:green;position:absolute;" />
       <b-img :class="{active: activeSlide === slide}" v-for="(slide, idx) in sortedslider" :key="idx" :src="slide.img" :style="{width: `${slide.width * 2 / 3}px`, height: `${slide.height * 2 / 3}px`}" style="position:absolute;left:10px;bottom:10px;" />
    <b-button @click='startrecord' class='m-5'>开始录制</b-button>
    <b-button @click='stoprecord' class='m-5'>停止录制</b-button>
    <b-button style="" class='m-5'>拖动</b-button>

    <span>{{position}}</span>
    <canvas id='preview' style='position:absolute;right:10px;bottom:10px;width:1280px;height:720px;border:1px solid black' />
  </div>
</template>

<script>
/* global Leap */
const { ipcRenderer } = require('electron')
let updatefun
Leap.loop({
  enableGestures: true,
  hand: function (hand) {
    // console.log(hand.screenPosition())
    updatefun && updatefun(hand.screenPosition())
  }
}, (frame) => {
  if (frame.gestures.length > 0) {
    // console.log(frame.gestures)
  }
}).use('screenPosition')
export default {
  data: () => ({
    position: '',
    left: 0,
    top: 0,
    activeSlide: null,
    slides: [
      {img: '/static/images/img1.png', width: 1145, height: 809},
      {img: '/static/images/img2.png', width: 1140, height: 601},
      {img: '/static/images/img3.png', width: 1136, height: 515},
      {img: '/static/images/img4.png', width: 1144, height: 692},
      {img: '/static/images/img5.png', width: 1131, height: 759},
      {img: '/static/images/img6.png', width: 1136, height: 771},
      {img: '/static/images/img7.png', width: 1133, height: 1005},
      {img: '/static/images/img8.png', width: 1132, height: 980},
      {img: '/static/images/img9.png', width: 1127, height: 979},
      {img: '/static/images/img10.png', width: 1135, height: 988},
      {img: '/static/images/img11.png', width: 1133, height: 1006},
      {img: '/static/images/img12.png', width: 1143, height: 990},
      {img: '/static/images/img13.png', width: 1135, height: 976},
      {img: '/static/images/img14.png', width: 1133, height: 1010}
    ]
  }),
  computed: {
    sortedslider () {
      return this.slides.reverse()
    }
  },
  created () {
    updatefun = (pos) => {
      this.position = `${Math.round(pos[0])},${Math.round(pos[1])},${Math.round(pos[2])}`
      this.left = `${pos[0]}px`
      this.top = `${window.innerHeight / 2 + pos[1]}px`
    }
  },
  methods: {
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
      console.log(imgpath)
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
</style>
