// server.js
import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebRTC Voice Server');
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', ws => {
  ws.room = null;
  ws.username = null;

  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }

    const { type, room, username, to } = data;

    if (type === 'join') {
      ws.room = room;
      ws.username = username;
      if (!rooms.has(room)) rooms.set(room, new Map());
      rooms.get(room).set(username, ws);

      for (const [u, client] of rooms.get(room)) {
        if (client !== ws) {
          client.send(JSON.stringify({ type: 'user_joined', username }));
          ws.send(JSON.stringify({ type: 'user_joined', username: u }));
        }
      }
    }

    if (['offer', 'answer', 'ice'].includes(type)) {
      const target = rooms.get(room)?.get(to);
      if (target && target.readyState === 1) {
        target.send(JSON.stringify({ ...data, from: username }));
      }
    }
  });

  ws.on('close', () => {
    const { room, username } = ws;
    if (room && rooms.has(room)) {
      rooms.get(room).delete(username);
      for (const client of rooms.get(room).values()) {
        client.send(JSON.stringify({ type: 'user_left', username }));
      }
      if (rooms.get(room).size === 0) rooms.delete(room);
    }
  });
});

server.listen(8080, () => {
  console.log("WebSocket voice server running at http://localhost:8080");
});
