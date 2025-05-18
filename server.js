// server.js
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });
const rooms = new Map(); // roomName -> Set of sockets

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.error("Invalid message:", msg);
      return;
    }

    if (data.type === 'join') {
      const room = data.room;
      ws.room = room;
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }

      const peers = Array.from(rooms.get(room)).filter(p => p !== ws);
      ws.send(JSON.stringify({ type: 'joined', room }));
      ws.send(JSON.stringify({ type: 'peers', peers: peers.map(p => p._id) }));

      ws._id = generateId(); // assign unique id
      rooms.get(room).add(ws);

      for (const peer of peers) {
        peer.send(JSON.stringify({ type: 'peers', peers: [ws._id] }));
      }
    }

    if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice') {
      const target = findClientById(data.to);
      if (target) {
        target.send(JSON.stringify({
          type: data.type,
          from: ws._id,
          ...(data.offer && { offer: data.offer }),
          ...(data.answer && { answer: data.answer }),
          ...(data.candidate && { candidate: data.candidate }),
        }));
      }
    }

    if (data.type === 'call-start') {
      const clients = rooms.get(ws.room) || new Set();
      for (const client of clients) {
        if (client !== ws) {
          client.send(JSON.stringify({ type: 'call-start' }));
        }
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
  return Math.random().toString(36).substr(2, 9);
}

function findClientById(id) {
  for (const room of rooms.values()) {
    for (const client of room) {
      if (client._id === id) return client;
    }
  }
  return null;
}

console.log(`WebSocket signaling server running on port ${PORT}`);
