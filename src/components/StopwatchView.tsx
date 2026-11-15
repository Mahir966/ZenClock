'use client';

import React, { useState } from 'react';
import { useStopwatch } from '@/hooks/useStopwatch';
import { formatStopwatch } from '@/lib/utils';
import { Play, Pause, RotateCcw, Flag, Copy, Check, ArrowDown, ArrowUp } from 'lucide-react';

export const StopwatchView: React.FC = () => {
  const {
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
  } = useStopwatch();

  const [copied, setCopied] = useState(false);
  const { main, milliseconds } = formatStopwatch(elapsedMs);

  const handleCopyLaps = () => {
    if (laps.length === 0) return;
    const lines = [
      'ZenClock - Stopwatch Lap Times',
      '--------------------------------',
      ...laps.map((l) => {
        const lapFormatted = formatStopwatch(l.lapTimeMs);
        const overallFormatted = formatStopwatch(l.overallTimeMs);
        return `Lap ${l.lapNumber.toString().padStart(2, '0')}: +${lapFormatted.main}.${lapFormatted.milliseconds} (Total: ${overallFormatted.main}.${overallFormatted.milliseconds})`;
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4 py-6">
      {/* Stopwatch Display */}
      <div className="flex flex-col items-center justify-center my-6 select-none">
        <div className="flex items-baseline justify-center">
          <span className="text-6xl sm:text-7xl md:text-8xl font-mono font-bold tracking-tight tabular-timer">
            {main}
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-medium text-sky-500 tabular-timer ml-1.5 sm:ml-2">
            .{milliseconds}
          </span>
        </div>

        {/* Status Subtitle */}
        <p className="mt-2 text-xs sm:text-sm font-medium uppercase tracking-widest text-slate-400">
          {isRunning ? 'Timing Active' : isPaused ? 'Paused' : 'Ready'}
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4 my-4 w-full">
        {!isRunning && !isPaused && (
          <button
            onClick={start}
            className="flex-1 max-w-[200px] py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/25 transition-all transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start</span>
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={recordLap}
              className="flex-1 max-w-[160px] py-3.5 px-5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-base flex items-center justify-center space-x-2 border border-slate-300/40 dark:border-slate-700/60 transition-all active:scale-95"
            >
              <Flag className="w-4 h-4 text-sky-500" />
              <span>Lap</span>
            </button>

            <button
              onClick={pause}
              className="flex-1 max-w-[160px] py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-base flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={reset}
              className="flex-1 max-w-[160px] py-3.5 px-5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-base flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              onClick={resume}
              className="flex-1 max-w-[160px] py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>
          </>
        )}
      </div>

      {/* Laps List Section */}
      {laps.length > 0 && (
        <div className="w-full mt-6 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Lap ({laps.length})</span>
            <div className="flex items-center space-x-4">
              <span>Split Time</span>
              <span>Overall</span>
              <button
                onClick={handleCopyLaps}
                title="Copy Laps"
                className="p-1 hover:text-sky-500 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-200/50 dark:divide-slate-800/50 font-mono text-sm">
            {laps.map((lap) => {
              const isFastest = lap.id === fastestLapId;
              const isSlowest = lap.id === slowestLapId;

              const splitFormatted = formatStopwatch(lap.lapTimeMs);
              const overallFormatted = formatStopwatch(lap.overallTimeMs);

              return (
                <div
                  key={lap.id}
                  className={`flex items-center justify-between py-2.5 px-1 transition-colors ${
                    isFastest
                      ? 'text-emerald-500 dark:text-emerald-400 font-semibold'
                      : isSlowest
                      ? 'text-rose-500 dark:text-rose-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 w-12 text-xs">
                      #{lap.lapNumber.toString().padStart(2, '0')}
                    </span>
                    {isFastest && (
                      <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> Best
                      </span>
                    )}
                    {isSlowest && (
                      <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> Slow
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 tabular-timer">
                    <span className="text-right">
                      +{splitFormatted.main}.{splitFormatted.milliseconds}
                    </span>
                    <span className="text-right text-slate-400 dark:text-slate-500 text-xs">
                      {overallFormatted.main}.{overallFormatted.milliseconds}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
