import React, { useState } from 'react';
import { MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import type { CanvasItem, Camera, UserPresence } from '../../types/canvas';

interface MinimapProps {
  items: CanvasItem[];
  camera: Camera;
  onPanTo: (worldX: number, worldY: number) => void;
  users: Record<string, UserPresence>;
}

export const Minimap: React.FC<MinimapProps> = ({
  items,
  camera,
  onPanTo,
  users
}) => {
  // Collapsed by default on mobile screens (< 640px)
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 640);

  // Radar bounds in world coordinates
  const radarRadius = 2500;
  const radarMinX = -radarRadius;
  const radarMinY = -radarRadius;
  const radarSpan = radarRadius * 2;

  // Viewport rectangle in world coordinates
  const viewWidthWorld = window.innerWidth / camera.zoom;
  const viewHeightWorld = window.innerHeight / camera.zoom;
  const viewLeftWorld = -camera.x / camera.zoom;
  const viewTopWorld = -camera.y / camera.zoom;

  const mapSize = 150; // 150x150 px

  const worldToMap = (wx: number, wy: number) => {
    const mx = ((wx - radarMinX) / radarSpan) * mapSize;
    const my = ((wy - radarMinY) / radarSpan) * mapSize;
    return {
      x: Math.max(0, Math.min(mapSize, mx)),
      y: Math.max(0, Math.min(mapSize, my))
    };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = (clickX / mapSize) * radarSpan + radarMinX;
    const targetWorldY = (clickY / mapSize) * radarSpan + radarMinY;

    onPanTo(targetWorldX, targetWorldY);
  };

  const vpMapTopLeft = worldToMap(viewLeftWorld, viewTopWorld);
  const vpMapBottomRight = worldToMap(
    viewLeftWorld + viewWidthWorld,
    viewTopWorld + viewHeightWorld
  );
  const vpMapWidth = Math.max(6, vpMapBottomRight.x - vpMapTopLeft.x);
  const vpMapHeight = Math.max(6, vpMapBottomRight.y - vpMapTopLeft.y);

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-20 select-none">
      <div className="bg-gray-900/90 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        {/* Header Pill */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 text-[11px] text-gray-300 cursor-pointer hover:bg-white/5"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Radar ({items.length} items)</span>
            <span className="sm:hidden">Radar</span>
          </div>
          <button className="p-0.5 rounded text-gray-400 hover:text-white">
            {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Map Viewport Area */}
        {!isCollapsed && (
          <div
            onClick={handleMapClick}
            className="w-[150px] h-[150px] bg-black/60 relative cursor-crosshair overflow-hidden"
            title="Click to jump camera"
          >
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 pointer-events-none" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 pointer-events-none" />

            {/* Placed Items as dots */}
            {items.map((item) => {
              const pos = worldToMap(item.x, item.y);
              return (
                <div
                  key={item.id}
                  className={`absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 ${
                    item.type === 'sticker' ? 'w-1.5 h-1.5 bg-amber-400 shadow-sm' : 'w-1 h-1 bg-pink-400/60'
                  }`}
                  style={{ left: pos.x, top: pos.y }}
                />
              );
            })}

            {/* Other player cursors on radar */}
            {Object.values(users).map((user) => {
              const pos = worldToMap(user.cursor.x, user.cursor.y);
              return (
                <div
                  key={user.id}
                  className="absolute w-2 h-2 rounded-full border border-white shadow-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    backgroundColor: user.color || '#10b981'
                  }}
                  title={user.name}
                />
              );
            })}

            {/* Current Viewport box */}
            <div
              className="absolute border border-pink-400 bg-pink-500/15 pointer-events-none rounded-sm transition-all duration-75"
              style={{
                left: vpMapTopLeft.x,
                top: vpMapTopLeft.y,
                width: vpMapWidth,
                height: vpMapHeight
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
