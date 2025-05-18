const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).substr(2, 9);
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'join') {
      ws.room = data.room;
      if (!rooms.has(ws.room)) rooms.set(ws.room, new Set());
      const clients = rooms.get(ws.room);
      const peers = [...clients].map(c => c.id);

      clients.add(ws);
      ws.send(JSON.stringify({ type: 'joined' }));
      ws.send(JSON.stringify({ type: 'peers', peers }));

      for (const client of clients) {
        if (client !== ws) {
          client.send(JSON.stringify({ type: 'peers', peers: [ws.id] }));
        }
      }
    }

    if (['offer', 'answer', 'ice'].includes(data.type)) {
      const clients = rooms.get(ws.room) || [];
      for (const client of clients) {
        if (client.id === data.to) {
          client.send(JSON.stringify({ ...data, from: ws.id }));
        }
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
    }
  });
});

console.log('WebSocket signaling server running on ws://localhost:8080');
