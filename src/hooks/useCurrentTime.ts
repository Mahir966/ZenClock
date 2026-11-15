'use client';

import { useState, useEffect } from 'react';

export function useCurrentTime(smoothSweep = true) {
  const [date, setDate] = useState<Date>(() => new Date());

  useEffect(() => {
    let animId: number;

    if (smoothSweep) {
      const update = () => {
        setDate(new Date());
        animId = requestAnimationFrame(update);
      };
      animId = requestAnimationFrame(update);
    } else {
      const interval = setInterval(() => {
        setDate(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [smoothSweep]);

  const ms = date.getMilliseconds();
  const rawSeconds = date.getSeconds();
  const rawMinutes = date.getMinutes();
  const rawHours = date.getHours();

  const secondsProgress = smoothSweep ? rawSeconds + ms / 1000 : rawSeconds;
  const minutesProgress = rawMinutes + secondsProgress / 60;
  const hoursProgress = (rawHours % 12) + minutesProgress / 60;

  const secondAngle = secondsProgress * 6; // 360 / 60 = 6
  const minuteAngle = minutesProgress * 6;
  const hourAngle = hoursProgress * 30; // 360 / 12 = 30

  const pad = (n: number) => n.toString().padStart(2, '0');

  const hours12 = rawHours % 12 || 12;
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  const time12 = `${pad(hours12)}:${pad(rawMinutes)}:${pad(rawSeconds)}`;
  const time24 = `${pad(rawHours)}:${pad(rawMinutes)}:${pad(rawSeconds)}`;

  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMinsRemainder = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const gmtString = `GMT${offsetSign}${offsetHours}${offsetMinsRemainder > 0 ? `:${pad(offsetMinsRemainder)}` : ''}`;

  return {
    date,
    secondAngle,
    minuteAngle,
    hourAngle,
    time12,
    time24,
    ampm,
    dateFormatted,
    timezone,
    gmtString,
  };
}
