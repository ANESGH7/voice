// server.js
import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebRTC signaling server");
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', ws => {
  ws.room = null;
  ws.username = null;

  ws.on('message', data => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === "join") {
      ws.room = msg.room;
      ws.username = msg.username;
      if (!rooms.has(ws.room)) rooms.set(ws.room, new Set());
      rooms.get(ws.room).add(ws);

      for (const client of rooms.get(ws.room)) {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({ type: "user_joined", username: ws.username }));
        }
      }
    }

    else if (["offer", "answer", "ice"].includes(msg.type)) {
      if (!ws.room || !rooms.has(ws.room)) return;
      for (const client of rooms.get(ws.room)) {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({ ...msg, from: ws.username }));
        }
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
      for (const client of rooms.get(ws.room)) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "user_left", username: ws.username }));
        }
      }
      if (rooms.get(ws.room).size === 0) rooms.delete(ws.room);
    }
  });
});

server.listen(process.env.PORT || 8080, () => {
  console.log("Signaling server running on port 8080");
});
