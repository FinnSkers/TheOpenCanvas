import React from 'react';
import type { UserPresence } from '../../types/canvas';

interface LiveCursorsProps {
  users: Record<string, UserPresence>;
  currentUserId: string;
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({ users, currentUserId }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {Object.values(users).map((user) => {
        if (user.id === currentUserId) return null;

        const hasSpeech = user.statusText && (!user.statusExpiresAt || Date.now() < user.statusExpiresAt);
        const isLaser = user.activeTool === 'laser';

        return (
          <div
            key={user.id}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: user.cursor.x,
              top: user.cursor.y,
              transform: 'translate3d(0, 0, 0)'
            }}
          >
            {/* Laser pointer glow effect */}
            {isLaser && (
              <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
            )}

            {/* Custom SVG cursor */}
            <svg
              className="w-5 h-5 drop-shadow-md origin-top-left"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path
                d="M3 3l7 18 3-7 7-3L3 3z"
                fill={isLaser ? '#ef4444' : user.color || '#ec4899'}
              />
            </svg>

            {/* Nametag & Avatar badge */}
            <div
              className="absolute left-4 top-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-lg whitespace-nowrap border border-white/20 select-none"
              style={{ backgroundColor: user.color || '#ec4899' }}
            >
              <span className="text-xs">{user.avatar || '👾'}</span>
              <span>{user.name}</span>
            </div>

            {/* Speech Bubble */}
            {hasSpeech && (
              <div className="absolute left-6 -top-10 px-3 py-1.5 rounded-2xl bg-white text-gray-900 text-xs font-medium shadow-2xl border border-gray-200 whitespace-nowrap animate-in fade-in zoom-in-75 duration-100 flex items-center gap-1.5 z-40">
                <span>{user.statusText}</span>
                {/* Little triangle tail */}
                <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-white transform rotate-45 border-r border-b border-gray-200" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
