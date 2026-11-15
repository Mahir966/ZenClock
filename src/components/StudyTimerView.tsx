'use client';

import React from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { StudyMode } from '@/lib/types';
import { ZenMinimalLayout } from './layouts/ZenMinimalLayout';
import { StudioModernLayout } from './layouts/StudioModernLayout';
import { CyberNeonLayout } from './layouts/CyberNeonLayout';
import { Spatial3DLayout } from './layouts/Spatial3DLayout';
import { CustomTimePickerModal } from './CustomTimePickerModal';
import { SkipForward, Coffee, Flame, Zap, Award, RotateCcw } from 'lucide-react';

export const StudyTimerView: React.FC = () => {
  const { preferences, triggerAlarm, incrementCompletedPomodoros, resetCompletedPomodoros } = useZenClock();
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  const study = useStudyTimer({
    settings: preferences.studySettings,
    onWorkComplete: (mode, sessionNumber) => {
      incrementCompletedPomodoros();
      triggerAlarm(`Focus Session ${sessionNumber} Complete! Take a well-earned break.`);
    },
    onBreakComplete: () => {
      triggerAlarm('Break is finished! Ready to step back into flow?');
    },
    onCycleComplete: () => {
      triggerAlarm('Cycle Complete! 4 focus blocks finished. Enjoy your long break!');
    },
  });

  const getModeTitle = () => {
    if (study.isBreak) {
      return study.currentSession % preferences.studySettings.sessionsBeforeLongBreak === 0
        ? 'Long Break'
        : 'Short Break';
    }
    switch (study.mode) {
      case 'deep_work':
        return 'Deep Work Block';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Pomodoro Focus';
    }
  };

  const getAccentColor = () => {
    if (study.isBreak) return '#10b981'; // Emerald
    if (study.mode === 'deep_work') return '#8b5cf6'; // Purple
    return '#38bdf8'; // Sky
  };

  const layoutProps = {
    remaining: study.remaining,
    duration: study.duration,
    progress: study.progress,
    isRunning: study.isRunning,
    isPaused: study.isPaused,
    onStart: study.start,
    onPause: study.pause,
    onResume: study.resume,
    onReset: study.reset,
    onOpenCustomPicker: () => setIsPickerOpen(true),
    onAddSeconds: (s: number) => {
      // not directly altering study timer duration preset, but provides nice manual bump if needed
      study.switchMode(study.mode, study.isBreak);
    },
    modeTitle: getModeTitle(),
    subTitle: `Session ${study.currentSession} of ${preferences.studySettings.sessionsBeforeLongBreak}`,
    accentColor: getAccentColor(),
  };

  return (
    <div className="flex flex-col items-center w-full px-4 py-2">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md mb-4 max-w-full overflow-x-auto">
        <button
          onClick={() => study.switchMode('pomodoro', false)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            study.mode === 'pomodoro' && !study.isBreak
              ? 'bg-white dark:bg-slate-900 text-sky-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Pomodoro (25m)</span>
        </button>

        <button
          onClick={() => study.switchMode('deep_work', false)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            study.mode === 'deep_work' && !study.isBreak
              ? 'bg-white dark:bg-slate-900 text-purple-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Deep Work (50m)</span>
        </button>

        <button
          onClick={() => study.switchMode('short_break', true)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            study.isBreak && study.remaining <= preferences.studySettings.shortBreakMinutes * 60
              ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Short Break (5m)</span>
        </button>

        <button
          onClick={() => study.switchMode('long_break', true)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            study.isBreak && study.remaining > preferences.studySettings.shortBreakMinutes * 60
              ? 'bg-white dark:bg-slate-900 text-teal-500 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Long Break (15m)</span>
        </button>
      </div>

      {/* Cycle Progress Dots & Streak Tracker */}
      <div className="flex items-center justify-between w-full max-w-md px-4 mb-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Cycle:</span>
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: preferences.studySettings.sessionsBeforeLongBreak }).map((_, i) => {
              const sessionIndex = i + 1;
              const isCurrent = sessionIndex === study.currentSession;
              const isPast = sessionIndex < study.currentSession;
              return (
                <div
                  key={i}
                  title={`Session ${sessionIndex}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-6 bg-sky-500 shadow-sm shadow-sky-500/50'
                      : isPast
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Skip to Next Session Button */}
        <button
          onClick={study.skipToNext}
          className="flex items-center space-x-1 text-slate-400 hover:text-sky-500 transition-colors"
          title="Skip to next session / break"
        >
          <span>Skip</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Layout Container */}
      <div className="w-full">
        {preferences.layout === 'zen' && <ZenMinimalLayout {...layoutProps} />}
        {preferences.layout === 'studio' && <StudioModernLayout {...layoutProps} />}
        {preferences.layout === 'cyber' && <CyberNeonLayout {...layoutProps} />}
        {preferences.layout === 'spatial' && <Spatial3DLayout {...layoutProps} />}
      </div>

      {/* Completed Today Badge */}
      <div className="mt-4 flex items-center space-x-3 text-xs text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 px-3.5 py-1.5 rounded-full border border-slate-200/40 dark:border-slate-800">
        <Award className="w-3.5 h-3.5 text-amber-500" />
        <span>
          <strong>{preferences.completedPomodoros}</strong> focus sessions completed today
        </span>
        {preferences.completedPomodoros > 0 && (
          <button
            onClick={resetCompletedPomodoros}
            title="Reset daily count"
            className="hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      <CustomTimePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSetTime={(secs) => {
          // allows custom time
          study.reset();
        }}
        initialSeconds={study.duration}
      />
    </div>
  );
};
