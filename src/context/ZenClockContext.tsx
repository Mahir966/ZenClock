'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useTransition } from 'react';
import { LayoutType, StudySettings, UserPreferences } from '@/lib/types';
import { DEFAULT_PREFERENCES } from '@/lib/constants';
import { soundManager } from '@/lib/audio';

const STORAGE_KEY = 'zenclock_user_preferences_v1';

interface ZenClockContextType {
  preferences: UserPreferences;
  isMounted: boolean;
  isFullscreen: boolean;
  isAlarmActive: boolean;
  alarmMessage: string;
  previewingSoundId: string | null;
  setTheme: (theme: 'dark' | 'light') => void;
  setLayout: (layout: LayoutType) => void;
  setSelectedSound: (soundId: string) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (isMuted: boolean) => void;
  grantSoundPermission: () => Promise<void>;
  setEnable3D: (enable: boolean) => void;
  updateStudySettings: (settings: Partial<StudySettings>) => void;
  incrementCompletedPomodoros: () => void;
  resetCompletedPomodoros: () => void;
  triggerAlarm: (message?: string) => void;
  dismissAlarm: () => void;
  toggleFullscreen: () => void;
  previewSound: (soundId: string) => void;
  stopPreview: () => void;
}

const ZenClockContext = createContext<ZenClockContextType | null>(null);

export const ZenClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState('Timer Finished!');
  const [previewingSoundId, setPreviewingSoundId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Load preferences from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences((prev) => ({
          ...prev,
          ...parsed,
          studySettings: {
            ...prev.studySettings,
            ...(parsed.studySettings || {}),
          },
        }));
      } else {
        // Check system prefers-color-scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setPreferences((prev) => ({
          ...prev,
          theme: prefersDark ? 'dark' : 'light',
        }));
      }
    } catch (e) {
      console.warn('Failed to read preferences from localStorage:', e);
    }
  }, []);

  // Sync dark class on <html> document element
  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme, isMounted]);

  // Persist preferences to localStorage
  const savePreferences = useCallback((newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (e) {
      console.warn('Failed to write preferences to localStorage:', e);
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  }, []);

  const setTheme = useCallback(
    (theme: 'dark' | 'light') => {
      savePreferences({ ...preferences, theme });
    },
    [preferences, savePreferences]
  );

  const setLayout = useCallback(
    (layout: LayoutType) => {
      savePreferences({ ...preferences, layout });
    },
    [preferences, savePreferences]
  );

  const setSelectedSound = useCallback(
    (soundId: string) => {
      savePreferences({ ...preferences, selectedSound: soundId });
    },
    [preferences, savePreferences]
  );

  const setVolume = useCallback(
    (volume: number) => {
      const v = Math.max(0, Math.min(1, volume));
      savePreferences({ ...preferences, volume: v });
      soundManager.updateVolume(v, preferences.isMuted);
    },
    [preferences, savePreferences]
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !preferences.isMuted;
    savePreferences({ ...preferences, isMuted: nextMuted });
    soundManager.updateVolume(preferences.volume, nextMuted);
  }, [preferences, savePreferences]);

  const setMuted = useCallback(
    (isMuted: boolean) => {
      savePreferences({ ...preferences, isMuted });
      soundManager.updateVolume(preferences.volume, isMuted);
    },
    [preferences, savePreferences]
  );

  const grantSoundPermission = useCallback(async () => {
    const success = await soundManager.unlock();
    savePreferences({ ...preferences, soundPermissionGranted: true });
    // Play a gentle confirm preview
    if (success && !preferences.isMuted) {
      soundManager.previewSound(preferences.selectedSound, preferences.volume * 0.7);
    }
  }, [preferences, savePreferences]);

  const setEnable3D = useCallback(
    (enable: boolean) => {
      savePreferences({ ...preferences, enable3D: enable });
    },
    [preferences, savePreferences]
  );

  const updateStudySettings = useCallback(
    (updated: Partial<StudySettings>) => {
      savePreferences({
        ...preferences,
        studySettings: {
          ...preferences.studySettings,
          ...updated,
        },
      });
    },
    [preferences, savePreferences]
  );

  const incrementCompletedPomodoros = useCallback(() => {
    savePreferences({
      ...preferences,
      completedPomodoros: preferences.completedPomodoros + 1,
    });
  }, [preferences, savePreferences]);

  const resetCompletedPomodoros = useCallback(() => {
    savePreferences({
      ...preferences,
      completedPomodoros: 0,
    });
  }, [preferences, savePreferences]);

  // Alarm management
  const triggerAlarm = useCallback(
    (message = "Time's Up!") => {
      setAlarmMessage(message);
      setIsAlarmActive(true);

      if (typeof document !== 'undefined') {
        document.title = "⏰ TIME'S UP! — ZenClock";
        // Add intense blinking alert to body
        document.body.classList.add('alarm-flashing-active');
      }

      // Play looping sound if not muted
      soundManager.playAlarm(preferences.selectedSound, preferences.volume, preferences.isMuted);

      // Attempt web notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('⏰ ZenClock Alarm', {
            body: message,
            tag: 'zenclock-alarm',
          });
        } catch {
          // ignore
        }
      }
    },
    [preferences.selectedSound, preferences.volume, preferences.isMuted]
  );

  const dismissAlarm = useCallback(() => {
    setIsAlarmActive(false);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('alarm-flashing-active');
      document.title = 'ZenClock — Modern Timer, Stopwatch & Study Suite';
    }
    soundManager.stopAlarm();
  }, []);

  // Keyboard shortcut listener: ESC or Space to dismiss alarm, 'M' to mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, etc.
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (isAlarmActive && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        dismissAlarm();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlarmActive, dismissAlarm, toggleMute]);

  const previewSound = useCallback(
    (soundId: string) => {
      setPreviewingSoundId(soundId);
      soundManager.previewSound(soundId, preferences.volume);
    },
    [preferences.volume]
  );

  const stopPreview = useCallback(() => {
    setPreviewingSoundId(null);
    soundManager.stopPreview();
  }, []);

  return (
    <ZenClockContext.Provider
      value={{
        preferences,
        isMounted,
        isFullscreen,
        isAlarmActive,
        alarmMessage,
        previewingSoundId,
        setTheme,
        setLayout,
        setSelectedSound,
        setVolume,
        toggleMute,
        setMuted,
        grantSoundPermission,
        setEnable3D,
        updateStudySettings,
        incrementCompletedPomodoros,
        resetCompletedPomodoros,
        triggerAlarm,
        dismissAlarm,
        toggleFullscreen,
        previewSound,
        stopPreview,
      }}
    >
      {children}
    </ZenClockContext.Provider>
  );
};

export const useZenClock = () => {
  const context = useContext(ZenClockContext);
  if (!context) {
    throw new Error('useZenClock must be used within a ZenClockProvider');
  }
  return context;
};
