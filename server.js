// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const clients = new Map(); // socket -> { id, room }
const rooms = new Map();   // roomName -> Set of sockets

// Serve static files
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

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).substr(2, 9);
  clients.set(ws, { id });

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    const client = clients.get(ws);

    if (data.type === 'join') {
      const room = data.room;
      client.room = room;
      rooms.set(room, rooms.get(room) || new Set());
      rooms.get(room).add(ws);

      // Send confirmation and existing users
      ws.send(JSON.stringify({ type: 'joined', id }));
      broadcastUserList(room);
    }

    if (data.type === 'call-start') {
      broadcastToRoom(client.room, {
        type: 'call-start',
      }, ws);
    }

    if (['offer', 'answer', 'ice'].includes(data.type)) {
      const target = Array.from(rooms.get(client.room) || []).find(s => clients.get(s)?.id === data.to);
      if (target) {
        target.send(JSON.stringify({ ...data, from: client.id }));
      }
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client?.room && rooms.has(client.room)) {
      rooms.get(client.room).delete(ws);
      if (rooms.get(client.room).size === 0) {
        rooms.delete(client.room);
      } else {
        broadcastUserList(client.room);
      }
    }
    clients.delete(ws);
  });
});

function broadcastToRoom(room, msg, excludeSocket = null) {
  (rooms.get(room) || new Set()).forEach(client => {
    if (client !== excludeSocket) {
      client.send(JSON.stringify(msg));
    }
  });
}

function broadcastUserList(room) {
  const users = Array.from(rooms.get(room) || []).map(s => clients.get(s)?.id);
  broadcastToRoom(room, { type: 'user-list', users });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
