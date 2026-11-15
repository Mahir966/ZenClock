'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { LAYOUT_DEFINITIONS } from '@/lib/constants';
import { LayoutType } from '@/lib/types';
import { Palette, Check, Sparkles, Disc, Terminal, Orbit, ChevronDown } from 'lucide-react';

export const LayoutSwitcher: React.FC = () => {
  const { preferences, setLayout } = useZenClock();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLayoutDef =
    LAYOUT_DEFINITIONS.find((l) => l.id === preferences.layout) || LAYOUT_DEFINITIONS[0];

  const getLayoutIcon = (id: LayoutType) => {
    switch (id) {
      case 'zen':
        return <Sparkles className="w-4 h-4 text-sky-500" />;
      case 'studio':
        return <Disc className="w-4 h-4 text-amber-500" />;
      case 'cyber':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'spatial':
        return <Orbit className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all text-slate-700 dark:text-slate-200"
        title="Switch UI Layout"
      >
        {getLayoutIcon(preferences.layout)}
        <span className="hidden sm:inline">{currentLayoutDef.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-fadeIn">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Select UI Design
            </span>
          </div>

          <div className="space-y-1 mt-1">
            {LAYOUT_DEFINITIONS.map((item) => {
              const isSelected = item.id === preferences.layout;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setLayout(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start space-x-3 p-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="mt-0.5">{getLayoutIcon(item.id)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{item.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {item.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
