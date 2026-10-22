import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { CanvasItem, UserPresence, ToolType, ChaosMode } from '../types/canvas';
import { soundEngine } from '../utils/soundEngine';
import { MEME_CATALOG } from '../data/memeCatalog';

interface MultiplayerMessage {
  type: 'cursor' | 'item_add' | 'item_update' | 'item_delete' | 'items_batch' | 'chaos_event' | 'speech' | 'sync_state' | 'user_leave';
  userId: string;
  payload: unknown;
}

const BOT_NAMES = [
  { name: 'DogeLover99', color: '#f59e0b', avatar: '🐕' },
  { name: 'PepeArchitect', color: '#10b981', avatar: '🐸' },
  { name: 'PopcatGeneral', color: '#ec4899', avatar: '🐱' },
  { name: 'ChaosGoblin', color: '#8b5cf6', avatar: '👾' }
];

export function useMultiplayer(
  currentUser: { id: string; name: string; color: string; avatar: string },
  items: CanvasItem[],
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>,
  triggerChaos: (chaos: ChaosMode) => void
) {
  const [users, setUsers] = useState<Record<string, UserPresence>>({});
  const [enableBots, setEnableBots] = useState<boolean>(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>('general-chaos');

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastCursorSentRef = useRef<number>(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Read room from URL query (e.g. ?room=xyz)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

  // Handle incoming message (from WS or BroadcastChannel)
  const handleIncomingMessage = useCallback(
    (msg: MultiplayerMessage) => {
      if (!msg || msg.userId === currentUser.id) return;

      switch (msg.type) {
        case 'cursor': {
          const presence = msg.payload as UserPresence;
          setUsers((prev) => ({
            ...prev,
            [msg.userId]: {
              ...presence,
              lastActive: Date.now()
            }
          }));
          break;
        }

        case 'sync_state': {
          const { items: remoteItems } = msg.payload as { items: CanvasItem[] };
          if (Array.isArray(remoteItems) && remoteItems.length > 0) {
            setItems(remoteItems);
          }
          break;
        }

        case 'item_add': {
          const newItem = msg.payload as CanvasItem;
          setItems((prev) => {
            if (prev.some((it) => it.id === newItem.id)) return prev;
            return [...prev, newItem];
          });
          soundEngine.play('pop', { x: newItem.x, y: newItem.y });
          break;
        }

        case 'item_update': {
          const updated = msg.payload as CanvasItem;
          setItems((prev) =>
            prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
          );
          break;
        }

        case 'item_delete': {
          const deleteId = msg.payload as string;
          setItems((prev) => prev.filter((it) => it.id !== deleteId));
          break;
        }

        case 'items_batch': {
          const batch = msg.payload as CanvasItem[];
          setItems(batch);
          break;
        }

        case 'chaos_event': {
          const chaos = msg.payload as ChaosMode;
          triggerChaos(chaos);
          break;
        }

        case 'speech': {
          const { text } = msg.payload as { text: string };
          setUsers((prev) => {
            const user = prev[msg.userId];
            if (!user) return prev;
            return {
              ...prev,
              [msg.userId]: {
                ...user,
                statusText: text,
                statusExpiresAt: Date.now() + 6000
              }
            };
          });
          break;
        }

        case 'user_leave': {
          setUsers((prev) => {
            const next = { ...prev };
            delete next[msg.userId];
            return next;
          });
          break;
        }
      }
    },
    [currentUser.id, setItems, triggerChaos]
  );

  // Initialize BroadcastChannel (cross-tab fallback)
  useEffect(() => {
    const channelName = `theopencanvas_room_${roomId}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<MultiplayerMessage>) => {
      handleIncomingMessage(event.data);
    };

    return () => {
      channel.close();
    };
  }, [roomId, handleIncomingMessage]);

  // Initialize WebSocket connection to local/remote server
  useEffect(() => {
    const hostname = window.location.hostname || 'localhost';
    const wsUrl = `ws://${hostname}:3001?room=${encodeURIComponent(roomId)}`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let isDisposed = false;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isDisposed) return;
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          if (isDisposed) return;
          setIsWsConnected(false);
          // Try reconnecting in 3 seconds
          reconnectTimeout = window.setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch {
        setIsWsConnected(false);
        reconnectTimeout = window.setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
        wsRef.current = null;
      }
    };
  }, [roomId, handleIncomingMessage]);

  // Clean stale users every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, user] of Object.entries(next)) {
          if (!id.startsWith('bot_') && now - user.lastActive > 10000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Universal dispatch helper (sends to WS and BroadcastChannel)
  const dispatchMessage = useCallback((msg: MultiplayerMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(msg);
    }
  }, []);

  // Broadcast cursor movements (throttled to ~30fps)
  const broadcastCursor = useCallback(
    (x: number, y: number, activeTool: ToolType, laserTrail?: { x: number; y: number; time: number }[]) => {
      const now = performance.now();
      if (now - lastCursorSentRef.current < 30) return;
      lastCursorSentRef.current = now;

      const presence: UserPresence = {
        id: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
        avatar: currentUser.avatar,
        cursor: { x, y },
        activeTool,
        lastActive: Date.now(),
        laserTrail
      };

      dispatchMessage({
        type: 'cursor',
        userId: currentUser.id,
        payload: presence
      });
    },
    [currentUser, dispatchMessage]
  );

  // Broadcast item addition
  const broadcastItemAdd = useCallback(
    (item: CanvasItem) => {
      dispatchMessage({
        type: 'item_add',
        userId: currentUser.id,
        payload: item
      });
    },
    [currentUser.id, dispatchMessage]
  );

  // Broadcast item update
  const broadcastItemUpdate = useCallback(
    (item: CanvasItem) => {
      dispatchMessage({
        type: 'item_update',
        userId: currentUser.id,
        payload: item
      });
    },
    [currentUser.id, dispatchMessage]
  );

  // Broadcast item deletion
  const broadcastItemDelete = useCallback(
    (id: string) => {
      dispatchMessage({
        type: 'item_delete',
        userId: currentUser.id,
        payload: id
      });
    },
    [currentUser.id, dispatchMessage]
  );

  // Broadcast items batch (e.g. for clear or reorder)
  const broadcastItemsBatch = useCallback(
    (batch: CanvasItem[]) => {
      dispatchMessage({
        type: 'items_batch',
        userId: currentUser.id,
        payload: batch
      });
    },
    [currentUser.id, dispatchMessage]
  );

  // Broadcast speech bubble
  const broadcastSpeech = useCallback(
    (text: string) => {
      dispatchMessage({
        type: 'speech',
        userId: currentUser.id,
        payload: { text }
      });
    },
    [currentUser.id, dispatchMessage]
  );

  // Broadcast chaos event
  const broadcastChaos = useCallback(
    (chaos: ChaosMode) => {
      dispatchMessage({
        type: 'chaos_event',
        userId: currentUser.id,
        payload: chaos
      });
    },
    [currentUser.id, dispatchMessage]
  );

  // Check for high-five interaction when user cursor gets close to any peer
  const checkHighFive = useCallback(
    (userWorldPos: { x: number; y: number }, clientScreenPos: { x: number; y: number }) => {
      for (const [id, peer] of Object.entries(users)) {
        const dx = userWorldPos.x - peer.cursor.x;
        const dy = userWorldPos.y - peer.cursor.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 45) {
          // Trigger high-five celebration!
          soundEngine.play('high-five', userWorldPos);
          confetti({
            particleCount: 40,
            spread: 60,
            origin: {
              x: clientScreenPos.x / window.innerWidth,
              y: clientScreenPos.y / window.innerHeight
            }
          });

          // Set status on peer
          setUsers((prev) => {
            const p = prev[id];
            if (!p) return prev;
            return {
              ...prev,
              [id]: {
                ...p,
                statusText: `High-five with ${currentUser.name}! 🖐️`,
                statusExpiresAt: Date.now() + 3000
              }
            };
          });
          break;
        }
      }
    },
    [users, currentUser.name]
  );

  // Simulated AI/Bot Collaborators for instant multiplayer vibe
  useEffect(() => {
    if (!enableBots) {
      setUsers((prev) => {
        const next = { ...prev };
        BOT_NAMES.forEach((_, i) => delete next[`bot_${i}`]);
        return next;
      });
      return;
    }

    // Initialize bot presence
    const initialBots: Record<string, UserPresence> = {};
    BOT_NAMES.forEach((bot, i) => {
      initialBots[`bot_${i}`] = {
        id: `bot_${i}`,
        name: bot.name,
        color: bot.color,
        avatar: bot.avatar,
        cursor: { x: 200 + i * 150, y: 150 + i * 80 },
        activeTool: 'pen',
        lastActive: Date.now()
      };
    });
    setUsers((prev) => ({ ...prev, ...initialBots }));

    // Animate bots wandering, speaking, and occasionally dropping memes
    const interval = setInterval(() => {
      setUsers((prev) => {
        const next = { ...prev };
        BOT_NAMES.forEach((_, i) => {
          const botId = `bot_${i}`;
          const current = next[botId];
          if (!current) return;

          // Wandering target
          const targetX = current.cursor.x + (Math.random() - 0.5) * 80;
          const targetY = current.cursor.y + (Math.random() - 0.5) * 80;

          // Random speech lines
          let statusText = current.statusText;
          let statusExpiresAt = current.statusExpiresAt;
          if (Math.random() < 0.08 && (!statusExpiresAt || Date.now() > statusExpiresAt)) {
            const quotes = [
              'Yooo this canvas is wild!',
              'Who dropped that Gigachad? 🗿',
              'Popcat supremacy 🐱',
              'High-five me! 🖐️',
              'Hold my bongo cat...',
              'Draw something crazy here!',
              'Gravity flip incoming?'
            ];
            statusText = quotes[Math.floor(Math.random() * quotes.length)];
            statusExpiresAt = Date.now() + 4500;
          }

          next[botId] = {
            ...current,
            cursor: { x: targetX, y: targetY },
            statusText,
            statusExpiresAt
          };
        });
        return next;
      });

      // Bot occasionally drops a funny sticker!
      if (Math.random() < 0.04 && itemsRef.current.length < 35) {
        const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const randomMeme = MEME_CATALOG[Math.floor(Math.random() * MEME_CATALOG.length)];
        const botItem: CanvasItem = {
          id: `bot_item_${Date.now()}_${Math.random()}`,
          type: 'sticker',
          url: randomMeme.url,
          label: randomMeme.name,
          isAnimated: true,
          soundEffect: randomMeme.soundEffect,
          aspectRatio: randomMeme.aspectRatio,
          x: Math.random() * 800 - 200,
          y: Math.random() * 500 - 100,
          width: 140,
          height: 140 / randomMeme.aspectRatio,
          rotation: (Math.random() - 0.5) * 30,
          zIndex: itemsRef.current.length + 1,
          creatorId: `bot_${randomBot.name}`,
          creatorName: randomBot.name,
          creatorColor: randomBot.color,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        setItems((prev) => [...prev, botItem]);
        soundEngine.play(randomMeme.soundEffect, { x: botItem.x, y: botItem.y });
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [enableBots, setItems]);

  return {
    users,
    roomId,
    setRoomId,
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
  };
}
