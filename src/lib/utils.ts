import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(totalSeconds: number, forceHours = false): string {
  const rounded = Math.max(0, Math.ceil(totalSeconds));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0 || forceHours) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Split seconds into { hours, minutes, seconds }
 */
export function splitSeconds(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
  const rounded = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  return { hours, minutes, seconds };
}

/**
 * Format stopwatch milliseconds: HH:MM:SS.CS (centiseconds)
 */
export function formatStopwatch(ms: number): {
  main: string;
  milliseconds: string;
} {
  const totalHundredths = Math.floor(ms / 10);
  const cs = totalHundredths % 100;
  const totalSeconds = Math.floor(ms / 1000);
  const secs = totalSeconds % 60;
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const hrs = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');

  let main = `${pad(mins)}:${pad(secs)}`;
  if (hrs > 0) {
    main = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  return {
    main,
    milliseconds: pad(cs),
  };
}

/**
 * Format duration into human readable string e.g. "25 min", "1 hr 15 min"
 */
export function formatDurationLabel(seconds: number): string {
  const { hours, minutes, seconds: s } = splitSeconds(seconds);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}
