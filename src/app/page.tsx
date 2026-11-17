'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
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
  Disc,
  Terminal,
  Orbit,
  ArrowDown,
  ArrowUp,
  Globe,
  Calendar,
  SkipForward,
} from 'lucide-react';

import { DesignStyle, TimerMode, LapItem } from '@/lib/types';
import { SOUND_DEFINITIONS, DESIGN_STYLES, QUICK_PRESETS } from '@/lib/constants';
import { formatTime, formatStopwatch, splitSeconds, cn } from '@/lib/utils';
import {
  playAlarm,
  stopAlarm,
  previewSound,
  stopPreview,
  updateVolume,
  unlockAudio,
} from '@/lib/audio';

const STORAGE_KEY = 'zenclock_prefs_v2';

export default function ZenClockApp() {
  // Application Settings & State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('zen');
  const [selectedSound, setSelectedSound] = useState('oxygen');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [soundPermissionGranted, setSoundPermissionGranted] = useState(false);
  const [enable3D, setEnable3D] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);

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

  // --- COUNTDOWN / STUDY TIMER ACCURACY TICK LOOP ---
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

        // Completion logic
        if (timerMode === 'pomodoro') {
          setCompletedPomodoros((c) => c + 1);
          triggerAlarmAlert(`Focus Session #${studySessionNumber} Completed! Take a refreshing break.`);
        } else if (timerMode === 'deep_work') {
          triggerAlarmAlert('Deep Work block finished! Relax and recharge.');
        } else if (timerMode === 'short_break' || timerMode === 'long_break') {
          triggerAlarmAlert('Break is finished! Ready to step back into focus?');
        } else {
          triggerAlarmAlert(`Timer (${formatTime(duration)}) has finished!`);
        }
      } else {
        const secsLeft = Math.ceil(diffMs / 1000);
        setRemaining(secsLeft);
      }
    }, 150);

    return () => window.clearInterval(interval);
  }, [isTimerRunning, isTimerPaused, duration, timerMode, studySessionNumber, triggerAlarmAlert]);

  // Sync tab title when running
  useEffect(() => {
    if (isTimerRunning && !isTimerPaused && remaining > 0) {
      document.title = `(${formatTime(remaining)}) ZenClock`;
    }
  }, [isTimerRunning, isTimerPaused, remaining]);

  // Timer Controls
  const startTimer = () => {
    unlockAudio();
    if (remaining <= 0) {
      setRemaining(duration);
      timerTargetEndRef.current = Date.now() + duration * 1000;
    } else {
      timerTargetEndRef.current = Date.now() + remaining * 1000;
    }
    setIsTimerRunning(true);
    setIsTimerPaused(false);
  };

  const pauseTimer = () => {
    if (!isTimerRunning || isTimerPaused) return;
    if (timerTargetEndRef.current) {
      const diffMs = Math.max(0, timerTargetEndRef.current - Date.now());
      setRemaining(Math.ceil(diffMs / 1000));
    }
    timerTargetEndRef.current = null;
    setIsTimerPaused(true);
  };

  const resumeTimer = () => {
    if (!isTimerRunning || !isTimerPaused) return;
    timerTargetEndRef.current = Date.now() + remaining * 1000;
    setIsTimerPaused(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    timerTargetEndRef.current = null;
    setRemaining(duration);
    document.title = 'ZenClock — Modern Focus Suite';
  };

  // Switch Study/Timer Mode
  const switchMode = (mode: TimerMode) => {
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    timerTargetEndRef.current = null;
    setTimerMode(mode);

    let sec = 1500;
    if (mode === 'pomodoro') sec = 1500; // 25m
    else if (mode === 'deep_work') sec = 3000; // 50m
    else if (mode === 'short_break') sec = 300; // 5m
    else if (mode === 'long_break') sec = 900; // 15m
    else if (mode === 'countdown') sec = duration;

    setDuration(sec);
    setRemaining(sec);
    const sp = splitSeconds(sec);
    setCustomHours(sp.hours);
    setCustomMinutes(sp.minutes);
    setCustomSeconds(sp.seconds);
  };

  // Add/Subtract quick seconds
  const addQuickSeconds = (extraSec: number) => {
    const newDur = Math.max(1, duration + extraSec);
    setDuration(newDur);
    setRemaining((prev) => {
      const nextRem = Math.max(1, prev + extraSec);
      if (timerTargetEndRef.current) {
        timerTargetEndRef.current += extraSec * 1000;
      }
      return nextRem;
    });
    const sp = splitSeconds(newDur);
    setCustomHours(sp.hours);
    setCustomMinutes(sp.minutes);
    setCustomSeconds(sp.seconds);
  };

  // Apply custom duration directly (FIXES THE CUSTOM TIMER BUG!)
  const applyCustomDuration = (h: number, m: number, s: number) => {
    const totalSec = Math.max(1, h * 3600 + m * 60 + s);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    timerTargetEndRef.current = null;
    setDuration(totalSec);
    setRemaining(totalSec);
    setIsCustomPickerOpen(false);
  };

  // --- STOPWATCH HIGH-PRECISION TICK LOOP ---
  useEffect(() => {
    if (!isSwRunning || isSwPaused) return;

    const tick = () => {
      if (swStartTimeRef.current !== null) {
        setSwElapsedMs(swAccumulatedRef.current + (Date.now() - swStartTimeRef.current));
      }
      swAnimFrameRef.current = requestAnimationFrame(tick);
    };
    swAnimFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (swAnimFrameRef.current) cancelAnimationFrame(swAnimFrameRef.current);
    };
  }, [isSwRunning, isSwPaused]);

  const startStopwatch = () => {
    swStartTimeRef.current = Date.now();
    setIsSwRunning(true);
    setIsSwPaused(false);
  };

  const pauseStopwatch = () => {
    if (!isSwRunning || isSwPaused) return;
    if (swStartTimeRef.current !== null) {
      swAccumulatedRef.current += Date.now() - swStartTimeRef.current;
      setSwElapsedMs(swAccumulatedRef.current);
    }
    swStartTimeRef.current = null;
    setIsSwPaused(true);
  };

  const resumeStopwatch = () => {
    if (!isSwRunning || !isSwPaused) return;
    swStartTimeRef.current = Date.now();
    setIsSwPaused(false);
  };

  const resetStopwatch = () => {
    if (swAnimFrameRef.current) cancelAnimationFrame(swAnimFrameRef.current);
    setIsSwRunning(false);
    setIsSwPaused(false);
    setSwElapsedMs(0);
    setLaps([]);
    swStartTimeRef.current = null;
    swAccumulatedRef.current = 0;
    swLastLapElapsedRef.current = 0;
  };

  const recordLap = () => {
    if (!isSwRunning) return;
    const currentTotal = swStartTimeRef.current !== null
      ? swAccumulatedRef.current + (Date.now() - swStartTimeRef.current)
      : swAccumulatedRef.current;

    const lapDuration = currentTotal - swLastLapElapsedRef.current;
    swLastLapElapsedRef.current = currentTotal;

    const newLap: LapItem = {
      id: `lap-${Date.now()}-${laps.length + 1}`,
      lapNumber: laps.length + 1,
      lapTimeMs: lapDuration,
      overallTimeMs: currentTotal,
    };
    setLaps((prev) => [newLap, ...prev]);
  };

  const copyLapsToClipboard = () => {
    if (laps.length === 0) return;
    const lines = [
      'ZenClock Stopwatch Laps',
      ...laps.map((l) => {
        const s = formatStopwatch(l.lapTimeMs);
        const o = formatStopwatch(l.overallTimeMs);
        return `Lap ${l.lapNumber}: +${s.main}.${s.cs} (Total: ${o.main}.${o.cs})`;
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedLaps(true);
    setTimeout(() => setCopiedLaps(false), 2000);
  };

  // Compute fastest & slowest lap IDs
  let fastestLapId: string | null = null;
  let slowestLapId: string | null = null;
  if (laps.length >= 2) {
    let min = Infinity;
    let max = -Infinity;
    for (const l of laps) {
      if (l.lapTimeMs < min) { min = l.lapTimeMs; fastestLapId = l.id; }
      if (l.lapTimeMs > max) { max = l.lapTimeMs; slowestLapId = l.id; }
    }
  }

  // --- THREE.JS SUBTLE 3D PARTICLES BACKGROUND ---
  useEffect(() => {
    if (!enable3D || !threeCanvasRef.current) return;

    const container = threeCanvasRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 22;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Particle Torus
    const pCount = 900;
    const pos = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    const isDark = theme === 'dark';
    const c1 = isDark ? new THREE.Color(0x38bdf8) : new THREE.Color(0x0284c7);
    const c2 = isDark ? new THREE.Color(0x818cf8) : new THREE.Color(0x4f46e5);

    for (let i = 0; i < pCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 8.5 + (Math.random() - 0.5) * 2;
      const r = 2.0 + (Math.random() - 0.5) * 1.2;

      pos[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      pos[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
      pos[i * 3 + 2] = r * Math.sin(v);

      const col = c1.clone().lerp(c2, Math.random());
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.6 : 0.35,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    // Gyroscopic Ring
    const ringGeo = new THREE.TorusGeometry(8.0, 0.03, 8, 60);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x93c5fd : 0x3b82f6,
      transparent: true,
      opacity: isDark ? 0.2 : 0.1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    group.add(ringMesh);

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      group.rotation.y += (mouseX - group.rotation.y) * 0.05;
      group.rotation.x += (-mouseY - group.rotation.x) * 0.05;

      const speed = isTimerRunning ? 1.8 : 0.6;
      particles.rotation.z += 0.0015 * speed;
      ringMesh.rotation.z += 0.002 * speed;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container && renderer.domElement) {
        try { container.removeChild(renderer.domElement); } catch {}
      }
      pGeo.dispose();
      pMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [enable3D, theme, isTimerRunning]);

  // Analog Clock angles calculation
  const dateObj = currentTime || new Date();
  const rawMs = dateObj.getMilliseconds();
  const rawSec = dateObj.getSeconds();
  const rawMin = dateObj.getMinutes();
  const rawHrs = dateObj.getHours();

  const secVal = smoothSweep ? rawSec + rawMs / 1000 : rawSec;
  const minVal = rawMin + secVal / 60;
  const hrsVal = (rawHrs % 12) + minVal / 60;

  const secAngle = secVal * 6;
  const minAngle = minVal * 6;
  const hrAngle = hrsVal * 30;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const clockDigital12 = `${pad(rawHrs % 12 || 12)}:${pad(rawMin)}:${pad(rawSec)}`;
  const clockDigital24 = `${pad(rawHrs)}:${pad(rawMin)}:${pad(rawSec)}`;
  const ampm = rawHrs >= 12 ? 'PM' : 'AM';
  const dayOfMonth = dateObj.getDate();
  const formattedDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(dateObj);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ');

  // Timer Progress fraction (0 to 1)
  const timerProgress = duration > 0 ? Math.min(1, Math.max(0, (duration - remaining) / duration)) : 0;
  const circleRadius = 110;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (1 - timerProgress) * circleCircumference;

  // Stopwatch formatted string
  const swFormatted = formatStopwatch(swElapsedMs);

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-between bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-300 select-none">
      {/* Three.js 3D Background */}
      {enable3D && (
        <div
          ref={threeCanvasRef}
          className="fixed inset-0 pointer-events-none z-0 opacity-75"
          aria-hidden="true"
        />
      )}

      {/* TOP COMPACT HEADER */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md flex items-center justify-between shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              ZenClock
            </h1>
          </div>
        </div>

        {/* Live Mini Time & Date Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-semibold tabular">
            {use24Hour ? clockDigital24 : `${clockDigital12} ${ampm}`}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400">{formattedDate}</span>
        </div>

        {/* Control Tools Cluster */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Layout Style Picker */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            {DESIGN_STYLES.map((st) => (
              <button
                key={st.id}
                onClick={() => setDesignStyle(st.id)}
                title={st.tag}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all',
                  designStyle === st.id
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {st.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Dedicated Mute/Unmute */}
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              updateVolume(volume, nextMuted);
            }}
            className={cn(
              'p-2 rounded-xl border transition-all',
              isMuted
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200'
            )}
            title={isMuted ? 'Unmute Audio (Visual alerts still active)' : 'Mute Audio [M]'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Alarm Sounds & Preferences"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title={isFullscreen ? 'Exit Fullscreen [ESC]' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN SINGLE-PAGE NO-SCROLL DASHBOARD */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 min-h-0">
        {/* LEFT / CENTER PANEL: MASTER FOCUS TIMER & STUDY SUITE (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xl shadow-lg relative min-h-0">
          {/* Mode Switcher Bar */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 max-w-full overflow-x-auto shrink-0">
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
                      ? 'bg-white dark:bg-slate-900 text-sky-500 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC DESIGN STYLE DISPLAY (Fits cleanly without scrolling!) */}
          <div className="flex-1 flex flex-col items-center justify-center my-2 sm:my-4 relative">
            {/* 1. ZEN MINIMALIST STYLE */}
            {designStyle === 'zen' && (
              <div className="relative flex items-center justify-center">
                {/* Breathing ambient glow */}
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
                      className="stroke-slate-200/60 dark:stroke-slate-800/70"
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
                      onClick={() => setIsCustomPickerOpen(true)}
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

            {/* 2. STUDIO MODERN (BAUHAUS RADIAL SEGMENTED DIAL) */}
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
                        className={isActive ? 'stroke-amber-500' : 'stroke-slate-200 dark:stroke-slate-800'}
                        strokeWidth={isMajor ? 3 : 1.5}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-10 rounded-full bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shadow-lg">
                  <span
                    onClick={() => setIsCustomPickerOpen(true)}
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
              <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-950/90 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
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
                    onClick={() => setIsCustomPickerOpen(true)}
                    className="text-5xl sm:text-6xl font-mono font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer tabular"
                  >
                    {formatTime(remaining)}
                  </span>
                </div>

                {/* Progress bar */}
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
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-slate-900/70 to-purple-500/10 border border-white/20 dark:border-white/10 shadow-2xl flex flex-col items-center justify-center p-4">
                <Orbit className="w-5 h-5 text-indigo-400 animate-spin mb-1" style={{ animationDuration: '10s' }} />
                <span
                  onClick={() => setIsCustomPickerOpen(true)}
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
              <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
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

          {/* TIMER ACTION CONTROLS */}
          <div className="flex flex-col items-center space-y-3 shrink-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Reset */}
              <button
                onClick={resetTimer}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95"
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
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95"
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
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 border border-transparent hover:border-sky-500/30 transition-all shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALOG CLOCK + STOPWATCH (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 sm:gap-4 min-h-0">
          {/* TOP RIGHT: LIVE ANALOG CLOCK MODULE */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xl shadow-lg flex items-center justify-between min-h-0">
            {/* SVG Analog Clock Face */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                {/* Clock Bezel */}
                <circle
                  cx="100"
                  cy="100"
                  r="95"
                  className="fill-slate-100/90 dark:fill-slate-950/90 stroke-slate-300/80 dark:stroke-slate-700/80"
                  strokeWidth="2.5"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="91"
                  className="fill-white/80 dark:fill-slate-900/60"
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
                    className="fill-slate-200 dark:fill-slate-800"
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

            {/* Analog Clock Telemetry & Readouts */}
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

              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formattedDate}
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setSmoothSweep((s) => !s)}
                  className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  {smoothSweep ? 'Sweep' : 'Tick'}
                </button>
                <button
                  onClick={() => setUse24Hour((h) => !h)}
                  className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  {use24Hour ? '24H' : '12H'}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: PRECISION STOPWATCH & LAPS MODULE */}
          <div className="flex-1 p-3.5 sm:p-4 rounded-3xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xl shadow-lg flex flex-col justify-between min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
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
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1 border border-slate-200/60 dark:border-slate-700/60 transition-all"
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
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1 border border-slate-200/60 dark:border-slate-700/60 transition-all"
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

            {/* Scrollable Lap Records List (Compact!) */}
            <div className="flex-1 min-h-[70px] max-h-[110px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono mt-1">
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

      {/* COMPACT FOOTER STATUS BAR */}
      <footer className="relative z-20 w-full px-4 sm:px-6 py-2 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center space-x-3">
          <span>[Space] / [ESC] Dismiss Alert</span>
          <span>•</span>
          <span>[M] Mute Sound</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Sound: <strong>{SOUND_DEFINITIONS.find((s) => s.id === selectedSound)?.name}</strong></span>
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
        <div className="fixed bottom-12 right-6 z-40 max-w-sm p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Enable Alarm Sound
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grant audio permission so classic Android alarm tones ring when timers complete.
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

      {/* CUSTOM TIMER PICKER MODAL (WORKING 100%!) */}
      {isCustomPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Secs</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-1.5 mb-5">
              {[60, 300, 600, 900, 1500, 1800, 2700, 3600].map((s) => {
                const label = s < 3600 ? `${s / 60}m` : `${s / 3600}h`;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      const sp = splitSeconds(s);
                      setCustomHours(sp.hours);
                      setCustomMinutes(sp.minutes);
                      setCustomSeconds(sp.seconds);
                    }}
                    className="py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 hover:text-sky-500"
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Apply Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCustomPickerOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => applyCustomDuration(customHours, customMinutes, customSeconds)}
                disabled={customHours === 0 && customMinutes === 0 && customSeconds === 0}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-50 shadow-md shadow-sky-500/25"
              >
                Apply Duration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS & AUDIO PREFERENCES MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-base">Sound & Preferences</h3>
              </div>
              <button
                onClick={() => {
                  stopPreview();
                  setIsSettingsOpen(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Volume Slider */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Volume: {Math.round(volume * 100)}%</span>
                  <span className="text-slate-400">{isMuted ? 'Muted' : 'Audible'}</span>
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
                  disabled={isMuted}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-40"
                />
              </div>

              {/* Sound list */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Android-Inspired Alarm Tone
                </label>
                {SOUND_DEFINITIONS.map((s) => {
                  const isSelected = selectedSound === s.id;
                  const isPrev = previewingId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSound(s.id)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      )}
                    >
                      <div>
                        <div className="text-xs font-bold">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPrev) {
                            stopPreview();
                            setPreviewingId(null);
                          } else {
                            unlockAudio();
                            previewSound(s.id, volume);
                            setPreviewingId(s.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-700 hover:bg-sky-500 hover:text-white transition-colors"
                      >
                        {isPrev ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 3D Background Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs">
                  <div className="font-semibold">Three.js 3D Background</div>
                  <div className="text-slate-400 text-[11px]">Subtle orbital particle halo</div>
                </div>
                <input
                  type="checkbox"
                  checked={enable3D}
                  onChange={(e) => setEnable3D(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => {
                  stopPreview();
                  setIsSettingsOpen(false);
                }}
                className="py-2 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all"
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

function Square({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}
