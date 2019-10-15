<template>
  <div id="app"
       style="width:100vwheight:100vh"
       class="d-flex flex-column align-items-center justify-content-center">
    <b-button @click="startPreview" class="m-5">开始预览</b-button>
    <canvas id="preview" style="width:1920px;height:1080px;border:1px solid black" />
  </div>
</template>

<script>
/* global Leap */
const { ipcRenderer } = require('electron')
Leap.loop({
  hand: function (hand) {
    console.log(hand.screenPosition())
  }
}).use('screenPosition')
export default {
  methods: {
    startPreview () {
      const canvas = document.getElementById('preview')
      const context = canvas.getContext('2d')
      const image = new Image()
      let imgpath = ipcRenderer.sendSync('previewpath')
      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        image.src = `file://${ipcRenderer.sendSync('previewpath')}`
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
