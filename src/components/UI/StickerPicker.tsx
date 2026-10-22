import React, { useState, useRef } from 'react';
import { Search, Plus, X, Volume2, Scissors, Sparkles, Image as ImageIcon } from 'lucide-react';
import { MEME_CATALOG } from '../../data/memeCatalog';
import type { MemeTemplate } from '../../data/memeCatalog';
import { soundEngine } from '../../utils/soundEngine';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (meme: MemeTemplate, isCutout?: boolean) => void;
  isSlapModeActive?: boolean;
  onToggleSlapMode?: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  isSlapModeActive,
  onToggleSlapMode
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const triggerHaptic = (ms: number = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const filteredMemes = MEME_CATALOG.filter((meme) => {
    const matchesCat = selectedCategory === 'all' || meme.category === selectedCategory;
    const matchesSearch =
      search === '' ||
      meme.name.toLowerCase().includes(search.toLowerCase()) ||
      meme.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    triggerHaptic();

    const customMeme: MemeTemplate = {
      id: `custom_${Date.now()}`,
      name: customName.trim() || 'Custom Sticker',
      category: 'chaos',
      url: customUrl.trim(),
      soundEffect: 'vine-boom',
      aspectRatio: 1,
      tags: ['custom']
    };

    onSelectSticker(customMeme, false);
    setCustomUrl('');
    setCustomName('');
    onClose();
  };

  // Upload local file and make into an Instagram-style cutout sticker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      triggerHaptic();
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const cutoutMeme: MemeTemplate = {
            id: `cutout_${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, '') || 'Custom Cutout',
            category: 'reactions',
            url: dataUrl,
            soundEffect: 'pop',
            aspectRatio: 1,
            tags: ['cutout', 'custom']
          };
          onSelectSticker(cutoutMeme, true);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full sm:max-w-2xl bg-gray-900/98 sm:bg-gray-900/95 border-t sm:border border-pink-500/30 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile slide-up drag handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Sticker & GIF Vault</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">
                  INSTA OVERLAY
                </span>
              </div>
              <p className="text-xs text-gray-400">Slap stickers & animated GIFs anywhere over chats and canvas</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Slap Mode & Cutout Toolbar */}
        <div className="flex items-center justify-between gap-2 py-2.5 border-b border-white/5 flex-wrap shrink-0">
          {/* Instagram Slap Mode Toggle */}
          {onToggleSlapMode && (
            <button
              onClick={() => {
                triggerHaptic();
                onToggleSlapMode();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSlapModeActive
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-2 ring-pink-400'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Tap-to-Slap: {isSlapModeActive ? 'ACTIVE ✋' : 'OFF'}</span>
            </button>
          )}

          {/* Upload Cutout Button */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => {
                triggerHaptic();
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Photo Cutout Maker</span>
            </button>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="py-2.5 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anything: cats, lol, chad, heart, dance, anime..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-base sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs scrollbar-none touch-pan-x">
            {[
              { id: 'all', label: '🔥 All' },
              { id: 'reactions', label: '💖 Reactions' },
              { id: 'animated-gif', label: '✨ Animated GIFs' },
              { id: 'viral', label: '👑 Viral' },
              { id: 'chaos', label: '💥 Chaos' },
              { id: 'classic', label: '📼 Classic' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 font-bold'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sticker Grid (Fluid 3 columns on mobile, 4-5 on desktop) */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 py-2 min-h-[200px]">
          {filteredMemes.map((meme) => (
            <button
              key={meme.id}
              onClick={() => {
                triggerHaptic(12);
                soundEngine.play(meme.soundEffect);
                onSelectSticker(meme, false);
                onClose();
              }}
              className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative">
                <img
                  src={meme.url}
                  alt={meme.name}
                  className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-300 group-hover:text-pink-300 mt-1.5 truncate w-full text-center">
                {meme.name}
              </span>

              {/* Sound indicator badge */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-1 text-pink-400">
                <Volume2 className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>

        {/* Add Anything by URL */}
        <form onSubmit={handleAddCustomUrl} className="pt-2.5 border-t border-white/10 flex gap-2 items-center shrink-0">
          <div className="relative flex-1">
            <ImageIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste any GIF or Image web URL..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-base sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>
          <button
            type="submit"
            disabled={!customUrl.trim()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Slap</span>
          </button>
        </form>
      </div>
    </div>
  );
};
