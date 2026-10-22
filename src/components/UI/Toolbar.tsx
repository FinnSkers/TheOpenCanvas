import React, { useState } from 'react';
import {
  MousePointer2,
  Pen,
  Sparkles,
  Smile,
  Type,
  Eraser,
  Flame,
  Activity,
  Palette,
  Undo2,
  Redo2,
  Zap,
  Orbit,
  MessageCircle
} from 'lucide-react';
import type { ToolType, BrushType } from '../../types/canvas';
import type { MemeTemplate } from '../../data/memeCatalog';

interface ToolbarProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  brushColor: string;
  onChangeColor: (color: string) => void;
  brushSize: number;
  onChangeSize: (size: number) => void;
  brushType: BrushType;
  onChangeBrushType: (bType: BrushType) => void;
  onOpenStickerPicker: () => void;
  activeStreamSticker: MemeTemplate;
  onSelectStreamSticker: (m: MemeTemplate) => void;
  isPhysicsRunning: boolean;
  onTogglePhysics: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onQuickSlapReaction?: (emoji: string) => void;
}

const COLOR_PALETTE = [
  '#f43f5e', // rose
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#eab308', // yellow
  '#f97316', // orange
  '#ffffff', // white
  '#000000'  // black
];

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '💀', '😮', '👏', '🗿'];

type MobileTab = 'select' | 'draw' | 'chat' | 'slap' | 'chaos';

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onChangeTool,
  brushColor,
  onChangeColor,
  brushSize,
  onChangeSize,
  brushType,
  onChangeBrushType,
  onOpenStickerPicker,
  activeStreamSticker,
  isPhysicsRunning,
  onTogglePhysics,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onQuickSlapReaction
}) => {
  const [mobileTab, setMobileTab] = useState<MobileTab>(() => {
    if (activeTool === 'chat') return 'chat';
    if (activeTool === 'sticker-slap') return 'slap';
    if (activeTool === 'black-hole' || activeTool === 'laser') return 'chaos';
    if (activeTool === 'select') return 'select';
    return 'draw';
  });

  const triggerHaptic = (ms: number = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const isDrawingTool =
    activeTool === 'pen' ||
    activeTool === 'neon' ||
    activeTool === 'rainbow' ||
    activeTool === 'gif-stream' ||
    activeTool === 'emoji-stream' ||
    activeTool === 'sparkle';

  const handleMobileTabSwitch = (tab: MobileTab) => {
    triggerHaptic(12);
    setMobileTab(tab);
    if (tab === 'select') {
      onChangeTool('select');
    } else if (tab === 'chat') {
      onChangeTool('chat');
    } else if (tab === 'slap') {
      onChangeTool('sticker-slap');
    } else if (tab === 'draw') {
      if (!isDrawingTool) {
        onChangeBrushType('pen');
        onChangeTool('pen');
      }
    }
  };

  return (
    <>
      {/* ========================================================
          1. DESKTOP TOOLBAR (Screens sm: and larger)
         ======================================================== */}
      <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2.5 z-30 pointer-events-auto select-none max-w-[96vw]">
        {/* Instagram-Style Quick Reactions Bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/90 backdrop-blur-md border border-white/10 shadow-xl text-base animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 tracking-wider">
            Slap:
          </span>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                triggerHaptic();
                onQuickSlapReaction?.(emoji);
              }}
              title={`Slap ${emoji} onto chat or canvas`}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-transform hover:scale-125 active:scale-95 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            onClick={() => {
              triggerHaptic();
              onOpenStickerPicker();
            }}
            title="Open Sticker & GIF Vault"
            className="px-2.5 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>+ GIF / Sticker</span>
          </button>
        </div>

        {/* Sub-bar for Drawing Customizations */}
        {isDrawingTool && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gray-900/95 backdrop-blur-md border border-white/10 shadow-xl max-w-full overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Colors */}
            {activeTool !== 'gif-stream' && activeTool !== 'rainbow' && activeTool !== 'emoji-stream' && (
              <div className="flex items-center gap-1.5 shrink-0">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      triggerHaptic();
                      onChangeColor(c);
                    }}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      brushColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}

            {/* Active GIF stream sticker indicator */}
            {activeTool === 'gif-stream' && (
              <div className="flex items-center gap-1.5 text-xs text-gray-300 shrink-0">
                <span className="text-[11px] font-semibold text-pink-400">Spraying:</span>
                <img
                  src={activeStreamSticker.url}
                  alt="stream sticker"
                  className="w-6 h-6 object-contain rounded"
                />
                <span className="font-medium text-xs truncate max-w-[100px]">{activeStreamSticker.name}</span>
                <button
                  onClick={() => {
                    triggerHaptic();
                    onOpenStickerPicker();
                  }}
                  className="text-xs text-pink-400 hover:text-pink-300 underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            {/* Emoji streamer label */}
            {activeTool === 'emoji-stream' && (
              <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold shrink-0">
                <span>Spraying:</span>
                <span>🔥 ✨ ⭐ 🎉 💀</span>
              </div>
            )}

            {/* Brush Size Slider */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10 shrink-0">
              <span className="text-xs font-medium text-gray-400">Size</span>
              <input
                type="range"
                min={4}
                max={64}
                value={brushSize}
                onChange={(e) => onChangeSize(Number(e.target.value))}
                className="w-20 accent-pink-500 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
              />
              <span className="text-xs font-mono text-gray-300 w-4">{brushSize}</span>
            </div>
          </div>
        )}

        {/* Main Desktop Tool Dock */}
        <nav className="flex items-center gap-1.5 p-2 rounded-3xl bg-gray-900/90 backdrop-blur-lg border border-white/15 shadow-2xl">
          {/* Undo / Redo */}
          <button
            onClick={() => {
              triggerHaptic();
              onUndo();
            }}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-2.5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 hover:bg-white/5 transition-all cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              triggerHaptic();
              onRedo();
            }}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-2.5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 hover:bg-white/5 transition-all cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* Select / Move */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeTool('select');
            }}
            title="Select & Pan (V)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <MousePointer2 className="w-5 h-5" />
          </button>

          {/* Instagram DM Chat Bubble Tool */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeTool('chat');
            }}
            title="Post Instagram-style Chat Bubble (C)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'chat'
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-5 h-5 text-pink-400" />
          </button>

          {/* Freehand Pen */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeBrushType('pen');
              onChangeTool('pen');
            }}
            title="Freehand Ink (B)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'pen' && brushType === 'pen'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Pen className="w-5 h-5" />
          </button>

          {/* Neon Glow Pen */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeBrushType('neon');
              onChangeTool('neon');
            }}
            title="Neon Cyber Glow Pen"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'neon'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 scale-105 ring-2 ring-cyan-300'
                : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-white/5'
            }`}
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Rainbow Brush */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeBrushType('rainbow');
              onChangeTool('rainbow');
            }}
            title="Rainbow Magic Brush (R)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'rainbow'
                ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* GIF Streamer Brush */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeBrushType('gif-stream');
              onChangeTool('gif-stream');
            }}
            title="GIF Streamer: Spray animated memes! (G)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
              activeTool === 'gif-stream'
                ? 'bg-gradient-to-tr from-amber-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="absolute -top-1 -right-1 text-[9px] font-black px-1 rounded-full bg-pink-500 text-white">
              GIF
            </span>
          </button>

          {/* Emoji Streamer Brush */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeBrushType('emoji-stream');
              onChangeTool('emoji-stream');
            }}
            title="Emoji Spray Gun"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer text-base ${
              activeTool === 'emoji-stream'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            🔥
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* Sticker & Meme Picker */}
          <button
            onClick={() => {
              triggerHaptic();
              onOpenStickerPicker();
            }}
            title="Meme & GIF Vault (S)"
            className="p-3 rounded-2xl flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-white/5 transition-all cursor-pointer relative"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* WordArt / Meme Text */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeTool('text');
            }}
            title="Meme Text / WordArt (T)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'text'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Black Hole Gravity Well */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeTool('black-hole');
            }}
            title="Black Hole Vortex"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'black-hole'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 scale-105 ring-2 ring-purple-300'
                : 'text-purple-400/80 hover:text-purple-300 hover:bg-white/5'
            }`}
          >
            <Orbit className="w-5 h-5 animate-spin" />
          </button>

          {/* Physics Bouncy Toggle */}
          <button
            onClick={() => {
              triggerHaptic();
              onTogglePhysics();
            }}
            title={isPhysicsRunning ? 'Pause 2D Physics' : 'Activate 2D Bouncy Physics (P)'}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
              isPhysicsRunning
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-400/80 hover:text-emerald-400 hover:bg-white/5'
            }`}
          >
            <Activity className="w-5 h-5" />
            {isPhysicsRunning && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
            )}
          </button>

          {/* Laser Pointer */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeTool('laser');
            }}
            title="Live Laser Pointer (L)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'laser'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-105 animate-pulse'
                : 'text-red-400/80 hover:text-red-400 hover:bg-white/5'
            }`}
          >
            <Flame className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* Eraser */}
          <button
            onClick={() => {
              triggerHaptic();
              onChangeTool('eraser');
            }}
            title="Eraser (E)"
            className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Eraser className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* ========================================================
          2. MOBILE-OPTIMIZED DOCK & TRAYS (Screens < sm)
         ======================================================== */}
      <div className="flex sm:hidden fixed bottom-0 inset-x-0 flex-col items-center z-30 pointer-events-auto select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-3">
        {/* Floating Quick Drawer (Renders depending on active mobile tab) */}
        
        {/* A. Mobile Slap Ribbon (When in Slap/Sticker tab or activeTool is sticker-slap) */}
        {(mobileTab === 'slap' || activeTool === 'sticker-slap') && (
          <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/95 backdrop-blur-md border border-white/20 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
            <span className="text-[10px] uppercase font-black text-pink-400 mr-0.5">Slap:</span>
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  triggerHaptic(12);
                  onQuickSlapReaction?.(emoji);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg active:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-4 bg-white/20 mx-0.5" />
            <button
              onClick={() => {
                triggerHaptic();
                onOpenStickerPicker();
              }}
              className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>+ Vault</span>
            </button>
          </div>
        )}

        {/* B. Mobile Draw Tray (When in Draw tab) */}
        {mobileTab === 'draw' && (
          <div className="mb-2 w-full max-w-sm bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 shadow-2xl space-y-2 animate-in slide-in-from-bottom-2 duration-150">
            {/* Top row: Brush Styles */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-1">
              {/* Pen */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onChangeBrushType('pen');
                  onChangeTool('pen');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  activeTool === 'pen' ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-300'
                }`}
              >
                <Pen className="w-3.5 h-3.5" />
                <span>Pen</span>
              </button>

              {/* Neon */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onChangeBrushType('neon');
                  onChangeTool('neon');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  activeTool === 'neon' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-cyan-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Neon</span>
              </button>

              {/* Rainbow */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onChangeBrushType('rainbow');
                  onChangeTool('rainbow');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  activeTool === 'rainbow'
                    ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-white'
                    : 'bg-white/5 text-gray-300'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Rainbow</span>
              </button>

              {/* GIF Spray */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onChangeBrushType('gif-stream');
                  onChangeTool('gif-stream');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  activeTool === 'gif-stream' ? 'bg-amber-500 text-white' : 'bg-white/5 text-amber-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>GIF</span>
              </button>

              {/* Emoji Spray */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onChangeBrushType('emoji-stream');
                  onChangeTool('emoji-stream');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  activeTool === 'emoji-stream' ? 'bg-orange-500 text-white' : 'bg-white/5 text-orange-300'
                }`}
              >
                <span>🔥</span>
                <span>Spray</span>
              </button>

              {/* Eraser */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onChangeTool('eraser');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  activeTool === 'eraser' ? 'bg-rose-500 text-white' : 'bg-white/5 text-rose-300'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
              </button>
            </div>

            {/* Bottom row: Colors & Brush Size */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              {/* Color dots (Horizontal touch swipe) */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      triggerHaptic();
                      onChangeColor(c);
                    }}
                    className={`w-6 h-6 rounded-full shrink-0 transition-transform ${
                      brushColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Size Slider */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/15 shrink-0">
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={brushSize}
                  onChange={(e) => onChangeSize(Number(e.target.value))}
                  className="w-16 accent-pink-500 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
                />
                <span className="text-[11px] font-mono text-gray-300 w-4">{brushSize}</span>
              </div>
            </div>
          </div>
        )}

        {/* C. Mobile Chaos Tray (When in Chaos tab) */}
        {mobileTab === 'chaos' && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-900/95 backdrop-blur-md border border-white/20 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
            {/* Physics Toggle */}
            <button
              onClick={() => {
                triggerHaptic();
                onTogglePhysics();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                isPhysicsRunning ? 'bg-emerald-500 text-white' : 'bg-white/10 text-emerald-400'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isPhysicsRunning ? 'Physics ON' : 'Physics OFF'}</span>
            </button>

            {/* Black Hole */}
            <button
              onClick={() => {
                triggerHaptic();
                onChangeTool('black-hole');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                activeTool === 'black-hole' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300'
              }`}
            >
              <Orbit className="w-4 h-4 animate-spin" />
              <span>Vortex</span>
            </button>

            {/* Laser */}
            <button
              onClick={() => {
                triggerHaptic();
                onChangeTool('laser');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                activeTool === 'laser' ? 'bg-red-600 text-white' : 'bg-white/10 text-red-300'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Laser</span>
            </button>
          </div>
        )}

        {/* Primary Mobile Navigation Dock */}
        <nav className="w-full max-w-sm flex items-center justify-between p-1.5 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
          {/* Quick Undo */}
          <button
            onClick={() => {
              triggerHaptic();
              onUndo();
            }}
            disabled={!canUndo}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-20 active:scale-90 transition-transform"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* 1. Select / Pan Tab */}
          <button
            onClick={() => handleMobileTabSwitch('select')}
            className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
              mobileTab === 'select'
                ? 'bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MousePointer2 className="w-4 h-4" />
            <span className="text-[10px]">Select</span>
          </button>

          {/* 2. Draw Tab */}
          <button
            onClick={() => handleMobileTabSwitch('draw')}
            className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
              mobileTab === 'draw'
                ? 'bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Pen className="w-4 h-4" />
            <span className="text-[10px]">Draw</span>
          </button>

          {/* 3. Instagram Chat Tab */}
          <button
            onClick={() => handleMobileTabSwitch('chat')}
            className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
              mobileTab === 'chat'
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-pink-500/30'
                : 'text-pink-400/80 hover:text-pink-300'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[10px]">Chat</span>
          </button>

          {/* 4. Slap / Stickers Tab */}
          <button
            onClick={() => handleMobileTabSwitch('slap')}
            className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
              mobileTab === 'slap'
                ? 'bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/30'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span className="text-[10px]">Stickers</span>
          </button>

          {/* 5. Chaos Tab */}
          <button
            onClick={() => handleMobileTabSwitch('chaos')}
            className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
              mobileTab === 'chaos'
                ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
                : 'text-purple-400/80 hover:text-purple-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px]">Chaos</span>
          </button>

          {/* Quick Redo */}
          <button
            onClick={() => {
              triggerHaptic();
              onRedo();
            }}
            disabled={!canRedo}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-20 active:scale-90 transition-transform"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </>
  );
};
