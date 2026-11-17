'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
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
  Globe,
  SkipForward,
  Quote,
  TrendingUp,
  Activity,
  Layers,
  Palette,
} from 'lucide-react';

import { DesignStyle, TimerMode, LapItem, PaletteId } from '@/lib/types';
import { SOUND_DEFINITIONS, DESIGN_STYLES, QUICK_PRESETS, MOTIVATIONAL_QUOTES } from '@/lib/constants';
import { PALETTES, PALETTE_LIST, DEFAULT_PALETTE_ID } from '@/lib/palettes';
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
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export default function ZenClockApp() {
  // Application Settings & State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [palette, setPalette] = useState<PaletteId>(DEFAULT_PALETTE_ID);
  const [isPaletteMenuOpen, setIsPaletteMenuOpen] = useState(false);
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
      const savedPalette = localStorage.getItem('zenclock_palette') as PaletteId;

      if (savedPalette && PALETTES[savedPalette]) {
        setPalette(savedPalette);
        document.documentElement.setAttribute('data-palette', savedPalette);
      } else {
        document.documentElement.setAttribute('data-palette', DEFAULT_PALETTE_ID);
      }

      if (stored) {
        const p = JSON.parse(stored);
        if (p.theme) setTheme(p.theme);
        if (p.palette && PALETTES[p.palette as PaletteId]) {
          setPalette(p.palette as PaletteId);
          document.documentElement.setAttribute('data-palette', p.palette);
        }
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
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Palette switch handler
  const changePalette = useCallback((id: PaletteId) => {
    setPalette(id);
    document.documentElement.setAttribute('data-palette', id);
    try {
      localStorage.setItem('zenclock_palette', id);
    } catch {}
  }, []);

  // Save preferences
  const savePrefs = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme,
          palette,
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
  }, [theme, palette, designStyle, selectedSound, volume, isMuted, soundPermissionGranted, enable3D, completedPomodoros]);

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
        const ipRes = await fetch('https://ipapi.co/json/');
        if (!ipRes.ok) return;
        const ipData = await ipRes.json();
        const { latitude, longitude, city } = ipData;
        if (!latitude || !longitude) return;

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
        );
        if (!weatherRes.ok) return;
        const weatherData = await weatherRes.json();
        const temp = Math.round(weatherData.current.temperature_2m);
        const code = weatherData.current.weather_code;
        const icon = WMO_ICONS[code] || '🌤️';

        setWeather({ temp, icon, city: city || 'Local Area' });
      } catch {
        // Fallback or silent fail if offline
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Stop sound previews when unmounting
  useEffect(() => {
    return () => {
      stopPreview();
      stopAlarm();
    };
  }, []);

  // Dismiss Alarm Alert
  const dismissAlarmAlert = useCallback(() => {
    stopAlarm();
    setIsAlarmActive(false);
  }, []);

  // Timer Tick Engine using timestamp delta
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      if (!timerTargetEndRef.current) return;
      const left = Math.max(0, Math.ceil((timerTargetEndRef.current - Date.now()) / 1000));
      setRemaining(left);

      if (left <= 0) {
        clearInterval(interval);
        setIsTimerRunning(false);
        setIsTimerPaused(false);
        timerTargetEndRef.current = null;

        let msg = "Time's up!";
        if (timerMode === 'pomodoro') {
          msg = `Pomodoro #${studySessionNumber} Complete! Take a break.`;
          setCompletedPomodoros((p) => p + 1);
          setStudySessionNumber((n) => (n % 4) + 1);
        } else if (timerMode === 'deep_work') {
          msg = 'Deep Work Session Finished! Outstanding focus.';
          setCompletedPomodoros((p) => p + 2);
        } else if (timerMode === 'short_break' || timerMode === 'long_break') {
          msg = 'Break Finished! Ready to dive back in?';
        }
        setAlarmMessage(msg);
        setIsAlarmActive(true);

        // Continuous audio playback (unless muted)
        playAlarm(selectedSound, volume, isMuted);

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#cbd5e1', '#94a3b8', '#64748b'],
          });
        } catch {}
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerMode, studySessionNumber, selectedSound, volume, isMuted]);

  // Stopwatch RequestAnimationFrame Loop
  useEffect(() => {
    if (!isSwRunning) {
      if (swAnimFrameRef.current) {
        cancelAnimationFrame(swAnimFrameRef.current);
        swAnimFrameRef.current = null;
      }
      return;
    }

    const step = () => {
      if (swStartTimeRef.current !== null) {
        const now = performance.now();
        const total = swAccumulatedRef.current + (now - swStartTimeRef.current);
        setSwElapsedMs(total);
      }
      swAnimFrameRef.current = requestAnimationFrame(step);
    };

    swAnimFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (swAnimFrameRef.current) cancelAnimationFrame(swAnimFrameRef.current);
    };
  }, [isSwRunning]);

  // System Time Updater for smooth sweep analog clock
  useEffect(() => {
    let anim: number;
    const update = () => {
      setCurrentTime(new Date());
      anim = requestAnimationFrame(update);
    };
    anim = requestAnimationFrame(update);
    return () => cancelAnimationFrame(anim);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isAlarmActive) {
          dismissAlarmAlert();
        } else if (!isTimerRunning && !isTimerPaused) {
          startTimer();
        } else if (isTimerRunning) {
          pauseTimer();
        } else if (isTimerPaused) {
          resumeTimer();
        }
      } else if (e.code === 'Escape') {
        if (isAlarmActive) {
          dismissAlarmAlert();
        } else if (isCustomPickerOpen) {
          setIsCustomPickerOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isPaletteMenuOpen) {
          setIsPaletteMenuOpen(false);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        updateVolume(volume, nextMuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlarmActive, isTimerRunning, isTimerPaused, isMuted, volume, isCustomPickerOpen, isSettingsOpen, isPaletteMenuOpen, dismissAlarmAlert]);

  // Timer Control Actions
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
    if (timerTargetEndRef.current) {
      const left = Math.max(0, Math.ceil((timerTargetEndRef.current - Date.now()) / 1000));
      setRemaining(left);
    }
    timerTargetEndRef.current = null;
    setIsTimerRunning(false);
    setIsTimerPaused(true);
    document.title = 'ZenClock — Paused';
  };

  const resumeTimer = () => {
    startTimer();
  };

  const resetTimer = () => {
    timerTargetEndRef.current = null;
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setRemaining(duration);
    document.title = 'ZenClock — Modern Focus Suite';
  };

  const addQuickSeconds = (seconds: number) => {
    if (isTimerRunning && timerTargetEndRef.current) {
      timerTargetEndRef.current += seconds * 1000;
      setRemaining((r) => r + seconds);
      setDuration((d) => d + seconds);
    } else {
      setDuration((d) => d + seconds);
      setRemaining((r) => r + seconds);
    }
  };

  const switchMode = (mode: TimerMode) => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    timerTargetEndRef.current = null;

    let sec = 1500;
    if (mode === 'countdown') sec = duration;
    else if (mode === 'pomodoro') sec = 1500;
    else if (mode === 'deep_work') sec = 3000;
    else if (mode === 'short_break') sec = 300;
    else if (mode === 'long_break') sec = 900;

    setDuration(sec);
    setRemaining(sec);
  };

  const applyCustomDuration = () => {
    const totalSec = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (totalSec > 0) {
      setDuration(totalSec);
      setRemaining(totalSec);
      setTimerMode('countdown');
      setIsTimerRunning(false);
      setIsTimerPaused(false);
      timerTargetEndRef.current = null;
    }
    setIsCustomPickerOpen(false);
  };

  // Stopwatch actions
  const startStopwatch = () => {
    unlockAudio();
    swStartTimeRef.current = performance.now();
    setIsSwRunning(true);
    setIsSwPaused(false);
  };

  const pauseStopwatch = () => {
    if (swStartTimeRef.current !== null) {
      swAccumulatedRef.current += performance.now() - swStartTimeRef.current;
      swStartTimeRef.current = null;
    }
    setIsSwRunning(false);
    setIsSwPaused(true);
  };

  const resumeStopwatch = () => {
    swStartTimeRef.current = performance.now();
    setIsSwRunning(true);
    setIsSwPaused(false);
  };

  const resetStopwatch = () => {
    swStartTimeRef.current = null;
    swAccumulatedRef.current = 0;
    swLastLapElapsedRef.current = 0;
    setIsSwRunning(false);
    setIsSwPaused(false);
    setSwElapsedMs(0);
    setLaps([]);
  };

  const recordLap = () => {
    if (!isSwRunning && !isSwPaused) return;
    const currentTotal = swElapsedMs;
    const lapTime = currentTotal - swLastLapElapsedRef.current;
    swLastLapElapsedRef.current = currentTotal;

    const newLap: LapItem = {
      id: `${Date.now()}-${laps.length}`,
      lapNumber: laps.length + 1,
      lapTimeMs: lapTime,
      overallTimeMs: currentTotal,
      timestamp: Date.now(),
    };
    setLaps((prev) => [newLap, ...prev]);
  };

  const copyLapsToClipboard = async () => {
    if (laps.length === 0) return;
    const lines = laps.map(
      (l) =>
        `#${l.lapNumber.toString().padStart(2, '0')} | Split: ${formatStopwatch(l.lapTimeMs).main}.${formatStopwatch(l.lapTimeMs).cs} | Total: ${formatStopwatch(l.overallTimeMs).main}.${formatStopwatch(l.overallTimeMs).cs}`
    );
    const text = `ZenClock Stopwatch Laps\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLaps(true);
      setTimeout(() => setCopiedLaps(false), 2000);
    } catch {}
  };

  // Motivational quote forward
  const handleNextQuote = () => {
    setQuoteFade(false);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      setQuoteFade(true);
    }, 200);
  };

  // Sound Preview Handler
  const handlePreviewSound = (id: string) => {
    unlockAudio();
    if (previewingId === id) {
      stopPreview();
      setPreviewingId(null);
    } else {
      stopPreview();
      previewSound(id, volume);
      setPreviewingId(id);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // Three.js Ambient 3D Engine — Palette-Coordinated & Visible in Gaps
  // ═════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enable3D || !threeCanvasRef.current) return;
    const container = threeCanvasRef.current;
    container.innerHTML = '';

    const currentPaletteTheme = PALETTES[palette] || PALETTES.midnight;
    const { threeJs } = currentPaletteTheme;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Tilted Orbital Curve Rings looping across dashboard gaps
    const orbitMaterials = threeJs.orbitRings.map(
      (color, idx) =>
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: idx === 0 ? 0.38 : idx === 1 ? 0.28 : 0.2,
        })
    );

    const orbitGroup = new THREE.Group();
    mainGroup.add(orbitGroup);

    const createOrbitalRing = (radiusX: number, radiusY: number, mat: THREE.LineBasicMaterial, rotX: number, rotY: number) => {
      const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(120);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, mat);
      line.rotation.x = rotX;
      line.rotation.y = rotY;
      return line;
    };

    const ring1 = createOrbitalRing(18, 13, orbitMaterials[0], Math.PI / 3.2, Math.PI / 5.5);
    const ring2 = createOrbitalRing(26, 19, orbitMaterials[1], -Math.PI / 3.8, Math.PI / 4.2);
    const ring3 = createOrbitalRing(34, 24, orbitMaterials[2], Math.PI / 5, -Math.PI / 4.5);
    orbitGroup.add(ring1);
    orbitGroup.add(ring2);
    orbitGroup.add(ring3);

    // 2. Cosmic Stardust Particles with Palette Colors
    const particleCount = 800;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColorsArray = new Float32Array(particleCount * 3);

    const baseColors = threeJs.particleColors.map((c) => new THREE.Color(c));

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 65;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 45;

      const chosenColor = baseColors[i % baseColors.length];
      particleColorsArray[i * 3] = chosenColor.r;
      particleColorsArray[i * 3 + 1] = chosenColor.g;
      particleColorsArray[i * 3 + 2] = chosenColor.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColorsArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: theme === 'dark' ? 0.65 : 0.5,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    mainGroup.add(particleSystem);

    // 3. Floating Geometric Wireframe Objects (Placed in viewable gaps)
    const geoGroup = new THREE.Group();
    mainGroup.add(geoGroup);

    // Object A: Floating Wireframe Icosahedron (Top Gap between Col 1 & Col 2)
    const icoGeom = new THREE.IcosahedronGeometry(2.2, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: threeJs.geo.ico,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
      roughness: 0.2,
      metalness: 0.85,
    });
    const icoMesh = new THREE.Mesh(icoGeom, icoMat);
    icoMesh.position.set(-6, 6, -5);
    geoGroup.add(icoMesh);

    // Object B: Floating Torus (Lower Gap between Col 2 & Col 3)
    const torusGeom = new THREE.TorusGeometry(3.2, 0.18, 16, 80);
    const torusMat = new THREE.MeshStandardMaterial({
      color: threeJs.geo.torus,
      transparent: true,
      opacity: 0.4,
      roughness: 0.15,
      metalness: 0.9,
    });
    const torusMesh = new THREE.Mesh(torusGeom, torusMat);
    torusMesh.position.set(6, -5, -6);
    torusMesh.rotation.x = Math.PI / 3;
    geoGroup.add(torusMesh);

    // Object C: Floating Wireframe Octahedron (Center Upper Gap above Centerpiece)
    const octaGeom = new THREE.OctahedronGeometry(2.0, 0);
    const octaMat = new THREE.MeshStandardMaterial({
      color: threeJs.geo.sphere,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
      roughness: 0.2,
      metalness: 0.8,
    });
    const octaMesh = new THREE.Mesh(octaGeom, octaMat);
    octaMesh.position.set(0, 8, -7);
    geoGroup.add(octaMesh);

    // Object D: Floating Reflective Sphere (Bottom Left Gap)
    const sphereGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: threeJs.geo.sphere,
      roughness: 0.1,
      metalness: 0.92,
      transparent: true,
      opacity: 0.32,
    });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    sphereMesh.position.set(-7, -6, -4);
    geoGroup.add(sphereMesh);

    // 4. Ambient & Coordinated Point Lighting
    const ambientLight = new THREE.AmbientLight(threeJs.ambientLight, threeJs.ambientIntensity);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(
      threeJs.pointLight1.color,
      threeJs.pointLight1.intensity,
      60
    );
    pointLight1.position.set(threeJs.pointLight1.x, threeJs.pointLight1.y, threeJs.pointLight1.z);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(
      threeJs.pointLight2.color,
      threeJs.pointLight2.intensity,
      50
    );
    pointLight2.position.set(threeJs.pointLight2.x, threeJs.pointLight2.y, threeJs.pointLight2.z);
    scene.add(pointLight2);

    // 5. Interactive Mouse-Responsive Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Orbit rotations
        orbitGroup.rotation.z += 0.0009;
        ring1.rotation.y += 0.0006;
        ring2.rotation.x += 0.0005;

        // Geometric float & spin visible in gaps
        icoMesh.rotation.x += 0.003;
        icoMesh.rotation.y += 0.005;
        icoMesh.position.y = 6 + Math.sin(elapsed * 0.7) * 1.2;
        icoMesh.position.x = -6 + Math.cos(elapsed * 0.5) * 0.8;

        torusMesh.rotation.y += 0.004;
        torusMesh.rotation.z += 0.003;
        torusMesh.position.y = -5 + Math.cos(elapsed * 0.6) * 1.2;
        torusMesh.position.x = 6 + Math.sin(elapsed * 0.5) * 0.8;

        octaMesh.rotation.y += 0.004;
        octaMesh.rotation.x += 0.003;
        octaMesh.position.y = 8 + Math.sin(elapsed * 0.8) * 1.0;

        sphereMesh.position.y = -6 + Math.sin(elapsed * 1.0) * 0.9;

        // Particles gentle drift
        particleSystem.rotation.y += 0.0003;

        // Smooth mouse parallax lerp
        targetX = mouseX * 0.22;
        targetY = mouseY * 0.18;
        mainGroup.rotation.y += (targetX - mainGroup.rotation.y) * 0.04;
        mainGroup.rotation.x += (-targetY - mainGroup.rotation.x) * 0.04;
      }

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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      icoGeom.dispose();
      icoMat.dispose();
      torusGeom.dispose();
      torusMat.dispose();
      octaGeom.dispose();
      octaMat.dispose();
      sphereGeom.dispose();
      sphereMat.dispose();
      orbitMaterials.forEach((m) => m.dispose());
    };
  }, [enable3D, theme, palette]);

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
  const circleRadius = 105;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (1 - timerProgress) * circleCircumference;

  // Stopwatch formatted
  const swFormatted = formatStopwatch(swElapsedMs);
  const fastestLapId = laps.length > 1 ? laps.reduce((f, l) => (l.lapTimeMs < f.lapTimeMs ? l : f), laps[0])?.id : null;
  const slowestLapId = laps.length > 1 ? laps.reduce((s, l) => (l.lapTimeMs > s.lapTimeMs ? l : s), laps[0])?.id : null;

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 bg-transparent text-slate-100 transition-colors duration-300 select-none">
      {/* ───── Three.js Fixed Background (Visible through all grid gaps) ───── */}
      {enable3D && (
        <div ref={threeCanvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-95" />
      )}

      {/* ───── FLOATING DASHBOARD CANVAS (Transparent outer frame with visible gaps) ───── */}
      <div className="dashboard-outer-canvas w-full max-w-[1480px] h-full max-h-[940px] rounded-[28px] sm:rounded-[36px] xl:rounded-[42px] flex flex-col justify-between overflow-hidden relative z-10 shadow-2xl">
        
        {/* TOP BAR / NAVIGATION PILL */}
        <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 liquid-header flex items-center justify-between shrink-0">
          {/* Brand & Hourglass Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-md flex items-center justify-center bg-black/60 shrink-0">
              <img src="./logo.png" alt="ZenClock Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ZenClock
              </h1>
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/[0.08] px-1.5 py-0.2 rounded border border-white/10">
                PRO
              </span>
            </div>
          </div>

          {/* Segmented Timer Mode Switcher Pills */}
          <div className="hidden md:flex items-center space-x-1 p-1 rounded-2xl liquid-btn text-xs font-medium">
            {[
              { id: 'countdown', label: 'Custom', icon: Sparkles },
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
                    'flex items-center space-x-1.5 py-1 px-3 rounded-xl transition-all text-xs font-semibold',
                    isActive
                      ? 'bg-white/[0.14] text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-300" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Quick Palette Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPaletteMenuOpen((v) => !v)}
                className="flex items-center space-x-1.5 py-1.5 px-2.5 rounded-xl liquid-btn text-xs font-semibold text-slate-200 hover:text-white transition-all"
                title="Switch Color Palette"
              >
                <Palette className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden xl:inline text-[11px]">{PALETTES[palette].name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                  style={{ backgroundColor: PALETTES[palette].swatches.accent }}
                />
              </button>

              {isPaletteMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl liquid-glass p-2 shadow-2xl z-50 border border-white/10 backdrop-blur-2xl">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                    Select Palette (6 Themes)
                  </div>
                  <div className="space-y-1">
                    {PALETTE_LIST.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          changePalette(p.id);
                          setIsPaletteMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs',
                          palette === p.id
                            ? 'bg-white/[0.14] text-white font-bold'
                            : 'text-slate-300 hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: p.swatches.accent }}
                          />
                          <div>
                            <div className="font-semibold text-xs text-white">{p.name}</div>
                            <div className="text-[9px] text-slate-400">{p.subtitle}</div>
                          </div>
                        </div>
                        {palette === p.id && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Design Style Switcher */}
            <div className="flex items-center liquid-btn rounded-xl p-0.5 text-xs">
              {DESIGN_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setDesignStyle(style.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-all text-[11px]',
                    designStyle === style.id
                      ? 'bg-white/[0.14] text-white font-semibold border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                  title={style.tag}
                >
                  {style.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Mute Audio Toggle */}
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                updateVolume(volume, nextMuted);
              }}
              className={cn(
                'p-2 rounded-xl liquid-btn transition-all',
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'text-slate-300 hover:text-white'
              )}
              title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Preferences Modal Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl liquid-btn text-slate-300 hover:text-white transition-all"
              title="Sound & Preferences"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-xl liquid-btn text-slate-300 hover:text-white transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-200" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-2 rounded-xl liquid-btn text-slate-300 hover:text-white transition-all"
              title={isFullscreen ? 'Exit Fullscreen [ESC]' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Hero Action Button */}
            <button
              onClick={!isTimerRunning && !isTimerPaused ? startTimer : isTimerRunning ? pauseTimer : resumeTimer}
              className="palette-glow-btn px-4 sm:px-5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              {!isTimerRunning && !isTimerPaused && <Play className="w-3.5 h-3.5 fill-current" />}
              {isTimerRunning && <Pause className="w-3.5 h-3.5 fill-current" />}
              {isTimerPaused && <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{!isTimerRunning && !isTimerPaused ? 'START' : isTimerRunning ? 'PAUSE' : 'RESUME'}</span>
            </button>
          </div>
        </header>

        {/* ───── MAIN 3-COLUMN MULTI-PANEL DASHBOARD GRID (Transparent gaps reveal Three.js) ───── */}
        <main className="relative z-10 flex-1 w-full p-2.5 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden min-h-0 bg-transparent">
          
          {/* COLUMN 1 (4 Cols): FOCUS TELEMETRY & HERO VISUAL TIMER */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
            
            {/* Card 1: Focus Telemetry & Analytics Wave */}
            <div className="p-3.5 sm:p-4 rounded-3xl liquid-glass flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-slate-200">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide">Focus Analytics</h3>
                    <span className="text-[10px] text-slate-400">Today&apos;s Momentum</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4%</span>
                </div>
              </div>

              {/* Glowing SVG Wave Sparkline Chart */}
              <div className="my-2.5 h-12 w-full relative flex items-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 280 48" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="wave-neutral-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                  </defs>
                  {/* Background Soft Wave */}
                  <path
                    d="M 0,38 C 40,42 70,22 110,26 C 150,30 180,14 220,20 C 250,25 270,12 280,18"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                    strokeDasharray="4 4"
                  />
                  {/* Primary Glowing Curve */}
                  <path
                    d="M 0,26 C 35,8 65,36 105,18 C 145,2 175,32 215,14 C 245,2 265,22 280,8"
                    fill="none"
                    stroke="url(#wave-neutral-grad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Active Anchor Points */}
                  <circle cx="105" cy="18" r="3" fill="#ffffff" />
                  <circle cx="215" cy="14" r="3" fill="#94a3b8" />
                </svg>
              </div>

              {/* Cycle & Status Badges */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400">Cycle:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          step === studySessionNumber
                            ? 'w-4 bg-white shadow-sm shadow-white/50'
                            : step < studySessionNumber
                            ? 'w-2 bg-emerald-400'
                            : 'w-2 bg-slate-700'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-200">
                  {completedPomodoros} {completedPomodoros === 1 ? 'Session' : 'Sessions'} Done
                </div>
              </div>
            </div>

            {/* Card 2: Centerpiece Visual Countdown Timer */}
            <div className="flex-1 p-4 rounded-3xl liquid-glass flex flex-col justify-between items-center relative min-h-0">
              
              {/* Status Header */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
                <span className="flex items-center space-x-1.5 text-slate-200">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-slate-300" />
                  <span>TIMER // {timerMode.toUpperCase()}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-slate-200 font-semibold text-[10px]">
                  {isTimerRunning ? 'FLOW ACTIVE' : isTimerPaused ? 'PAUSED' : 'READY'}
                </span>
              </div>

              {/* Active Layout Centerpiece */}
              <div className="flex-1 flex flex-col items-center justify-center my-2 relative">
                {/* 1. Zen Minimal (Breathing Silver/Neutral Ring) */}
                {designStyle === 'zen' && (
                  <div className="relative flex items-center justify-center">
                    <div
                      className={cn(
                        'absolute inset-4 rounded-full blur-2xl transition-all duration-1000',
                        isTimerRunning ? 'bg-white/10 scale-105' : 'bg-white/5 scale-95'
                      )}
                    />
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 250 250">
                        <circle
                          cx="125"
                          cy="125"
                          r={circleRadius}
                          className="stroke-slate-800/80"
                          strokeWidth="5"
                          fill="transparent"
                        />
                        <circle
                          cx="125"
                          cy="125"
                          r={circleRadius}
                          stroke="url(#timer-neutral-grad)"
                          strokeWidth="6"
                          strokeDasharray={circleCircumference}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-500 ease-linear"
                        />
                        <defs>
                          <linearGradient id="timer-neutral-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="50%" stopColor="#cbd5e1" />
                            <stop offset="100%" stopColor="#94a3b8" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span
                          onClick={() => setIsCustomPickerOpen(true)}
                          className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular text-white cursor-pointer hover:text-slate-200 transition-colors drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
                          title="Click to edit duration"
                        >
                          {formatTime(remaining)}
                        </span>
                        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">
                          {isTimerRunning ? 'Focused' : 'Tap to edit'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Studio Modern (Radial Bauhaus Dial) */}
                {designStyle === 'studio' && (
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const rad = (i / 48) * 360 * (Math.PI / 180);
                        const isDone = i <= Math.floor(timerProgress * 48);
                        const isMajor = i % 4 === 0;
                        const r1 = isMajor ? 102 : 108;
                        const r2 = 118;
                        const x1 = 130 + r1 * Math.cos(rad);
                        const y1 = 130 + r1 * Math.sin(rad);
                        const x2 = 130 + r2 * Math.cos(rad);
                        const y2 = 130 + r2 * Math.sin(rad);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isDone ? '#ffffff' : 'rgba(148, 163, 184, 0.25)'}
                            strokeWidth={isMajor ? 3 : 1.5}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-8 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center">
                      <span
                        onClick={() => setIsCustomPickerOpen(true)}
                        className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular text-white cursor-pointer hover:text-slate-200 transition-colors"
                      >
                        {formatTime(remaining)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider mt-1">
                        {Math.round(timerProgress * 100)}% COMPLETE
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Cyber Neon (HUD Container) */}
                {designStyle === 'cyber' && (
                  <div className="w-full max-w-xs p-4 rounded-2xl bg-black/70 border border-white/20 shadow-[0_0_24px_rgba(255,255,255,0.08)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 pb-1 border-b border-white/10">
                      <span>SYS://FOCUS_CORE</span>
                      <span>STATUS: {isTimerRunning ? 'RUN' : 'HALT'}</span>
                    </div>
                    <div className="text-center my-3">
                      <span
                        onClick={() => setIsCustomPickerOpen(true)}
                        className="text-4xl sm:text-5xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] cursor-pointer tabular"
                      >
                        {formatTime(remaining)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="bg-white h-full shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-200"
                        style={{ width: `${timerProgress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Spatial 3D (Gyroscopic Halo) */}
                {designStyle === 'spatial' && (
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-black/60 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center p-4">
                    <div className="w-5 h-5 text-slate-300 animate-spin mb-1">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span
                      onClick={() => setIsCustomPickerOpen(true)}
                      className="text-4xl sm:text-5xl font-mono font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer tabular"
                    >
                      {formatTime(remaining)}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">
                      Spatial Active
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Preset Pills */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto max-w-full py-1 shrink-0">
                {QUICK_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => addQuickSeconds(p.sec)}
                    className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium text-slate-300 liquid-btn hover:text-white hover:border-white/25 transition-all shrink-0"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2 (4 Cols): SESSION CONFIGURATION & MOTIVATIONAL WISDOM */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
            
            {/* Card 3: Session Controls & Sound Chamber */}
            <div className="p-4 rounded-3xl liquid-glass flex flex-col justify-between space-y-3 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 className="text-xs font-bold text-white tracking-wide flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                  <span>Session Controls</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Audio &amp; Presets</span>
              </div>

              {/* Master Start / Pause / Reset Buttons Row */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetTimer}
                  className="p-3 rounded-2xl liquid-btn text-slate-300 hover:text-white transition-all active:scale-95"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={!isTimerRunning && !isTimerPaused ? startTimer : isTimerRunning ? pauseTimer : resumeTimer}
                  className="flex-1 py-3 px-4 rounded-2xl palette-glow-btn font-extrabold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  {!isTimerRunning && !isTimerPaused && <Play className="w-4 h-4 fill-current" />}
                  {isTimerRunning && <Pause className="w-4 h-4 fill-current" />}
                  {isTimerPaused && <Play className="w-4 h-4 fill-current" />}
                  <span>{!isTimerRunning && !isTimerPaused ? 'START FOCUS' : isTimerRunning ? 'PAUSE' : 'RESUME'}</span>
                </button>

                <button
                  onClick={() => {
                    const sp = splitSeconds(duration);
                    setCustomHours(sp.hours);
                    setCustomMinutes(sp.minutes);
                    setCustomSeconds(sp.seconds);
                    setIsCustomPickerOpen(true);
                  }}
                  className="p-3 rounded-2xl liquid-btn text-slate-300 hover:text-white transition-all active:scale-95"
                  title="Configure Custom Time"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>

              {/* Active Sound Card & Volume Slider */}
              <div className="p-3 rounded-2xl liquid-btn space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Bell className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-semibold text-slate-200">
                      {SOUND_DEFINITIONS.find((s) => s.id === selectedSound)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePreviewSound(selectedSound)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-white/[0.08] text-slate-200 border border-white/10 hover:bg-white/[0.14] transition-all"
                  >
                    {previewingId === selectedSound ? 'Stop' : 'Preview'}
                  </button>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 w-12">Vol: {Math.round(volume * 100)}%</span>
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
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Motivational Engine & Wisdom */}
            <div className="flex-1 p-4 rounded-3xl liquid-glass flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center space-x-1.5">
                  <Quote className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-xs font-bold text-white tracking-wide">Wisdom Feed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
                    60s
                  </span>
                  <button
                    onClick={handleNextQuote}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Next Quote"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quote Body */}
              <div className="my-auto py-2 quote-fade">
                <p className="italic text-slate-200 text-xs sm:text-sm leading-relaxed">
                  &ldquo;{currentQuote.text}&rdquo;
                </p>
                <span className="text-[11px] text-slate-400 font-medium block mt-2">
                  — {currentQuote.author}
                </span>
              </div>

              {/* Session Progress Note */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <span>Next quote in auto-rotation</span>
                <span className="font-mono text-slate-300">Quote #{quoteIndex + 1}/50</span>
              </div>
            </div>
          </div>

          {/* COLUMN 3 (4 Cols): OBSERVATORY (ANALOG CLOCK) & CHRONOGRAPH */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
            
            {/* Card 5: Live Observatory (Analog Clock) */}
            <div className="p-3.5 sm:p-4 rounded-3xl liquid-glass flex items-center justify-between min-h-0 shrink-0">
              {/* Analog Clock Dial */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                  {/* Outer Bezel */}
                  <circle
                    cx="100"
                    cy="100"
                    r="95"
                    className="fill-black/60 stroke-white/15"
                    strokeWidth="2"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    className="fill-black/80 stroke-white/[0.06]"
                    strokeWidth="1"
                  />

                  {/* Dial Hour Ticks */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const rad = (i * 30 * Math.PI) / 180;
                    const x1 = 100 + 76 * Math.sin(rad);
                    const y1 = 100 - 76 * Math.cos(rad);
                    const x2 = 100 + 86 * Math.sin(rad);
                    const y2 = 100 - 86 * Math.cos(rad);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={i % 3 === 0 ? '#ffffff' : '#64748b'}
                        strokeWidth={i % 3 === 0 ? 2.5 : 1.2}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Date Display Box */}
                  <rect x="132" y="91" width="24" height="18" rx="3" className="fill-slate-900 border border-white/20" />
                  <text x="144" y="104" textAnchor="middle" className="text-[9px] font-bold fill-slate-200 tabular">
                    {dayOfMonth}
                  </text>

                  {/* Hour Hand */}
                  <g transform={`rotate(${hrAngle}, 100, 100)`}>
                    <line x1="100" y1="110" x2="100" y2="52" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
                  </g>
                  {/* Minute Hand */}
                  <g transform={`rotate(${minAngle}, 100, 100)`}>
                    <line x1="100" y1="115" x2="100" y2="30" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
                  </g>
                  {/* Second Hand (Continuous Sweep) */}
                  <g transform={`rotate(${secAngle}, 100, 100)`}>
                    <line x1="100" y1="120" x2="100" y2="22" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="100" cy="112" r="3" fill="#e2e8f0" />
                  </g>

                  {/* Pinion */}
                  <circle cx="100" cy="100" r="4" className="fill-slate-200" />
                  <circle cx="100" cy="100" r="1.5" fill="#ffffff" />
                </svg>
              </div>

              {/* Time Readout & Telemetry */}
              <div className="flex-1 pl-4 flex flex-col justify-center space-y-1.5 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-slate-300" />
                  <span className="truncate">{timezone}</span>
                </span>

                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular text-white">
                  {use24Hour ? clockDigital24 : clockDigital12}
                  {!use24Hour && (
                    <span className="text-xs font-semibold text-slate-400 ml-1.5">{ampm}</span>
                  )}
                </div>

                <div className="text-xs font-medium text-slate-300">
                  {formattedDate}
                </div>

                {/* Sweep & 12/24H Toggles */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => setSmoothSweep((s) => !s)}
                    className="text-[10px] px-2 py-0.5 rounded-md font-mono liquid-btn text-slate-300 hover:text-white transition-colors"
                  >
                    {smoothSweep ? 'Sweep' : 'Tick'}
                  </button>
                  <button
                    onClick={() => setUse24Hour((h) => !h)}
                    className="text-[10px] px-2 py-0.5 rounded-md font-mono liquid-btn text-slate-300 hover:text-white transition-colors"
                  >
                    {use24Hour ? '24H' : '12H'}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6: Precision Chronograph & Laps */}
            <div className="flex-1 p-3.5 sm:p-4 rounded-3xl liquid-glass flex flex-col justify-between min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Watch className="w-3.5 h-3.5 text-slate-300" />
                  <span>Chronograph</span>
                </div>
                {laps.length > 0 && (
                  <button
                    onClick={copyLapsToClipboard}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                    title="Copy Laps"
                  >
                    {copiedLaps ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLaps ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {/* Stopwatch Large Display */}
              <div className="flex items-baseline justify-center my-2 shrink-0">
                <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular text-white">
                  {swFormatted.main}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-semibold text-slate-300 ml-1.5 tabular">
                  .{swFormatted.cs}
                </span>
              </div>

              {/* Stopwatch Action Controls */}
              <div className="flex items-center justify-center space-x-2 py-1 shrink-0">
                {!isSwRunning && !isSwPaused && (
                  <button
                    onClick={startStopwatch}
                    className="flex-1 py-1.5 px-4 rounded-xl palette-glow-btn text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </button>
                )}

                {isSwRunning && (
                  <>
                    <button
                      onClick={recordLap}
                      className="flex-1 py-1.5 px-3 rounded-xl liquid-btn text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <Flag className="w-3.5 h-3.5 text-slate-300" />
                      <span>Lap</span>
                    </button>
                    <button
                      onClick={pauseStopwatch}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
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
                      className="flex-1 py-1.5 px-3 rounded-xl liquid-btn text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={resumeStopwatch}
                      className="flex-1 py-1.5 px-3 rounded-xl palette-glow-btn text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  </>
                )}
              </div>

              {/* Scrollable Lap Records List */}
              <div className="flex-1 min-h-[70px] max-h-[110px] overflow-y-auto divide-y divide-white/[0.06] text-xs font-mono mt-1">
                {laps.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-[11px] italic">
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
                            ? 'text-emerald-400 font-semibold'
                            : isSlowest
                            ? 'text-rose-400 font-semibold'
                            : 'text-slate-300'
                        )}
                      >
                        <span className="text-slate-400 w-10">#{lap.lapNumber}</span>
                        <span className="tabular">+{split.main}.{split.cs}</span>
                        <span className="text-slate-500 tabular text-[11px]">{total.main}.{total.cs}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ───── BOTTOM FOOTER & TELEMETRY PILL ───── */}
        <footer className="relative z-20 w-full px-4 sm:px-6 py-2 border-t border-white/[0.08] liquid-header flex items-center justify-between text-xs text-slate-400 shrink-0">
          {/* Left Telemetry Pill */}
          <div className="flex items-center space-x-2.5">
            {/* IP Weather */}
            {weather && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full liquid-btn text-[11px] font-medium text-slate-200">
                <span className="text-sm">{weather.icon}</span>
                <span className="font-mono font-bold text-white">{weather.temp}°C</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 truncate max-w-[90px]">{weather.city}</span>
              </div>
            )}

            {/* Cultural Calendars */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full liquid-btn text-[11px] font-medium text-slate-300">
              <span className="text-emerald-400">🇧🇩 {banglaDate}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-200">🌙 {hijriDate}</span>
            </div>
          </div>

          {/* Right Keyboard Shortcuts */}
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="hidden md:inline">[Space] Start / Dismiss</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">[ESC] Close / Fullscreen</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">[M] Mute</span>
            <span>Alarm: <strong className="text-slate-200 font-semibold">{SOUND_DEFINITIONS.find((s) => s.id === selectedSound)?.name}</strong></span>
          </div>
        </footer>
      </div>

      {/* ───── FULLSCREEN RED/WHITE BLINKING ALARM ALERT ───── */}
      {isAlarmActive && (
        <>
          <div className="fixed inset-0 z-50 pointer-events-none alarm-active opacity-90 transition-opacity" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md p-8 rounded-3xl bg-black/95 border-2 border-red-500 text-center text-white shadow-[0_0_80px_rgba(239,68,68,0.8)] backdrop-blur-2xl">
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

      {/* ───── CUSTOM TIMER PICKER MODAL ───── */}
      {isCustomPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d0f18] border border-white/20 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-300" />
                <h3 className="font-bold text-base text-white">Set Custom Duration</h3>
              </div>
              <button
                onClick={() => setIsCustomPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Spinner Selectors */}
            <div className="flex items-center justify-center space-x-4 my-6">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCustomHours((h) => Math.min(23, h + 1))}
                  className="p-1.5 rounded-lg liquid-btn text-slate-300 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="text-3xl font-mono font-bold my-1 w-14 text-center bg-transparent text-white tabular"
                />
                <button
                  onClick={() => setCustomHours((h) => Math.max(0, h - 1))}
                  className="p-1.5 rounded-lg liquid-btn text-slate-300 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Hours</span>
              </div>

              <span className="text-2xl font-mono font-bold text-slate-500 pb-5">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCustomMinutes((m) => (m >= 59 ? 0 : m + 1))}
                  className="p-1.5 rounded-lg liquid-btn text-slate-300 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-3xl font-mono font-bold my-1 w-14 text-center bg-transparent text-white tabular"
                />
                <button
                  onClick={() => setCustomMinutes((m) => (m <= 0 ? 59 : m - 1))}
                  className="p-1.5 rounded-lg liquid-btn text-slate-300 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Mins</span>
              </div>

              <span className="text-2xl font-mono font-bold text-slate-500 pb-5">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCustomSeconds((s) => (s >= 59 ? 0 : s + 1))}
                  className="p-1.5 rounded-lg liquid-btn text-slate-300 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-3xl font-mono font-bold my-1 w-14 text-center bg-transparent text-white tabular"
                />
                <button
                  onClick={() => setCustomSeconds((s) => (s <= 0 ? 59 : s - 1))}
                  className="p-1.5 rounded-lg liquid-btn text-slate-300 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Secs</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setIsCustomPickerOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyCustomDuration}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold palette-glow-btn text-white transition-all shadow-md"
              >
                Apply Duration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── SOUNDS & PREFERENCES MODAL (With Multi-Palette Switcher) ───── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#0d0f18] border border-white/20 p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-300" />
                <h3 className="font-bold text-base text-white">Theme &amp; Preferences</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Section 1: 6 Coordinated Color Palettes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center space-x-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-300" />
                    <span>Color Palette (6 Themes)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Neutral Foundations</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PALETTE_LIST.map((p) => {
                    const isCurrent = palette === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => changePalette(p.id)}
                        className={cn(
                          'p-3 rounded-2xl text-left transition-all border flex flex-col justify-between space-y-2',
                          isCurrent
                            ? 'bg-white/[0.14] border-white/40 shadow-sm'
                            : 'liquid-btn border-white/[0.06] hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{p.subtitle}</span>
                        <div className="flex items-center space-x-1.5 pt-0.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: p.swatches.bg }}
                            title="Background"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: p.swatches.card }}
                            title="Panel Glass"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: p.swatches.border }}
                            title="Border"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: p.swatches.accent }}
                            title="Accent"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Volume Slider */}
              <div className="p-3.5 rounded-2xl liquid-btn space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>Master Volume</span>
                  <span className="font-mono text-slate-300">{Math.round(volume * 100)}%</span>
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-200"
                />
              </div>

              {/* Section 3: 3D Visual Effects Toggle */}
              <div className="p-3.5 rounded-2xl liquid-btn flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Three.js 3D Background</div>
                  <div className="text-[10px] text-slate-400">Animated particles, orbital rings &amp; geometry</div>
                </div>
                <button
                  onClick={() => setEnable3D((e) => !e)}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-semibold transition-all',
                    enable3D
                      ? 'bg-white/[0.16] text-white border border-white/30'
                      : 'bg-white/[0.04] text-slate-400 border border-white/10'
                  )}
                >
                  {enable3D ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Section 4: 12 Alarm Sounds */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Alarm Sounds ({SOUND_DEFINITIONS.length})
                </span>
                {SOUND_DEFINITIONS.map((sound) => {
                  const isSelected = sound.id === selectedSound;
                  const isPreviewing = previewingId === sound.id;
                  const isCustom = sound.id.startsWith('custom_alarm');

                  return (
                    <div
                      key={sound.id}
                      onClick={() => setSelectedSound(sound.id)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-white/[0.14] border-white/40 text-white shadow-sm'
                          : 'liquid-btn border-white/[0.06] text-slate-300 hover:border-white/20'
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold truncate text-white">{sound.name}</span>
                          {isCustom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-300 border border-white/10">
                              Imported
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.16] text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{sound.description}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewSound(sound.id);
                        }}
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-lg transition-all shrink-0',
                          isPreviewing
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'liquid-btn text-slate-300 hover:text-white'
                        )}
                      >
                        {isPreviewing ? 'Stop' : 'Preview'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end shrink-0">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="py-2 px-5 rounded-xl palette-glow-btn text-white font-semibold text-xs transition-all"
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
