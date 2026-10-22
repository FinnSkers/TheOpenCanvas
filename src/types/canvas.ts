export type ToolType = 
  | 'select' 
  | 'pen' 
  | 'neon'
  | 'rainbow' 
  | 'highlighter' 
  | 'sparkle' 
  | 'gif-stream' 
  | 'emoji-stream'
  | 'black-hole'
  | 'sticker' 
  | 'sticker-slap'
  | 'chat'
  | 'text' 
  | 'eraser' 
  | 'physics' 
  | 'laser';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export type BrushType = 
  | 'pen' 
  | 'neon' 
  | 'rainbow' 
  | 'highlighter' 
  | 'sparkle' 
  | 'gif-stream' 
  | 'emoji-stream';

export interface BaseCanvasItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  zIndex: number;
  creatorId: string;
  creatorName: string;
  creatorColor: string;
  createdAt: number;
  updatedAt: number;
  // Physics integration
  isPhysicsActive?: boolean;
  velocityX?: number;
  velocityY?: number;
}

export interface PathItem extends BaseCanvasItem {
  type: 'path';
  points: [number, number, number][]; // [x, y, pressure]
  color: string;
  size: number;
  brushType: BrushType;
  streamStickerUrl?: string; // For gif-stream brush
}

export interface StickerItem extends BaseCanvasItem {
  type: 'sticker';
  url: string;
  label: string;
  isAnimated: boolean;
  soundEffect?: string;
  aspectRatio: number;
  bounciness?: number;
  isCutout?: boolean; // Instagram style sticker cutout with white borders
}

export interface TextItem extends BaseCanvasItem {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: 'impact' | 'comic' | 'wordart' | 'sans';
  color: string;
  isWordArt?: boolean;
}

export interface ChatBubbleItem extends BaseCanvasItem {
  type: 'chat';
  message: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  timestamp: string;
}

export type CanvasItem = PathItem | StickerItem | TextItem | ChatBubbleItem;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  avatar: string;
  cursor: { x: number; y: number };
  activeTool: ToolType;
  statusText?: string;
  statusExpiresAt?: number;
  isTyping?: boolean;
  lastActive: number;
  laserTrail?: { x: number; y: number; time: number }[];
}

export type ChaosMode = 'none' | 'nuke' | 'gravity' | 'disco' | 'earthquake' | 'confetti';

export interface RoomState {
  roomId: string;
  items: CanvasItem[];
  users: Record<string, UserPresence>;
  activeChaos: ChaosMode;
  chaosEndsAt: number;
}
