'use client';

import React from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { BellOff, BellRing, Sparkles, VolumeX } from 'lucide-react';

interface AlarmAlertModalProps {
  onDismissCallback?: () => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({ onDismissCallback }) => {
  const { isAlarmActive, alarmMessage, dismissAlarm, preferences } = useZenClock();

  if (!isAlarmActive) return null;

  const handleDismiss = () => {
    dismissAlarm();
    onDismissCallback?.();
  };

  return (
    <>
      {/* Intense Blinking Screen Flasher */}
      <div
        className="fixed inset-0 z-50 pointer-events-none animate-alarm-flash opacity-90 transition-opacity"
        aria-hidden="true"
      />

      {/* Central Dismissal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-slate-950/95 border-2 border-red-500 rounded-3xl p-8 sm:p-10 shadow-[0_0_80px_rgba(239,68,68,0.8)] text-center text-white backdrop-blur-2xl animate-bounceSubtle">
          {/* Animated Alarm Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse">
            <BellRing className="w-10 h-10 text-red-400 animate-wiggle" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
            Time&apos;s Up!
          </h2>

          <p className="mt-3 text-lg sm:text-xl font-medium text-red-200">
            {alarmMessage}
          </p>

          {preferences.isMuted && (
            <div className="inline-flex items-center space-x-1.5 mt-3 px-3 py-1 rounded-full bg-slate-900 border border-red-500/40 text-xs font-semibold text-red-300">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Audio is Muted • Visual Alert Active</span>
            </div>
          )}

          {/* Huge Unmissable Dismiss Button */}
          <div className="mt-8">
            <button
              onClick={handleDismiss}
              autoFocus
              className="w-full py-4 px-8 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xl tracking-wider uppercase shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3 cursor-pointer"
            >
              <BellOff className="w-6 h-6" />
              <span>Dismiss Alarm</span>
            </button>
          </div>

          <p className="mt-4 text-xs font-medium text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">ESC</kbd> to stop alert
          </p>
        </div>
      </div>
    </>
  );
};
