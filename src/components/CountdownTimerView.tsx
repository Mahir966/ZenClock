'use client';

import React, { useState } from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { useTimer } from '@/hooks/useTimer';
import { ZenMinimalLayout } from './layouts/ZenMinimalLayout';
import { StudioModernLayout } from './layouts/StudioModernLayout';
import { CyberNeonLayout } from './layouts/CyberNeonLayout';
import { Spatial3DLayout } from './layouts/Spatial3DLayout';
import { CustomTimePickerModal } from './CustomTimePickerModal';
import { formatTime } from '@/lib/utils';

export const CountdownTimerView: React.FC = () => {
  const { preferences, triggerAlarm } = useZenClock();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const timer = useTimer({
    initialDurationSeconds: 1500, // 25 mins initial
    onComplete: () => {
      triggerAlarm(`Timer (${formatTime(timer.duration)}) has finished!`);
    },
  });

  const layoutProps = {
    remaining: timer.remaining,
    duration: timer.duration,
    progress: timer.progress,
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    onStart: timer.start,
    onPause: timer.pause,
    onResume: timer.resume,
    onReset: timer.reset,
    onOpenCustomPicker: () => setIsPickerOpen(true),
    onAddSeconds: timer.addSeconds,
    modeTitle: 'Countdown Timer',
    subTitle: `Total: ${formatTime(timer.duration)}`,
    accentColor: '#38bdf8',
  };

  return (
    <div className="flex flex-col items-center w-full px-4 py-2">
      <div className="w-full">
        {preferences.layout === 'zen' && <ZenMinimalLayout {...layoutProps} />}
        {preferences.layout === 'studio' && <StudioModernLayout {...layoutProps} />}
        {preferences.layout === 'cyber' && <CyberNeonLayout {...layoutProps} />}
        {preferences.layout === 'spatial' && <Spatial3DLayout {...layoutProps} />}
      </div>

      <CustomTimePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSetTime={(totalSeconds) => {
          timer.setCustomDuration(totalSeconds);
        }}
        initialSeconds={timer.duration}
      />
    </div>
  );
};
