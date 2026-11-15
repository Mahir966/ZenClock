'use client';

import React from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { MainTab } from '@/lib/types';
import { LayoutSwitcher } from './LayoutSwitcher';
import {
  Timer as TimerIcon,
  BookOpen,
  Watch,
  Clock,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onOpenSettings }) => {
  const { preferences, setTheme, toggleMute, toggleFullscreen, isFullscreen } = useZenClock();

  const isDark = preferences.theme === 'dark';

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'timer', label: 'Timer', icon: TimerIcon },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'stopwatch', label: 'Stopwatch', icon: Watch },
    { id: 'clock', label: 'Analog Clock', icon: Clock },
  ];

  return (
    <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 select-none relative z-20">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              ZenClock
            </h1>
          </div>
        </div>

        {/* Desktop Navigation Pill Bar */}
        <nav className="hidden md:flex items-center space-x-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Layout Switcher */}
          <LayoutSwitcher />

          {/* Dedicated Mute / Unmute Button */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full border transition-all ${
              preferences.isMuted
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60'
            }`}
            title={preferences.isMuted ? 'Unmute Audio (Visual alerts still active)' : 'Mute Audio'}
          >
            {preferences.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all hidden sm:flex"
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all"
            title="Settings & Alarm Sounds"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom/Sub Navigation Bar */}
      <div className="flex md:hidden items-center justify-around mt-3 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-500 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
