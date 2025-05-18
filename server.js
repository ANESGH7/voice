import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });
console.log('Server running on ws://localhost:8080');

const rooms = new Map(); // roomId => Set of clients

function broadcastToRoom(roomId, data, exceptClient = null) {
  const clients = rooms.get(roomId);
  if (!clients) return;
  for (const client of clients) {
    if (client !== exceptClient && client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  ws.id = uuidv4();
  ws.roomId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join') {
        // join room
        if (ws.roomId) {
          // remove from old room
          rooms.get(ws.roomId).delete(ws);
          broadcastToRoom(ws.roomId, JSON.stringify({
            type: 'userlist',
            users: Array.from(rooms.get(ws.roomId)).map(c => c.id)
          }));
        }
        ws.roomId = data.roomId;
        if (!rooms.has(ws.roomId)) {
          rooms.set(ws.roomId, new Set());
        }
        rooms.get(ws.roomId).add(ws);
        // send user their ID
        ws.send(JSON.stringify({ type: 'id', id: ws.id }));
        // broadcast user list to room
        broadcastToRoom(ws.roomId, JSON.stringify({
          type: 'userlist',
          users: Array.from(rooms.get(ws.roomId)).map(c => c.id)
        }));
      } else if (data.type === 'voice') {
        // voice data broadcast
        if (ws.roomId) {
          const payload = JSON.stringify({
            type: 'voice',
            from: ws.id,
            audio: data.audio
          });
          broadcastToRoom(ws.roomId, payload, ws);
        }
      } else if (data.type === 'call') {
        // broadcast call start to room
        if (ws.roomId) {
          const payload = JSON.stringify({
            type: 'call',
            from: ws.id
          });
          broadcastToRoom(ws.roomId, payload, ws);
        }
      } else if (data.type === 'answer') {
        // broadcast answer to room
        if (ws.roomId) {
          const payload = JSON.stringify({
            type: 'answer',
            from: ws.id
          });
          broadcastToRoom(ws.roomId, payload, ws);
        }
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    if (ws.roomId && rooms.has(ws.roomId)) {
      rooms.get(ws.roomId).delete(ws);
      broadcastToRoom(ws.roomId, JSON.stringify({
        type: 'userlist',
        users: Array.from(rooms.get(ws.roomId)).map(c => c.id)
      }));
    }
  });
});
