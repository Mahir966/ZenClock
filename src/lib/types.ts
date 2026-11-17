export type ThemeMode = 'dark' | 'light';

export type DesignStyle = 'zen' | 'studio' | 'cyber' | 'spatial';

export type TimerMode = 'countdown' | 'pomodoro' | 'deep_work' | 'short_break' | 'long_break';

export interface LapItem {
  id: string;
  lapNumber: number;
  lapTimeMs: number;
  overallTimeMs: number;
}

export interface SoundDefinition {
  id: string;
  name: string;
  description: string;
  file: string;
}
