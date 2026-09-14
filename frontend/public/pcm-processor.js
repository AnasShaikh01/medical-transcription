class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.bufferSize = 2048; // ~128ms output buffer at 16kHz
    this.outputBuffer = new Float32Array(this.bufferSize);
    this.outputIndex = 0;
    
    // Persist fractional resample phase across process() iterations
    this.resamplePhase = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // Mono channel
    const currentSampleRate = sampleRate; // Hardware sample rate

    if (currentSampleRate === this.targetSampleRate) {
      for (let i = 0; i < channelData.length; i++) {
        this.outputBuffer[this.outputIndex++] = channelData[i];
        if (this.outputIndex >= this.bufferSize) {
          this.port.postMessage(this.outputBuffer.slice(0, this.bufferSize));
          this.outputIndex = 0;
        }
      }
    } else {
      const ratio = currentSampleRate / this.targetSampleRate;
      let inputIndex = this.resamplePhase;

      while (inputIndex < channelData.length) {
        const indexFloor = Math.floor(inputIndex);
        const indexCeil = Math.min(channelData.length - 1, Math.ceil(inputIndex));
        const fraction = inputIndex - indexFloor;

        const sample = channelData[indexFloor] * (1 - fraction) + channelData[indexCeil] * fraction;
        this.outputBuffer[this.outputIndex++] = sample;

        if (this.outputIndex >= this.bufferSize) {
          this.port.postMessage(this.outputBuffer.slice(0, this.bufferSize));
          this.outputIndex = 0;
        }

        inputIndex += ratio;
      }

      // Preserve phase remainder for the next chunk
      this.resamplePhase = inputIndex - channelData.length;
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);