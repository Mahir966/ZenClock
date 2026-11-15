import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_RATE = 44100;
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

function writeWav(filename, samplesLeft, samplesRight) {
  const numSamples = samplesLeft.length;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const subChunk2Size = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + subChunk2Size);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + subChunk2Size, 4);
  buffer.write('WAVE', 8);

  // "fmt " subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // "data" subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(subChunk2Size, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp to -1.0 .. 1.0
    const left = Math.max(-1, Math.min(1, samplesLeft[i]));
    const right = Math.max(-1, Math.min(1, samplesRight[i]));

    const valL = Math.floor(left < 0 ? left * 32768 : left * 32767);
    const valR = Math.floor(right < 0 ? right * 32768 : right * 32767);

    buffer.writeInt16LE(valL, offset);
    buffer.writeInt16LE(valR, offset + 2);
    offset += 4;
  }

  const filePath = path.join(SOUNDS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// Sound generators
function generateOxygen() {
  // Inspired by Android Oxygen: mellow warm marimba/rhodes dual melody repeated twice
  const duration = 4.0;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50)
  const melody = [
    { freq: 523.25, time: 0.0, dur: 0.6, pan: -0.2 },
    { freq: 659.25, time: 0.35, dur: 0.6, pan: 0.2 },
    { freq: 783.99, time: 0.7, dur: 0.8, pan: -0.1 },
    { freq: 1046.50, time: 1.15, dur: 1.2, pan: 0.1 },
    // Repeat with variation
    { freq: 587.33, time: 2.0, dur: 0.6, pan: -0.2 },
    { freq: 783.99, time: 2.35, dur: 0.6, pan: 0.2 },
    { freq: 880.00, time: 2.7, dur: 0.8, pan: -0.1 },
    { freq: 1046.50, time: 3.15, dur: 1.3, pan: 0.3 },
  ];

  for (const note of melody) {
    const startIdx = Math.floor(note.time * SAMPLE_RATE);
    const len = Math.floor(note.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      // Warm marimba/bell envelope: quick attack, exp decay
      const env = Math.exp(-t * 3.5) * (1 - Math.exp(-t * 120));
      // Harmonics (fundamental + soft 2nd + tiny 3rd)
      const val = 0.65 * Math.sin(2 * Math.PI * note.freq * t) +
                  0.25 * Math.sin(2 * Math.PI * note.freq * 2 * t) * Math.exp(-t * 6) +
                  0.10 * Math.sin(2 * Math.PI * note.freq * 3 * t) * Math.exp(-t * 10);
      const amp = val * env * 0.45;
      left[idx] += amp * (1 - note.pan);
      right[idx] += amp * (1 + note.pan);
    }
  }

  writeWav('oxygen.wav', left, right);
}

function generateArgon() {
  // Inspired by Android Argon: rhythmic bright electro-chime alarm sequence
  const duration = 3.6;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Arpeggiated sequence (F#4, A#4, C#5, F#5, G#5, A#5)
  const notes = [
    { freq: 739.99, time: 0.00, dur: 0.4 },
    { freq: 932.33, time: 0.20, dur: 0.4 },
    { freq: 1108.73, time: 0.40, dur: 0.4 },
    { freq: 1479.98, time: 0.60, dur: 0.8 },
    { freq: 739.99, time: 1.20, dur: 0.4 },
    { freq: 932.33, time: 1.40, dur: 0.4 },
    { freq: 1108.73, time: 1.60, dur: 0.4 },
    { freq: 1661.22, time: 1.80, dur: 0.8 },
    { freq: 1479.98, time: 2.40, dur: 0.4 },
    { freq: 1661.22, time: 2.60, dur: 0.4 },
    { freq: 1864.66, time: 2.80, dur: 0.9 },
  ];

  for (const n of notes) {
    const start = Math.floor(n.time * SAMPLE_RATE);
    const len = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 5.0) * (1 - Math.exp(-t * 150));
      // Ring modulation / crisp FM chime
      const mod = Math.sin(2 * Math.PI * n.freq * 2.01 * t);
      const val = Math.sin(2 * Math.PI * n.freq * t + 0.3 * mod);
      const amp = val * env * 0.4;
      left[idx] += amp * 0.85;
      right[idx] += amp * 0.85;
    }
  }

  writeWav('argon.wav', left, right);
}

function generateCesium() {
  // Inspired by Android Cesium: vibrant cascading bell chime
  const duration = 4.2;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const chords = [
    { f1: 523.25, f2: 659.25, f3: 783.99, time: 0.0, dur: 1.5 },
    { f1: 587.33, f2: 698.46, f3: 880.00, time: 0.8, dur: 1.5 },
    { f1: 659.25, f2: 783.99, f3: 1046.50, time: 1.6, dur: 2.2 },
  ];

  for (const chord of chords) {
    const start = Math.floor(chord.time * SAMPLE_RATE);
    const len = Math.floor(chord.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 2.2) * (1 - Math.exp(-t * 80));
      const s1 = Math.sin(2 * Math.PI * chord.f1 * t);
      const s2 = Math.sin(2 * Math.PI * chord.f2 * t);
      const s3 = Math.sin(2 * Math.PI * chord.f3 * t);
      const amp = (s1 * 0.4 + s2 * 0.35 + s3 * 0.25) * env * 0.4;
      left[idx] += amp * 0.9;
      right[idx] += amp * 0.9;
    }
  }

  writeWav('cesium.wav', left, right);
}

function generateDigitalBeep() {
  // Classic dual-tone urgent crisp alarm beeps
  const duration = 3.2;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // 4 bursts of rapid beeps: beep-beep-beep-beep
  const beeps = [
    0.0, 0.18, 0.36, 0.54,
    1.1, 1.28, 1.46, 1.64,
    2.2, 2.38, 2.56, 2.74
  ];

  for (const bTime of beeps) {
    const start = Math.floor(bTime * SAMPLE_RATE);
    const len = Math.floor(0.10 * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      // Envelope with gentle slope to avoid clicks
      const env = Math.sin((Math.PI * i) / len);
      const val = 0.7 * Math.sin(2 * Math.PI * 980 * t) + 0.3 * Math.sin(2 * Math.PI * 1960 * t);
      const amp = val * env * 0.42;
      left[idx] += amp;
      right[idx] += amp;
    }
  }

  writeWav('digital_beep.wav', left, right);
}

function generateZenSingingBowl() {
  // Meditative singing bowl with deep fundamental (220Hz / 440Hz / 1210Hz) and shimmering beat frequencies
  const duration = 5.0;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const strikes = [0.0, 2.2];
  for (const sTime of strikes) {
    const start = Math.floor(sTime * SAMPLE_RATE);
    const len = Math.floor(3.0 * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 1.0) * (1 - Math.exp(-t * 60));
      // Fundamental 261.63Hz (C4) + subtle detune creating 2Hz binaural beating
      const f1 = Math.sin(2 * Math.PI * 261.63 * t);
      const f1b = Math.sin(2 * Math.PI * 263.63 * t);
      const f2 = Math.sin(2 * Math.PI * 720.0 * t) * Math.exp(-t * 2.0);
      const f3 = Math.sin(2 * Math.PI * 1440.0 * t) * Math.exp(-t * 3.5);

      const ampL = ((f1 * 0.5 + f1b * 0.3 + f2 * 0.2 + f3 * 0.1) * env) * 0.45;
      const ampR = ((f1 * 0.3 + f1b * 0.5 + f2 * 0.2 + f3 * 0.1) * env) * 0.45;
      left[idx] += ampL;
      right[idx] += ampR;
    }
  }

  writeWav('zen_bowl.wav', left, right);
}

function generateGentleChime() {
  // Gentle wind chime / glass bells
  const duration = 4.0;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const chimes = [
    { freq: 1174.66, time: 0.05, pan: -0.4 },
    { freq: 1318.51, time: 0.25, pan: 0.3 },
    { freq: 1567.98, time: 0.50, pan: -0.2 },
    { freq: 1760.00, time: 0.85, pan: 0.4 },
    { freq: 2093.00, time: 1.20, pan: 0.0 },
    { freq: 1567.98, time: 2.00, pan: -0.3 },
    { freq: 1760.00, time: 2.25, pan: 0.3 },
    { freq: 2349.32, time: 2.55, pan: 0.1 },
  ];

  for (const c of chimes) {
    const start = Math.floor(c.time * SAMPLE_RATE);
    const len = Math.floor(1.6 * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 3.2) * (1 - Math.exp(-t * 200));
      const val = Math.sin(2 * Math.PI * c.freq * t) + 0.3 * Math.sin(2 * Math.PI * c.freq * 2.75 * t) * Math.exp(-t * 6);
      const amp = val * env * 0.32;
      left[idx] += amp * (1 - c.pan);
      right[idx] += amp * (1 + c.pan);
    }
  }

  writeWav('gentle_chime.wav', left, right);
}

function generateMorningBreeze() {
  // Morning acoustic warmth
  const duration = 4.5;
  const totalSamples = Math.floor(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Pentatonic scale: G4, B4, D5, E5, G5, B5
  const notes = [
    { freq: 392.00, time: 0.0, dur: 1.2 },
    { freq: 493.88, time: 0.4, dur: 1.2 },
    { freq: 587.33, time: 0.8, dur: 1.4 },
    { freq: 659.25, time: 1.2, dur: 1.4 },
    { freq: 783.99, time: 1.6, dur: 2.0 },
    { freq: 987.77, time: 2.3, dur: 2.2 },
  ];

  for (const n of notes) {
    const start = Math.floor(n.time * SAMPLE_RATE);
    const len = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= totalSamples) break;
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 2.5) * (1 - Math.exp(-t * 80));
      const val = Math.sin(2 * Math.PI * n.freq * t) * 0.7 + Math.sin(2 * Math.PI * n.freq * 2 * t) * 0.3;
      const amp = val * env * 0.38;
      left[idx] += amp;
      right[idx] += amp;
    }
  }

  writeWav('morning_breeze.wav', left, right);
}

console.log('Generating local alarm sound assets...');
generateOxygen();
generateArgon();
generateCesium();
generateDigitalBeep();
generateZenSingingBowl();
generateGentleChime();
generateMorningBreeze();
console.log('All alarm sound assets generated successfully!');
