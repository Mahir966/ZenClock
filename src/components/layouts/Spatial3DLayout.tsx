'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';
import { Play, Pause, RotateCcw, SlidersHorizontal, Orbit, Sparkles } from 'lucide-react';

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

export const Spatial3DLayout: React.FC<LayoutProps> = ({
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
  modeTitle = 'Spatial Focus',
  subTitle,
}) => {
  const timeFormatted = formatTime(remaining);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4 select-none animate-fadeIn">
      {/* 3D Orbit Badge */}
      <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-6 text-indigo-400">
        <Orbit className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="text-xs font-medium tracking-wide">
          {modeTitle} {subTitle ? `• ${subTitle}` : ''}
        </span>
      </div>

      {/* Spatial Holographic Floating Capsule */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        {/* Outer Spatial Ring with dynamic glow */}
        <div
          className={`absolute inset-0 rounded-full border border-indigo-500/30 transition-all duration-700 ${
            isRunning ? 'scale-100 shadow-[0_0_60px_rgba(99,102,241,0.25)]' : 'scale-95 opacity-60'
          }`}
        />

        {/* Inner Glass Sphere */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-purple-500/10 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          <span
            onClick={onOpenCustomPicker}
            title="Set custom duration"
            className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-105 transition-all tabular-timer"
          >
            {timeFormatted}
          </span>

          <span className="mt-2 text-xs font-mono uppercase tracking-widest text-indigo-300/80">
            {isRunning ? 'Spatial Active' : isPaused ? 'Paused' : 'Idle'}
          </span>

          {/* Spherical Progress Arc Indicator */}
          <div className="w-32 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Spatial Controls */}
      <div className="flex items-center justify-center space-x-4 mt-8">
        <button
          onClick={onReset}
          className="p-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 transition-all active:scale-95"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {!isRunning && !isPaused && (
          <button
            onClick={onStart}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95"
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

        <button
          onClick={onOpenCustomPicker}
          className="p-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 transition-all active:scale-95"
          title="Set Duration"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Add Presets */}
      <div className="flex items-center space-x-2 mt-6">
        {[60, 300, 600, 900].map((s) => (
          <button
            key={s}
            onClick={() => onAddSeconds(s)}
            className="px-3 py-1 rounded-full text-xs font-medium text-indigo-300/80 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/20 transition-all"
          >
            +{s / 60}m
          </button>
        ))}
      </div>
    </div>
  );
};
