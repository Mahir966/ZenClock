import { SoundDefinition, DesignStyle } from './types';

export const SOUND_DEFINITIONS: SoundDefinition[] = [
  { id: 'oxygen', name: 'Oxygen', description: 'Warm Android marimba & dual chime', file: 'sounds/oxygen.wav' },
  { id: 'argon', name: 'Argon', description: 'Upbeat rhythmic electro-chime alarm', file: 'sounds/argon.wav' },
  { id: 'cesium', name: 'Cesium', description: 'Cascading harp bells with rich harmonics', file: 'sounds/cesium.wav' },
  { id: 'digital_beep', name: 'Digital Beep', description: 'Classic dual-frequency crisp beeper', file: 'sounds/digital_beep.wav' },
  { id: 'zen_bowl', name: 'Zen Bowl', description: 'Tibetan singing bowl with deep resonance', file: 'sounds/zen_bowl.wav' },
  { id: 'gentle_chime', name: 'Gentle Chimes', description: 'Crystalline wind chimes & bell pan', file: 'sounds/gentle_chime.wav' },
  { id: 'morning_breeze', name: 'Morning Breeze', description: 'Pentatonic morning flute harmony', file: 'sounds/morning_breeze.wav' },
];

export const DESIGN_STYLES: { id: DesignStyle; name: string; tag: string }[] = [
  { id: 'zen', name: 'Zen Minimal', tag: 'Breathing ring & clean lines' },
  { id: 'studio', name: 'Studio Modern', tag: 'Bauhaus segmented dial & amber' },
  { id: 'cyber', name: 'Cyber Neon', tag: 'HUD framing & glowing cyan' },
  { id: 'spatial', name: 'Spatial 3D', tag: 'Interactive 3D particle halo' },
];

export const QUICK_PRESETS = [
  { label: '+1m', sec: 60 },
  { label: '+5m', sec: 300 },
  { label: '+10m', sec: 600 },
  { label: '+15m', sec: 900 },
  { label: '+25m', sec: 1500 },
  { label: '+45m', sec: 2700 },
  { label: '+60m', sec: 3600 },
];
