'use client';

import React, { useState } from 'react';
import { useZenClock } from '@/context/ZenClockContext';
import { SOUND_OPTIONS } from '@/lib/audio';
import {
  X,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Square,
  Sparkles,
  BookOpen,
  Orbit,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_STUDY_SETTINGS } from '@/lib/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    preferences,
    setSelectedSound,
    setVolume,
    toggleMute,
    setEnable3D,
    updateStudySettings,
    previewSound,
    stopPreview,
    previewingSoundId,
  } = useZenClock();

  const [activeTab, setActiveTab] = useState<'sound' | 'study' | 'display'>('sound');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Preferences</h3>
          </div>
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2">
          {[
            { id: 'sound', label: 'Alarm Sounds', icon: Volume2 },
            { id: 'study', label: 'Study Sessions', icon: BookOpen },
            { id: 'display', label: '3D & Visuals', icon: Orbit },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'sound' | 'study' | 'display')}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-sky-500 text-sky-500'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: ALARM SOUNDS */}
          {activeTab === 'sound' && (
            <div className="space-y-6">
              {/* Volume Slider & Mute Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {preferences.isMuted ? (
                      <VolumeX className="w-5 h-5 text-rose-500" />
                    ) : preferences.volume > 0.5 ? (
                      <Volume2 className="w-5 h-5 text-sky-500" />
                    ) : (
                      <Volume1 className="w-5 h-5 text-sky-500" />
                    )}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Master Volume ({Math.round(preferences.volume * 100)}%)
                    </span>
                  </div>

                  <button
                    onClick={toggleMute}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-colors ${
                      preferences.isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {preferences.isMuted ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>Muted</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Audio On</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={preferences.volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    disabled={preferences.isMuted}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Sound Selection List */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Android-Inspired Tone
                </label>

                <div className="space-y-2">
                  {SOUND_OPTIONS.map((snd) => {
                    const isSelected = snd.id === preferences.selectedSound;
                    const isPreviewing = previewingSoundId === snd.id;

                    return (
                      <div
                        key={snd.id}
                        onClick={() => setSelectedSound(snd.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/40 text-slate-900 dark:text-slate-100'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-sky-500 bg-sky-500'
                                : 'border-slate-400 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{snd.name}</div>
                            <div className="text-xs text-slate-400">{snd.description}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPreviewing) {
                              stopPreview();
                            } else {
                              previewSound(snd.id);
                            }
                          }}
                          className={`p-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                            isPreviewing
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-sky-500 hover:text-white text-slate-600 dark:text-slate-300'
                          }`}
                          title="Preview sound"
                        >
                          {isPreviewing ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Preview</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDY SESSIONS */}
          {activeTab === 'study' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Work duration */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pomodoro Focus Time
                  </label>
                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={preferences.studySettings.workMinutes}
                      onChange={(e) =>
                        updateStudySettings({ workMinutes: Math.max(1, parseInt(e.target.value) || 25) })
                      }
                      className="w-20 text-xl font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-center"
                    />
                    <span className="text-sm font-medium text-slate-500">minutes</span>
                  </div>
                </div>

                {/* Short break duration */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Short Break Time
                  </label>
                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={preferences.studySettings.shortBreakMinutes}
                      onChange={(e) =>
                        updateStudySettings({ shortBreakMinutes: Math.max(1, parseInt(e.target.value) || 5) })
                      }
                      className="w-20 text-xl font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-center"
                    />
                    <span className="text-sm font-medium text-slate-500">minutes</span>
                  </div>
                </div>

                {/* Long break duration */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Long Break Time
                  </label>
                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={preferences.studySettings.longBreakMinutes}
                      onChange={(e) =>
                        updateStudySettings({ longBreakMinutes: Math.max(1, parseInt(e.target.value) || 15) })
                      }
                      className="w-20 text-xl font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-center"
                    />
                    <span className="text-sm font-medium text-slate-500">minutes</span>
                  </div>
                </div>

                {/* Sessions before long break */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sessions Before Long Break
                  </label>
                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={preferences.studySettings.sessionsBeforeLongBreak}
                      onChange={(e) =>
                        updateStudySettings({ sessionsBeforeLongBreak: Math.max(1, parseInt(e.target.value) || 4) })
                      }
                      className="w-20 text-xl font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-center"
                    />
                    <span className="text-sm font-medium text-slate-500">sessions</span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Auto-start Breaks</div>
                    <div className="text-xs text-slate-400">Begin break countdown immediately after focus session finishes</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.studySettings.autoStartBreaks}
                    onChange={(e) => updateStudySettings({ autoStartBreaks: e.target.checked })}
                    className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Auto-start Pomodoros</div>
                    <div className="text-xs text-slate-400">Begin focus session automatically after break finishes</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.studySettings.autoStartPomodoros}
                    onChange={(e) => updateStudySettings({ autoStartPomodoros: e.target.checked })}
                    className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Reset Defaults Button */}
              <button
                onClick={() => updateStudySettings(DEFAULT_STUDY_SETTINGS)}
                className="text-xs text-slate-400 hover:text-sky-500 flex items-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset study durations to standard 25/5 defaults</span>
              </button>
            </div>
          )}

          {/* TAB 3: 3D & DISPLAY */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Orbit className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Three.js 3D Ambient Visuals</div>
                    <div className="text-xs text-slate-400">
                      Renders interactive particle torus and gyroscopic rings. Disable for battery saving.
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={preferences.enable3D}
                  onChange={(e) => setEnable3D(e.target.checked)}
                  className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
