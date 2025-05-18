// server.js
import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebRTC signaling server is running');
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', ws => {
  ws.room = null;
  ws.username = null;

  ws.on('message', message => {
    let data;
    try { data = JSON.parse(message); } catch { return; }

    const { type, room, username, to } = data;

    if (type === 'join') {
      ws.room = room;
      ws.username = username;
      if (!rooms.has(room)) rooms.set(room, new Map());
      rooms.get(room).set(username, ws);

      for (const [otherUsername, client] of rooms.get(room)) {
        if (client !== ws) {
          client.send(JSON.stringify({ type: 'user_joined', username }));
          ws.send(JSON.stringify({ type: 'user_joined', username: otherUsername }));
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
    if (ws.room && ws.username && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws.username);
      for (const client of rooms.get(ws.room).values()) {
        client.send(JSON.stringify({ type: 'user_left', username: ws.username }));
      }
      if (rooms.get(ws.room).size === 0) {
        rooms.delete(ws.room);
      }
    }
  });
});

server.listen(process.env.PORT || 8080, () =>
  console.log('WebRTC signaling server running on port 8080')
);
