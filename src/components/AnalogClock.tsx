'use client';

import React, { useState } from 'react';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useZenClock } from '@/context/ZenClockContext';
import { Clock, Globe, Calendar, Zap, Check } from 'lucide-react';

interface AnalogClockProps {
  compact?: boolean;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({ compact = false }) => {
  const { preferences } = useZenClock();
  const [smoothSweep, setSmoothSweep] = useState(true);
  const [use24Hour, setUse24Hour] = useState(false);

  const {
    secondAngle,
    minuteAngle,
    hourAngle,
    time12,
    time24,
    ampm,
    dateFormatted,
    timezone,
    gmtString,
    date,
  } = useCurrentTime(smoothSweep);

  const dayOfMonth = date.getDate();
  const dayNameShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase();

  const isDark = preferences.theme === 'dark';

  return (
    <div className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${compact ? 'py-4' : 'py-8'}`}>
      {/* Clock Face Container */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <div
          className={`absolute -inset-6 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-700 ${
            isDark ? 'bg-blue-500' : 'bg-blue-400'
          }`}
        />

        {/* SVG Clock Dial */}
        <div className={`relative ${compact ? 'w-56 h-56' : 'w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96'} transition-all`}>
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full drop-shadow-2xl select-none"
            style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))' }}
          >
            {/* Outer bezel */}
            <circle
              cx="200"
              cy="200"
              r="192"
              className={isDark ? 'fill-slate-900/90 stroke-slate-700/60' : 'fill-white/90 stroke-slate-200'}
              strokeWidth="4"
            />
            {/* Inner ring gradient */}
            <circle
              cx="200"
              cy="200"
              r="184"
              className={isDark ? 'fill-slate-950/40 stroke-slate-800/40' : 'fill-slate-50/50 stroke-slate-100'}
              strokeWidth="2"
            />

            {/* 60 Minute Tick Marks */}
            {Array.from({ length: 60 }).map((_, i) => {
              const isHour = i % 5 === 0;
              const angle = i * 6;
              const rad = (angle * Math.PI) / 180;
              const rInner = isHour ? 158 : 170;
              const rOuter = 178;

              const x1 = 200 + rInner * Math.sin(rad);
              const y1 = 200 - rInner * Math.cos(rad);
              const x2 = 200 + rOuter * Math.sin(rad);
              const y2 = 200 - rOuter * Math.cos(rad);

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isHour
                      ? isDark
                        ? '#cbd5e1'
                        : '#334155'
                      : isDark
                      ? '#475569'
                      : '#cbd5e1'
                  }
                  strokeWidth={isHour ? (i % 15 === 0 ? 3.5 : 2.5) : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Hour Numbers (12, 3, 6, 9) */}
            {[
              { num: '12', x: 200, y: 72 },
              { num: '3', x: 332, y: 207 },
              { num: '6', x: 200, y: 342 },
              { num: '9', x: 68, y: 207 },
            ].map(({ num, x, y }) => (
              <text
                key={num}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`font-semibold text-lg md:text-xl tracking-wider select-none ${
                  isDark ? 'fill-slate-300' : 'fill-slate-700'
                }`}
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {num}
              </text>
            ))}

            {/* Brand Label */}
            <text
              x="200"
              y="125"
              textAnchor="middle"
              className={`text-[11px] font-medium tracking-[0.25em] uppercase select-none ${
                isDark ? 'fill-slate-400' : 'fill-slate-500'
              }`}
            >
              ZENCLOCK
            </text>

            {/* Date Complication Badge at 3 o'clock position */}
            <g transform="translate(255, 186)">
              <rect
                width="42"
                height="26"
                rx="5"
                className={isDark ? 'fill-slate-800 stroke-slate-700' : 'fill-slate-100 stroke-slate-300'}
                strokeWidth="1"
              />
              <text
                x="21"
                y="17"
                textAnchor="middle"
                className={`text-[11px] font-bold tracking-tight select-none ${
                  isDark ? 'fill-sky-400' : 'fill-blue-600'
                }`}
              >
                {dayOfMonth}
              </text>
            </g>

            {/* Hour Hand */}
            <g transform={`rotate(${hourAngle}, 200, 200)`}>
              <line
                x1="200"
                y1="220"
                x2="200"
                y2="105"
                stroke={isDark ? '#f8fafc' : '#0f172a'}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <line
                x1="200"
                y1="210"
                x2="200"
                y2="115"
                stroke={isDark ? '#94a3b8' : '#64748b'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>

            {/* Minute Hand */}
            <g transform={`rotate(${minuteAngle}, 200, 200)`}>
              <line
                x1="200"
                y1="230"
                x2="200"
                y2="55"
                stroke={isDark ? '#e2e8f0' : '#1e293b'}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <line
                x1="200"
                y1="220"
                x2="200"
                y2="70"
                stroke={isDark ? '#38bdf8' : '#0284c7'}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Second Hand (Continuous or Tick) */}
            <g transform={`rotate(${secondAngle}, 200, 200)`}>
              {/* Counterweight */}
              <line
                x1="200"
                y1="242"
                x2="200"
                y2="42"
                stroke="#ef4444"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="200" cy="225" r="5" fill="#ef4444" />
            </g>

            {/* Center Cap Pinion */}
            <circle cx="200" cy="200" r="7" className={isDark ? 'fill-slate-200' : 'fill-slate-900'} />
            <circle cx="200" cy="200" r="3" fill="#ef4444" />
          </svg>
        </div>
      </div>

      {/* Digital Time & Date Information */}
      <div className="mt-8 flex flex-col items-center text-center space-y-3">
        {/* Large Digital Readout */}
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-timer">
            {use24Hour ? time24 : time12}
          </span>
          {!use24Hour && (
            <span className="text-sm font-semibold tracking-wide text-sky-500 uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
              {ampm}
            </span>
          )}
        </div>

        {/* Date Display */}
        <div className="flex items-center space-x-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
          <Calendar className="w-4 h-4 text-sky-500" />
          <span>{dateFormatted}</span>
        </div>

        {/* Timezone pill */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500">
          <Globe className="w-3.5 h-3.5" />
          <span>
            {timezone} ({gmtString})
          </span>
        </div>

        {/* Clock Setting Toggles */}
        <div className="flex items-center space-x-3 pt-3">
          <button
            onClick={() => setSmoothSweep((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
              smoothSweep
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                : 'bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>{smoothSweep ? 'Smooth Sweep' : 'Crisp Tick'}</span>
          </button>

          <button
            onClick={() => setUse24Hour((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
              use24Hour
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                : 'bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{use24Hour ? '24-Hour Time' : '12-Hour Time'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
