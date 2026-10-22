import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type {
  CanvasItem,
  ToolType,
  BrushType,
  ChaosMode,
  ChatBubbleItem
} from './types/canvas';
import { MEME_CATALOG } from './data/memeCatalog';
import type { MemeTemplate } from './data/memeCatalog';
import { soundEngine } from './utils/soundEngine';
import { exportCanvasToPng } from './utils/canvasExport';
import { useMultiplayer } from './hooks/useMultiplayer';
import { Navbar } from './components/UI/Navbar';
import { Toolbar } from './components/UI/Toolbar';
import { StickerPicker } from './components/UI/StickerPicker';
import { ChaosBar } from './components/UI/ChaosBar';
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas';

// Default welcome items for instant viral fun (NO floating wordart!)
const INITIAL_ITEMS: CanvasItem[] = [
  {
    id: 'welcome_popcat',
    type: 'sticker',
    url: 'https://media.tenor.com/7vjP5h9w8hIAAAAj/pop-cat-cat.gif',
    label: 'Popcat',
    isAnimated: true,
    soundEffect: 'pop',
    aspectRatio: 1,
    x: -200,
    y: -80,
    width: 170,
    height: 170,
    rotation: -8,
    zIndex: 1,
    creatorId: 'system',
    creatorName: 'TheOpenCanvas',
    creatorColor: '#ec4899',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'welcome_doge',
    type: 'sticker',
    url: 'https://media.tenor.com/2K1z9_p_H6cAAAAj/doge.gif',
    label: 'Doge',
    isAnimated: true,
    soundEffect: 'boing',
    aspectRatio: 1,
    x: 80,
    y: -70,
    width: 160,
    height: 160,
    rotation: 12,
    zIndex: 2,
    creatorId: 'system',
    creatorName: 'TheOpenCanvas',
    creatorColor: '#f59e0b',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'welcome_chat_demo',
    type: 'chat',
    message: 'Bro, slap any sticker, emoji, or GIF right over this chat! 🔥',
    senderName: 'InstaChat',
    senderAvatar: '💬',
    senderColor: '#ec4899',
    timestamp: '12:00 AM',
    x: -140,
    y: 80,
    width: 270,
    height: 90,
    rotation: -1,
    zIndex: 3,
    creatorId: 'system',
    creatorName: 'TheOpenCanvas',
    creatorColor: '#ec4899',
    createdAt: Date.now(),
    updatedAt: Date.now()
  } as ChatBubbleItem
];

export function App() {
  // Current user identity
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('theopencanvas_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const randNum = Math.floor(Math.random() * 900) + 100;
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];
    const avatars = ['🐕', '🐸', '🐱', '👾', '🚀', '🔥', '👑', '⚡', '🗿'];
    return {
      id: `user_${Date.now()}_${Math.random()}`,
      name: `MemeLord_${randNum}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      avatar: avatars[Math.floor(Math.random() * avatars.length)]
    };
  });

  const updateUserProfile = (name: string, avatar: string) => {
    const updated = { ...currentUser, name, avatar };
    setCurrentUser(updated);
    localStorage.setItem('theopencanvas_user', JSON.stringify(updated));
  };

  // Canvas Items
  const [items, setItems] = useState<CanvasItem[]>(INITIAL_ITEMS);

  // Undo / Redo History Stacks
  const undoStackRef = useRef<CanvasItem[][]>([]);
  const redoStackRef = useRef<CanvasItem[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const takeSnapshot = useCallback(() => {
    undoStackRef.current.push([...items]);
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [items]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop();
    if (previous) {
      redoStackRef.current.push([...items]);
      setItems(previous);
      setCanUndo(undoStackRef.current.length > 0);
      setCanRedo(true);
      soundEngine.play('pop');
    }
  }, [items]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop();
    if (next) {
      undoStackRef.current.push([...items]);
      setItems(next);
      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
      soundEngine.play('pop');
    }
  }, [items]);

  // Global Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handleUndoRedoKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleUndoRedoKeys);
    return () => window.removeEventListener('keydown', handleUndoRedoKeys);
  }, [handleUndo, handleRedo]);

  // Active Tool & Brush settings
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [brushColor, setBrushColor] = useState<string>('#ec4899');
  const [brushSize, setBrushSize] = useState<number>(12);
  const [brushType, setBrushType] = useState<BrushType>('pen');

  // GIF Streamer & Slap active template
  const [activeStreamSticker, setActiveStreamSticker] = useState<MemeTemplate>(MEME_CATALOG[0]);

  // Chaos Mode state
  const [activeChaos, setActiveChaos] = useState<ChaosMode>('none');
  const [isPhysicsRunning, setIsPhysicsRunning] = useState<boolean>(false);

  // Modals
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [isChaosBarOpen, setIsChaosBarOpen] = useState(false);

  // Trigger temporary Chaos events (Nuke, Gravity, Disco, Confetti)
  const triggerChaos = (chaos: ChaosMode) => {
    setActiveChaos(chaos);
    broadcastChaos(chaos);

    if (chaos === 'nuke') {
      soundEngine.play('nuke');
      setTimeout(() => setActiveChaos('none'), 1200);
    } else if (chaos === 'disco') {
      soundEngine.play('airhorn');
      setTimeout(() => setActiveChaos('none'), 8000);
    } else if (chaos === 'earthquake') {
      soundEngine.play('vine-boom');
      setTimeout(() => setActiveChaos('none'), 2500);
    } else if (chaos === 'confetti') {
      soundEngine.play('high-five');
      confetti({ particleCount: 120, spread: 100 });
      setTimeout(() => setActiveChaos('none'), 2000);
    } else if (chaos === 'gravity') {
      setIsPhysicsRunning(true);
      setTimeout(() => setActiveChaos('none'), 3000);
    }
  };

  // Real-time Multiplayer & Presence Hook
  const {
    users,
    roomId,
    isWsConnected,
    enableBots,
    setEnableBots,
    broadcastCursor,
    broadcastItemAdd,
    broadcastItemUpdate,
    broadcastItemDelete,
    broadcastItemsBatch,
    broadcastSpeech,
    broadcastChaos,
    checkHighFive
  } = useMultiplayer(currentUser, items, setItems, triggerChaos);

  // Quick Slap reaction from Instagram-style reaction bar
  const handleQuickSlapReaction = (emoji: string) => {
    // Generate an emoji SVG or text template
    const emojiMeme: MemeTemplate = {
      id: `reaction_${Date.now()}`,
      name: emoji,
      category: 'reactions',
      url: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='85'>${emoji}</text></svg>`,
      soundEffect: emoji === '🔥' ? 'explosion' : emoji === '💀' ? 'vine-boom' : 'pop',
      aspectRatio: 1,
      tags: ['reaction', emoji]
    };

    setActiveStreamSticker(emojiMeme);
    setActiveTool('sticker-slap');
    soundEngine.play('pop');
  };

  // Sticker selected from Vault: enters slap mode or stamps immediately
  const handleSelectSticker = (meme: MemeTemplate, isCutout: boolean = false) => {
    takeSnapshot();
    const size = 160;
    const newSticker: CanvasItem = {
      id: `sticker_${Date.now()}_${Math.random()}`,
      type: 'sticker',
      url: meme.url,
      label: meme.name,
      isAnimated: meme.url.includes('.gif') || meme.url.includes('tenor'),
      soundEffect: meme.soundEffect,
      aspectRatio: meme.aspectRatio,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      width: size,
      height: size / meme.aspectRatio,
      rotation: (Math.random() - 0.5) * 24, // organic Instagram slap tilt!
      zIndex: items.length + 1,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorColor: currentUser.color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCutout
    };

    setItems((prev) => [...prev, newSticker]);
    broadcastItemAdd(newSticker);
    setActiveStreamSticker(meme);
    soundEngine.play(meme.soundEffect, { x: newSticker.x, y: newSticker.y });
    setActiveTool('sticker-slap'); // keep in slap mode so user can slap more!
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (window.confirm('Clear all drawings, chats, and memes on the canvas?')) {
      takeSnapshot();
      setItems([]);
      broadcastItemsBatch([]);
      soundEngine.play('pop');
    }
  };

  // Export Canvas Snapshot as High-Res PNG image
  const handleExportImage = async () => {
    soundEngine.play('high-five');
    confetti({ particleCount: 60, spread: 80 });
    await exportCanvasToPng(items);
  };

  const totalUserCount = Object.keys(users).length + 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0c10]">
      {/* Top Navigation */}
      <Navbar
        userCount={totalUserCount}
        roomId={roomId}
        isWsConnected={isWsConnected}
        enableBots={enableBots}
        onToggleBots={() => setEnableBots((v) => !v)}
        onClearCanvas={handleClearCanvas}
        onExportImage={handleExportImage}
        currentUser={currentUser}
        onUpdateUser={updateUserProfile}
        onTriggerChaos={() => setIsChaosBarOpen(true)}
      />

      {/* Main Interactive Infinite Canvas */}
      <InfiniteCanvas
        items={items}
        setItems={setItems}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        brushColor={brushColor}
        brushSize={brushSize}
        brushType={brushType}
        activeStreamSticker={activeStreamSticker}
        currentUser={currentUser}
        users={users}
        broadcastCursor={broadcastCursor}
        broadcastItemAdd={broadcastItemAdd}
        broadcastItemUpdate={broadcastItemUpdate}
        broadcastItemDelete={broadcastItemDelete}
        checkHighFive={checkHighFive}
        activeChaos={activeChaos}
        onOpenStickerPicker={() => setIsStickerPickerOpen(true)}
        isPhysicsRunning={isPhysicsRunning}
        onSnapshotAction={takeSnapshot}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Floating Bottom Toolbar with Instagram Quick Reactions Bar */}
      <Toolbar
        activeTool={activeTool}
        onChangeTool={setActiveTool}
        brushColor={brushColor}
        onChangeColor={setBrushColor}
        brushSize={brushSize}
        onChangeSize={setBrushSize}
        brushType={brushType}
        onChangeBrushType={setBrushType}
        onOpenStickerPicker={() => setIsStickerPickerOpen(true)}
        activeStreamSticker={activeStreamSticker}
        onSelectStreamSticker={setActiveStreamSticker}
        isPhysicsRunning={isPhysicsRunning}
        onTogglePhysics={() => {
          const next = !isPhysicsRunning;
          setIsPhysicsRunning(next);
          soundEngine.play(next ? 'boing' : 'pop');
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onQuickSlapReaction={handleQuickSlapReaction}
      />

      {/* Meme & GIF Vault Modal with Cutout Maker */}
      <StickerPicker
        isOpen={isStickerPickerOpen}
        onClose={() => setIsStickerPickerOpen(false)}
        onSelectSticker={handleSelectSticker}
        isSlapModeActive={activeTool === 'sticker-slap'}
        onToggleSlapMode={() =>
          setActiveTool(activeTool === 'sticker-slap' ? 'select' : 'sticker-slap')
        }
      />

      {/* Chaos Wheel & Soundboard Drawer */}
      <ChaosBar
        isOpen={isChaosBarOpen}
        onClose={() => setIsChaosBarOpen(false)}
        onTriggerChaos={triggerChaos}
        onSendSpeech={broadcastSpeech}
      />
    </div>
  );
}

export default App;
