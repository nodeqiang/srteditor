<template>
  <div class="page">
    <div class="topbar">
      <b-link @click="choosesrt">{{ srtfile || '未指定srt文件' }}</b-link>
      <b-link @click="choosemp3">{{ mp3file || '未指定mp3文件' }}</b-link>
      <audio id="player" v-if="mp3file" :src="`file://${mp3file}`" />
    </div>
    <div class="controlbar">
      <b-button-toolbar key-nav aria-label="Toolbar with button groups">
        <b-button v-if="!srtfile" @click="chooseraw">从文本文件创建</b-button>
        <b-button v-if="rawfile" @click="makepoint">打点</b-button>
        <b-button-group v-if="mp3file" class="mx-1">
          <b-button @click="speednormal=true" :pressed="speednormal">正常速度</b-button>
          <b-button @click="speednormal=false" :pressed="!speednormal">慢速播放</b-button>
        </b-button-group>
      </b-button-toolbar>
    </div>
    <div class="srtline" v-for="(line, idx) of lines" :key="line.sequence">
      <b-link class="sequence">{{line.sequence}}</b-link>
      <b-link @click="play(line)" class="time">{{line.time}}</b-link>
      <input class="cnt" @change="dosave(idx)" v-model="newvalue[idx].cnt" />
    </div>
  </div>
</template>

<script>
const { dialog } = require('electron').remote
module.exports = {
  data: () => ({
    mp3file: '',
    srtfile: '',
    rawfile: '',
    speednormal: true,
    lines: []
  }),
  methods: {
    choosesrt () {
      const path = dialog.showOpenDialog({properties: ['openFile'], filters: [{name: '字幕文件', extensions: ['srt']}]})
      this.srtfile = path && path[0]
    },
    chooseraw () {
      const path = dialog.showOpenDialog({properties: ['openFile'], filters: [{name: '文本文件', extensions: ['txt']}]})
      this.rawfile = path && path[0]
    },
    choosemp3 () {
      const path = dialog.showOpenDialog({properties: ['openFile'], filters: [{name: '配音文件', extensions: ['mp3']}]})
      this.mp3file = path && path[0]
    },
    dosave (idx) {
      if (this.srtfile) {
        require('fs').writeFileSync(this.srtfile, this.newvalue.map(l => {
          return `${l.sequence}\n${l.time}\n${l.cnt}`
        }).join('\n\n'))
      } else if (this.rawfile) {
        require('fs').writeFileSync(this.rawfile + '.srt', this.lines.map(l => {
          return `${l.sequence}\n${l.time}\n${l.cnt}`
        }).join('\n\n'))
      }
    },
    makepoint () {
      const player = document.getElementById('player')
      if (player.paused) {
        player.play()
        this.rawidx = 0
      } else {
        if (this.rawidx >= this.lines.length) {
          player.pause()
          return
        }
        let secs = player.currentTime
        const msec = Math.round(secs * 1000) % 1000
        const hour = Math.floor(secs / 3600)
        const min = Math.floor(secs / 60) % 60
        secs = Math.floor(secs) % 60
        const timestr = (hour > 9 ? hour : ('0' + hour)) + ':' + (min > 9 ? min : ('0' + min)) + ':' + (secs > 9 ? secs : ('0' + secs)) + ',' + msec

        if (this.lines[this.rawidx].time) {
          this.lines[this.rawidx].time += '-->' + timestr
          this.rawidx += 1
        } else {
          this.lines[this.rawidx].time = timestr
        }
        this.dosave()
      }
    },
    play (line) {
      const player = document.getElementById('player')
      if (player.paused) {
        const starttime = line.time.split('-->')[0].trim()
        const params = starttime.split(/[:,]/)
        const hour = +params[0]
        const min = +params[1]
        const sec = +params[2]
        const msec = +params[3]
        player.currentTime = hour * 3600 + min * 60 + sec + (msec / 1000)
        player.play()
      } else {
        player.pause()
      }
    }
  },
  watch: {
    rawfile () {
      if (this.rawfile) {
        const content = require('fs').readFileSync(this.rawfile, 'utf-8')
        this.lines = content.split('\n').map((param, idx) => {
          return { sequence: idx + 1, time: '', cnt: param }
        })
        this.newvalue = this.lines.map(a => ({ sequence: a.sequence, time: a.time, cnt: a.cnt }))
      }
    },
    srtfile () {
      if (this.srtfile) {
        const content = require('fs').readFileSync(this.srtfile, 'utf-8')
        this.lines = content.split('\n\n').map(param => {
          const params = param.split('\n')
          return { sequence: params[0], time: params[1], cnt: params[2] }
        })
        this.newvalue = this.lines.map(a => ({ sequence: a.sequence, time: a.time, cnt: a.cnt }))
      }
    },
    speednormal () {
      const player = document.getElementById('player')
      if (this.speednormal) {
        player.defaultPlaybackRate = 1
        player.playbackRate = 1
      } else {
        player.defaultPlaybackRate = 0.5
        player.playbackRate = 0.5
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
}
.sequence {
  width: 50px;
}
.time {
  width:250px;
}
.cnt {
  flex:1;
  padding: 5px;
}
.srtline{
  display: flex;
  align-items: center;
  margin-top: 10px;
}
.controlbar{
  position: fixed;
  right: 20px;
  bottom: 20px;
}
</style>
