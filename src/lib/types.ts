export type LayoutType = 'zen' | 'studio' | 'cyber' | 'spatial';

export type MainTab = 'timer' | 'study' | 'stopwatch' | 'clock';

export type StudyMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'custom';

export interface StudySettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  deepWorkMinutes: number;
  deepWorkBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface LapItem {
  id: string;
  lapNumber: number;
  lapTimeMs: number;
  overallTimeMs: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  layout: LayoutType;
  selectedSound: string;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  soundPermissionGranted: boolean;
  enable3D: boolean;
  enableAnalogTicks: boolean;
  studySettings: StudySettings;
  completedPomodoros: number;
}
