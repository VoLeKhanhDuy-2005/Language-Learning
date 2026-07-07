export class WAVRecorder {
  constructor() {
    this.audioContext = null
    this.mediaStream = null
    this.mediaStreamSource = null
    this.processor = null
    this.leftChannel = []
    this.recordingLength = 0
    this.sampleRate = 44100
  }

  async start() {
    this.leftChannel = []
    this.recordingLength = 0
    
    // Lấy microphone stream
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Tạo AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContextClass()
    this.sampleRate = this.audioContext.sampleRate
    
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream)
    
    // Tạo ScriptProcessorNode (buffer 2048, 1 input channel, 1 output channel)
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1)
    
    this.processor.onaudioprocess = (e) => {
      const left = e.inputBuffer.getChannelData(0)
      this.leftChannel.push(new Float32Array(left))
      this.recordingLength += 2048
    }
    
    // Kết nối các node
    this.mediaStreamSource.connect(this.processor)
    this.processor.connect(this.audioContext.destination)
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect()
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect()
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
    }
    if (this.audioContext) {
      this.audioContext.close()
    }

    // Gộp tất cả các block buffer PCM Float32 lại thành một mảng duy nhất
    const mergedBuffer = this.mergeBuffers(this.leftChannel, this.recordingLength)
    
    // Mã hóa buffer PCM thành file định dạng .wav
    const wavBlob = this.encodeWAV(mergedBuffer, this.sampleRate)
    return wavBlob
  }

  mergeBuffers(channelBuffer, recordingLength) {
    const result = new Float32Array(recordingLength)
    let offset = 0
    for (let i = 0; i < channelBuffer.length; i++) {
      result.set(channelBuffer[i], offset)
      offset += channelBuffer[i].length
    }
    return result
  }

  encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // RIFF identifier
    this.writeString(view, 0, 'RIFF')
    // File length
    view.setUint32(4, 36 + samples.length * 2, true)
    // RIFF type
    this.writeString(view, 8, 'WAVE')
    // Format chunk identifier
    this.writeString(view, 12, 'fmt ')
    // Format chunk length
    view.setUint32(16, 16, true)
    // Sample format (raw PCM = 1)
    view.setUint16(20, 1, true)
    // Channel count (mono = 1)
    view.setUint16(22, 1, true)
    // Sample rate
    view.setUint32(24, sampleRate, true)
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true)
    // Block align (channel count * bytes per sample)
    view.setUint16(32, 2, true)
    // Bits per sample (16-bit)
    view.setUint16(34, 16, true)
    // Data chunk identifier
    this.writeString(view, 36, 'data')
    // Data chunk length
    view.setUint32(40, samples.length * 2, true)

    // Viết dữ liệu PCM 16-bit
    this.floatTo16BitPCM(view, 44, samples)

    return new Blob([view], { type: 'audio/wav' })
  }

  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
}
