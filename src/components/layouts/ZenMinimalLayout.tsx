'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';
import { Play, Pause, RotateCcw, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';

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
  accentColor?: string;
}

export const ZenMinimalLayout: React.FC<LayoutProps> = ({
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
  modeTitle = 'Zen Timer',
  subTitle,
  accentColor = '#38bdf8',
}) => {
  const timeFormatted = formatTime(remaining);
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  // Progress stroke dashoffset: 1 is empty, 0 is full
  const strokeDashoffset = circumference - (1 - progress) * circumference;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-4 select-none animate-fadeIn">
      {/* Mode Tag */}
      <div className="mb-6 flex items-center space-x-2">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-sky-500/10 text-sky-500 border border-sky-500/20 backdrop-blur-md">
          <Sparkles className="w-3 h-3" />
          <span>{modeTitle}</span>
        </span>
        {subTitle && (
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            • {subTitle}
          </span>
        )}
      </div>

      {/* Breathing Circular Progress Ring */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Breathing Glow */}
        <div
          className={`absolute inset-4 rounded-full blur-3xl transition-all duration-1000 ${
            isRunning ? 'opacity-30 scale-105' : 'opacity-10 scale-95'
          }`}
          style={{ backgroundColor: accentColor }}
        />

        <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
            {/* Background Track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              className="stroke-slate-200/50 dark:stroke-slate-800/60"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Animated Progress Arc */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke={accentColor}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              onClick={onOpenCustomPicker}
              title="Click to set custom duration"
              className="text-5xl sm:text-6xl font-mono font-bold tracking-tight cursor-pointer hover:opacity-85 transition-opacity tabular-timer"
            >
              {timeFormatted}
            </span>
            <span className="mt-2 text-xs font-medium text-slate-400 tracking-widest uppercase">
              {isRunning ? 'Flow State' : isPaused ? 'Paused' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-5 mt-8">
        {/* Reset */}
        <button
          onClick={onReset}
          title="Reset Timer"
          className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Start / Pause / Resume */}
        {!isRunning && !isPaused && (
          <button
            onClick={onStart}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-xl shadow-sky-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Pause className="w-8 h-8 fill-current" />
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}

        {/* Set Duration Picker */}
        <button
          onClick={onOpenCustomPicker}
          title="Customize Duration"
          className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Add Presets Pills */}
      <div className="flex items-center space-x-2 mt-6">
        {[
          { label: '+1m', sec: 60 },
          { label: '+5m', sec: 300 },
          { label: '+10m', sec: 600 },
          { label: '+15m', sec: 900 },
        ].map(({ label, sec }) => (
          <button
            key={label}
            onClick={() => onAddSeconds(sec)}
            className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
