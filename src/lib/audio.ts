/**
 * ZenClock Audio System
 * Manages alarm sound effects, Web Audio fallback synthesis, volume, and browser autoplay permissions.
 */

export interface SoundOption {
  id: string;
  name: string;
  description: string;
  file: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'oxygen',
    name: 'Oxygen',
    description: 'Warm Android-inspired marimba & soothing chimes',
    file: 'sounds/oxygen.wav',
  },
  {
    id: 'argon',
    name: 'Argon',
    description: 'Upbeat rhythmic electro-chime alarm sequence',
    file: 'sounds/argon.wav',
  },
  {
    id: 'cesium',
    name: 'Cesium',
    description: 'Vibrant cascading harp bells with rich harmonics',
    file: 'sounds/cesium.wav',
  },
  {
    id: 'digital_beep',
    name: 'Digital Beep',
    description: 'Classic dual-frequency crisp alarm beeper',
    file: 'sounds/digital_beep.wav',
  },
  {
    id: 'zen_bowl',
    name: 'Zen Singing Bowl',
    description: 'Tibetan singing bowl with deep meditative resonance',
    file: 'sounds/zen_bowl.wav',
  },
  {
    id: 'gentle_chime',
    name: 'Gentle Chimes',
    description: 'Crystalline wind chimes with soft stereo pan',
    file: 'sounds/gentle_chime.wav',
  },
  {
    id: 'morning_breeze',
    name: 'Morning Breeze',
    description: 'Soothing pentatonic acoustic sunrise harmony',
    file: 'sounds/morning_breeze.wav',
  },
];

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private previewAudioElement: HTMLAudioElement | null = null;
  private isAlarmPlaying = false;
  private synthInterval: number | null = null;

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  /**
   * Resumes AudioContext on user interaction to satisfy browser autoplay requirements.
   */
  public async unlock(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Play a tiny silent buffer to warm up audio subsystem
      if (ctx) {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
      return true;
    } catch (e) {
      console.warn('Unable to unlock Web Audio:', e);
      return false;
    }
  }

  /**
   * Gets absolute or base-path corrected URL for an asset
   */
  private getAssetUrl(relativePath: string): string {
    if (typeof window === 'undefined') return relativePath;
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

    // Check environment variable
    if (process.env.NEXT_PUBLIC_BASE_PATH) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '');
      return `${base}/${cleanPath}`;
    }

    // Auto-detect GitHub Pages repository subpath if hosted on github.io
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
      const segments = window.location.pathname.split('/').filter(Boolean);
      if (segments.length > 0 && !segments[0].includes('.')) {
        return `/${segments[0]}/${cleanPath}`;
      }
    }

    return `/${cleanPath}`;
  }

  /**
   * Play continuous looping alarm sound
   */
  public playAlarm(soundId: string, volume: number, isMuted: boolean): void {
    if (isMuted) return; // Muted silences audio, but visual alert still flashes!

    this.stopAlarm();
    this.isAlarmPlaying = true;

    const sound = SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];
    const url = this.getAssetUrl(sound.file);

    try {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = Math.max(0, Math.min(1, volume));

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio element play failed, falling back to Web Audio Synth:', err);
          this.playSynthesizedFallback(volume);
        });
      }

      this.currentAudioElement = audio;
    } catch {
      this.playSynthesizedFallback(volume);
    }
  }

  /**
   * Play a single preview iteration of a sound
   */
  public previewSound(soundId: string, volume: number): void {
    this.stopPreview();

    const sound = SOUND_OPTIONS.find((s) => s.id === soundId) || SOUND_OPTIONS[0];
    const url = this.getAssetUrl(sound.file);

    try {
      const audio = new Audio(url);
      audio.loop = false;
      audio.volume = Math.max(0, Math.min(1, volume));

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Preview audio play failed, falling back to Web Audio synth note:', err);
          this.previewSynthesizedChime(volume);
        });
      }

      this.previewAudioElement = audio;
      audio.onended = () => {
        if (this.previewAudioElement === audio) {
          this.previewAudioElement = null;
        }
      };
    } catch {
      this.previewSynthesizedChime(volume);
    }
  }

  public stopPreview(): void {
    if (this.previewAudioElement) {
      try {
        this.previewAudioElement.pause();
        this.previewAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      this.previewAudioElement = null;
    }
  }

  public stopAlarm(): void {
    this.isAlarmPlaying = false;
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudioElement = null;
    }

    if (this.synthInterval) {
      window.clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public updateVolume(volume: number, isMuted: boolean): void {
    const effectiveVol = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = effectiveVol;
    }
    if (this.previewAudioElement) {
      this.previewAudioElement.volume = effectiveVol;
    }
  }

  /**
   * Built-in Web Audio Procedural Chime (Emergency Fallback)
   */
  private previewSynthesizedChime(volume: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35); // C6

    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  private playSynthesizedFallback(volume: number): void {
    if (this.synthInterval) return;

    const playBeep = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1760, now + 0.1);

      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    };

    playBeep();
    this.synthInterval = window.setInterval(playBeep, 800);
  }
}

export const soundManager = new SoundManager();
