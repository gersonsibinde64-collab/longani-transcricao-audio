
export const splitAudioFile = async (file: File, maxDurationSeconds: number): Promise<File[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const sampleRate = audioBuffer.sampleRate;
      const totalSamples = audioBuffer.length;
      const chunkSamples = maxDurationSeconds * sampleRate;
      const numberOfChannels = audioBuffer.numberOfChannels;
      
      const chunks: File[] = [];
      let chunkIndex = 0;
      
      for (let start = 0; start < totalSamples; start += chunkSamples) {
        const end = Math.min(start + chunkSamples, totalSamples);
        const chunkLength = end - start;
        
        // Create new buffer for this chunk
        const chunkBuffer = audioContext.createBuffer(
          numberOfChannels,
          chunkLength,
          sampleRate
        );
        
        // Copy audio data to chunk buffer
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const originalChannelData = audioBuffer.getChannelData(channel);
          const chunkChannelData = chunkBuffer.getChannelData(channel);
          
          for (let i = 0; i < chunkLength; i++) {
            chunkChannelData[i] = originalChannelData[start + i];
          }
        }
        
        // Convert to WAV blob
        const wavBlob = await audioBufferToWav(chunkBuffer);
        
        // Create file from blob
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        const extension = file.name.split('.').pop() || 'wav';
        const chunkFile = new File(
          [wavBlob], 
          `${originalName}_part_${chunkIndex + 1}.${extension}`, 
          { type: 'audio/wav' }
        );
        
        chunks.push(chunkFile);
        chunkIndex++;
      }
      
      await audioContext.close();
      resolve(chunks);
      
    } catch (error) {
      console.error('Error splitting audio file:', error);
      reject(error);
    }
  });
};

// Helper function to convert AudioBuffer to WAV blob
async function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
