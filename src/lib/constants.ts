import { LayoutType, StudySettings, UserPreferences } from './types';

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  deepWorkMinutes: 50,
  deepWorkBreakMinutes: 10,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  layout: 'zen',
  selectedSound: 'oxygen',
  volume: 0.8,
  isMuted: false,
  soundPermissionGranted: false,
  enable3D: true,
  enableAnalogTicks: false,
  studySettings: DEFAULT_STUDY_SETTINGS,
  completedPomodoros: 0,
};

export const LAYOUT_DEFINITIONS: {
  id: LayoutType;
  name: string;
  tagline: string;
  description: string;
  badge: string;
}[] = [
  {
    id: 'zen',
    name: 'Zen Minimalist',
    tagline: 'Clean, peaceful & distraction-free',
    description: 'Sleek typography with a gentle breathing progress ring and glassmorphic surfaces.',
    badge: 'Zen',
  },
  {
    id: 'studio',
    name: 'Modern Studio',
    tagline: 'Bauhaus architectural elegance',
    description: 'Segmented dial indicators, warm brass/slate styling, and structured ergonomics.',
    badge: 'Studio',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Neon',
    tagline: 'Holographic glow & digital precision',
    description: 'Vibrant neon cyan, monospace LED segmented counters, and futuristic HUD brackets.',
    badge: 'Cyber',
  },
  {
    id: 'spatial',
    name: 'Spatial 3D',
    tagline: 'Interactive 3D particle halo & depth',
    description: 'WebGL-powered particle rings and ambient gyroscopic energy sphere responsive to timer state.',
    badge: '3D Flow',
  },
];

export const TIMER_PRESETS = [
  { label: '+1m', seconds: 60 },
  { label: '+5m', seconds: 300 },
  { label: '+10m', seconds: 600 },
  { label: '+15m', seconds: 900 },
  { label: '+25m', seconds: 1500 },
  { label: '+30m', seconds: 1800 },
  { label: '+45m', seconds: 2700 },
  { label: '+60m', seconds: 3600 },
];
