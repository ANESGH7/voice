import http from 'http';
import { WebSocketServer } from 'ws';

const port = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebRTC Signaling Server is Running.");
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.room = null;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      return;
    }

    if (msg.type === 'join') {
      ws.room = msg.room;
      if (!rooms.has(ws.room)) rooms.set(ws.room, new Set());
      rooms.get(ws.room).add(ws);
      console.log(`User joined room: ${ws.room}`);
    } else if (['offer', 'answer', 'ice'].includes(msg.type)) {
      if (ws.room && rooms.has(ws.room)) {
        for (const client of rooms.get(ws.room)) {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(msg));
          }
        }
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
      if (rooms.get(ws.room).size === 0) rooms.delete(ws.room);
    }
  });
});

server.listen(port, () => {
  console.log(`✅ WebRTC signaling server running on port ${port}`);
});
