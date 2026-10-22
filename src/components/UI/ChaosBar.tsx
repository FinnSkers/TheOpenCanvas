import React, { useState } from 'react';
import { Sparkles, Bomb, Orbit, Disc, PartyPopper, MessageSquare, Volume2, X } from 'lucide-react';
import type { ChaosMode } from '../../types/canvas';
import { soundEngine } from '../../utils/soundEngine';

interface ChaosBarProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerChaos: (chaos: ChaosMode) => void;
  onSendSpeech: (text: string) => void;
}

export const ChaosBar: React.FC<ChaosBarProps> = ({
  isOpen,
  onClose,
  onTriggerChaos,
  onSendSpeech
}) => {
  const [speechText, setSpeechText] = useState('');

  if (!isOpen) return null;

  const triggerHaptic = (ms: number = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleSpeechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (speechText.trim()) {
      triggerHaptic(10);
      onSendSpeech(speechText.trim());
      setSpeechText('');
      soundEngine.play('pop');
    }
  };

  const handleTriggerWithHaptic = (chaos: ChaosMode) => {
    triggerHaptic(15);
    onTriggerChaos(chaos);
  };

  const handleSoundWithHaptic = (id: Parameters<typeof soundEngine.play>[0]) => {
    triggerHaptic(10);
    soundEngine.play(id);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none z-40 flex flex-col justify-end sm:justify-start sm:items-end p-2 sm:p-0 pointer-events-auto"
    >
      <div className="w-full sm:w-80 sm:mt-20 sm:mr-4 bg-gray-900/98 sm:bg-gray-900/95 backdrop-blur-md border border-pink-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-right-4 duration-150 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile grab indicator bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <h3 className="font-bold text-white text-sm">Chaos Wheel & FX</h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chaos Triggers Grid */}
        <div className="py-3 space-y-2">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Trigger Room Event
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Meme Nuke */}
            <button
              onClick={() => handleTriggerWithHaptic('nuke')}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-600/30 to-amber-600/30 border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
            >
              <Bomb className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-bold text-white">Meme Nuke</span>
              <span className="text-[9px] text-gray-400">Blast elements</span>
            </button>

            {/* Invert Gravity */}
            <button
              onClick={() => handleTriggerWithHaptic('gravity')}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 hover:border-purple-400 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
            >
              <Orbit className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-white">Flip Gravity</span>
              <span className="text-[9px] text-gray-400">Physics upside down</span>
            </button>

            {/* Disco Party */}
            <button
              onClick={() => handleTriggerWithHaptic('disco')}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-600/30 to-fuchsia-600/30 border border-pink-500/40 hover:border-pink-400 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
            >
              <Disc className="w-5 h-5 text-pink-400 animate-spin" />
              <span className="text-xs font-bold text-white">Disco Party</span>
              <span className="text-[9px] text-gray-400">Rainbow strobe grid</span>
            </button>

            {/* Confetti */}
            <button
              onClick={() => handleTriggerWithHaptic('confetti')}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
            >
              <PartyPopper className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-white">Confetti Blast</span>
              <span className="text-[9px] text-gray-400">Celebration shower</span>
            </button>
          </div>
        </div>

        {/* Meme Soundboard Quick triggers */}
        <div className="py-3 border-t border-white/10 space-y-2">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Meme Soundboard</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'vine-boom' as const, label: '💥 Boom' },
              { id: 'airhorn' as const, label: '📢 Airhorn' },
              { id: 'boing' as const, label: '🤸 Boing' },
              { id: 'quack' as const, label: '🦆 Quack' },
              { id: 'laser' as const, label: '🔫 Pew' },
              { id: 'explosion' as const, label: '💣 Kaboom' }
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => handleSoundWithHaptic(snd.id)}
                className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 text-gray-200 text-[11px] font-medium transition-all active:scale-95 cursor-pointer text-center truncate"
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Cursor Speech Bubble Form */}
        <form onSubmit={handleSpeechSubmit} className="pt-3 border-t border-white/10 space-y-1.5">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Speak Over Cursor</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              placeholder="Type a bubble message..."
              maxLength={60}
              className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-base sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!speechText.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95"
            >
              Say
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
