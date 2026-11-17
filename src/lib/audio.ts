/**
 * ZenClock Audio Engine
 * Supports both local WAV files and Web Audio procedural synthesis fallback.
 * Features real-time master volume modulation, mute management, and auditory feedback.
 */

import { SOUND_DEFINITIONS } from './constants';

let currentAudio: HTMLAudioElement | null = null;
let previewAudio: HTMLAudioElement | null = null;
let synthInterval: number | null = null;
let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

let masterVolume = 0.85;
let masterMuted = false;
let activeSoundId = 'custom_alarm_1';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGainNode) {
    masterGainNode = ctx.createGain();
    const effective = masterMuted ? 0 : Math.max(0, Math.min(1, masterVolume));
    masterGainNode.gain.setValueAtTime(effective, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
  }
  return masterGainNode;
}

export function unlockAudio(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (ctx) {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
    return true;
  } catch {
    return false;
  }
}

function resolveAssetUrl(filePath: string): string {
  if (typeof window === 'undefined') return filePath;
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  const clean = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return base ? `${base}/${clean}` : `./${clean}`;
}

export function playAlarm(soundId: string, volume: number, isMuted: boolean) {
  masterVolume = Math.max(0, Math.min(1, isNaN(volume) ? 0.85 : volume));
  masterMuted = isMuted;
  activeSoundId = soundId;

  stopAlarm();
  if (isMuted) return; // Visual alert still triggers, audio muted

  const sound = SOUND_DEFINITIONS.find((s) => s.id === soundId) || SOUND_DEFINITIONS[0];
  const url = resolveAssetUrl(sound.file);

  try {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = masterVolume;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playSynthAlarm(soundId);
      });
    }
    currentAudio = audio;
  } catch {
    playSynthAlarm(soundId);
  }
}

export function stopAlarm() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (synthInterval !== null) {
    window.clearInterval(synthInterval);
    synthInterval = null;
  }
}

export function previewSound(soundId: string, volume: number) {
  stopPreview();

  masterVolume = Math.max(0, Math.min(1, isNaN(volume) ? 0.85 : volume));
  activeSoundId = soundId;
  const effective = masterMuted ? 0 : masterVolume;

  const sound = SOUND_DEFINITIONS.find((s) => s.id === soundId) || SOUND_DEFINITIONS[0];
  const url = resolveAssetUrl(sound.file);

  try {
    const audio = new Audio(url);
    audio.loop = false;
    audio.volume = effective;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playSynthTone(soundId);
      });
    }
    previewAudio = audio;
    audio.onended = () => {
      if (previewAudio === audio) previewAudio = null;
    };
  } catch {
    playSynthTone(soundId);
  }
}

export function stopPreview() {
  if (previewAudio) {
    try {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    } catch {}
    previewAudio = null;
  }
}

/**
 * Real-time master volume updater.
 * Immediately modifies active HTMLAudioElements and Web Audio Master GainNode.
 */
export function updateVolume(volume: number, isMuted: boolean) {
  masterVolume = Math.max(0, Math.min(1, isNaN(volume) ? 0.85 : volume));
  masterMuted = isMuted;
  const effective = isMuted ? 0 : masterVolume;

  // 1. Modulate currently playing alarm audio in real time
  if (currentAudio) {
    try {
      currentAudio.volume = effective;
    } catch {}
  }

  // 2. Modulate currently playing sound preview in real time
  if (previewAudio) {
    try {
      previewAudio.volume = effective;
    } catch {}
  }

  // 3. Modulate Web Audio Master GainNode in real time
  if (audioCtx) {
    try {
      const master = getMasterGain(audioCtx);
      master.gain.setValueAtTime(effective, audioCtx.currentTime);
    } catch {}
  }
}

/**
 * Auditory volume adjustment feedback chirp.
 * Plays a brief, elegant tone so the user hears the new volume level when adjusting sliders.
 */
let lastChirpTime = 0;
export function playVolumeFeedbackChirp() {
  if (masterMuted) return;
  const nowMs = Date.now();
  if (nowMs - lastChirpTime < 90) return; // Throttle to 90ms for smooth sliding
  lastChirpTime = nowMs;

  // Only play feedback if no preview or alarm is actively making sound
  if (currentAudio && !currentAudio.paused) return;
  if (previewAudio && !previewAudio.paused) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const master = getMasterGain(ctx);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {}
}

/**
 * Procedural Web Audio Synthesis for instant zero-dependency fallback.
 */
function playSynthTone(soundId: string) {
  if (masterMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const toneGain = ctx.createGain();
  const master = getMasterGain(ctx);

  // Distinct tone based on soundId
  let f1 = 523.25;
  let f2 = 1046.5;
  if (soundId === 'argon') { f1 = 739.99; f2 = 1479.98; }
  else if (soundId === 'cesium') { f1 = 587.33; f2 = 1174.66; }
  else if (soundId === 'digital_beep') { f1 = 880; f2 = 1760; }
  else if (soundId === 'zen_bowl') { f1 = 261.63; f2 = 523.25; }
  else if (soundId === 'gentle_chime') { f1 = 1174.66; f2 = 2349.32; }

  osc.type = soundId === 'digital_beep' ? 'square' : soundId === 'zen_bowl' ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(f1, now);
  osc.frequency.exponentialRampToValueAtTime(f2, now + 0.3);

  toneGain.gain.setValueAtTime(0.35, now);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + (soundId === 'zen_bowl' ? 1.8 : 0.8));

  osc.connect(toneGain);
  toneGain.connect(master);

  osc.start(now);
  osc.stop(now + (soundId === 'zen_bowl' ? 1.9 : 0.85));
}

function playSynthAlarm(soundId: string) {
  if (synthInterval !== null) return;
  playSynthTone(soundId);
  synthInterval = window.setInterval(() => {
    playSynthTone(activeSoundId || soundId);
  }, 900);
}
