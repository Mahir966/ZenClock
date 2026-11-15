import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
};

export const metadata: Metadata = {
  title: 'ZenClock — Modern Timer, Stopwatch & Study Suite',
  description: 'A premium, modern, distraction-free timer, pomodoro study suite, stopwatch, and live analog clock web application with customizable layouts and 3D visual elements.',
  keywords: ['timer', 'pomodoro', 'stopwatch', 'study timer', 'analog clock', 'zen clock', 'alarm', 'minimalist'],
  authors: [{ name: 'ZenClock' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
