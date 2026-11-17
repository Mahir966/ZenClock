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
  95: '⛈️', 96: '⛈️', 99: '⛈️',
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
      root.classList.remove('light');
    } else {
      root.classList.add('light');
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
        const city = geo.city || geo.region || 'Local';
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

      // Trigger locally stored audio loop with Web Audio fallback
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

  // Countdown Timer Engine
  useEffect(() => {
    if (!isTimerRunning || isTimerPaused) return;

    const interval = window.setInterval(() => {
      if (!timerTargetEndRef.current) return;
      const diffMs = timerTargetEndRef.current - Date.now();

      if (diffMs <= 0) {
        setRemaining(0);
        setIsTimerRunning(false);
        setIsTimerPaused(false);
        timerTargetEndRef.current = null;

        if (timerMode === 'pomodoro') {
          setCompletedPomodoros((prev) => {
            const next = prev + 1;
            if (next % 4 === 0) {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
            return next;
          });
          setStudySessionNumber((s) => (s >= 4 ? 1 : s + 1));
          triggerAlarmAlert('Pomodoro Focus Session Finished! Take a break.');
        } else if (timerMode === 'deep_work') {
          triggerAlarmAlert('Deep Work Block Complete! Outstanding focus.');
        } else if (timerMode === 'short_break' || timerMode === 'long_break') {
          triggerAlarmAlert('Break Finished! Ready to resume flow?');
        } else {
          triggerAlarmAlert('Countdown Timer Finished!');
        }
      } else {
        const secLeft = Math.ceil(diffMs / 1000);
        setRemaining(secLeft);
        document.title = `(${formatTime(secLeft)}) ZenClock`;
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [isTimerRunning, isTimerPaused, timerMode, triggerAlarmAlert]);

  // Stopwatch Engine
  useEffect(() => {
    if (!isSwRunning) return;

    const tick = () => {
      if (swStartTimeRef.current !== null) {
        const now = Date.now();
        setSwElapsedMs(swAccumulatedRef.current + (now - swStartTimeRef.current));
      }
      swAnimFrameRef.current = requestAnimationFrame(tick);
    };

    swAnimFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (swAnimFrameRef.current) cancelAnimationFrame(swAnimFrameRef.current);
    };
  }, [isSwRunning]);

  // Live System Clock Ticker
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
        }
      } else if (e.key === 'm' || e.key === 'M') {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        updateVolume(volume, nextMuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlarmActive, isTimerRunning, isTimerPaused, isMuted, volume, isCustomPickerOpen, isSettingsOpen, dismissAlarmAlert]);

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

  // Custom Picker apply
  const applyCustomDuration = () => {
    const total = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (total > 0) {
      setDuration(total);
      setRemaining(total);
      setIsTimerRunning(false);
      setIsTimerPaused(false);
      timerTargetEndRef.current = null;
    }
    setIsCustomPickerOpen(false);
  };

  // Stopwatch Actions
  const startStopwatch = () => {
    swStartTimeRef.current = Date.now();
    setIsSwRunning(true);
    setIsSwPaused(false);
  };

  const pauseStopwatch = () => {
    if (swStartTimeRef.current !== null) {
      swAccumulatedRef.current += Date.now() - swStartTimeRef.current;
    }
    swStartTimeRef.current = null;
    setIsSwRunning(false);
    setIsSwPaused(true);
  };

  const resumeStopwatch = () => {
    swStartTimeRef.current = Date.now();
    setIsSwRunning(true);
    setIsSwPaused(false);
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
    const total = swElapsedMs;
    const split = total - swLastLapElapsedRef.current;
    swLastLapElapsedRef.current = total;

    setLaps((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        lapNumber: prev.length + 1,
        lapTimeMs: split,
        overallTimeMs: total,
      },
      ...prev,
    ]);
  };

  const copyLapsToClipboard = () => {
    if (laps.length === 0) return;
    const text = laps
      .map((lap) => {
        const split = formatStopwatch(lap.lapTimeMs);
        const total = formatStopwatch(lap.overallTimeMs);
        return `Lap ${lap.lapNumber}: +${split.main}.${split.cs} (Total: ${total.main}.${total.cs})`;
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedLaps(true);
    setTimeout(() => setCopiedLaps(false), 2000);
  };

  // Sound Preview Actions
  const handlePreviewSound = (id: string) => {
    if (previewingId === id) {
      stopPreview();
      setPreviewingId(null);
    } else {
      unlockAudio();
      previewSound(id, volume);
      setPreviewingId(id);
    }
  };

  // ───── Futuristic Three.js Ambient 3D Engine (Reference Inspired) ─────
  useEffect(() => {
    if (!enable3D || !threeCanvasRef.current) return;
    const container = threeCanvasRef.current;
    container.innerHTML = '';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Three Glowing Orbital Curves (Reference Inspired)
    const orbitMaterials = [
      new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35 }),
      new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.25 }),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2 }),
    ];

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

    const ring1 = createOrbitalRing(16, 12, orbitMaterials[0], Math.PI / 3, Math.PI / 6);
    const ring2 = createOrbitalRing(22, 16, orbitMaterials[1], -Math.PI / 4, Math.PI / 4);
    const ring3 = createOrbitalRing(28, 20, orbitMaterials[2], Math.PI / 6, -Math.PI / 5);
    orbitGroup.add(ring1);
    orbitGroup.add(ring2);
    orbitGroup.add(ring3);

    // 2. Cosmic Stardust Particles
    const particleCount = 750;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      color: theme === 'dark' ? 0xc084fc : 0x7c3aed,
      transparent: true,
      opacity: theme === 'dark' ? 0.45 : 0.35,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    mainGroup.add(particleSystem);

    // 3. Floating Geometric Wireframe Objects
    const geoGroup = new THREE.Group();
    mainGroup.add(geoGroup);

    // Floating Icosahedron
    const icoGeom = new THREE.IcosahedronGeometry(2.4, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      metalness: 0.8,
    });
    const icoMesh = new THREE.Mesh(icoGeom, icoMat);
    icoMesh.position.set(-18, 9, -6);
    geoGroup.add(icoMesh);

    // Floating Torus
    const torusGeom = new THREE.TorusGeometry(3.5, 0.2, 16, 90);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.38,
      roughness: 0.15,
      metalness: 0.85,
    });
    const torusMesh = new THREE.Mesh(torusGeom, torusMat);
    torusMesh.position.set(19, -8, -8);
    torusMesh.rotation.x = Math.PI / 3;
    geoGroup.add(torusMesh);

    // Floating Sphere Accent
    const sphereGeom = new THREE.SphereGeometry(1.6, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.3,
    });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    sphereMesh.position.set(-14, -10, -4);
    geoGroup.add(sphereMesh);

    // 4. Subtle Purple Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0x2e1065, 1.4);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.8, 60);
    purpleLight.position.set(15, 12, 10);
    scene.add(purpleLight);

    const indigoLight = new THREE.PointLight(0x6366f1, 2.0, 50);
    indigoLight.position.set(-15, -12, 8);
    scene.add(indigoLight);

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

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!prefersReducedMotion) {
        // Orbit rotations
        orbitGroup.rotation.z += 0.0012;
        ring1.rotation.y += 0.0008;
        ring2.rotation.x += 0.0006;

        // Geometric float & spin
        icoMesh.rotation.x += 0.004;
        icoMesh.rotation.y += 0.006;
        torusMesh.rotation.y += 0.005;
        torusMesh.rotation.z += 0.003;
        sphereMesh.position.y += Math.sin(clock.getElapsedTime() * 1.5) * 0.005;

        // Particles gentle drift
        particleSystem.rotation.y += 0.0004;

        // Smooth mouse parallax lerp
        targetX = mouseX * 0.25;
        targetY = mouseY * 0.2;
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
      sphereGeom.dispose();
      sphereMat.dispose();
      orbitMaterials.forEach((m) => m.dispose());
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
  const circleRadius = 105;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (1 - timerProgress) * circleCircumference;

  // Stopwatch formatted
  const swFormatted = formatStopwatch(swElapsedMs);
  const fastestLapId = laps.length > 1 ? laps.reduce((f, l) => (l.lapTimeMs < f.lapTimeMs ? l : f), laps[0])?.id : null;
  const slowestLapId = laps.length > 1 ? laps.reduce((s, l) => (l.lapTimeMs > s.lapTimeMs ? l : s), laps[0])?.id : null;

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 bg-[#07080c] text-slate-100 transition-colors duration-300 select-none">
      {/* Three.js Ambient Particle & Orbit Background */}
      {enable3D && (
        <div ref={threeCanvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-80" />
      )}

      {/* ───── FLOATING DASHBOARD CANVAS (Reference Inspired) ───── */}
      <div className="dashboard-outer-canvas w-full max-w-[1480px] h-full max-h-[940px] rounded-[28px] sm:rounded-[36px] xl:rounded-[42px] flex flex-col justify-between overflow-hidden relative z-10 shadow-2xl">
        
        {/* TOP BAR / NAVIGATION PILL */}
        <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 liquid-header flex items-center justify-between shrink-0">
          {/* Brand & Hourglass Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-purple-500/40 shadow-lg shadow-purple-500/20 flex items-center justify-center bg-black/70 shrink-0">
              <img src="./logo.png" alt="ZenClock Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                ZenClock
              </h1>
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                PRO
              </span>
            </div>
          </div>

          {/* Segmented Timer Mode Switcher Pills (Inspired by Reference Navigation) */}
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
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Design Style Switcher */}
            <div className="flex items-center liquid-btn rounded-xl p-0.5 text-xs">
              {DESIGN_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setDesignStyle(style.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-all text-[11px]',
                    designStyle === style.id
                      ? 'bg-purple-600/40 text-purple-200 font-semibold border border-purple-500/30 shadow-sm'
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
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
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
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-2 rounded-xl liquid-btn text-slate-300 hover:text-white transition-all"
              title={isFullscreen ? 'Exit Fullscreen [ESC]' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Hero Purple Glow Action Button (Inspired by "Send" in Reference) */}
            <button
              onClick={!isTimerRunning && !isTimerPaused ? startTimer : isTimerRunning ? pauseTimer : resumeTimer}
              className="purple-glow-btn px-4 sm:px-5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              {!isTimerRunning && !isTimerPaused && <Play className="w-3.5 h-3.5 fill-current" />}
              {isTimerRunning && <Pause className="w-3.5 h-3.5 fill-current" />}
              {isTimerPaused && <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{!isTimerRunning && !isTimerPaused ? 'START' : isTimerRunning ? 'PAUSE' : 'RESUME'}</span>
            </button>
          </div>
        </header>

        {/* ───── MAIN 3-COLUMN MULTI-PANEL DASHBOARD GRID ───── */}
        <main className="relative z-10 flex-1 w-full p-3 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden min-h-0">
          
          {/* COLUMN 1 (4 Cols): FOCUS TELEMETRY & HERO VISUAL TIMER */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
            
            {/* Card 1: Focus Telemetry & Analytics Wave (Like "Analytics Today" in reference) */}
            <div className="p-3.5 sm:p-4 rounded-3xl liquid-glass flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
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
                    <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#38bdf8" />
                      <stop offset="50%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#ec4899" />
                    </linearGradient>
                    <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
                    </linearGradient>
                  </defs>
                  {/* Background Soft Wave */}
                  <path
                    d="M 0,38 C 40,42 70,22 110,26 C 150,30 180,14 220,20 C 250,25 270,12 280,18"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    strokeDasharray="4 4"
                  />
                  {/* Primary Glowing Curve */}
                  <path
                    d="M 0,26 C 35,8 65,36 105,18 C 145,2 175,32 215,14 C 245,2 265,22 280,8"
                    fill="none"
                    stroke="url(#wave-grad-1)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  {/* Active Anchor Points */}
                  <circle cx="105" cy="18" r="3" fill="#a855f7" />
                  <circle cx="215" cy="14" r="3" fill="#38bdf8" />
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
                            ? 'w-4 bg-purple-500 shadow-sm shadow-purple-500/50'
                            : step < studySessionNumber
                            ? 'w-2 bg-emerald-500'
                            : 'w-2 bg-slate-700'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[11px] font-mono font-semibold text-purple-300">
                  {completedPomodoros} {completedPomodoros === 1 ? 'Session' : 'Sessions'} Done
                </div>
              </div>
            </div>

            {/* Card 2: Centerpiece Visual Countdown Timer (Like the 3D Sphere card in reference) */}
            <div className="flex-1 p-4 rounded-3xl liquid-glass flex flex-col justify-between items-center relative min-h-0">
              
              {/* Status Header */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
                <span className="flex items-center space-x-1.5 text-purple-300">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                  <span>TIMER // {timerMode.toUpperCase()}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                  {isTimerRunning ? 'FLOW ACTIVE' : isTimerPaused ? 'PAUSED' : 'READY'}
                </span>
              </div>

              {/* Active Layout Centerpiece */}
              <div className="flex-1 flex flex-col items-center justify-center my-2 relative">
                {/* 1. Zen Minimal (Breathing Violet Ring) */}
                {designStyle === 'zen' && (
                  <div className="relative flex items-center justify-center">
                    <div
                      className={cn(
                        'absolute inset-4 rounded-full blur-2xl transition-all duration-1000',
                        isTimerRunning ? 'bg-purple-600/30 scale-105' : 'bg-purple-600/10 scale-95'
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
                          stroke="url(#timer-purple-grad)"
                          strokeWidth="7"
                          strokeDasharray={circleCircumference}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-[stroke-dashoffset] duration-200 ease-linear"
                        />
                        <defs>
                          <linearGradient id="timer-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
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
                          className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular text-white cursor-pointer hover:text-purple-300 transition-colors drop-shadow-[0_2px_12px_rgba(168,85,247,0.4)]"
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
                            stroke={isDone ? '#a855f7' : 'rgba(148, 163, 184, 0.25)'}
                            strokeWidth={isMajor ? 3 : 1.5}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-8 rounded-full bg-slate-950/70 border border-purple-500/20 backdrop-blur-xl flex flex-col items-center justify-center">
                      <span
                        onClick={() => setIsCustomPickerOpen(true)}
                        className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular text-purple-300 cursor-pointer"
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
                  <div className="w-full max-w-xs p-4 rounded-2xl bg-slate-950/80 border border-purple-500/40 shadow-[0_0_24px_rgba(168,85,247,0.25)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 pb-1 border-b border-purple-500/20">
                      <span>SYS://FOCUS_CORE</span>
                      <span>STATUS: {isTimerRunning ? 'RUN' : 'HALT'}</span>
                    </div>
                    <div className="text-center my-3">
                      <span
                        onClick={() => setIsCustomPickerOpen(true)}
                        className="text-4xl sm:text-5xl font-mono font-black text-purple-200 drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] cursor-pointer tabular"
                      >
                        {formatTime(remaining)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-purple-900/60">
                      <div
                        className="bg-purple-500 h-full shadow-[0_0_10px_#a855f7] transition-all duration-200"
                        style={{ width: `${timerProgress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Spatial 3D (Gyroscopic Halo) */}
                {designStyle === 'spatial' && (
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-purple-500/15 via-slate-950/70 to-indigo-500/15 border border-purple-500/30 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center p-4">
                    <div className="w-5 h-5 text-purple-400 animate-spin mb-1">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span
                      onClick={() => setIsCustomPickerOpen(true)}
                      className="text-4xl sm:text-5xl font-mono font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer tabular"
                    >
                      {formatTime(remaining)}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300/80 mt-1">
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
                    className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium text-slate-300 liquid-btn hover:text-purple-300 hover:border-purple-500/40 transition-all shrink-0"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2 (4 Cols): SESSION CONFIGURATION & MOTIVATIONAL WISDOM */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
            
            {/* Card 3: Session Controls & Sound Chamber (Like Center Form in Reference) */}
            <div className="p-4 rounded-3xl liquid-glass flex flex-col justify-between space-y-3 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 className="text-xs font-bold text-white tracking-wide flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
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
                  className="flex-1 py-3 px-4 rounded-2xl purple-glow-btn font-extrabold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
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
                    <Bell className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold text-slate-200">
                      {SOUND_DEFINITIONS.find((s) => s.id === selectedSound)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePreviewSound(selectedSound)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
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
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Motivational Engine & Wisdom (Like Social Friends Card in Reference) */}
            <div className="flex-1 p-4 rounded-3xl liquid-glass flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center space-x-1.5">
                  <Quote className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-bold text-white tracking-wide">Wisdom Feed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
                    60s
                  </span>
                  <button
                    onClick={handleNextQuote}
                    className="p-1 rounded-lg hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 transition-colors"
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
                <span className="text-[11px] text-purple-400 font-medium block mt-2">
                  — {currentQuote.author}
                </span>
              </div>

              {/* Session Progress Note */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <span>Next quote in auto-rotation</span>
                <span className="font-mono text-purple-300">Quote #{quoteIndex + 1}/50</span>
              </div>
            </div>
          </div>

          {/* COLUMN 3 (4 Cols): OBSERVATORY (ANALOG CLOCK) & CHRONOGRAPH */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
            
            {/* Card 5: Live Observatory (Analog Clock - Like Wallet in Reference) */}
            <div className="p-3.5 sm:p-4 rounded-3xl liquid-glass flex items-center justify-between min-h-0 shrink-0">
              {/* Analog Clock Dial */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                  {/* Outer Bezel */}
                  <circle
                    cx="100"
                    cy="100"
                    r="95"
                    className="fill-black/60 stroke-purple-500/30"
                    strokeWidth="2"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    className="fill-slate-950/80 stroke-white/[0.06]"
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
                        stroke={i % 3 === 0 ? '#c084fc' : '#475569'}
                        strokeWidth={i % 3 === 0 ? 2.5 : 1.2}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Date Display Box */}
                  <rect x="132" y="91" width="24" height="18" rx="3" className="fill-slate-900 border border-purple-500/40" />
                  <text x="144" y="104" textAnchor="middle" className="text-[9px] font-bold fill-purple-400 tabular">
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
                    <line x1="100" y1="120" x2="100" y2="22" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="100" cy="112" r="3" fill="#ec4899" />
                  </g>

                  {/* Pinion */}
                  <circle cx="100" cy="100" r="4" className="fill-purple-400" />
                  <circle cx="100" cy="100" r="1.5" fill="#ec4899" />
                </svg>
              </div>

              {/* Time Readout & Telemetry */}
              <div className="flex-1 pl-4 flex flex-col justify-center space-y-1.5 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-purple-400" />
                  <span className="truncate">{timezone}</span>
                </span>

                <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight tabular text-white">
                  {use24Hour ? clockDigital24 : clockDigital12}
                  {!use24Hour && (
                    <span className="text-xs font-semibold text-purple-400 ml-1.5">{ampm}</span>
                  )}
                </div>

                <div className="text-xs font-medium text-slate-300">
                  {formattedDate}
                </div>

                {/* Sweep & 12/24H Toggles */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => setSmoothSweep((s) => !s)}
                    className="text-[10px] px-2 py-0.5 rounded-md font-mono liquid-btn text-slate-300 hover:text-purple-300 transition-colors"
                  >
                    {smoothSweep ? 'Sweep' : 'Tick'}
                  </button>
                  <button
                    onClick={() => setUse24Hour((h) => !h)}
                    className="text-[10px] px-2 py-0.5 rounded-md font-mono liquid-btn text-slate-300 hover:text-purple-300 transition-colors"
                  >
                    {use24Hour ? '24H' : '12H'}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6: Precision Chronograph & Laps (Like Programs in Reference) */}
            <div className="flex-1 p-3.5 sm:p-4 rounded-3xl liquid-glass flex flex-col justify-between min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Watch className="w-3.5 h-3.5 text-purple-400" />
                  <span>Chronograph</span>
                </div>
                {laps.length > 0 && (
                  <button
                    onClick={copyLapsToClipboard}
                    className="text-[11px] text-slate-400 hover:text-purple-300 flex items-center space-x-1 transition-colors"
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
                <span className="text-xl sm:text-2xl font-mono font-semibold text-purple-400 ml-1.5 tabular">
                  .{swFormatted.cs}
                </span>
              </div>

              {/* Stopwatch Action Controls */}
              <div className="flex items-center justify-center space-x-2 py-1 shrink-0">
                {!isSwRunning && !isSwPaused && (
                  <button
                    onClick={startStopwatch}
                    className="flex-1 py-1.5 px-4 rounded-xl purple-glow-btn text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
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
                      <Flag className="w-3.5 h-3.5 text-purple-400" />
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
                      className="flex-1 py-1.5 px-3 rounded-xl liquid-btn text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={resumeStopwatch}
                      className="flex-1 py-1.5 px-3 rounded-xl purple-glow-btn text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-all"
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

        {/* ───── BOTTOM FOOTER & TELEMETRY PILL (Reference Inspired) ───── */}
        <footer className="relative z-20 w-full px-4 sm:px-6 py-2 border-t border-white/[0.08] liquid-header flex items-center justify-between text-xs text-slate-400 shrink-0">
          {/* Left Telemetry Pill (Like "Trusted Us" pill in reference) */}
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
              <span className="text-purple-300">🌙 {hijriDate}</span>
            </div>
          </div>

          {/* Right Keyboard Shortcuts */}
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="hidden md:inline">[Space] Start / Dismiss</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">[ESC] Close / Fullscreen</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">[M] Mute</span>
            <span>Alarm: <strong className="text-purple-300 font-semibold">{SOUND_DEFINITIONS.find((s) => s.id === selectedSound)?.name}</strong></span>
          </div>
        </footer>
      </div>

      {/* ───── FULLSCREEN RED/WHITE BLINKING ALARM ALERT ───── */}
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

      {/* ───── CUSTOM TIMER PICKER MODAL ───── */}
      {isCustomPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d0f18] border border-purple-500/30 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400" />
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
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold purple-glow-btn text-white transition-all shadow-md"
              >
                Apply Duration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── SOUNDS & PREFERENCES MODAL ───── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0d0f18] border border-purple-500/30 p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-base text-white">Sound &amp; Preferences</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Volume Slider */}
              <div className="p-3.5 rounded-2xl liquid-btn space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>Master Volume</span>
                  <span className="font-mono text-purple-300">{Math.round(volume * 100)}%</span>
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* 12 Sounds List */}
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
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-200 shadow-sm'
                          : 'liquid-btn border-white/[0.06] text-slate-300 hover:border-purple-500/25'
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold truncate text-white">{sound.name}</span>
                          {isCustom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Imported
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200">
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
                className="py-2 px-5 rounded-xl purple-glow-btn text-white font-semibold text-xs transition-all"
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
