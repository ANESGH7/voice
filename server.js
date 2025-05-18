const WebSocket = require('ws');
const { v4: uuid } = require('uuid');

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

const rooms = new Map();

wss.on('connection', ws => {
  ws.id = uuid();
  ws.room = null;

  ws.on('message', msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === 'join') {
      ws.room = data.room;
      if (!rooms.has(data.room)) rooms.set(data.room, new Set());
      rooms.get(data.room).add(ws);

      ws.send(JSON.stringify({ type: 'joined', id: ws.id }));
      broadcastUserList(data.room);
    }

    if (data.type === 'call-start') {
      broadcast(ws.room, {
        type: 'call-start',
        from: ws.id
      }, ws);
    }

    if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice') {
      const target = findClientById(ws.room, data.to);
      if (target) {
        target.send(JSON.stringify({
          type: data.type,
          from: ws.id,
          ...(data.offer && { offer: data.offer }),
          ...(data.answer && { answer: data.answer }),
          ...(data.candidate && { candidate: data.candidate }),
        }));
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
      if (rooms.get(ws.room).size === 0) rooms.delete(ws.room);
      else broadcastUserList(ws.room);
    }
  });

  function broadcastUserList(room) {
    const users = [...(rooms.get(room) || [])].map(w => w.id);
    broadcast(room, { type: 'user-list', users });
  }

  function broadcast(room, msg, exclude) {
    for (const client of rooms.get(room) || []) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    }
  }

  function findClientById(room, id) {
    for (const client of rooms.get(room) || []) {
      if (client.id === id) return client;
    }
    return null;
  }
});

console.log('WebSocket server running');
