# The Open Canvas 🎨💥

> An ultra-responsive, real-time multiplayer infinite canvas where users draw with animated GIFs, slap stickers directly on top of chats (inspired by Instagram's latest DM overlay update), bounce physics-enabled memes, spray stickers, trigger spatial Web Audio sound effects, and collaborate across desktop and mobile devices in pure internet chaos.

[![Built with Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Matter.js Physics](https://img.shields.io/badge/Matter.js-2D%20Physics-F05032)](https://brm.io/matter-js/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📸 Instagram-Style Chat & Sticker Overlay

Inspired by the latest **Instagram DM Sticker & GIF Overlay Update**, you can now:
- 💬 **Drop Instagram Chat Bubbles (`C`)**: Click anywhere on the canvas to post stylized message bubbles (with avatar, name, and timestamp). Tap or click to type any message.
- ✋ **Slap Stickers & GIFs Directly Over Chats**: Select any sticker, GIF, or reaction, and slap it directly over chat messages, doodles, or memes. They drop with organic random tilt (`-14°` to `+14°`), realistic drop shadows, and satisfying tactile pop sounds!
- ⚡ **Instant Reaction Slap Bar**: Quick-access bar (`❤️`, `😂`, `🔥`, `💀`, `😮`, `👏`, `🗿`) to immediately slap reactions anywhere.
- ✂️ **Photo Cutout Maker**: Upload any photo from your phone or desktop to create a custom cutout sticker with authentic white die-cut borders and shadows.
- 🌐 **Add Anything by URL**: Paste any Giphy, Tenor, Reddit, Discord, or Imgur link to add any media directly into the canvas.

---

## 📱 Mobile-First Native Experience

Optimized from the ground up for iOS Safari and Android Chrome:
- 🖐️ **Adaptive Mobile Bottom Dock**: 5 thumb-friendly tabs (`Select`, `Draw`, `Chat`, `Stickers`, `Chaos`) with integrated quick Undo and Redo buttons.
- ✌️ **Procreate-Style Touch Gestures**:
  - **Two-Finger Tap**: Instant Undo with tactile haptic vibration (`15ms`).
  - **Three-Finger Tap**: Instant Redo with haptic feedback.
  - **Single-Finger Double-Tap**: Smoothly zooms in to `1.75x` or resets to `100%`.
  - **Two-Finger Pinch & Pan**: Simultaneous smooth zooming and translation.
- 🧭 **Floating Navigation HUD**: Thumb-accessible zoom in `(+)`, zoom out `(-)`, zoom percentage, and 1-tap view recenter.
- 📱 **Slide-Up Bottom Sheets**: Native bottom sheets for the Sticker/GIF Vault and Chaos soundboard with swipe grab handles and tap-to-dismiss backdrops.
- 📲 **Native Share & Photo Save**:
  - Instant room sharing via `navigator.share` (WhatsApp, iMessage, Instagram DM).
  - Snapshot export with direct **"Save to Camera Roll"** support.
- 🛡️ **No iOS Zoom Glitches**: Inputs and textareas styled with safe font sizing to prevent unwanted iOS Safari viewport auto-zoom.

---

## ✨ Full Feature Overview

### 👥 Real-Time Multi-Device Collaboration
- **Dedicated Node.js WebSocket Gateway (`ws://localhost:3001`)**: Real-time cross-device state synchronization across phones, tablets, and computers.
- **BroadcastChannel Fallback**: Works offline or between tabs without extra network overhead.
- **Custom Room Codes**: Open `http://localhost:5173/?room=party123` to collaborate in isolated lobbies.
- **📱 Instant Mobile QR Connect**: Scan the navbar QR code with any smartphone camera to instantly join the exact room on your local Wi-Fi.
- **Simulated AI/Bot Collaborators**: Active bot roommates (`DogeLover99`, `PepeArchitect`, `PopcatGeneral`) that wander, chat, drop memes, and react.
- **High-Five Detector**: Collide cursors with peers to trigger confetti bursts and celebratory chimes.
- **Live Cursor Speech Bubbles**: Type messages that float directly above your cursor in real time.
- **Live Laser Pointer (`L`)**: Casts an animated glowing laser trail across the canvas.

### 🧲 Interactive Physics & Gravity Toys
- **2D Rigid-Body Meme Physics (`P`)**: Powered by [Matter.js](https://brm.io/matter-js/). Turn any meme or sticker into a bouncy rigid body.
- **Grab & Fling**: Pick up any physics meme, swing it around, and fling it across the canvas with velocity!
- **Black Hole Vortex Tool**: Hold click on the canvas to spawn a gravitational vortex that sucks in and swirls physics elements into an orbiting spiral!
- **Invert Gravity**: Flip the room's gravity upside down from the Chaos Wheel!

### 🎨 Brushes & Creative Tools
- **GIF Streamer Brush (`G`)**: Spray animated GIFs (Popcats, Doges, Nyan Cats) along your cursor path with velocity-sensitive rotation.
- **Neon Cyber Glow Brush**: Vibrant electric glowing strokes with SVG Gaussian blur glow filters.
- **Rainbow Magic Brush (`R`)**: Dynamic chromatic HSL gradient along vector strokes.
- **Emoji Spray Gun**: Sprays random party emojis (`🔥`, `✨`, `⭐`, `🎉`, `💀`, `🚀`).
- **Freehand Calligraphic Ink (`B`)**: Smooth pressure-sensitive vector curves powered by `perfect-freehand`.
- **WordArt / Meme Text (`T`)**: Impact-style meme typography with 3D drop-shadows.
- **30-Step Undo / Redo (`Ctrl+Z`, `Ctrl+Y`)**: Complete state history stack.
- **Minimap Radar**: Interactive radar in the bottom-left showing item locations, player positions, and viewport boundary. Click anywhere to teleport the camera!

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` + Drag / Middle Click | Pan Canvas Viewport |
| `C` | Drop Instagram Chat Bubble |
| `Ctrl+V` | Paste Image / GIF from Clipboard |
| `Ctrl+Z` | Undo Action |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo Action |
| `V` | Select & Transform Gizmo |
| `B` | Freehand Pen |
| `R` | Rainbow Brush |
| `G` | GIF Streamer Brush |
| `S` | Open Meme & GIF Vault |
| `T` | Meme Text / WordArt |
| `P` | Toggle 2D Bouncy Physics |
| `L` | Live Laser Pointer |
| `E` | Eraser |
| `Delete` / `Backspace` | Delete Selected Item |
| `Ctrl+D` | Duplicate Selected Item |

---

## 🛠️ Architecture & Tech Stack

```
TheOpenCanvas/
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── InfiniteCanvas.tsx   # Infinite viewport, SVG paths, pinch-pan, gestures
│   │   │   ├── TransformGizmo.tsx   # Mobile touch handles, rotate, edit, sound triggers
│   │   │   ├── LiveCursors.tsx      # Multi-user presence, laser trails, speech bubbles
│   │   │   └── Minimap.tsx          # Real-time radar navigation
│   │   └── UI/
│   │       ├── Navbar.tsx           # Room info, Chaos triggers, QR code, mobile sheet
│   │       ├── Toolbar.tsx          # Desktop floating dock & responsive mobile tab bar
│   │       ├── StickerPicker.tsx    # Slide-up vault, Photo Cutout Maker, URL importer
│   │       └── ChaosBar.tsx         # Meme nuke, gravity flip, soundboard, speech input
│   ├── hooks/
│   │   └── useMultiplayer.ts        # WebSocket & BroadcastChannel networking
│   ├── utils/
│   │   ├── soundEngine.ts           # Zero-dependency Web Audio synthesizer
│   │   ├── physicsEngine.ts         # Matter.js 2D rigid-body engine
│   │   ├── drawing.ts               # Perfect-freehand SVG stroke rendering
│   │   └── canvasExport.ts          # High-res PNG exporter & Web Share API
│   └── data/
│       └── memeCatalog.ts           # Curated viral meme templates, GIFs & reactions
└── server/
    └── server.mjs                   # Node.js WebSocket room server
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/FinnSkers/TheOpenCanvas.git
cd TheOpenCanvas

# Install dependencies
npm install

# Run Vite dev client and WebSocket server concurrently
npm run dev
```

* **Client**: `http://localhost:5173` (also accessible via LAN IP for mobile testing)
* **WebSocket Server**: `ws://localhost:3001`
* **Custom Room**: `http://localhost:5173/?room=friends`

### Production Build

```bash
npm run build
```

---

## 📄 License

MIT License. Have fun creating chaos!
