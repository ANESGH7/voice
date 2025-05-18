// server.js
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
    } else {
      res.writeHead(200);
      res.end(content);
    }
  });
});

const wss = new WebSocket.Server({ server });
const rooms = new Map(); // roomName -> Set of sockets

wss.on('connection', (ws) => {
  ws._id = generateId();

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === 'join') {
      const room = data.room;
      ws.room = room;

      if (!rooms.has(room)) rooms.set(room, new Set());
      const peers = Array.from(rooms.get(room)).filter(p => p !== ws);

      ws.send(JSON.stringify({ type: 'joined', id: ws._id }));
      ws.send(JSON.stringify({ type: 'peers', peers: peers.map(p => p._id) }));

      rooms.get(room).add(ws);
      peers.forEach(peer => {
        peer.send(JSON.stringify({ type: 'peers', peers: [ws._id] }));
      });
    }

    if (data.type === 'call-start') {
      const clients = rooms.get(ws.room) || new Set();
      for (const client of clients) {
        if (client !== ws) {
          client.send(JSON.stringify({ type: 'call-start' }));
        }
      }
    }

    if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice') {
      const to = findClientById(data.to);
      if (to) {
        to.send(JSON.stringify({ ...data, from: ws._id }));
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
      if (rooms.get(ws.room).size === 0) {
        rooms.delete(ws.room);
      }
    }
  });
});

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function findClientById(id) {
  for (const room of rooms.values()) {
    for (const client of room) {
      if (client._id === id) return client;
    }
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
