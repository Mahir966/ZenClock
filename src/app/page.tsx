'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  BellRing,
  BellOff,
  Bell,
  Clock,
  Sparkles,
  Zap,
  Coffee,
  Flame,
  Watch,
  Flag,
  Copy,
  Check,
  Plus,
  Minus,
  X,
  Orbit,
  Globe,
  SkipForward,
  Quote,
} from 'lucide-react';

import { DesignStyle, TimerMode, LapItem } from '@/lib/types';
import { SOUND_DEFINITIONS, DESIGN_STYLES, QUICK_PRESETS, MOTIVATIONAL_QUOTES } from '@/lib/constants';
import { formatTime, formatStopwatch, splitSeconds, cn, getBanglaDate, getHijriDate } from '@/lib/utils';
import {
  playAlarm,
  stopAlarm,
  previewSound,
  stopPreview,
  updateVolume,
  unlockAudio,
} from '@/lib/audio';

const STORAGE_KEY = 'zenclock_prefs_v3';

interface WeatherInfo {
  temp: number;
  icon: string;
  city: string;
}

const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌧️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '🌧️',
  85: '❄️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

export default function ZenClockApp() {
  // Application Settings & State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('zen');
  const [selectedSound, setSelectedSound] = useState('custom_alarm_1');
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [soundPermissionGranted, setSoundPermissionGranted] = useState(false);
  const [enable3D, setEnable3D] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  // Active Completion Alarm State
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState("Time's Up!");

  // Timer & Study State
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [duration, setDuration] = useState(1500); // 25 mins
  const [remaining, setRemaining] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Study Session Cycle (Pomodoro)
  const [studySessionNumber, setStudySessionNumber] = useState(1);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  // Stopwatch State
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);
  const [isSwPaused, setIsSwPaused] = useState(false);
  const [laps, setLaps] = useState<LapItem[]>([]);
  const [copiedLaps, setCopiedLaps] = useState(false);

  // System Time State (Live Clock)
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [smoothSweep, setSmoothSweep] = useState(true);
  const [use24Hour, setUse24Hour] = useState(false);

  // Custom Time Inputs state (Hours, Minutes, Seconds)
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customSeconds, setCustomSeconds] = useState(0);

  // Sound Previewing state
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Motivational Quotes State (Cycles every 1 minute)
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

  // Refs for accurate timing
  const timerTargetEndRef = useRef<number | null>(null);
  const swStartTimeRef = useRef<number | null>(null);
  const swAccumulatedRef = useRef<number>(0);
  const swLastLapElapsedRef = useRef<number>(0);
  const swAnimFrameRef = useRef<number | null>(null);
  const threeCanvasRef = useRef<HTMLDivElement>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        if (p.theme) setTheme(p.theme);
        if (p.designStyle) setDesignStyle(p.designStyle);
        if (p.selectedSound) setSelectedSound(p.selectedSound);
        if (typeof p.volume === 'number') setVolume(p.volume);
        if (typeof p.isMuted === 'boolean') setIsMuted(p.isMuted);
        if (typeof p.soundPermissionGranted === 'boolean') setSoundPermissionGranted(p.soundPermissionGranted);
        if (typeof p.enable3D === 'boolean') setEnable3D(p.enable3D);
        if (typeof p.completedPomodoros === 'number') setCompletedPomodoros(p.completedPomodoros);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch {}
  }, []);

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Save preferences
  const savePrefs = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme,
          designStyle,
          selectedSound,
          volume,
          isMuted,
          soundPermissionGranted,
          enable3D,
          completedPomodoros,
        })
      );
    } catch {}
  }, [theme, designStyle, selectedSound, volume, isMuted, soundPermissionGranted, enable3D, completedPomodoros]);

  useEffect(() => {
    savePrefs();
  }, [savePrefs]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  };

  // Quotes rotation: rotates every 1 minute (60,000ms)
  useEffect(() => {
    const quoteInterval = window.setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteFade(true);
      }, 300);
    }, 60000);
    return () => window.clearInterval(quoteInterval);
  }, []);

  // IP-based weather fetch
  useEffect(() => {
    async function fetchWeather() {
      try {
        const geo = await fetch('https://ipapi.co/json/').then((r) => r.json());
        if (!geo || !geo.latitude) return;
        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`
        ).then((r) => r.json());
        if (!wx || !wx.current_weather) return;

        const temp = Math.round(wx.current_weather.temperature);
        const code = wx.current_weather.weathercode;
        const icon = WMO_ICONS[code] || '🌡️';
        const city = geo.city || geo.region || 'Unknown';
        setWeather({ temp, icon, city });
      } catch {}
    }

    fetchWeather();
    const wxInterval = window.setInterval(fetchWeather, 1800000);
    return () => window.clearInterval(wxInterval);
  }, []);

  const handleNextQuote = () => {
    setQuoteFade(false);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      setQuoteFade(true);
    }, 200);
  };

  // Alarm Trigger & Dismiss
  const triggerAlarmAlert = useCallback(
    (msg = "Time's Up!") => {
      setAlarmMessage(msg);
      setIsAlarmActive(true);
      document.body.classList.add('alarm-active');
      document.title = "⏰ TIME'S UP! — ZenClock";
      playAlarm(selectedSound, volume, isMuted);
    },
    [selectedSound, volume, isMuted]
  );

  const dismissAlarmAlert = useCallback(() => {
    setIsAlarmActive(false);
    document.body.classList.remove('alarm-active');
    document.title = 'ZenClock — Modern Focus Suite';
    stopAlarm();
  }, []);

  // Global Keyboard shortcuts: ESC/Space to dismiss alarm, 'M' to mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (isAlarmActive && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        dismissAlarmAlert();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => {
          const next = !prev;
          updateVolume(volume, next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlarmActive, dismissAlarmAlert, volume]);

  // Real-time System Clock
  useEffect(() => {
    let anim: number;
    const updateTime = () => {
      setCurrentTime(new Date());
      anim = requestAnimationFrame(updateTime);
    };
    anim = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(anim);
  }, []);

  // Countdown timer tick loop
  useEffect(() => {
    if (!isTimerRunning || isTimerPaused) return;

    const interval = window.setInterval(() => {
      if (!timerTargetEndRef.current) return;
      const now = Date.now();
      const diffMs = timerTargetEndRef.current - now;

      if (diffMs <= 0) {
        setRemaining(0);
        setIsTimerRunning(false);
        setIsTimerPaused(false);
        timerTargetEndRef.current = null;

        if (timerMode === 'pomodoro') {
          setCompletedPomodoros((c) => c + 1);
          setStudySessionNumber((s) => (s >= 4 ? 1 : s + 1));
          triggerAlarmAlert('Pomodoro Focus Session Completed!');
        } else if (timerMode === 'deep_work') {
          triggerAlarmAlert('Deep Work Block Completed! Take a Rest.');
        } else if (timerMode === 'short_break' || timerMode === 'long_break') {
          triggerAlarmAlert('Break is Over! Ready to Focus?');
        } else {
          triggerAlarmAlert('Custom Countdown Complete!');
        }
      } else {
        const secs = Math.ceil(diffMs / 1000);
        setRemaining(secs);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [isTimerRunning, isTimerPaused, timerMode, triggerAlarmAlert]);

  // Update browser tab title with active countdown
  useEffect(() => {
    if (isAlarmActive) return;
    if (isTimerRunning && !isTimerPaused) {
      document.title = `(${formatTime(remaining)}) ZenClock`;
    } else {
      document.title = 'ZenClock — Modern Focus Suite';
    }
  }, [remaining, isTimerRunning, isTimerPaused, isAlarmActive]);

  // Timer controls
  const startTimer = () => {
    unlockAudio();
    const target = Date.now() + (remaining <= 0 ? duration : remaining) * 1000;
    timerTargetEndRef.current = target;
    if (remaining <= 0) setRemaining(duration);
    setIsTimerRunning(true);
    setIsTimerPaused(false);
  };

  const pauseTimer = () => {
    if (timerTargetEndRef.current) {
      const now = Date.now();
      const currentRemaining = Math.max(0, Math.ceil((timerTargetEndRef.current - now) / 1000));
      setRemaining(currentRemaining);
    }
    timerTargetEndRef.current = null;
    setIsTimerRunning(false);
    setIsTimerPaused(true);
  };

  const resumeTimer = () => {
    if (remaining <= 0) {
      startTimer();
      return;
    }
    unlockAudio();
    timerTargetEndRef.current = Date.now() + remaining * 1000;
    setIsTimerRunning(true);
    setIsTimerPaused(false);
  };

  const resetTimer = () => {
    timerTargetEndRef.current = null;
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setRemaining(duration);
  };

  const switchMode = (mode: TimerMode) => {
    setTimerMode(mode);
    let dur = 1500;
    if (mode === 'countdown') dur = duration || 1500;
    if (mode === 'pomodoro') dur = 1500; // 25m
    if (mode === 'deep_work') dur = 3000; // 50m
    if (mode === 'short_break') dur = 300; // 5m
    if (mode === 'long_break') dur = 900; // 15m

    setDuration(dur);
    setRemaining(dur);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    timerTargetEndRef.current = null;
  };

  const addQuickSeconds = (sec: number) => {
    if (isTimerRunning && timerTargetEndRef.current) {
      timerTargetEndRef.current += sec * 1000;
      setRemaining((r) => r + sec);
      setDuration((d) => d + sec);
    } else {
      const next = remaining + sec;
      setDuration(next);
      setRemaining(next);
    }
  };

  const applyCustomDuration = (totalSec: number) => {
    const validSec = Math.max(5, Math.min(86400, totalSec));
    setDuration(validSec);
    setRemaining(validSec);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    timerTargetEndRef.current = null;
    setIsCustomPickerOpen(false);
  };

  // Stopwatch Logic
  const stopwatchTick = useCallback(() => {
    if (!swStartTimeRef.current) return;
    const now = Date.now();
    const elapsed = swAccumulatedRef.current + (now - swStartTimeRef.current);
    setSwElapsedMs(elapsed);
    swAnimFrameRef.current = requestAnimationFrame(stopwatchTick);
  }, []);

  const startStopwatch = () => {
    swStartTimeRef.current = Date.now();
    setIsSwRunning(true);
    setIsSwPaused(false);
    swAnimFrameRef.current = requestAnimationFrame(stopwatchTick);
  };

  const pauseStopwatch = () => {
    if (swStartTimeRef.current) {
      swAccumulatedRef.current += Date.now() - swStartTimeRef.current;
      swStartTimeRef.current = null;
    }
    if (swAnimFrameRef.current) cancelAnimationFrame(swAnimFrameRef.current);
    setIsSwRunning(false);
    setIsSwPaused(true);
  };

  const resumeStopwatch = () => {
    startStopwatch();
  };

  const resetStopwatch = () => {
    if (swAnimFrameRef.current) cancelAnimationFrame(swAnimFrameRef.current);
    swStartTimeRef.current = null;
    swAccumulatedRef.current = 0;
    swLastLapElapsedRef.current = 0;
    setSwElapsedMs(0);
    setIsSwRunning(false);
    setIsSwPaused(false);
    setLaps([]);
  };

  const recordLap = () => {
    if (!isSwRunning) return;
    const currentTotal = swElapsedMs;
    const lapTime = currentTotal - swLastLapElapsedRef.current;
    swLastLapElapsedRef.current = currentTotal;

    const newLap: LapItem = {
      id: Math.random().toString(36).substring(2, 9),
      lapNumber: laps.length + 1,
      lapTimeMs: lapTime,
      overallTimeMs: currentTotal,
      timestamp: Date.now(),
    };
    setLaps((prev) => [newLap, ...prev]);
  };

  const copyLapsToClipboard = async () => {
    if (laps.length === 0) return;
    const text = laps
      .map((l) => {
        const split = formatStopwatch(l.lapTimeMs);
        const total = formatStopwatch(l.overallTimeMs);
        return `Lap ${l.lapNumber}: +${split.main}.${split.cs} (Total: ${total.main}.${total.cs})`;
      })
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLaps(true);
      setTimeout(() => setCopiedLaps(false), 2000);
    } catch {}
  };

  // Three.js ambient background
  useEffect(() => {
    if (!enable3D || !threeCanvasRef.current) return;
    const container = threeCanvasRef.current;
    container.innerHTML = '';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 850;
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 8.5 + (Math.random() - 0.5) * 2;
      const r = 2.2 + (Math.random() - 0.5) * 1;
      pos[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      pos[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
      pos[i * 3 + 2] = r * Math.sin(v);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const material = new THREE.PointsMaterial({
      size: 0.12,
      color: theme === 'dark' ? 0x818cf8 : 0x0284c7,
      transparent: true,
      opacity: theme === 'dark' ? 0.45 : 0.35,
    });
    const points = new THREE.Points(geometry, material);
    group.add(points);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      group.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [enable3D, theme]);

  // Analog Clock angles
  const now = currentTime || new Date();
  const ms = now.getMilliseconds();
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();

  const secVal = smoothSweep ? sec + ms / 1000 : sec;
  const minVal = min + secVal / 60;
  const hrVal = (hr % 12) + minVal / 60;

  const secAngle = secVal * 6;
  const minAngle = minVal * 6;
  const hrAngle = hrVal * 30;

  const clockDigital12 = `${(hr % 12 || 12).toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  const clockDigital24 = `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const dayOfMonth = now.getDate();
  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ') : 'Local Time';

  // Bangla & Hijri Dates
  const banglaDate = getBanglaDate(now);
  const hijriDate = getHijriDate(now);

  // Timer Progress
  const timerProgress = duration > 0 ? (duration - remaining) / duration : 0;
  const circleRadius = 110;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (1 - timerProgress) * circleCircumference;

  // Stopwatch formatted
  const swFormatted = formatStopwatch(swElapsedMs);
  const fastestLapId = laps.length > 1 ? laps.reduce((f, l) => (l.lapTimeMs < f.lapTimeMs ? l : f), laps[0])?.id : null;
  const slowestLapId = laps.length > 1 ? laps.reduce((s, l) => (l.lapTimeMs > s.lapTimeMs ? l : s), laps[0])?.id : null;

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between bg-slate-900 text-slate-100 transition-colors duration-300 select-none">
      {/* 3D Three.js Ambient Particle Halo */}
      {enable3D && (
        <div ref={threeCanvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />
      )}

      {/* TOP HEADER - Glassmorphic Navigation */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 liquid-header flex items-center justify-between shrink-0 shadow-sm">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-md shadow-purple-500/30 flex items-center justify-center bg-black/50 shrink-0">
            <img src="./logo.png" alt="ZenClock Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-900 dark:from-white dark:via-slate-200 dark:to-indigo-300 bg-clip-text text-transparent">
              ZenClock
            </h1>
          </div>
        </div>

        {/* Live System Clock & Cultural Date Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full liquid-btn text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-semibold tabular text-slate-800 dark:text-slate-200">
            {use24Hour ? clockDigital24 : `${clockDigital12} ${ampm}`}
          </span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-slate-600 dark:text-slate-300">{formattedDate}</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">🇧🇩 {banglaDate}</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-indigo-600 dark:text-indigo-300 font-medium">🌙 {hijriDate}</span>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Design Style Selector Switch */}
          <div className="flex items-center liquid-btn rounded-xl p-0.5 text-xs">
            {DESIGN_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setDesignStyle(style.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all text-xs',
                  designStyle === style.id
                    ? 'bg-white dark:bg-slate-800 text-sky-500 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
                title={style.tag}
              >
                {style.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Mute / Unmute Button */}
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              updateVolume(volume, nextMuted);
            }}
            className={cn(
              'p-2 rounded-xl liquid-btn transition-all',
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-500'
                : 'text-slate-700 dark:text-slate-300'
            )}
            title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Preferences & Sounds Modal Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl liquid-btn text-slate-700 dark:text-slate-300 transition-all"
            title="Sound & Audio Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="p-2 rounded-xl liquid-btn text-slate-700 dark:text-slate-300 transition-all"
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl liquid-btn text-slate-700 dark:text-slate-300 transition-all"
            title={isFullscreen ? 'Exit Fullscreen [ESC]' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN SINGLE-PAGE NO-SCROLL DASHBOARD */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 min-h-0">
        
        {/* LEFT / CENTER PANEL: MASTER FOCUS TIMER & STUDY SUITE (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-6 rounded-3xl liquid-glass relative min-h-0">
          
          {/* Mode Switcher Bar */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl liquid-btn max-w-full overflow-x-auto shrink-0">
            {[
              { id: 'countdown', label: 'Custom Timer', icon: Sparkles },
              { id: 'pomodoro', label: 'Pomodoro (25m)', icon: Flame },
              { id: 'deep_work', label: 'Deep Work (50m)', icon: Zap },
              { id: 'short_break', label: 'Short Break (5m)', icon: Coffee },
              { id: 'long_break', label: 'Long Break (15m)', icon: Coffee },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = timerMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id as TimerMode)}
                  className={cn(
                    'flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-sky-500 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC DESIGN STYLE DISPLAY */}
          <div className="flex-1 flex flex-col items-center justify-center my-2 sm:my-3 relative">
            {/* 1. ZEN MINIMALIST STYLE */}
            {designStyle === 'zen' && (
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    'absolute inset-4 rounded-full blur-2xl transition-all duration-1000',
                    isTimerRunning ? 'bg-sky-500/20 scale-105' : 'bg-sky-500/5 scale-95'
                  )}
                />
                <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
                    <circle
                      cx="130"
                      cy="130"
                      r={circleRadius}
                      className="stroke-slate-300/40 dark:stroke-slate-800/70"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="130"
                      cy="130"
                      r={circleRadius}
                      stroke="#38bdf8"
                      strokeWidth="6"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-[stroke-dashoffset] duration-200 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      onClick={() => {
                        const sp = splitSeconds(duration);
                        setCustomHours(sp.hours);
                        setCustomMinutes(sp.minutes);
                        setCustomSeconds(sp.seconds);
                        setIsCustomPickerOpen(true);
                      }}
                      className="text-5xl sm:text-6xl font-mono font-bold tracking-tight tabular cursor-pointer hover:opacity-85 transition-opacity"
                      title="Click to set custom duration"
                    >
                      {formatTime(remaining)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                      {isTimerRunning ? 'Flow State' : isTimerPaused ? 'Paused' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDIO MODERN STYLE */}
            {designStyle === 'studio' && (
              <div className="relative w-56 h-56 sm:w-68 sm:h-68 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const angle = (i / 48) * 360;
                    const rad = (angle * Math.PI) / 180;
                    const isActive = i <= Math.floor(timerProgress * 48);
                    const isMajor = i % 4 === 0;
                    const r1 = isMajor ? 114 : 118;
                    const r2 = 130;
                    return (
                      <line
                        key={i}
                        x1={140 + r1 * Math.cos(rad)}
                        y1={140 + r1 * Math.sin(rad)}
                        x2={140 + r2 * Math.cos(rad)}
                        y2={140 + r2 * Math.sin(rad)}
                        stroke={isActive ? '#f59e0b' : 'currentColor'}
                        className={isActive ? 'stroke-amber-500' : 'stroke-slate-300/40 dark:stroke-slate-800'}
                        strokeWidth={isMajor ? 3 : 1.5}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-10 rounded-full bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-white/30 dark:border-white/10 flex flex-col items-center justify-center shadow-lg">
                  <span
                    onClick={() => {
                      const sp = splitSeconds(duration);
                      setCustomHours(sp.hours);
                      setCustomMinutes(sp.minutes);
                      setCustomSeconds(sp.seconds);
                      setIsCustomPickerOpen(true);
                    }}
                    className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight tabular text-amber-500 cursor-pointer"
                  >
                    {formatTime(remaining)}
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mt-1">
                    {Math.round(timerProgress * 100)}% COMPLETE
                  </span>
                </div>
              </div>
            )}

            {/* 3. CYBER NEON HUD */}
            {designStyle === 'cyber' && (
              <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-2">
                  <span>SYS://CYBER_TIMER</span>
                  <span>{isTimerRunning ? 'STATUS: EXECUTING' : 'STATUS: STANDBY'}</span>
                </div>

                <div className="text-center my-2">
                  <span
                    onClick={() => {
                      const sp = splitSeconds(duration);
                      setCustomHours(sp.hours);
                      setCustomMinutes(sp.minutes);
                      setCustomSeconds(sp.seconds);
                      setIsCustomPickerOpen(true);
                    }}
                    className="text-5xl sm:text-6xl font-mono font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer tabular"
                  >
                    {formatTime(remaining)}
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-cyan-900/60 mt-3">
                  <div
                    className="bg-cyan-400 h-full shadow-[0_0_10px_#22d3ee] transition-all duration-200"
                    style={{ width: `${timerProgress * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* 4. SPATIAL 3D GLASS ORB */}
            {designStyle === 'spatial' && (
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-purple-500/10 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center p-4">
                <Orbit className="w-5 h-5 text-indigo-400 animate-spin mb-1" style={{ animationDuration: '10s' }} />
                <span
                  onClick={() => {
                    const sp = splitSeconds(duration);
                    setCustomHours(sp.hours);
                    setCustomMinutes(sp.minutes);
                    setCustomSeconds(sp.seconds);
                    setIsCustomPickerOpen(true);
                  }}
                  className="text-5xl sm:text-6xl font-mono font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer tabular"
                >
                  {formatTime(remaining)}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300/80 mt-1">
                  {isTimerRunning ? 'Spatial Active' : 'Spatial Idle'}
                </span>
              </div>
            )}

            {/* Study Cycle Indicator (When in Pomodoro mode) */}
            {timerMode === 'pomodoro' && (
              <div className="mt-2.5 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Cycle:</span>
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        step === studySessionNumber
                          ? 'w-5 bg-sky-500'
                          : step < studySessionNumber
                          ? 'w-2 bg-emerald-500'
                          : 'w-2 bg-slate-300 dark:bg-slate-700'
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setStudySessionNumber((s) => (s >= 4 ? 1 : s + 1))}
                  className="ml-2 hover:text-sky-500 transition-colors p-1"
                  title="Advance session"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* MOTIVATIONAL QUOTE GLASS WIDGET (Cycles every 1 minute) */}
          <div className="w-full px-3.5 py-2 my-1 rounded-2xl liquid-btn flex items-center justify-between text-xs transition-all shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Quote className="w-3.5 h-3.5" />
              </div>
              <div className={cn('flex-1 min-w-0 transition-opacity duration-300', quoteFade ? 'opacity-100' : 'opacity-0')}>
                <p className="italic text-slate-700 dark:text-slate-200 truncate text-[11px] sm:text-xs">
                  &ldquo;{currentQuote.text}&rdquo;
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                  — {currentQuote.author}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 pl-2 shrink-0">
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-white/20 dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/10" title="Updates every 60s">
                60s
              </span>
              <button
                onClick={handleNextQuote}
                className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Next Quote"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TIMER ACTION CONTROLS */}
          <div className="flex flex-col items-center space-y-2.5 shrink-0 pt-1">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Reset */}
              <button
                onClick={resetTimer}
                className="p-3 sm:p-3.5 rounded-2xl liquid-btn text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Primary Start / Pause / Resume */}
              {!isTimerRunning && !isTimerPaused && (
                <button
                  onClick={startTimer}
                  className="py-3 px-8 sm:px-10 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-base flex items-center space-x-2 shadow-lg shadow-sky-500/25 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>START</span>
                </button>
              )}

              {isTimerRunning && (
                <button
                  onClick={pauseTimer}
                  className="py-3 px-8 sm:px-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-base flex items-center space-x-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>PAUSE</span>
                </button>
              )}

              {isTimerPaused && (
                <button
                  onClick={resumeTimer}
                  className="py-3 px-8 sm:px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base flex items-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>RESUME</span>
                </button>
              )}

              {/* Set Custom Time Button */}
              <button
                onClick={() => {
                  const sp = splitSeconds(duration);
                  setCustomHours(sp.hours);
                  setCustomMinutes(sp.minutes);
                  setCustomSeconds(sp.seconds);
                  setIsCustomPickerOpen(true);
                }}
                className="p-3 sm:p-3.5 rounded-2xl liquid-btn text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                title="Configure Custom Duration"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Presets Chips */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto max-w-full py-0.5">
              {QUICK_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => addQuickSeconds(p.sec)}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium text-slate-600 dark:text-slate-400 liquid-btn hover:text-sky-500 transition-all shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALOG CLOCK + STOPWATCH (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 sm:gap-4 min-h-0">
          
          {/* TOP RIGHT: LIVE ANALOG CLOCK MODULE (Glassmorphic) */}
          <div className="p-3.5 sm:p-4 rounded-3xl liquid-glass flex items-center justify-between min-h-0">
            {/* SVG Analog Clock Face */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                {/* Clock Bezel */}
                <circle
                  cx="100"
                  cy="100"
                  r="95"
                  className="fill-white/40 dark:fill-slate-950/70 stroke-white/40 dark:stroke-slate-700/80"
                  strokeWidth="2.5"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="91"
                  className="fill-white/60 dark:fill-slate-900/60"
                />

                {/* Hour Ticks */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const rad = (i * 30 * Math.PI) / 180;
                  const x1 = 100 + 78 * Math.sin(rad);
                  const y1 = 100 - 78 * Math.cos(rad);
                  const x2 = 100 + 87 * Math.sin(rad);
                  const y2 = 100 - 87 * Math.cos(rad);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      className="stroke-slate-400 dark:stroke-slate-500"
                      strokeWidth={i % 3 === 0 ? 2.5 : 1.2}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Date Complication Badge */}
                <g transform="translate(132, 91)">
                  <rect
                    width="24"
                    height="18"
                    rx="3"
                    className="fill-slate-200/80 dark:fill-slate-800"
                  />
                  <text
                    x="12"
                    y="13"
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-sky-500 tabular"
                  >
                    {dayOfMonth}
                  </text>
                </g>

                {/* Hour Hand */}
                <g transform={`rotate(${hrAngle}, 100, 100)`}>
                  <line
                    x1="100"
                    y1="110"
                    x2="100"
                    y2="52"
                    stroke="currentColor"
                    className="stroke-slate-800 dark:stroke-slate-200"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>

                {/* Minute Hand */}
                <g transform={`rotate(${minAngle}, 100, 100)`}>
                  <line
                    x1="100"
                    y1="115"
                    x2="100"
                    y2="30"
                    stroke="currentColor"
                    className="stroke-slate-700 dark:stroke-slate-300"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </g>

                {/* Second Hand */}
                <g transform={`rotate(${secAngle}, 100, 100)`}>
                  <line
                    x1="100"
                    y1="120"
                    x2="100"
                    y2="22"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="112" r="3" fill="#ef4444" />
                </g>

                {/* Center Pinion */}
                <circle cx="100" cy="100" r="4" className="fill-slate-900 dark:fill-white" />
                <circle cx="100" cy="100" r="1.5" fill="#ef4444" />
              </svg>
            </div>

            {/* Analog Clock Telemetry & Cultural Dates */}
            <div className="flex-1 pl-4 flex flex-col justify-center space-y-1.5 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                <Globe className="w-3 h-3 text-sky-500" />
                <span className="truncate">{timezone}</span>
              </span>

              <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular text-slate-900 dark:text-white">
                {use24Hour ? clockDigital24 : clockDigital12}
                {!use24Hour && (
                  <span className="text-xs font-semibold text-sky-500 ml-1.5">{ampm}</span>
                )}
              </div>

              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {formattedDate}
              </div>

              {/* Cultural Calendar Badges (Bangla & Hijri) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium flex items-center space-x-1">
                  <span>🇧🇩</span>
                  <span className="font-mono">{banglaDate}</span>
                </div>
                <div className="px-2 py-0.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium flex items-center space-x-1">
                  <span>🌙</span>
                  <span className="font-mono">{hijriDate}</span>
                </div>
              </div>

              {/* Sweep & 12/24H Toggles */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setSmoothSweep((s) => !s)}
                  className="text-[10px] px-2 py-0.5 rounded-md font-mono liquid-btn text-slate-700 dark:text-slate-300 hover:text-sky-500 transition-colors"
                >
                  {smoothSweep ? 'Sweep' : 'Tick'}
                </button>
                <button
                  onClick={() => setUse24Hour((h) => !h)}
                  className="text-[10px] px-2 py-0.5 rounded-md font-mono liquid-btn text-slate-700 dark:text-slate-300 hover:text-sky-500 transition-colors"
                >
                  {use24Hour ? '24H' : '12H'}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: PRECISION STOPWATCH & LAPS MODULE (Glassmorphic) */}
          <div className="flex-1 p-3.5 sm:p-4 rounded-3xl liquid-glass flex flex-col justify-between min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/15 dark:border-white/10 shrink-0">
              <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Watch className="w-3.5 h-3.5 text-sky-500" />
                <span>Chronograph</span>
              </div>
              {laps.length > 0 && (
                <button
                  onClick={copyLapsToClipboard}
                  className="text-[11px] text-slate-400 hover:text-sky-500 flex items-center space-x-1 transition-colors"
                  title="Copy Laps"
                >
                  {copiedLaps ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLaps ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Stopwatch Large Display */}
            <div className="flex items-baseline justify-center my-2 shrink-0">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular">
                {swFormatted.main}
              </span>
              <span className="text-xl sm:text-2xl font-mono font-semibold text-sky-500 ml-1.5 tabular">
                .{swFormatted.cs}
              </span>
            </div>

            {/* Stopwatch Action Controls */}
            <div className="flex items-center justify-center space-x-2 py-1 shrink-0">
              {!isSwRunning && !isSwPaused && (
                <button
                  onClick={startStopwatch}
                  className="flex-1 py-1.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              )}

              {isSwRunning && (
                <>
                  <button
                    onClick={recordLap}
                    className="flex-1 py-1.5 px-3 rounded-xl liquid-btn text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <Flag className="w-3.5 h-3.5 text-sky-500" />
                    <span>Lap</span>
                  </button>
                  <button
                    onClick={pauseStopwatch}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </button>
                </>
              )}

              {isSwPaused && (
                <>
                  <button
                    onClick={resetStopwatch}
                    className="flex-1 py-1.5 px-3 rounded-xl liquid-btn text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={resumeStopwatch}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                </>
              )}
            </div>

            {/* Scrollable Lap Records List */}
            <div className="flex-1 min-h-[70px] max-h-[110px] overflow-y-auto divide-y divide-white/10 dark:divide-white/[0.06] text-xs font-mono mt-1">
              {laps.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">
                  Press &quot;Lap&quot; while running to record splits
                </div>
              ) : (
                laps.map((lap) => {
                  const isFastest = lap.id === fastestLapId;
                  const isSlowest = lap.id === slowestLapId;
                  const split = formatStopwatch(lap.lapTimeMs);
                  const total = formatStopwatch(lap.overallTimeMs);
                  return (
                    <div
                      key={lap.id}
                      className={cn(
                        'flex items-center justify-between py-1 px-1 transition-colors',
                        isFastest
                          ? 'text-emerald-500 font-semibold'
                          : isSlowest
                          ? 'text-rose-500 font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      <span className="text-slate-400 w-10">#{lap.lapNumber}</span>
                      <span className="tabular">+{split.main}.{split.cs}</span>
                      <span className="text-slate-400 tabular text-[11px]">{total.main}.{total.cs}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* COMPACT FOOTER STATUS BAR - Glassmorphic */}
      <footer className="relative z-20 w-full px-4 sm:px-6 py-2 border-t border-white/15 dark:border-white/10 liquid-header flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center space-x-3">
          {/* Weather Widget (IP-based) */}
          {weather && (
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full liquid-btn text-[11px] font-medium">
              <span className="text-sm">{weather.icon}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{weather.temp}°C</span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{weather.city}</span>
            </div>
          )}
          <span className="hidden sm:inline">[Space] / [ESC] Dismiss Alert</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">[M] Mute Sound</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>
            Alarm: <strong className="text-slate-700 dark:text-slate-200">{SOUND_DEFINITIONS.find((s) => s.id === selectedSound)?.name}</strong>
          </span>
          <span>•</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-sky-500 underline underline-offset-2 transition-colors font-medium"
          >
            Preferences
          </button>
        </div>
      </footer>

      {/* SOUND ACTIVATION PERMISSION BANNER (First Visit) */}
      {!soundPermissionGranted && (
        <div className="fixed bottom-12 right-6 z-40 max-w-sm p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-sky-500/40 shadow-2xl backdrop-blur-2xl animate-fadeIn">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Enable Alarm Sound
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grant audio permission so alarms and chimes ring when your timer completes.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => setSoundPermissionGranted(true)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    unlockAudio();
                    setSoundPermissionGranted(true);
                    previewSound(selectedSound, volume * 0.7);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-sm transition-all"
                >
                  Enable Sound
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN RED/WHITE BLINKING ALARM ALERT */}
      {isAlarmActive && (
        <>
          <div className="fixed inset-0 z-50 pointer-events-none alarm-active opacity-90 transition-opacity" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md p-8 rounded-3xl bg-slate-950/95 border-2 border-red-500 text-center text-white shadow-[0_0_80px_rgba(239,68,68,0.8)] backdrop-blur-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                <BellRing className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Time&apos;s Up!</h2>
              <p className="text-base font-medium text-red-200 mt-2">{alarmMessage}</p>

              {isMuted && (
                <div className="inline-flex items-center space-x-1.5 mt-2 px-3 py-0.5 rounded-full bg-slate-900 border border-red-500/40 text-xs font-semibold text-red-300">
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Audio Muted • Visual Alert Active</span>
                </div>
              )}

              <button
                onClick={dismissAlarmAlert}
                autoFocus
                className="w-full mt-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-lg uppercase tracking-wider shadow-lg shadow-red-500/50 transition-all flex items-center justify-center space-x-2"
              >
                <BellOff className="w-5 h-5" />
                <span>Dismiss Alarm</span>
              </button>
              <p className="text-xs text-slate-400 mt-3">Press [Space] or [ESC] to stop</p>
            </div>
          </div>
        </>
      )}

      {/* CUSTOM TIMER PICKER MODAL */}
      {isCustomPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-white/10 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-base">Set Custom Timer</h3>
              </div>
              <button
                onClick={() => setIsCustomPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Inputs for Hours, Minutes, Seconds */}
            <div className="flex items-center justify-center space-x-4 my-6">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCustomHours((h) => Math.min(23, h + 1))}
                  className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="text-3xl font-mono font-bold my-1 w-14 text-center bg-transparent tabular"
                />
                <button
                  onClick={() => setCustomHours((h) => Math.max(0, h - 1))}
                  className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Hours</span>
              </div>

              <span className="text-2xl font-mono font-bold text-slate-300 dark:text-slate-700 pb-5">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCustomMinutes((m) => (m >= 59 ? 0 : m + 1))}
                  className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-3xl font-mono font-bold my-1 w-14 text-center bg-transparent tabular"
                />
                <button
                  onClick={() => setCustomMinutes((m) => (m <= 0 ? 59 : m - 1))}
                  className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Mins</span>
              </div>

              <span className="text-2xl font-mono font-bold text-slate-300 dark:text-slate-700 pb-5">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCustomSeconds((s) => (s >= 59 ? 0 : s + 1))}
                  className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-3xl font-mono font-bold my-1 w-14 text-center bg-transparent tabular"
                />
                <button
                  onClick={() => setCustomSeconds((s) => (s <= 0 ? 59 : s - 1))}
                  className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Secs</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCustomPickerOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-white/40 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const total = customHours * 3600 + customMinutes * 60 + customSeconds;
                  applyCustomDuration(total || 60);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/25"
              >
                Apply Duration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREFERENCES & SOUND SELECTOR MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-white/30 dark:border-white/10 p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/10 shrink-0">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-base">Sound & Preferences</h3>
              </div>
              <button
                onClick={() => {
                  stopPreview();
                  setPreviewingId(null);
                  setIsSettingsOpen(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Master Volume */}
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-800/60 border border-white/20 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-sky-500" />
                    <span>Master Alarm Volume</span>
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    updateVolume(v, isMuted);
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* 3D Visualizer Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-slate-800/60 border border-white/20 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <Orbit className="w-4 h-4 text-sky-500" />
                  <div>
                    <div className="text-xs font-bold">Three.js 3D Particle Halo</div>
                    <div className="text-[10px] text-slate-400">Subtle floating ambient sphere</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enable3D}
                  onChange={(e) => setEnable3D(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Alarm Sounds List (User Uploads + Classics) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Alarm Sounds ({SOUND_DEFINITIONS.length} Available)
                </span>
                {SOUND_DEFINITIONS.map((sound) => {
                  const isSelected = selectedSound === sound.id;
                  const isPlayingThis = previewingId === sound.id;

                  return (
                    <div
                      key={sound.id}
                      onClick={() => {
                        setSelectedSound(sound.id);
                        unlockAudio();
                      }}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all',
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500 text-sky-500 shadow-sm'
                          : 'bg-white/40 dark:bg-slate-800/60 border-white/20 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold truncate">{sound.name}</span>
                          {sound.id.startsWith('custom_alarm') && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Imported
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{sound.description}</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAudio();
                          if (isPlayingThis) {
                            stopPreview();
                            setPreviewingId(null);
                          } else {
                            setPreviewingId(sound.id);
                            previewSound(sound.id, volume);
                            setTimeout(() => {
                              setPreviewingId((curr) => (curr === sound.id ? null : curr));
                            }, 3500);
                          }
                        }}
                        className="py-1 px-2.5 rounded-lg text-xs font-medium bg-white/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white transition-all shadow-sm shrink-0"
                      >
                        {isPlayingThis ? 'Stop' : 'Preview'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/20 dark:border-white/10 flex justify-end shrink-0">
              <button
                onClick={() => {
                  stopPreview();
                  setPreviewingId(null);
                  setIsSettingsOpen(false);
                }}
                className="py-2 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
