'use client';

import React, { useState } from 'react';
import { ZenClockProvider, useZenClock } from '@/context/ZenClockContext';
import { MainTab } from '@/lib/types';
import { Header } from '@/components/Header';
import { ThreeVisualizer } from '@/components/ThreeVisualizer';
import { CountdownTimerView } from '@/components/CountdownTimerView';
import { StudyTimerView } from '@/components/StudyTimerView';
import { StopwatchView } from '@/components/StopwatchView';
import { AnalogClock } from '@/components/AnalogClock';
import { SoundPermissionPrompt } from '@/components/SoundPermissionPrompt';
import { AlarmAlertModal } from '@/components/AlarmAlertModal';
import { SettingsModal } from '@/components/SettingsModal';

function ZenClockMain() {
  const [currentTab, setCurrentTab] = useState<MainTab>('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { preferences } = useZenClock();

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Three.js Subtle 3D Ambient Visualizer Canvas */}
      <ThreeVisualizer mode={currentTab} />

      {/* Main Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Application Workspace */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {currentTab === 'timer' && <CountdownTimerView />}
        {currentTab === 'study' && <StudyTimerView />}
        {currentTab === 'stopwatch' && <StopwatchView />}
        {currentTab === 'clock' && <AnalogClock />}
      </main>

      {/* Modern Minimalist Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 text-center select-none">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="font-semibold text-slate-600 dark:text-slate-400">ZenClock</span>
          <span>•</span>
          <span>[M] Mute Audio</span>
          <span>•</span>
          <span>[Esc] Dismiss Alert</span>
          <span>•</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-sky-500 underline underline-offset-2 transition-colors"
          >
            Preferences & Sounds
          </button>
        </div>
      </footer>

      {/* Overlays, Prompts & Modals */}
      <SoundPermissionPrompt />
      <AlarmAlertModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <ZenClockProvider>
      <ZenClockMain />
    </ZenClockProvider>
  );
}
