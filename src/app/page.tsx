'use client';

import React, { useState } from 'react';
import { ZenClockProvider } from '@/context/ZenClockContext';
import { Header } from '@/components/Header';
import { ThreeVisualizer } from '@/components/ThreeVisualizer';
import { CountdownTimerView } from '@/components/CountdownTimerView';
import { StudyTimerView } from '@/components/StudyTimerView';
import { StopwatchView } from '@/components/StopwatchView';
import { AnalogClock } from '@/components/AnalogClock';
import { SoundPermissionPrompt } from '@/components/SoundPermissionPrompt';
import { AlarmAlertModal } from '@/components/AlarmAlertModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Sparkles, BookOpen, Watch, Clock, ChevronUp } from 'lucide-react';

function ZenClockMain() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Three.js Subtle 3D Ambient Visualizer Canvas */}
      <ThreeVisualizer mode="timer" />

      {/* Sticky Main Header with One-Page Anchor Navigation */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Single-Page Continuous Workspace */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-20 sm:space-y-28">
        {/* SECTION 1: COUNTDOWN TIMER */}
        <section id="timer" className="scroll-mt-24 flex flex-col items-center">
          <div className="text-center mb-6">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-500 border border-sky-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>01 // Focus Timer</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Precision Countdown
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Custom durations, quick increments, and real-time background-tab accuracy with 4 switchable UI aesthetics.
            </p>
          </div>

          <div className="w-full glass-panel rounded-3xl p-4 sm:p-8 shadow-xl">
            <CountdownTimerView />
          </div>
        </section>

        {/* SECTION 2: STUDY & POMODORO */}
        <section id="study" className="scroll-mt-24 flex flex-col items-center">
          <div className="text-center mb-6">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-500/10 text-purple-500 border border-purple-500/20 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>02 // Study & Pomodoro</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Deep Work & Interval Training
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Science-backed Pomodoro cycles (25/5), 50m Deep Work blocks, and automatic break transitions.
            </p>
          </div>

          <div className="w-full glass-panel rounded-3xl p-4 sm:p-8 shadow-xl">
            <StudyTimerView />
          </div>
        </section>

        {/* SECTION 3: STOPWATCH & LAPS */}
        <section id="stopwatch" className="scroll-mt-24 flex flex-col items-center">
          <div className="text-center mb-6">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
              <Watch className="w-3.5 h-3.5" />
              <span>03 // Stopwatch & Laps</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Split-Second Chronograph
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Millisecond precision with lap recording, fastest/slowest lap detection, and instant clipboard export.
            </p>
          </div>

          <div className="w-full glass-panel rounded-3xl p-4 sm:p-8 shadow-xl">
            <StopwatchView />
          </div>
        </section>

        {/* SECTION 4: ANALOG OBSERVATORY */}
        <section id="clock" className="scroll-mt-24 flex flex-col items-center">
          <div className="text-center mb-6">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>04 // Live Observatory</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              System Analog & Digital Clock
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Real-time synchronization with continuous sweeping second hand, date complications, and timezone telemetry.
            </p>
          </div>

          <div className="w-full glass-panel rounded-3xl p-4 sm:p-8 shadow-xl">
            <AnalogClock />
          </div>
        </section>
      </main>

      {/* Floating Scroll to Top Pill */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 z-40 p-3 rounded-full bg-slate-900/80 dark:bg-slate-100/80 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-xl backdrop-blur-md transition-all active:scale-95 group"
        title="Scroll to Top"
      >
        <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Modern Minimalist Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 text-center select-none border-t border-slate-200/50 dark:border-slate-800/50 mt-16">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">ZenClock</span>
          <span>•</span>
          <span>All-in-One Focus Suite</span>
          <span>•</span>
          <span>[M] Mute Audio</span>
          <span>•</span>
          <span>[Esc] Dismiss Alert</span>
          <span>•</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-sky-500 underline underline-offset-2 transition-colors font-medium text-slate-600 dark:text-slate-400"
          >
            Preferences & Alarm Sounds
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
