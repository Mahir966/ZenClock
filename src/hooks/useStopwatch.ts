'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LapItem } from '@/lib/types';

export function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [laps, setLaps] = useState<LapItem[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const lastLapElapsedRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // High precision animation frame tick
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const tick = () => {
      if (startTimeRef.current !== null) {
        const currentElapsed = accumulatedMsRef.current + (Date.now() - startTimeRef.current);
        setElapsedMs(currentElapsed);
      }
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isRunning, isPaused]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      setElapsedMs(accumulatedMsRef.current);
    }
    startTimeRef.current = null;
    setIsPaused(true);
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  }, [isRunning, isPaused]);

  const reset = useCallback(() => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setElapsedMs(0);
    setLaps([]);
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    lastLapElapsedRef.current = 0;
  }, []);

  const recordLap = useCallback(() => {
    if (!isRunning) return;

    const currentTotal = startTimeRef.current !== null
      ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
      : accumulatedMsRef.current;

    const lapDuration = currentTotal - lastLapElapsedRef.current;
    lastLapElapsedRef.current = currentTotal;

    const newLap: LapItem = {
      id: `lap-${Date.now()}-${laps.length + 1}`,
      lapNumber: laps.length + 1,
      lapTimeMs: lapDuration,
      overallTimeMs: currentTotal,
    };

    setLaps((prev) => [newLap, ...prev]);
  }, [isRunning, laps.length]);

  // Compute fastest and slowest lap IDs
  let fastestLapId: string | null = null;
  let slowestLapId: string | null = null;

  if (laps.length >= 2) {
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const lap of laps) {
      if (lap.lapTimeMs < minTime) {
        minTime = lap.lapTimeMs;
        fastestLapId = lap.id;
      }
      if (lap.lapTimeMs > maxTime) {
        maxTime = lap.lapTimeMs;
        slowestLapId = lap.id;
      }
    }
  }

  return {
    elapsedMs,
    isRunning,
    isPaused,
    laps,
    fastestLapId,
    slowestLapId,
    start,
    pause,
    resume,
    reset,
    recordLap,
  };
}
