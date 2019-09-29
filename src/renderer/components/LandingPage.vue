<template>
  <div class="page">
    <div class="topbar">
      <b-link @click="choosesrt">{{ srtfile || '未指定srt文件' }}</b-link>
      <b-link @click="choosemp3">{{ mp3file || '未指定mp3文件' }}</b-link>
      <audio id="player" v-if="mp3file" :src="`file://${mp3file}`" />
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
    lines: []
  }),
  methods: {
    choosesrt () {
      const path = dialog.showOpenDialog({properties: ['openFile'], filters: [{name: '字幕文件', extensions: ['srt']}]})
      this.srtfile = path && path[0]
    },
    choosemp3 () {
      const path = dialog.showOpenDialog({properties: ['openFile'], filters: [{name: '配音文件', extensions: ['mp3']}]})
      this.mp3file = path && path[0]
    },
    dosave (idx) {
      require('fs').writeFileSync(`${this.srtfile}_new.srt`, this.newvalue.map(l => {
        return `${l.sequence}\n${l.time}\n${l.cnt}`
      }).join('\n\n'))
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
    srtfile () {
      const content = require('fs').readFileSync(this.srtfile, 'utf-8')
      this.lines = content.split('\n\n').map(param => {
        const params = param.split('\n')
        return { sequence: params[0], time: params[1], cnt: params[2] }
      })
      this.newvalue = this.lines.map(a => ({ sequence: a.sequence, time: a.time, cnt: a.cnt }))
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
</style>
