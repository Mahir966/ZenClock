'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { StudyMode, StudySettings } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface UseStudyTimerOptions {
  settings: StudySettings;
  onWorkComplete?: (mode: StudyMode, sessionNumber: number) => void;
  onBreakComplete?: (mode: StudyMode) => void;
  onCycleComplete?: () => void;
}

export function useStudyTimer({
  settings,
  onWorkComplete,
  onBreakComplete,
  onCycleComplete,
}: UseStudyTimerOptions) {
  const [mode, setMode] = useState<StudyMode>('pomodoro');
  const [isBreak, setIsBreak] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Compute duration based on mode and break state
  const getDurationForState = useCallback(
    (currentMode: StudyMode, inBreak: boolean, currentSessionNum: number) => {
      if (inBreak) {
        if (currentSessionNum % settings.sessionsBeforeLongBreak === 0) {
          return settings.longBreakMinutes * 60;
        }
        if (currentMode === 'deep_work') {
          return settings.deepWorkBreakMinutes * 60;
        }
        return settings.shortBreakMinutes * 60;
      }

      switch (currentMode) {
        case 'deep_work':
          return settings.deepWorkMinutes * 60;
        case 'short_break':
          return settings.shortBreakMinutes * 60;
        case 'long_break':
          return settings.longBreakMinutes * 60;
        case 'pomodoro':
        case 'custom':
        default:
          return settings.workMinutes * 60;
      }
    },
    [settings]
  );

  const [duration, setDuration] = useState(() => getDurationForState('pomodoro', false, 1));
  const [remaining, setRemaining] = useState(() => getDurationForState('pomodoro', false, 1));

  const targetEndTimeRef = useRef<number | null>(null);

  // Update duration when settings change while idle
  useEffect(() => {
    if (!isRunning && !isPaused) {
      const newDur = getDurationForState(mode, isBreak, currentSession);
      setDuration(newDur);
      setRemaining(newDur);
    }
  }, [settings, mode, isBreak, currentSession, isRunning, isPaused, getDurationForState]);

  // Tick loop
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalId = window.setInterval(() => {
      if (!targetEndTimeRef.current) return;

      const diffMs = targetEndTimeRef.current - Date.now();
      if (diffMs <= 0) {
        // Complete current interval
        setIsRunning(false);
        setIsPaused(false);
        targetEndTimeRef.current = null;
        setRemaining(0);

        handleSessionCompletion();
      } else {
        setRemaining(Math.ceil(diffMs / 1000));
      }
    }, 150);

    return () => window.clearInterval(intervalId);
  }, [isRunning, isPaused, isBreak, mode, currentSession, settings]);

  // Dynamic tab title update
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isRunning && !isPaused && remaining > 0) {
      document.title = `(${formatTime(remaining)}) [${isBreak ? 'Break' : 'Focus'}] ZenClock`;
    }
  }, [isRunning, isPaused, remaining, isBreak]);

  const handleSessionCompletion = useCallback(() => {
    if (!isBreak) {
      // Work session just completed!
      const isCycleFinished = currentSession % settings.sessionsBeforeLongBreak === 0;

      if (isCycleFinished) {
        // Confetti burst for completing full cycle!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        onCycleComplete?.();
      }

      onWorkComplete?.(mode, currentSession);

      // Transition to break
      setIsBreak(true);
      const breakDur = isCycleFinished
        ? settings.longBreakMinutes * 60
        : mode === 'deep_work'
        ? settings.deepWorkBreakMinutes * 60
        : settings.shortBreakMinutes * 60;

      setDuration(breakDur);
      setRemaining(breakDur);

      if (settings.autoStartBreaks) {
        targetEndTimeRef.current = Date.now() + breakDur * 1000;
        setIsRunning(true);
        setIsPaused(false);
      }
    } else {
      // Break session just completed!
      onBreakComplete?.(mode);

      // Next work session
      setIsBreak(false);
      const nextSession = currentSession >= settings.sessionsBeforeLongBreak ? 1 : currentSession + 1;
      setCurrentSession(nextSession);

      const workDur = mode === 'deep_work' ? settings.deepWorkMinutes * 60 : settings.workMinutes * 60;
      setDuration(workDur);
      setRemaining(workDur);

      if (settings.autoStartPomodoros) {
        targetEndTimeRef.current = Date.now() + workDur * 1000;
        setIsRunning(true);
        setIsPaused(false);
      }
    }
  }, [isBreak, currentSession, settings, mode, onCycleComplete, onWorkComplete, onBreakComplete]);

  const start = useCallback(() => {
    if (remaining <= 0) {
      const resetDur = getDurationForState(mode, isBreak, currentSession);
      setRemaining(resetDur);
      targetEndTimeRef.current = Date.now() + resetDur * 1000;
    } else {
      targetEndTimeRef.current = Date.now() + remaining * 1000;
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [remaining, getDurationForState, mode, isBreak, currentSession]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    if (targetEndTimeRef.current) {
      const diffMs = Math.max(0, targetEndTimeRef.current - Date.now());
      setRemaining(Math.ceil(diffMs / 1000));
    }
    targetEndTimeRef.current = null;
    setIsPaused(true);
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    targetEndTimeRef.current = Date.now() + remaining * 1000;
    setIsPaused(false);
  }, [isRunning, isPaused, remaining]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    const initialDur = getDurationForState(mode, isBreak, currentSession);
    setDuration(initialDur);
    setRemaining(initialDur);
  }, [getDurationForState, mode, isBreak, currentSession]);

  const switchMode = useCallback(
    (newMode: StudyMode, forceBreak = false) => {
      setIsRunning(false);
      setIsPaused(false);
      targetEndTimeRef.current = null;
      setMode(newMode);
      setIsBreak(forceBreak);

      let newDur: number;
      if (newMode === 'short_break') {
        setIsBreak(true);
        newDur = settings.shortBreakMinutes * 60;
      } else if (newMode === 'long_break') {
        setIsBreak(true);
        newDur = settings.longBreakMinutes * 60;
      } else if (newMode === 'deep_work') {
        setIsBreak(forceBreak);
        newDur = forceBreak ? settings.deepWorkBreakMinutes * 60 : settings.deepWorkMinutes * 60;
      } else {
        setIsBreak(forceBreak);
        newDur = forceBreak ? settings.shortBreakMinutes * 60 : settings.workMinutes * 60;
      }

      setDuration(newDur);
      setRemaining(newDur);
    },
    [settings]
  );

  const skipToNext = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    handleSessionCompletion();
  }, [handleSessionCompletion]);

  const progress = duration > 0 ? Math.min(1, Math.max(0, (duration - remaining) / duration)) : 0;

  return {
    mode,
    isBreak,
    currentSession,
    duration,
    remaining,
    isRunning,
    isPaused,
    progress,
    start,
    pause,
    resume,
    reset,
    switchMode,
    skipToNext,
  };
}
