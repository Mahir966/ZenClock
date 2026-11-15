'use client';

import React, { useState } from 'react';
import { X, Check, Clock, Plus, Minus } from 'lucide-react';
import { splitSeconds } from '@/lib/utils';
import { TIMER_PRESETS } from '@/lib/constants';

interface CustomTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetTime: (totalSeconds: number) => void;
  initialSeconds: number;
}

export const CustomTimePickerModal: React.FC<CustomTimePickerModalProps> = ({
  isOpen,
  onClose,
  onSetTime,
  initialSeconds,
}) => {
  const initial = splitSeconds(initialSeconds);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [seconds, setSeconds] = useState(initial.seconds);

  if (!isOpen) return null;

  const handleApply = () => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total > 0) {
      onSetTime(total);
      onClose();
    }
  };

  const handlePreset = (presetSecs: number) => {
    const s = splitSeconds(presetSecs);
    setHours(s.hours);
    setMinutes(s.minutes);
    setSeconds(s.seconds);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100">
            <Clock className="w-5 h-5 text-sky-500" />
            <h3 className="font-semibold text-lg">Set Custom Timer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Spinners / Counters */}
        <div className="flex items-center justify-center space-x-4 my-6">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setHours((h) => Math.min(23, h + 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-3xl sm:text-4xl font-mono font-bold my-2 w-16 text-center tabular-timer">
              {pad(hours)}
            </span>
            <button
              onClick={() => setHours((h) => Math.max(0, h - 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-wider">Hours</span>
          </div>

          <span className="text-3xl font-mono font-bold text-slate-300 dark:text-slate-700 pb-6">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setMinutes((m) => (m >= 59 ? 0 : m + 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-3xl sm:text-4xl font-mono font-bold my-2 w-16 text-center tabular-timer">
              {pad(minutes)}
            </span>
            <button
              onClick={() => setMinutes((m) => (m <= 0 ? 59 : m - 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-wider">Mins</span>
          </div>

          <span className="text-3xl font-mono font-bold text-slate-300 dark:text-slate-700 pb-6">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSeconds((s) => (s >= 59 ? 0 : s + 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-3xl sm:text-4xl font-mono font-bold my-2 w-16 text-center tabular-timer">
              {pad(seconds)}
            </span>
            <button
              onClick={() => setSeconds((s) => (s <= 0 ? 59 : s - 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-wider">Secs</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Popular Presets</p>
          <div className="grid grid-cols-4 gap-2">
            {[60, 300, 600, 900, 1500, 1800, 2700, 3600].map((s) => {
              const label = s < 3600 ? `${s / 60}m` : `${s / 3600}h`;
              return (
                <button
                  key={s}
                  onClick={() => handlePreset(s)}
                  className="py-1.5 px-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 hover:text-sky-500 border border-transparent hover:border-sky-500/30 transition-all"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={hours === 0 && minutes === 0 && seconds === 0}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/25 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Duration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
