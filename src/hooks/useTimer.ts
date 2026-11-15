'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '@/lib/utils';

interface UseTimerOptions {
  initialDurationSeconds?: number;
  onComplete?: () => void;
}

export function useTimer({
  initialDurationSeconds = 1500, // 25 minutes default
  onComplete,
}: UseTimerOptions = {}) {
  const [duration, setDuration] = useState(initialDurationSeconds);
  const [remaining, setRemaining] = useState(initialDurationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Main high-precision tick loop using Date.now()
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalId = window.setInterval(() => {
      if (!targetEndTimeRef.current) return;

      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;

      if (diffMs <= 0) {
        setRemaining(0);
        setIsRunning(false);
        setIsPaused(false);
        targetEndTimeRef.current = null;
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      } else {
        const secsLeft = Math.ceil(diffMs / 1000);
        setRemaining(secsLeft);
      }
    }, 150);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, isPaused]);

  // Dynamic tab title update
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isRunning && !isPaused && remaining > 0) {
      document.title = `(${formatTime(remaining)}) ZenClock`;
    }
  }, [isRunning, isPaused, remaining]);

  const start = useCallback(() => {
    if (remaining <= 0) {
      setRemaining(duration);
      targetEndTimeRef.current = Date.now() + duration * 1000;
    } else {
      targetEndTimeRef.current = Date.now() + remaining * 1000;
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [duration, remaining]);

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
    setRemaining(duration);
  }, [duration]);

  const setCustomDuration = useCallback((seconds: number) => {
    const validSecs = Math.max(1, Math.floor(seconds));
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    setDuration(validSecs);
    setRemaining(validSecs);
  }, []);

  const addSeconds = useCallback((extraSeconds: number) => {
    setDuration((prevDur) => {
      const newDur = Math.max(1, prevDur + extraSeconds);
      return newDur;
    });

    setRemaining((prevRem) => {
      const newRem = Math.max(1, prevRem + extraSeconds);
      if (targetEndTimeRef.current) {
        targetEndTimeRef.current += extraSeconds * 1000;
      }
      return newRem;
    });
  }, []);

  const progress = duration > 0 ? Math.min(1, Math.max(0, (duration - remaining) / duration)) : 0;

  return {
    duration,
    remaining,
    isRunning,
    isPaused,
    progress,
    start,
    pause,
    resume,
    reset,
    setCustomDuration,
    addSeconds,
  };
}
