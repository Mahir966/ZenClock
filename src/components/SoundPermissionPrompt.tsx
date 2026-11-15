'use client';

import React, { useState } from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { Volume2, VolumeX, Bell, X, ShieldCheck } from 'lucide-react';

export const SoundPermissionPrompt: React.FC = () => {
  const { preferences, grantSoundPermission } = useZenClock();
  const [dismissed, setDismissed] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  if (preferences.soundPermissionGranted || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      await grantSoundPermission();
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-40 animate-slideUp">
      <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-sky-500/30 shadow-2xl backdrop-blur-xl flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Sound for ZenClock
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Allow audio permissions so alarm tones ring reliably when your timer finishes.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Remain Muted
          </button>
          <button
            onClick={handleEnable}
            disabled={isEnabling}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center space-x-1.5 shadow-md shadow-sky-500/25 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isEnabling ? 'Activating...' : 'Enable Sound'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
