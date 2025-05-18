// server.js
import { WebSocketServer } from 'ws';
const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT });

const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    const { type, room } = msg;

    if (type === 'join') {
      rooms[room] = rooms[room] || [];
      rooms[room].push(ws);
      ws.room = room;
      ws.send(JSON.stringify({ type: 'joined', initiator: rooms[room].length === 1 }));
    }

    // Relay offer, answer, candidate
    if (['offer', 'answer', 'candidate'].includes(type)) {
      rooms[room]?.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(msg));
        }
      });
    }
  });

  ws.on('close', () => {
    const room = ws.room;
    if (room) {
      rooms[room] = rooms[room].filter(client => client !== ws);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

console.log(`Server running on port ${PORT}`);
