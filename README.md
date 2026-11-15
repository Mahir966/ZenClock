# ⏱️ ZenClock — Premium Modern Timer & Productivity Suite

![ZenClock Banner](https://img.shields.io/badge/ZenClock-Next.js%2015%20%7C%20TypeScript%20%7C%20Tailwind%20CSS%20%7C%20Three.js-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages%20Ready-purple?style=for-the-badge)

**ZenClock** is a state-of-the-art, distraction-free timer, study companion, stopwatch, and live analog clock web application. Built with Next.js 15, TypeScript, Tailwind CSS, Lucide Icons, and Three.js for subtle 3D ambient visual depth.

Designed for peak focus, ZenClock operates entirely client-side with zero external database or backend dependencies, offers 100% offline accuracy across background tabs, and provides multiple switchable visual layouts tailored to different work styles.

---

## 🌟 Highlights & Key Features

### 1. 🎨 Multiple Distinct UI Designs
Switch seamlessly between 4 handcrafted visual layouts in real-time:
* **Zen Minimalist (Default):** Ultra-clean, breathing circular progress ring with glassmorphic controls and calm aesthetics.
* **Modern Studio:** Bauhaus architectural dial with segmented radial ticks, structured ergonomics, and warm amber accents.
* **Cyberpunk Neon:** High-tech HUD framing, luminous cyan/amber glows, audio frequency simulation bars, and monospace segmented digital counters.
* **Spatial 3D:** Three.js-powered interactive particle halo, gyroscopic orbital rings, and holographic depth responsive to timer status.

### 2. ⏳ Precision Countdown Timer
* **Accurate Background Tab Timing:** Uses `Date.now()` timestamp delta calculation to eliminate browser tab-throttling drift. Time stays 100% accurate even when tabs are inactive.
* **Custom Durations:** Interactive hours, minutes, and seconds spinner modal.
* **Quick Presets:** Instant `+1m`, `+5m`, `+10m`, `+15m`, `+25m`, `+30m`, `+45m`, and `+60m` increment buttons.
* **Dynamic Tab Title:** Live remaining time reflected in the browser tab title (e.g. `(14:32) ZenClock`).

### 3. 🍅 Comprehensive Study & Pomodoro Suite
* **Structured Modes:** Pomodoro (25m), Deep Work (50m), Short Break (5m), and Long Break (15m).
* **Cycle Tracking:** 4-session focus cycle with visual progress dots and celebratory confetti upon cycle completion.
* **Automation Toggles:** Optional auto-start for breaks and pomodoro intervals.
* **Daily Streak Counter:** Tracks completed daily focus blocks with `localStorage` persistence.

### 4. ⏱️ High-Precision Stopwatch
* **Millisecond Precision:** Centisecond / millisecond timing display (`00:00:00.00`).
* **Lap Recording:** Split and overall elapsed times with automatic **Best Lap** (green) and **Slowest Lap** (red) badges.
* **Copy & Export:** One-click clipboard copy of lap times in formatted text.

### 5. 🔔 Classic Android-Inspired Alarm Sounds
Locally stored high-fidelity audio assets with zero external network reliance:
* **Oxygen:** Warm acoustic marimba with soothing dual-tone chime.
* **Argon:** Upbeat rhythmic electro-chime alarm sequence.
* **Cesium:** Cascading harp bells with rich harmonics.
* **Digital Beep:** High-clarity twin-frequency alarm beeper.
* **Zen Singing Bowl:** Deep Tibetan singing bowl with meditative binaural resonance.
* **Gentle Chimes:** Crystalline wind chimes with stereo panning.
* **Morning Breeze:** Pentatonic morning flute and acoustic warmth.
* **Web Audio Synth Fallback:** Procedural chime that works even if audio decoding fails.
* **Sound Preview & Volume Slider:** Instant playback preview and 0–100% volume control.

### 6. 🔊 Sound Permissions & Autoplay Handling
* First-visit non-intrusive sound activation prompt.
* AudioContext unlocking to satisfy modern browser autoplay restrictions.

### 7. 🔇 Dedicated Mute Control
* Top bar mute/unmute button with tooltip and `[M]` keyboard shortcut.
* **Crucial Behavior:** Muting disables audio playback but **never suppresses visual alarm alerts**.

### 8. 🚨 Visual Alarm Completion Alert
* When any timer or study session reaches zero, the entire viewport **continuously flashes between intense alert red and white**.
* An unmissable alert dialog presents a **"Dismiss Alarm"** button.
* Keyboard dismiss via `[Space]` or `[Esc]`.

### 9. 🕒 Live Analog Clock
* Real-time device clock with smooth continuous sweep second hand (or crisp step tick).
* Inset date complication badge, 12h/24h digital readout, and timezone offset indicator (`GMT+X`).

### 10. 🌓 Themes & Fullscreen
* Instant Dark Mode and Light Mode switching with system preference auto-detection.
* Native HTML5 fullscreen toggle (`[Esc]` exits normally).
* All user preferences automatically persisted in `localStorage`.

---

## 📸 Screenshots & Layout Walkthrough

```
+-------------------------------------------------------------------------+
|  [⚡ ZenClock]    ( Timer | Study | Stopwatch | Clock )   [🎨 Layout] [🔊] [🌙] [⛶] |
+-------------------------------------------------------------------------+
|                                                                         |
|                                   * .                                   |
|                              *  3D HALO  *                              |
|                             *  PARTICLES  *                             |
|                                   . *                                   |
|                                                                         |
|                                 ( 24:59 )                               |
|                               FLOW STATE                                |
|                                                                         |
|                       [↺]       [ ▶ ]       [⚙]                         |
|                                                                         |
|                         [+1m]  [+5m]  [+10m]  [+15m]                    |
|                                                                         |
+-------------------------------------------------------------------------+
|  ZenClock • [M] Mute Audio • [Esc] Dismiss Alert • Preferences & Sounds |
+-------------------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **3D Graphics** | [Three.js](https://threejs.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Effects** | [Canvas Confetti](https://github.com/catdad/canvas-confetti) |
| **Audio** | HTML5 Audio + Web Audio API Synthesis |
| **Architecture** | 100% Client-Side Static Export (`output: 'export'`) |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v18.17.0 or later (v20+ recommended)
* `npm` or `pnpm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ZenClock.git
   cd ZenClock
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate audio assets (if needed):**
   ```bash
   npm run generate-sounds
   ```
   *(Local sound files are generated into `public/sounds/`)*

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Build & Static Export

To build the static HTML/CSS/JS export for production:

```bash
npm run build
```

This generates an optimized static export in the `./out` directory ready for deployment to any static web host or CDN.

---

## 🌐 GitHub Pages Deployment Guide

ZenClock is pre-configured for seamless GitHub Pages deployment using static export and GitHub Actions.

### Method 1: Automated GitHub Actions (Recommended)

1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/your-username/ZenClock.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository, navigate to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically trigger on push to `main` and publish the site!

### Method 2: Manual Build & Push to `gh-pages` Branch

If you prefer building locally and pushing to the `gh-pages` branch:

```bash
# Build the project
npm run build

# Deploy using gh-pages package
npx gh-pages -d out --dotfiles
```

> **Note on Base Path:** If hosting on `https://<username>.github.io/<repository-name>/`, ZenClock includes auto-detection for GitHub Pages subpaths. You can also specify the base path during build:
> ```bash
> NEXT_PUBLIC_BASE_PATH=/ZenClock npm run build
> ```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Start / Pause active timer or stopwatch |
| `M` / `m` | Toggle Audio Mute (Visual alerts remain active) |
| `Esc` | Dismiss flashing completion alert or exit fullscreen |
| `Enter` | Dismiss active alarm alert |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
