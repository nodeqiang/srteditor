const Frame = require('canvas-to-buffer')
class Layer {
  constructor (zindex, left, top, width, height) {
    this.zindex = zindex
    this.target = null
    this.left = left
    this.top = top
    this.width = width
    this.height = height
    this.startTick = new Date().getTime()
    this.operations = []
  }
  backToKeyFrame (tick) {
    let min = 0
    let max = this.operations.length - 1
    let avg = Math.floor((min + max) / 2)
    if (this.operations.length <= 0) return 0
    while (!(this.operations[avg].tick <= tick && (avg + 1 >= this.operations.length || this.operations[avg + 1].tick > tick))) {
      if (this.operations[avg].tick < tick) {
        min = avg
      } else {
        max = avg
      }
      avg = Math.floor((min + max) / 2)
      if ((avg === min) || (avg === max)) break
    }
    return avg
  }
  saveOperation (opt) {
    this.operations.push({
      tick: new Date().getTime(),
      ...opt
    })
  }
  runOperation (opt) {
    if (opt.type === 'clear') {
      this.clear()
    } else if (opt.type === 'zindex') {
      this.zindex = opt.zindex
    }
  }
  intersect (boundrect) {
    const nonIntersect = (this.left + this.width < boundrect.left) ||
      (this.left > boundrect.right) ||
      (this.top + this.height < boundrect.top) ||
      (this.top > boundrect.bottom)
    return !nonIntersect
  }
  setZIndex (zindex) {
    this.saveOperation({type: 'zindex', zindex})
  }
  update (tick) {
    const start = this.backToKeyFrame(tick)
    let i
    for (i = start; i < this.operations.length; i++) {
      const otick = this.operations[i].tick
      if (otick > tick) break
      this.runOperation(this.operations[i])
    }
    return i
  }
  _reset () { }
  clear () {
    this.saveOperation({type: 'clear'})
  }
  draw (context) {
    if (this.target) context.drawImage(this.target, this.left, this.top, this.width, this.height)
  }
}

export class ImageLayer extends Layer {
  constructor (zindex, url, left, top, width, height) {
    super(zindex, left, top, width, height)
    this.url = url
    this.target = new Image()
    this.target.src = url
    this._reset = () => {
      this.left = left
      this.top = top
    }
  }
  runOperation (opt) {
    if (opt.type === 'pos') {
      this.left = opt.left
      this.top = opt.top
    } else super.runOperation(opt)
  }
  setPos (left, top) {
    this.saveOperation({ type: 'pos', left, top })
  }
}

export class CanvasLayer extends Layer {
  constructor (zindex, left, top, width, height) {
    super(zindex, left, top, width, height)
    this.target = document.createElement('canvas')
    this.target.width = width
    this.target.height = height
    this.context = this.target.getContext('2d')
    this.context.lineWidth = 5
    this.context.strokeStyle = '#ff0000'
  }
  backToKeyFrame (tick) {
    let start = super.backToKeyFrame(tick)
    while (start > 0 && this.operations[start].type !== 'clear') {
      start--
    }
    return start
  }
  _reset () {
    this.context.clearRect(0, 0, this.target.width, this.target.height)
  }
  runOperation (opt) {
    if (opt.type === 'move') {
      this.context.beginPath()
      this.context.moveTo(...opt.to)
    } else if (opt.type === 'line') {
      this.context.lineTo(...opt.to)
      this.context.stroke()
    } else super.runOperation(opt)
  }
  move (to) {
    this.saveOperation({ type: 'move', to })
  }
  line (to) {
    this.saveOperation({ type: 'line', to })
  }
}

export class Capture {
  constructor (opts) {
    opts = opts || {}
    this.framerate = opts.framerate || 30
    this.width = opts.width || 1920
    this.height = opts.height || 1080
    this.layers = []
    this.capturing = false
  }
  start () {
    this.startTick = new Date().getTime()
    this.stopTick = null
    this.layers.forEach(layer => { layer.operations = [] })
    this.capturing = true
  }
  addLayer (layer) {
    this.layers.push(layer)
    return layer
  }
  stop () {
    this.stopTick = new Date().getTime()
    this.capturing = false
  }
  async save (savefunc) {
    if (!this.stopTick) return console.log('not start or not stop yet!')
    const framemap = {}
    const frames = []
    for (let frame = 1; ; frame++) {
      const tick = this.startTick + 1000 * frame / this.framerate
      if (tick > this.stopTick) {
        break
      }
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      const boundrect = {left: 0, top: 0, right: this.width, bottom: this.height}
      const context = canvas.getContext('2d')
      const layerdeep = JSON.stringify(this.layers.map(layer => layer.update(tick)))
      if (framemap[layerdeep]) {
        // console.log('skip save frame', frame, 'same as', framemap[layerdeep])
        frames[frames.length - 1].duration++
        continue
      }
      this.layers.sort((a, b) => a.zindex - b.zindex)
      this.layers.forEach(layer => {
        if (layer.intersect(boundrect)) {
          layer.draw(context)
        }
      })

      const aframe = new Frame(canvas, {
        image: {
          types: ['png']
        }
      })
      const buffer = aframe.toBuffer()
      const path = savefunc(frame, 'png', buffer)
      frames.push({ frame, duration: 1, path })
      framemap[layerdeep] = frame
    }
    this.exportfcp(savefunc, frames)
  }
  exportfcp (savefunc, frames) {
    const uuid = require('uuid')
    const moment = require('moment')
    const assets = frames.map(frame => {
      return `<asset id="r${100 + frame.frame}" name="${frame.frame}" uid="${uuid.v4()}" src="file://${frame.path}" start="0s" duration="0s" hasVideo="1" format="r4" />`
    }).join('\n')
    let curroffset = 0
    const videos = frames.map(frame => {
      const result = `<video name="${frame.frame}" lane="1" offset="${curroffset * 100}/3000s" ref="r${100 + frame.frame}" duration="${frame.duration * 100}/3000s" start="0s"/>`
      curroffset += frame.duration
      return result
    }).join('\n')
    const totalframe = curroffset
    const result = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
    <resources>
        <format id="r1" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1280" height="720" colorSpace="1-1-1 (Rec. 709)"/>
        <format id="r4" name="FFVideoFormatRateUndefined" width="1280" height="720"/>
        <effect id="r2" name="自定" uid=".../Generators.localized/Solids.localized/Custom.localized/Custom.motn"/>
        ${assets}
    </resources>
    <library location="file:///Users/wesleywang/Movies/%E9%BB%98%E8%AE%A4.fcpbundle/">
        <event name="日常" uid="6ABE2EA9-BBC0-4D9C-A187-9CBDB547B8F0">
            <project name="CaptureJS生成" uid="${uuid.v4()}" modDate="${moment().format('YYYY-MM-DD HH:mm:ss')} +0800">
                <sequence duration="${totalframe * 100}/3000s" format="r1" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
                    <spine>
                        <video name="自定" offset="0s" ref="r2" duration="${totalframe * 100}/3000s" start="0s">
                            ${videos}
                        </video>
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>
`
    savefunc('video', 'fcpxml', Buffer.from(result, 'utf-8'))
    // console.log(frames)
  }
}
