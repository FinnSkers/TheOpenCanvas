import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type {
  CanvasItem,
  PathItem,
  StickerItem,
  TextItem,
  ChatBubbleItem,
  ToolType,
  BrushType,
  Camera,
  ChaosMode,
  UserPresence
} from '../../types/canvas';
import { renderStroke, getRainbowColor } from '../../utils/drawing';
import { soundEngine } from '../../utils/soundEngine';
import { canvasPhysics } from '../../utils/physicsEngine';
import type { MemeTemplate } from '../../data/memeCatalog';
import { TransformGizmo } from './TransformGizmo';
import { LiveCursors } from './LiveCursors';
import { Minimap } from './Minimap';

interface InfiniteCanvasProps {
  items: CanvasItem[];
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  brushColor: string;
  brushSize: number;
  brushType: BrushType;
  activeStreamSticker: MemeTemplate;
  currentUser: { id: string; name: string; color: string; avatar: string };
  users: Record<string, UserPresence>;
  broadcastCursor: (x: number, y: number, tool: ToolType) => void;
  broadcastItemAdd: (item: CanvasItem) => void;
  broadcastItemUpdate: (item: CanvasItem) => void;
  broadcastItemDelete: (id: string) => void;
  checkHighFive: (worldPos: { x: number; y: number }, screenPos: { x: number; y: number }) => void;
  activeChaos: ChaosMode;
  onOpenStickerPicker: () => void;
  isPhysicsRunning: boolean;
  onSnapshotAction?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const EMOJI_PALETTE = ['🔥', '✨', '⭐', '🎉', '💀', '🚀', '🐱', '🐸', '👑', '🗿'];

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  items,
  setItems,
  activeTool,
  setActiveTool,
  brushColor,
  brushSize,
  brushType,
  activeStreamSticker,
  currentUser,
  users,
  broadcastCursor,
  broadcastItemAdd,
  broadcastItemUpdate,
  broadcastItemDelete,
  checkHighFive,
  activeChaos,
  onOpenStickerPicker,
  isPhysicsRunning,
  onSnapshotAction,
  onUndo,
  onRedo
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Gesture & Multi-touch refs (Procreate-style 2-finger Undo, 3-finger Redo, 1-finger double-tap zoom)
  const touchGestureRef = useRef<{
    startTime: number;
    maxFingers: number;
    hasMoved: boolean;
    startX: number;
    startY: number;
  }>({
    startTime: 0,
    maxFingers: 0,
    hasMoved: false,
    startX: 0,
    startY: 0
  });
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Viewport camera
  const [camera, setCamera] = useState<Camera>({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; camX: number; camY: number }>({ x: 0, y: 0, camX: 0, camY: 0 });

  // Touch gesture state (pinch-to-zoom & two-finger pan)
  const touchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const pinchStartMidRef = useRef<{ x: number; y: number; camX: number; camY: number } | null>(null);

  // Selection & Item Interaction
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragInteraction, setDragInteraction] = useState<{
    handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'rotate';
    startX: number;
    startY: number;
    itemInit: CanvasItem;
  } | null>(null);

  // Physics manual dragging / flinging
  const isDraggingPhysicsBodyRef = useRef<boolean>(false);

  // Black Hole active state
  const isBlackHoleActiveRef = useRef<boolean>(false);
  const blackHoleWorldPosRef = useRef<{ x: number; y: number } | null>(null);

  // Drawing state
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number, number][]>([]);
  const isDrawingRef = useRef(false);
  const lastStreamStampPosRef = useRef<{ x: number; y: number } | null>(null);

  // Text / Chat inline editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Drag over canvas visual feedback
  const [isDragOver, setIsDragOver] = useState(false);

  // Screen-to-world conversion
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - camera.x) / camera.zoom,
        y: (screenY - camera.y) / camera.zoom
      };
    },
    [camera]
  );

  // Pan camera to specific world coordinate (e.g. from Minimap click)
  const panToWorldCoord = (worldX: number, worldY: number) => {
    setCamera({
      x: window.innerWidth / 2 - worldX * camera.zoom,
      y: window.innerHeight / 2 - worldY * camera.zoom,
      zoom: camera.zoom
    });
    soundEngine.play('whoosh');
  };

  // Physics engine sync loop
  useEffect(() => {
    if (isPhysicsRunning) {
      canvasPhysics.syncItems(items);
      canvasPhysics.start((updatedPositions) => {
        setItems((prev) =>
          prev.map((item) => {
            const updated = updatedPositions[item.id];
            if (updated) {
              return {
                ...item,
                x: updated.x,
                y: updated.y,
                rotation: updated.rotation
              };
            }
            return item;
          })
        );
      });
    } else {
      canvasPhysics.stop();
    }
    return () => {
      canvasPhysics.stop();
    };
  }, [isPhysicsRunning, items, setItems]);

  // Handle Chaos Event triggers
  useEffect(() => {
    if (activeChaos === 'nuke') {
      const centerWorld = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
      canvasPhysics.applyExplosion(centerWorld.x, centerWorld.y, 0.25);
      soundEngine.play('nuke', centerWorld);
    } else if (activeChaos === 'gravity') {
      canvasPhysics.toggleGravityInversion();
      soundEngine.play('boing');
    } else if (activeChaos === 'confetti') {
      soundEngine.play('high-five');
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.2 }
      });
    }
  }, [activeChaos, screenToWorld]);

  // Clipboard Paste (Ctrl+V) handler for images and GIFs!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const url = event.target?.result as string;
              if (url) {
                dropNewSticker(url, 'Pasted Meme');
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }

      const text = e.clipboardData.getData('text');
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        dropNewSticker(text.trim(), 'Web Sticker');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [camera, currentUser, items.length]);

  // Helper to drop a new sticker from paste or drag-drop
  const dropNewSticker = (url: string, label: string = 'Sticker') => {
    const centerWorld = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const size = 180;
    const newSticker: StickerItem = {
      id: `pasted_${Date.now()}_${Math.random()}`,
      type: 'sticker',
      url,
      label,
      isAnimated: url.includes('.gif') || url.includes('tenor') || url.includes('giphy'),
      soundEffect: 'vine-boom',
      aspectRatio: 1,
      x: centerWorld.x - size / 2,
      y: centerWorld.y - size / 2,
      width: size,
      height: size,
      rotation: (Math.random() - 0.5) * 16,
      zIndex: items.length + 1,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorColor: currentUser.color,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (onSnapshotAction) onSnapshotAction();
    setItems((prev) => [...prev, newSticker]);
    broadcastItemAdd(newSticker);
    setSelectedId(newSticker.id);
    soundEngine.play('vine-boom', centerWorld);
  };

  // Native Drag and Drop from desktop / other apps
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const world = screenToWorld(e.clientX, e.clientY);
    const files = e.dataTransfer.files;

    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (url) {
            const size = 180;
            const newSticker: StickerItem = {
              id: `dropped_${Date.now()}`,
              type: 'sticker',
              url,
              label: file.name,
              isAnimated: file.type.includes('gif'),
              soundEffect: 'vine-boom',
              aspectRatio: 1,
              x: world.x - size / 2,
              y: world.y - size / 2,
              width: size,
              height: size,
              rotation: (Math.random() - 0.5) * 16,
              zIndex: items.length + 1,
              creatorId: currentUser.id,
              creatorName: currentUser.name,
              creatorColor: currentUser.color,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            if (onSnapshotAction) onSnapshotAction();
            setItems((prev) => [...prev, newSticker]);
            broadcastItemAdd(newSticker);
            setSelectedId(newSticker.id);
            soundEngine.play('pop', world);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        setIsSpacePressed(true);
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('chat');
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('pen');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('rainbow');
      } else if (e.key === 'g' || e.key === 'G') {
        setActiveTool('gif-stream');
      } else if (e.key === 's' || e.key === 'S') {
        onOpenStickerPicker();
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTool('laser');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          handleDeleteItem(selectedId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedId) {
          const it = items.find((i) => i.id === selectedId);
          if (it) handleDuplicateItem(it);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, items, setActiveTool, onOpenStickerPicker]);

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.15), 5);

    const mouseWorldX = (e.clientX - camera.x) / camera.zoom;
    const mouseWorldY = (e.clientY - camera.y) / camera.zoom;

    setCamera({
      x: e.clientX - mouseWorldX * newZoom,
      y: e.clientY - mouseWorldY * newZoom,
      zoom: newZoom
    });
  };

  // Pointer Down (Starting draw, pan, slap, chat, or selection)
  const handlePointerDown = (e: React.PointerEvent) => {
    touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch tracking for gestures (Undo, Redo, Pinch)
    if (touchPointersRef.current.size === 1) {
      touchGestureRef.current = {
        startTime: Date.now(),
        maxFingers: 1,
        hasMoved: false,
        startX: e.clientX,
        startY: e.clientY
      };
    } else {
      touchGestureRef.current.maxFingers = Math.max(
        touchGestureRef.current.maxFingers,
        touchPointersRef.current.size
      );
    }

    // Multi-touch pinch-to-zoom & two-finger pan
    if (touchPointersRef.current.size === 2) {
      isDrawingRef.current = false;
      setCurrentPathPoints([]);
      const pts = Array.from(touchPointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartZoomRef.current = camera.zoom;
      pinchStartMidRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
        camX: camera.x,
        camY: camera.y
      };
      return;
    }

    // Middle click or Spacebar => Canvas Pan
    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camX: camera.x,
        camY: camera.y
      };
      return;
    }

    if (e.button !== 0) return;

    const world = screenToWorld(e.clientX, e.clientY);

    // Broadcast cursor position
    broadcastCursor(world.x, world.y, activeTool);
    checkHighFive(world, { x: e.clientX, y: e.clientY });

    // Instagram-Style "Tap-to-Slap Anywhere" Mode:
    // Tapping anywhere slaps the active sticker/reaction with a playful tilt!
    if (activeTool === 'sticker-slap') {
      if (onSnapshotAction) onSnapshotAction();
      const size = 150;
      const newSticker: StickerItem = {
        id: `slapped_${Date.now()}_${Math.random()}`,
        type: 'sticker',
        url: activeStreamSticker.url,
        label: activeStreamSticker.name,
        isAnimated: activeStreamSticker.url.includes('.gif') || activeStreamSticker.url.includes('tenor'),
        soundEffect: activeStreamSticker.soundEffect,
        aspectRatio: activeStreamSticker.aspectRatio,
        x: world.x - size / 2,
        y: world.y - (size / activeStreamSticker.aspectRatio) / 2,
        width: size,
        height: size / activeStreamSticker.aspectRatio,
        rotation: (Math.random() - 0.5) * 28, // dynamic tilt like Instagram sticker placement!
        zIndex: items.length + 1,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorColor: currentUser.color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setItems((prev) => [...prev, newSticker]);
      broadcastItemAdd(newSticker);
      soundEngine.play(activeStreamSticker.soundEffect || 'pop', world);
      return;
    }

    // Instagram Chat Bubble Tool
    if (activeTool === 'chat') {
      if (onSnapshotAction) onSnapshotAction();
      const newChat: ChatBubbleItem = {
        id: `chat_${Date.now()}`,
        type: 'chat',
        x: world.x - 125,
        y: world.y - 45,
        width: 250,
        height: 90,
        rotation: (Math.random() - 0.5) * 6,
        zIndex: items.length + 1,
        message: 'Yo, slap a sticker or GIF on top of this! 💬',
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        senderColor: currentUser.color,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorColor: currentUser.color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setItems((prev) => [...prev, newChat]);
      broadcastItemAdd(newChat);
      setSelectedId(newChat.id);
      setEditingTextId(newChat.id);
      soundEngine.play('pop', world);
      setActiveTool('select');
      return;
    }

    // Black Hole Vortex Mode
    if (activeTool === 'black-hole') {
      isBlackHoleActiveRef.current = true;
      blackHoleWorldPosRef.current = world;
      soundEngine.play('whoosh', world);
      return;
    }

    // Physics Grab & Throw interaction
    if (isPhysicsRunning && activeTool === 'select') {
      const grabbedId = canvasPhysics.grabBodyAt(world.x, world.y);
      if (grabbedId) {
        isDraggingPhysicsBodyRef.current = true;
        soundEngine.play('pop', world);
        return;
      }
    }

    // On touch screens or with select tool on empty canvas => Pan viewport!
    if (activeTool === 'select') {
      setSelectedId(null);
      setEditingTextId(null);
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camX: camera.x,
        camY: camera.y
      };
      return;
    }

    // Drawing Tools
    const isDrawing =
      activeTool === 'pen' ||
      activeTool === 'neon' ||
      activeTool === 'rainbow' ||
      activeTool === 'sparkle' ||
      activeTool === 'gif-stream' ||
      activeTool === 'emoji-stream';

    if (isDrawing) {
      isDrawingRef.current = true;
      setCurrentPathPoints([[world.x, world.y, e.pressure || 0.5]]);

      if (activeTool === 'gif-stream') {
        lastStreamStampPosRef.current = { x: world.x, y: world.y };
        stampStreamSticker(world.x, world.y);
      } else if (activeTool === 'emoji-stream') {
        lastStreamStampPosRef.current = { x: world.x, y: world.y };
        stampEmojiSticker(world.x, world.y);
      }
      return;
    }

    // Text tool
    if (activeTool === 'text') {
      if (onSnapshotAction) onSnapshotAction();
      const newText: TextItem = {
        id: `text_${Date.now()}`,
        type: 'text',
        x: world.x - 70,
        y: world.y - 25,
        width: 200,
        height: 60,
        rotation: 0,
        zIndex: items.length + 1,
        text: 'MEME TEXT',
        fontSize: 36,
        fontFamily: 'impact',
        color: '#ffffff',
        isWordArt: true,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorColor: currentUser.color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setItems((prev) => [...prev, newText]);
      broadcastItemAdd(newText);
      setSelectedId(newText.id);
      setEditingTextId(newText.id);
      soundEngine.play('pop', world);
      setActiveTool('select');
      return;
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Mark gesture as moved if finger shifts significantly
    if (
      Math.hypot(
        e.clientX - touchGestureRef.current.startX,
        e.clientY - touchGestureRef.current.startY
      ) > 12
    ) {
      touchGestureRef.current.hasMoved = true;
    }

    // Handle touch pinch-to-zoom & two-finger pan
    if (touchPointersRef.current.size === 2 && pinchStartDistRef.current && pinchStartMidRef.current) {
      const pts = Array.from(touchPointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = currentDist / pinchStartDistRef.current;
      const targetZoom = Math.min(Math.max(pinchStartZoomRef.current * ratio, 0.15), 5);

      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const dx = midX - pinchStartMidRef.current.x;
      const dy = midY - pinchStartMidRef.current.y;

      setCamera({
        x: pinchStartMidRef.current.camX + dx,
        y: pinchStartMidRef.current.camY + dy,
        zoom: targetZoom
      });
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY);

    // Broadcast presence cursor
    broadcastCursor(world.x, world.y, activeTool);
    checkHighFive(world, { x: e.clientX, y: e.clientY });

    // Handle Black Hole vortex suction
    if (isBlackHoleActiveRef.current) {
      blackHoleWorldPosRef.current = world;
      canvasPhysics.applyVortex(world.x, world.y, 0.04);
      return;
    }

    // Handle dragging physics body
    if (isDraggingPhysicsBodyRef.current) {
      canvasPhysics.dragGrabbedBody(world.x, world.y);
      return;
    }

    // Handle Viewport Panning
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setCamera((prev) => ({
        ...prev,
        x: panStartRef.current.camX + dx,
        y: panStartRef.current.camY + dy
      }));
      return;
    }

    // Handle Transform Gizmo Resizing / Dragging / Rotating
    if (dragInteraction) {
      const { handleType, startX, startY, itemInit } = dragInteraction;
      const dx = (e.clientX - startX) / camera.zoom;
      const dy = (e.clientY - startY) / camera.zoom;

      if (handleType === 'move') {
        const updated = {
          ...itemInit,
          x: itemInit.x + dx,
          y: itemInit.y + dy
        };
        handleUpdateItem(updated as CanvasItem);
      } else if (handleType === 'rotate') {
        const itemCenterX = itemInit.x + itemInit.width / 2;
        const itemCenterY = itemInit.y + itemInit.height / 2;
        const currentWorld = screenToWorld(e.clientX, e.clientY);
        const rad = Math.atan2(currentWorld.y - itemCenterY, currentWorld.x - itemCenterX);
        const deg = (rad * 180) / Math.PI + 90;
        handleUpdateItem({ ...itemInit, rotation: Math.round(deg) } as CanvasItem);
      } else {
        let newW = itemInit.width;
        let newH = itemInit.height;
        let newX = itemInit.x;
        let newY = itemInit.y;

        if (handleType === 'se') {
          newW = Math.max(30, itemInit.width + dx);
          newH = Math.max(30, itemInit.height + dy);
        } else if (handleType === 'sw') {
          newW = Math.max(30, itemInit.width - dx);
          newX = itemInit.x + dx;
          newH = Math.max(30, itemInit.height + dy);
        } else if (handleType === 'ne') {
          newW = Math.max(30, itemInit.width + dx);
          newH = Math.max(30, itemInit.height - dy);
          newY = itemInit.y + dy;
        } else if (handleType === 'nw') {
          newW = Math.max(30, itemInit.width - dx);
          newX = itemInit.x + dx;
          newH = Math.max(30, itemInit.height - dy);
          newY = itemInit.y + dy;
        }

        handleUpdateItem({
          ...itemInit,
          x: newX,
          y: newY,
          width: newW,
          height: newH
        } as CanvasItem);
      }
      return;
    }

    // Handle Freehand & Stream Drawing
    if (isDrawingRef.current) {
      setCurrentPathPoints((prev) => [...prev, [world.x, world.y, e.pressure || 0.5]]);

      if (activeTool === 'gif-stream' && lastStreamStampPosRef.current) {
        const dist = Math.hypot(
          world.x - lastStreamStampPosRef.current.x,
          world.y - lastStreamStampPosRef.current.y
        );

        if (dist > 70) {
          lastStreamStampPosRef.current = { x: world.x, y: world.y };
          stampStreamSticker(world.x, world.y);
        }
      }

      if (activeTool === 'emoji-stream' && lastStreamStampPosRef.current) {
        const dist = Math.hypot(
          world.x - lastStreamStampPosRef.current.x,
          world.y - lastStreamStampPosRef.current.y
        );

        if (dist > 50) {
          lastStreamStampPosRef.current = { x: world.x, y: world.y };
          stampEmojiSticker(world.x, world.y);
        }
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    touchPointersRef.current.delete(e.pointerId);
    if (touchPointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
      pinchStartMidRef.current = null;
    }

    // Evaluate Procreate-style gestures when all touch pointers have finished
    if (touchPointersRef.current.size === 0) {
      const fingers = touchGestureRef.current.maxFingers;
      const duration = Date.now() - touchGestureRef.current.startTime;
      const hasMoved = touchGestureRef.current.hasMoved;

      // Reset gesture tracker
      touchGestureRef.current = {
        startTime: 0,
        maxFingers: 0,
        hasMoved: false,
        startX: 0,
        startY: 0
      };

      if (!hasMoved && duration < 380 && duration > 20) {
        // 2-Finger Tap => Procreate Undo!
        if (fingers === 2 && onUndo) {
          onUndo();
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
          soundEngine.play('pop');
          return;
        }
        // 3-Finger Tap => Procreate Redo!
        if (fingers === 3 && onRedo) {
          onRedo();
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
          soundEngine.play('pop');
          return;
        }
        // 1-Finger Double-Tap on canvas => Recenter / Zoom toggle!
        if (fingers === 1 && (activeTool === 'select' || activeTool === 'chat' || activeTool === 'sticker-slap')) {
          const now = Date.now();
          const dist = Math.hypot(e.clientX - lastTapRef.current.x, e.clientY - lastTapRef.current.y);
          if (now - lastTapRef.current.time < 320 && dist < 30) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            soundEngine.play('whoosh');
            if (Math.abs(camera.zoom - 1) < 0.25) {
              const mouseWorld = screenToWorld(e.clientX, e.clientY);
              const targetZoom = 1.75;
              setCamera({
                x: e.clientX - mouseWorld.x * targetZoom,
                y: e.clientY - mouseWorld.y * targetZoom,
                zoom: targetZoom
              });
            } else {
              setCamera({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                zoom: 1
              });
            }
            lastTapRef.current = { time: 0, x: 0, y: 0 };
            return;
          } else {
            lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
          }
        }
      }
    }

    if (isBlackHoleActiveRef.current) {
      isBlackHoleActiveRef.current = false;
      blackHoleWorldPosRef.current = null;
    }

    if (isDraggingPhysicsBodyRef.current) {
      const world = screenToWorld(e.clientX, e.clientY);
      canvasPhysics.releaseGrabbedBody(world.x, world.y);
      isDraggingPhysicsBodyRef.current = false;
      soundEngine.play('whoosh', world);
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragInteraction) {
      setDragInteraction(null);
      return;
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (currentPathPoints.length > 1 && activeTool !== 'gif-stream' && activeTool !== 'emoji-stream') {
        if (onSnapshotAction) onSnapshotAction();

        let finalColor = brushColor;
        if (activeTool === 'rainbow') {
          finalColor = getRainbowColor(items.length);
        } else if (activeTool === 'neon') {
          finalColor = brushColor || '#06b6d4';
        }

        const newPath: PathItem = {
          id: `path_${Date.now()}_${Math.random()}`,
          type: 'path',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          zIndex: items.length + 1,
          points: currentPathPoints,
          color: finalColor,
          size: brushSize,
          brushType,
          creatorId: currentUser.id,
          creatorName: currentUser.name,
          creatorColor: currentUser.color,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        setItems((prev) => [...prev, newPath]);
        broadcastItemAdd(newPath);
        soundEngine.play(activeTool === 'neon' ? 'laser' : 'whoosh');
      }
      setCurrentPathPoints([]);
    }
  };

  // Stamp a mini sticker for the GIF Streamer Brush
  const stampStreamSticker = (x: number, y: number) => {
    const size = Math.max(50, brushSize * 2.5);
    const newSticker: StickerItem = {
      id: `stream_sticker_${Date.now()}_${Math.random()}`,
      type: 'sticker',
      url: activeStreamSticker.url,
      label: activeStreamSticker.name,
      isAnimated: true,
      soundEffect: activeStreamSticker.soundEffect,
      aspectRatio: activeStreamSticker.aspectRatio,
      x: x - size / 2,
      y: y - (size / activeStreamSticker.aspectRatio) / 2,
      width: size,
      height: size / activeStreamSticker.aspectRatio,
      rotation: (Math.random() - 0.5) * 45,
      zIndex: items.length + 1,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorColor: currentUser.color,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setItems((prev) => [...prev, newSticker]);
    broadcastItemAdd(newSticker);
    soundEngine.play('pop', { x, y });
  };

  // Stamp an emoji sticker for Emoji Spray Gun
  const stampEmojiSticker = (x: number, y: number) => {
    const randomEmoji = EMOJI_PALETTE[Math.floor(Math.random() * EMOJI_PALETTE.length)];
    const newEmojiText: TextItem = {
      id: `emoji_${Date.now()}_${Math.random()}`,
      type: 'text',
      text: randomEmoji,
      fontSize: Math.max(24, brushSize * 2),
      fontFamily: 'sans',
      color: '#ffffff',
      x: x - 20,
      y: y - 20,
      width: 40,
      height: 40,
      rotation: (Math.random() - 0.5) * 60,
      zIndex: items.length + 1,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorColor: currentUser.color,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setItems((prev) => [...prev, newEmojiText]);
    broadcastItemAdd(newEmojiText);
    soundEngine.play('pop', { x, y });
  };

  // Handle Item Selection & Eraser
  const handleItemPointerDown = (e: React.PointerEvent, item: CanvasItem) => {
    if (activeTool === 'eraser') {
      e.stopPropagation();
      handleDeleteItem(item.id);
      soundEngine.play('pop', { x: item.x, y: item.y });
      return;
    }

    if (activeTool === 'select') {
      e.stopPropagation();
      // On mobile tap: If already selected, tap again to immediately edit text
      if (selectedId === item.id && (item.type === 'chat' || item.type === 'text')) {
        setEditingTextId(item.id);
      }
      setSelectedId(item.id);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
      setDragInteraction({
        handleType: 'move',
        startX: e.clientX,
        startY: e.clientY,
        itemInit: { ...item }
      });
    }
  };

  const handleStartTransformDrag = (
    e: React.PointerEvent,
    handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'rotate'
  ) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    if (onSnapshotAction) onSnapshotAction();
    setDragInteraction({
      handleType,
      startX: e.clientX,
      startY: e.clientY,
      itemInit: { ...item }
    });
  };

  const handleUpdateItem = (updated: CanvasItem) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    broadcastItemUpdate(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (onSnapshotAction) onSnapshotAction();
    setItems((prev) => prev.filter((it) => it.id !== id));
    broadcastItemDelete(id);
    if (selectedId === id) setSelectedId(null);
    soundEngine.play('pop');
  };

  const handleDuplicateItem = (item: CanvasItem) => {
    if (onSnapshotAction) onSnapshotAction();
    const dup: CanvasItem = {
      ...item,
      id: `${item.type}_${Date.now()}`,
      x: item.x + 40,
      y: item.y + 40,
      zIndex: items.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setItems((prev) => [...prev, dup]);
    broadcastItemAdd(dup);
    setSelectedId(dup.id);
    soundEngine.play('pop', { x: dup.x, y: dup.y });
  };

  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...items.map((i) => i.zIndex), 0) + 1;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, zIndex: maxZ } : it))
    );
  };

  const selectedItem = items.find((i) => i.id === selectedId);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${
        activeChaos === 'disco' ? 'canvas-grid-disco' : 'canvas-grid'
      } ${activeChaos === 'earthquake' ? 'screen-shake' : ''} ${
        isSpacePressed || isPanning
          ? 'cursor-grab active:cursor-grabbing'
          : activeTool === 'pen' || activeTool === 'neon' || activeTool === 'rainbow' || activeTool === 'gif-stream' || activeTool === 'emoji-stream'
          ? 'cursor-crosshair'
          : activeTool === 'laser'
          ? 'cursor-none'
          : activeTool === 'black-hole' || activeTool === 'sticker-slap'
          ? 'cursor-pointer'
          : activeTool === 'eraser'
          ? 'cursor-pointer'
          : 'cursor-default'
      }`}
    >
      {/* Drag & drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-sm border-4 border-dashed border-pink-400 z-50 flex items-center justify-center pointer-events-none">
          <div className="px-6 py-4 rounded-3xl bg-gray-900/90 text-white font-bold text-lg border border-pink-500 shadow-2xl flex items-center gap-3">
            <span>Drop your Meme / GIF here! 🎭</span>
          </div>
        </div>
      )}

      {/* Tap-to-Slap Mode Banner Indicator */}
      {activeTool === 'sticker-slap' && (
        <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-pink-600/90 backdrop-blur-md text-white font-bold text-xs border border-pink-400 shadow-xl flex items-center gap-2 animate-bounce">
            <span>✋ Tap anywhere (or on a chat message) to slap a sticker!</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTool('select');
              }}
              className="pointer-events-auto underline text-[10px] text-pink-200 hover:text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Transformed World Viewport Layer */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-auto"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`
        }}
      >
        {/* Layer 1: Vector SVG Drawings with Neon Glow Filter */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {items
            .filter((item): item is PathItem => item.type === 'path')
            .map((path) => (
              <path
                key={path.id}
                d={renderStroke(path.points, path.size, path.brushType)}
                fill={path.color}
                opacity={path.brushType === 'highlighter' ? 0.45 : 1}
                filter={path.brushType === 'neon' ? 'url(#neon-glow)' : undefined}
                className="pointer-events-none"
              />
            ))}

          {/* In-progress freehand stroke */}
          {currentPathPoints.length > 1 && (
            <path
              d={renderStroke(
                currentPathPoints,
                brushSize,
                activeTool === 'rainbow' ? 'rainbow' : activeTool === 'neon' ? 'neon' : brushType
              )}
              fill={activeTool === 'rainbow' ? getRainbowColor(items.length) : brushColor}
              opacity={0.9}
              filter={activeTool === 'neon' ? 'url(#neon-glow)' : undefined}
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Black Hole Gravity Well Visualizer */}
        {activeTool === 'black-hole' && isBlackHoleActiveRef.current && blackHoleWorldPosRef.current && (
          <div
            className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 border-2 border-purple-400 bg-purple-600/30 animate-spin"
            style={{
              left: blackHoleWorldPosRef.current.x,
              top: blackHoleWorldPosRef.current.y,
              width: 140,
              height: 140,
              boxShadow: '0 0 50px rgba(168, 85, 247, 0.8), inset 0 0 30px rgba(0,0,0,0.9)'
            }}
          />
        )}

        {/* Layer 2: Stickers, GIFs, Instagram Chat Bubbles & Text Elements */}
        {items
          .filter((item) => item.type === 'sticker' || item.type === 'text' || item.type === 'chat')
          .map((item) => {
            // 1. Stickers & GIFs (supports Instagram Cutout white border!)
            if (item.type === 'sticker') {
              const sticker = item as StickerItem;
              return (
                <div
                  key={sticker.id}
                  onPointerDown={(e) => handleItemPointerDown(e, sticker)}
                  className={`absolute group cursor-pointer transition-shadow rounded-2xl select-none ${
                    selectedId === sticker.id ? 'ring-2 ring-pink-500 shadow-2xl' : 'hover:scale-[1.02]'
                  }`}
                  style={{
                    left: sticker.x,
                    top: sticker.y,
                    width: sticker.width,
                    height: sticker.height,
                    transform: `rotate(${sticker.rotation}deg)`,
                    transformOrigin: 'center center',
                    zIndex: sticker.zIndex
                  }}
                >
                  <img
                    src={sticker.url}
                    alt={sticker.label}
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-lg"
                    style={
                      sticker.isCutout
                        ? {
                            filter:
                              'drop-shadow(0 0 2px white) drop-shadow(0 0 4px white) drop-shadow(0 6px 14px rgba(0,0,0,0.6))'
                          }
                        : undefined
                    }
                  />
                  {/* Creator badge on hover */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 px-1.5 py-0.5 rounded text-[9px] text-gray-300 whitespace-nowrap pointer-events-none">
                    by {sticker.creatorName}
                  </div>
                </div>
              );
            }

            // 2. Instagram-Style Chat Bubble Item
            if (item.type === 'chat') {
              const chatItem = item as ChatBubbleItem;
              const isEditing = editingTextId === chatItem.id;
              const isMe = chatItem.creatorId === currentUser.id;

              return (
                <div
                  key={chatItem.id}
                  onPointerDown={(e) => handleItemPointerDown(e, chatItem)}
                  onDoubleClick={() => setEditingTextId(chatItem.id)}
                  className={`absolute group cursor-pointer transition-shadow rounded-3xl select-none p-3.5 max-w-[280px] shadow-2xl backdrop-blur-md ${
                    isMe
                      ? 'bg-gradient-to-tr from-purple-800/90 via-pink-700/80 to-purple-900/90 border border-pink-500/40 text-white'
                      : 'bg-gray-800/90 border border-white/20 text-gray-100'
                  } ${selectedId === chatItem.id ? 'ring-2 ring-pink-500' : 'hover:scale-[1.02]'}`}
                  style={{
                    left: chatItem.x,
                    top: chatItem.y,
                    transform: `rotate(${chatItem.rotation}deg)`,
                    transformOrigin: 'center center',
                    zIndex: chatItem.zIndex
                  }}
                >
                  {/* Header: Avatar, Name, Time */}
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs shadow"
                        style={{ backgroundColor: chatItem.senderColor }}
                      >
                        {chatItem.senderAvatar}
                      </span>
                      <span className="text-[11px] truncate max-w-[120px]">{chatItem.senderName}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono">{chatItem.timestamp}</span>
                  </div>

                  {/* Message Body */}
                  <div className="pt-2 text-sm leading-snug">
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={chatItem.message}
                        onChange={(e) =>
                          handleUpdateItem({ ...chatItem, message: e.target.value } as CanvasItem)
                        }
                        onBlur={() => setEditingTextId(null)}
                        className="w-full bg-black/70 border border-pink-400 rounded-xl p-2 text-white text-base sm:text-xs focus:outline-none resize-none shadow-inner"
                        rows={2}
                      />
                    ) : (
                      <p className="break-words font-medium">{chatItem.message}</p>
                    )}
                  </div>

                  {/* Instagram-style floating reaction hint */}
                  <div className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-0.5 rounded-full text-[10px] text-pink-300 border border-pink-500/40 shadow-lg pointer-events-none whitespace-nowrap">
                    Slap stickers over me! 🎭
                  </div>
                </div>
              );
            }

            // 3. WordArt & Meme Text
            if (item.type === 'text') {
              const textItem = item as TextItem;
              const isEditing = editingTextId === textItem.id;

              return (
                <div
                  key={textItem.id}
                  onPointerDown={(e) => handleItemPointerDown(e, textItem)}
                  onDoubleClick={() => setEditingTextId(textItem.id)}
                  className={`absolute rounded-xl px-2 py-1 select-none cursor-pointer ${
                    selectedId === textItem.id ? 'ring-2 ring-pink-500' : ''
                  }`}
                  style={{
                    left: textItem.x,
                    top: textItem.y,
                    transform: `rotate(${textItem.rotation}deg)`,
                    transformOrigin: 'center center',
                    zIndex: textItem.zIndex
                  }}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={textItem.text}
                      onChange={(e) =>
                        handleUpdateItem({ ...textItem, text: e.target.value } as CanvasItem)
                      }
                      onBlur={() => setEditingTextId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingTextId(null);
                      }}
                      className="bg-transparent border-b-2 border-pink-500 text-white font-black text-center focus:outline-none"
                      style={{
                        fontSize: `${textItem.fontSize}px`,
                        fontFamily:
                          textItem.fontFamily === 'impact'
                            ? 'Impact, sans-serif'
                            : 'sans-serif'
                      }}
                    />
                  ) : (
                    <span
                      className="font-black tracking-wider text-center block"
                      style={{
                        fontSize: `${textItem.fontSize}px`,
                        color: textItem.color,
                        fontFamily:
                          textItem.fontFamily === 'impact'
                            ? 'Impact, sans-serif'
                            : 'sans-serif',
                        textShadow:
                          '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 10px rgba(0,0,0,0.8)'
                      }}
                    >
                      {textItem.text}
                    </span>
                  )}
                </div>
              );
            }

            return null;
          })}

        {/* Layer 3: Transform Gizmo for selected element */}
        {selectedItem && (
          <TransformGizmo
            item={selectedItem}
            onUpdateItem={(updated) => handleUpdateItem({ ...selectedItem, ...updated } as CanvasItem)}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onBringToFront={handleBringToFront}
            onStartDrag={handleStartTransformDrag}
            onStartEdit={(id) => setEditingTextId(id)}
          />
        )}

        {/* Layer 4: Live Multiplayer & Bot Cursors */}
        <LiveCursors users={users} currentUserId={currentUser.id} />
      </div>

      {/* Minimap Radar in Bottom-Left */}
      <Minimap
        items={items}
        camera={camera}
        onPanTo={panToWorldCoord}
        users={users}
      />

      {/* Floating Zoom & Camera Reset Controls */}
      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-gray-900/90 backdrop-blur-md border border-white/15 text-xs text-gray-300 z-20 shadow-xl select-none">
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
            setCamera((c) => ({ ...c, zoom: Math.max(0.2, c.zoom * 0.8) }));
          }}
          className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-transform cursor-pointer font-bold text-sm"
          title="Zoom Out"
        >
          -
        </button>
        <span className="font-mono w-10 sm:w-12 text-center text-gray-200 text-[11px] sm:text-xs">
          {Math.round(camera.zoom * 100)}%
        </span>
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
            setCamera((c) => ({ ...c, zoom: Math.min(4, c.zoom * 1.25) }));
          }}
          className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-transform cursor-pointer font-bold text-sm"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            soundEngine.play('whoosh');
            setCamera({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
              zoom: 1
            });
          }}
          className="ml-0.5 sm:ml-1 px-2 py-1 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 active:scale-90 transition-transform text-[10px] sm:text-[11px] font-semibold text-pink-300 cursor-pointer"
          title="Recenter View"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
