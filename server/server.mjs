import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({ port: PORT });

// In-memory room store: roomId -> { clients: Set<WebSocket>, items: CanvasItem[], users: Map }
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Set(),
      items: [],
      users: new Map()
    });
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws, req) => {
  let currentRoomId = 'default';
  let userId = null;

  // Extract room from URL query if present (e.g. ws://localhost:3001?room=fun)
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomParam = url.searchParams.get('room');
    if (roomParam) currentRoomId = roomParam;
  } catch {
    // fallback to 'default'
  }

  const room = getOrCreateRoom(currentRoomId);
  room.clients.add(ws);

  // Send current canvas state to newly connected client
  ws.send(JSON.stringify({
    type: 'sync_state',
    payload: {
      items: room.items
    }
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.userId) userId = message.userId;

      // Update room state for persistent actions
      if (message.type === 'item_add') {
        const item = message.payload;
        if (!room.items.some((i) => i.id === item.id)) {
          room.items.push(item);
        }
      } else if (message.type === 'item_update') {
        const updated = message.payload;
        room.items = room.items.map((i) => (i.id === updated.id ? { ...i, ...updated } : i));
      } else if (message.type === 'item_delete') {
        const delId = message.payload;
        room.items = room.items.filter((i) => i.id !== delId);
      } else if (message.type === 'items_batch') {
        room.items = message.payload;
      }

      // Broadcast to other peers in the room
      for (const client of room.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    room.clients.delete(ws);
    if (userId) {
      room.users.delete(userId);
      // Broadcast user departure
      for (const client of room.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'user_leave',
            userId
          }));
        }
      }
    }
    if (room.clients.size === 0) {
      // keep items in room for future joins
    }
  });
});

console.log(`[TheOpenCanvas] Real-time WebSocket server running on ws://localhost:${PORT}`);
