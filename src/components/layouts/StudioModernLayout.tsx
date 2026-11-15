'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';
import { Play, Pause, RotateCcw, SlidersHorizontal, Plus, Disc } from 'lucide-react';

interface LayoutProps {
  remaining: number;
  duration: number;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onOpenCustomPicker: () => void;
  onAddSeconds: (seconds: number) => void;
  modeTitle?: string;
  subTitle?: string;
}

export const StudioModernLayout: React.FC<LayoutProps> = ({
  remaining,
  duration,
  progress,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onReset,
  onOpenCustomPicker,
  onAddSeconds,
  modeTitle = 'Studio Clock',
  subTitle,
}) => {
  const timeFormatted = formatTime(remaining);
  const totalTicks = 48;
  const activeTicks = Math.floor(progress * totalTicks);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4 select-none animate-fadeIn">
      {/* Studio Header Badge */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
          {modeTitle} {subTitle ? `// ${subTitle}` : ''}
        </span>
      </div>

      {/* Segmented Dial Interface */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        {/* Circular Dial Radial Ticks */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 360 360">
          {Array.from({ length: totalTicks }).map((_, i) => {
            const angle = (i / totalTicks) * 360;
            const rad = (angle * Math.PI) / 180;
            const isActive = i <= activeTicks;
            const isMajor = i % 4 === 0;

            const r1 = isMajor ? 146 : 152;
            const r2 = 168;

            const x1 = 180 + r1 * Math.cos(rad);
            const y1 = 180 + r1 * Math.sin(rad);
            const x2 = 180 + r2 * Math.cos(rad);
            const y2 = 180 + r2 * Math.sin(rad);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  isActive
                    ? '#f59e0b'
                    : isMajor
                    ? 'currentColor'
                    : 'currentColor'
                }
                className={
                  isActive
                    ? 'stroke-amber-500'
                    : 'stroke-slate-200 dark:stroke-slate-800'
                }
                strokeWidth={isMajor ? 3.5 : 2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center Card */}
        <div className="absolute inset-16 rounded-full bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
          <span
            onClick={onOpenCustomPicker}
            title="Set custom duration"
            className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight cursor-pointer hover:text-amber-500 transition-colors tabular-timer"
          >
            {timeFormatted}
          </span>
          <div className="flex items-center space-x-1.5 mt-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
            <span>{Math.round(progress * 100)}% COMPLETE</span>
          </div>
        </div>
      </div>

      {/* Linear Segmented Progress Bar */}
      <div className="w-full max-w-sm mt-6 px-4">
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4 mt-8">
        <button
          onClick={onReset}
          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-all active:scale-95 border border-slate-300/40 dark:border-slate-700/60"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {!isRunning && !isPaused && (
          <button
            onClick={onStart}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base flex items-center space-x-2 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START</span>
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-base flex items-center space-x-2 shadow-xl transition-all active:scale-95"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span>PAUSE</span>
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base flex items-center space-x-2 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>
        )}

        <button
          onClick={onOpenCustomPicker}
          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-all active:scale-95 border border-slate-300/40 dark:border-slate-700/60"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center space-x-2 mt-6">
        {[60, 300, 600, 900].map((s) => (
          <button
            key={s}
            onClick={() => onAddSeconds(s)}
            className="px-3 py-1 rounded-xl text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all"
          >
            +{s / 60}MIN
          </button>
        ))}
      </div>
    </div>
  );
};
