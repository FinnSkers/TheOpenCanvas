import React from 'react';
import { Trash2, Copy, ArrowUp, Activity, Volume2, RotateCw, Edit3 } from 'lucide-react';
import type { CanvasItem, StickerItem } from '../../types/canvas';
import { soundEngine } from '../../utils/soundEngine';

interface TransformGizmoProps {
  item: CanvasItem;
  onUpdateItem: (updated: Partial<CanvasItem>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: CanvasItem) => void;
  onBringToFront: (id: string) => void;
  onStartDrag: (e: React.PointerEvent, handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'rotate') => void;
  onStartEdit?: (id: string) => void;
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({
  item,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onBringToFront,
  onStartDrag,
  onStartEdit
}) => {
  const isSticker = item.type === 'sticker';
  const isEditable = item.type === 'chat' || item.type === 'text';
  const stickerItem = item as StickerItem;

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const handleTogglePhysics = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    const nextState = !item.isPhysicsActive;
    onUpdateItem({ isPhysicsActive: nextState });
    soundEngine.play(nextState ? 'boing' : 'pop');
  };

  const handlePlaySound = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    if (isSticker && stickerItem.soundEffect) {
      soundEngine.play(stickerItem.soundEffect, { x: item.x, y: item.y });
    } else {
      soundEngine.play('pop', { x: item.x, y: item.y });
    }
  };

  const handlePointerDownWithHaptic = (
    e: React.PointerEvent,
    handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'rotate'
  ) => {
    triggerHaptic();
    onStartDrag(e, handleType);
  };

  return (
    <div
      className="absolute pointer-events-none select-none z-20"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {/* Selection Border */}
      <div className="absolute inset-0 border-2 border-pink-500 rounded-2xl pointer-events-none shadow-sm" />

      {/* Floating Action Bar directly above the item (Touch Friendly) */}
      <div
        className="absolute -top-13 sm:-top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-2 sm:py-1 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl pointer-events-auto text-xs text-white"
        style={{ transform: `translateX(-50%)` }}
      >
        {/* Edit Text (Instant 1-tap for mobile & touch) */}
        {isEditable && onStartEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onStartEdit(item.id);
            }}
            title="Edit Text"
            className="p-2 sm:p-1.5 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] font-bold sm:hidden">Edit</span>
          </button>
        )}

        {/* Toggle Physics */}
        <button
          onClick={handleTogglePhysics}
          title={item.isPhysicsActive ? 'Disable Physics' : 'Enable 2D Physics Body'}
          className={`p-2 sm:p-1.5 rounded-xl transition-colors cursor-pointer ${
            item.isPhysicsActive ? 'bg-emerald-500/30 text-emerald-300' : 'hover:bg-white/10 text-gray-400'
          }`}
        >
          <Activity className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Play attached sound */}
        {isSticker && (
          <button
            onClick={handlePlaySound}
            title="Play Sound"
            className="p-2 sm:p-1.5 rounded-xl hover:bg-white/10 text-pink-400 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        )}

        {/* Bring to front */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic();
            onBringToFront(item.id);
          }}
          title="Bring to Front"
          className="p-2 sm:p-1.5 rounded-xl hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
        >
          <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Duplicate */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic();
            onDuplicateItem(item);
          }}
          title="Duplicate"
          className="p-2 sm:p-1.5 rounded-xl hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
        >
          <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic();
            onDeleteItem(item.id);
          }}
          title="Delete"
          className="p-2 sm:p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Rotation Handle (top lollipop with enlarged touch target) */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
        <div
          onPointerDown={(e) => handlePointerDownWithHaptic(e, 'rotate')}
          className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-pink-500 hover:scale-125 border-2 border-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-transform"
          title="Rotate"
        >
          <RotateCw className="w-3 h-3 text-white" />
        </div>
        <div className="w-0.5 h-2 bg-pink-500" />
      </div>

      {/* Resize Corner Handles (Enlarged touch targets for fingers) */}
      <div
        onPointerDown={(e) => handlePointerDownWithHaptic(e, 'nw')}
        className="absolute -top-3.5 -left-3.5 w-7 h-7 sm:w-5 sm:h-5 bg-white border-2 border-pink-500 rounded-full cursor-nwse-resize pointer-events-auto shadow-md hover:scale-125 active:scale-125 transition-transform touch-none"
      />
      <div
        onPointerDown={(e) => handlePointerDownWithHaptic(e, 'ne')}
        className="absolute -top-3.5 -right-3.5 w-7 h-7 sm:w-5 sm:h-5 bg-white border-2 border-pink-500 rounded-full cursor-nesw-resize pointer-events-auto shadow-md hover:scale-125 active:scale-125 transition-transform touch-none"
      />
      <div
        onPointerDown={(e) => handlePointerDownWithHaptic(e, 'se')}
        className="absolute -bottom-3.5 -right-3.5 w-7 h-7 sm:w-5 sm:h-5 bg-white border-2 border-pink-500 rounded-full cursor-nwse-resize pointer-events-auto shadow-md hover:scale-125 active:scale-125 transition-transform touch-none"
      />
      <div
        onPointerDown={(e) => handlePointerDownWithHaptic(e, 'sw')}
        className="absolute -bottom-3.5 -left-3.5 w-7 h-7 sm:w-5 sm:h-5 bg-white border-2 border-pink-500 rounded-full cursor-nesw-resize pointer-events-auto shadow-md hover:scale-125 active:scale-125 transition-transform touch-none"
      />
    </div>
  );
};
