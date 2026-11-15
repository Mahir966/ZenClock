'use client';

import React from 'react';
import { formatTime } from '@/lib/utils';
import { Play, Pause, RotateCcw, SlidersHorizontal, Terminal, Activity, ShieldCheck } from 'lucide-react';

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

export const CyberNeonLayout: React.FC<LayoutProps> = ({
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
  modeTitle = 'SYSTEM PROTOCOL',
  subTitle,
}) => {
  const timeFormatted = formatTime(remaining);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4 select-none animate-fadeIn">
      {/* Top Cyber Telemetry Bar */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-cyan-500/80 mb-6 px-4 border-b border-cyan-500/20 pb-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>CYBER_TIMER://{modeTitle.toUpperCase().replace(/\s+/g, '_')}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400">SYNC_OK</span>
          </span>
          <span className="text-cyan-400/60">{subTitle || 'ACTIVE'}</span>
        </div>
      </div>

      {/* Cyber Frame Container with Glowing Brackets */}
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-slate-950/80 border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        {/* Glowing Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        {/* Status Chip */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
            STATUS: {isRunning ? 'EXECUTING' : isPaused ? 'HALTED' : 'STANDBY'}
          </span>
          <span className="text-xs font-mono text-cyan-300 tabular-timer">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Main Monospace Countdown */}
        <div className="flex flex-col items-center my-4">
          <span
            onClick={onOpenCustomPicker}
            className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] cursor-pointer hover:brightness-125 transition-all tabular-timer"
          >
            {timeFormatted}
          </span>
        </div>

        {/* Cyber Frequency Visualizer Bars */}
        <div className="flex items-end justify-center space-x-1 h-6 my-4">
          {Array.from({ length: 24 }).map((_, i) => {
            const heightFactor = isRunning
              ? Math.sin(i * 0.5 + Date.now() * 0.005) * 0.5 + 0.5
              : 0.15;
            return (
              <div
                key={i}
                className="w-1.5 bg-cyan-400/80 rounded-full transition-all duration-150"
                style={{
                  height: `${Math.max(4, heightFactor * 24)}px`,
                  opacity: isRunning ? 0.9 : 0.25,
                }}
              />
            );
          })}
        </div>

        {/* Cyber Segmented Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-cyan-900">
          <div
            className="bg-cyan-400 h-full shadow-[0_0_10px_#22d3ee] transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Cyber Controls */}
      <div className="flex items-center justify-center space-x-4 mt-8">
        <button
          onClick={onReset}
          className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-400 transition-all active:scale-95"
          title="System Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {!isRunning && !isPaused && (
          <button
            onClick={onStart}
            className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-black text-base flex items-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>EXECUTE</span>
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-base flex items-center space-x-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all active:scale-95"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span>SUSPEND</span>
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-base flex items-center space-x-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>
        )}

        <button
          onClick={onOpenCustomPicker}
          className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-400 transition-all active:scale-95"
          title="Configure Parameters"
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
            className="px-3 py-1 rounded-lg text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 transition-all"
          >
            +{s / 60}M
          </button>
        ))}
      </div>
    </div>
  );
};
