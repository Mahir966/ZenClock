import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function splitSeconds(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { hours, minutes, seconds };
}

export function formatStopwatch(ms: number) {
  const cs = Math.floor(ms / 10) % 100;
  const totalSec = Math.floor(ms / 1000);
  const sec = totalSec % 60;
  const min = Math.floor((totalSec % 3600) / 60);
  const h = Math.floor(totalSec / 3600);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const main = h > 0 ? `${pad(h)}:${pad(min)}:${pad(sec)}` : `${pad(min)}:${pad(sec)}`;
  return { main, cs: pad(cs) };
}

export function getBanglaDate(date: Date = new Date()): string {
  const y = date.getFullYear();

  // Bangladesh revised calendar: Starts April 14
  let bYear = y - 593;
  let apr14 = new Date(y, 3, 14);
  if (date < apr14) {
    bYear = y - 594;
    apr14 = new Date(y - 1, 3, 14);
  }

  const banglaMonths = [
    'Boishakh', 'Jyoishtho', 'Asharh', 'Srabon', 
    'Bhadro', 'Ashwin', 'Kartik', 'Ograhayon', 
    'Poush', 'Magh', 'Falgun', 'Choitro'
  ];

  const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const falgunDays = isLeap ? 30 : 29;
  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunDays, 30];

  const oneDay = 24 * 60 * 60 * 1000;
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcApr14 = Date.UTC(apr14.getFullYear(), apr14.getMonth(), apr14.getDate());
  let diffDays = Math.floor((utcDate - utcApr14) / oneDay);

  let bMonthIndex = 0;
  while (diffDays >= monthLengths[bMonthIndex] && bMonthIndex < 11) {
    diffDays -= monthLengths[bMonthIndex];
    bMonthIndex++;
  }
  const bDay = diffDays + 1;
  return `${bDay} ${banglaMonths[bMonthIndex]} ${bYear}`;
}

export function getHijriDate(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let day = '', month = '', year = '';
    for (const p of parts) {
      if (p.type === 'day') day = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'year') year = p.value;
    }
    if (day && month && year) {
      return `${day} ${month} ${year} AH`;
    }
  } catch {}

  // Fallback Tabular calculation
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
             Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
             Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
             d - 32075;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) +
            (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
      (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  const hm = Math.floor((24 * l) / 709);
  const hd = l - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  const islamicMonths = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
  ];
  return `${hd} ${islamicMonths[hm - 1] || 'Islamic Month'} ${hy} AH`;
}
