/**
 * ZenClock Audio Engine
 * Supports both local WAV files and Web Audio procedural synthesis fallback.
 */

import { SOUND_DEFINITIONS } from './constants';
import { SoundDefinition } from './types';

let currentAudio: HTMLAudioElement | null = null;
let previewAudio: HTMLAudioElement | null = null;
let synthInterval: number | null = null;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

export function unlockAudio(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
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
  if (isMuted) return; // Mute disables audio, but visual alert still triggers!
  stopAlarm();

  const sound = SOUND_DEFINITIONS.find((s) => s.id === soundId) || SOUND_DEFINITIONS[0];
  const url = resolveAssetUrl(sound.file);

  try {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume));
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playSynthAlarm(soundId, volume);
      });
    }
    currentAudio = audio;
  } catch {
    playSynthAlarm(soundId, volume);
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

  const sound = SOUND_DEFINITIONS.find((s) => s.id === soundId) || SOUND_DEFINITIONS[0];
  const url = resolveAssetUrl(sound.file);

  try {
    const audio = new Audio(url);
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playSynthTone(soundId, volume);
      });
    }
    previewAudio = audio;
    audio.onended = () => {
      previewAudio = null;
    };
  } catch {
    playSynthTone(soundId, volume);
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

export function updateVolume(volume: number, isMuted: boolean) {
  const effective = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  if (currentAudio) currentAudio.volume = effective;
  if (previewAudio) previewAudio.volume = effective;
}

// Procedural Web Audio Synthesis for instant fallback
function playSynthTone(soundId: string, volume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

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

  gain.gain.setValueAtTime(volume * 0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (soundId === 'zen_bowl' ? 1.8 : 0.8));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (soundId === 'zen_bowl' ? 1.9 : 0.85));
}

function playSynthAlarm(soundId: string, volume: number) {
  if (synthInterval !== null) return;
  playSynthTone(soundId, volume);
  synthInterval = window.setInterval(() => {
    playSynthTone(soundId, volume);
  }, 900);
}
