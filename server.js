import http from 'http';
import { WebSocketServer } from 'ws';

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Voice WebSocket Server is Running.");
});

const wss = new WebSocketServer({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  ws.room = null;
  ws.username = null;

  ws.on('message', (data, isBinary) => {
    if (!isBinary) {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch (e) {
        return;
      }

      if (msg.type === 'join') {
        const { room, username } = msg;
        ws.room = room;
        ws.username = username;

        if (!rooms.has(room)) {
          rooms.set(room, new Set());
        }

        rooms.get(room).add(ws);
        broadcastToRoom(room, {
          type: 'user_joined',
          username,
        });

      } else if (msg.type === 'start_stream') {
        broadcastToRoom(ws.room, {
          type: 'streaming_starting',
          username: ws.username,
        }, ws);
      }

    } else if (ws.room) {
      for (const client of rooms.get(ws.room) || []) {
        if (client !== ws && client.readyState === 1) {
          client.send(data, { binary: true });
        }
      }
    }
  });


ws.on('close', () => {
  if (ws.room && rooms.has(ws.room)) {
    const roomSet = rooms.get(ws.room);
    roomSet.delete(ws);
    broadcastToRoom(ws.room, {
      type: 'user_left',
      username: ws.username,
    });
    if (roomSet.size === 0) {
      rooms.delete(ws.room);
    }
  }
});

});

function broadcastToRoom(room, message, except = null) {
  if (!rooms.has(room)) return;
  const json = JSON.stringify(message);
  for (const client of rooms.get(room)) {
    if (client.readyState === 1 && client !== except) {
      client.send(json);
    }
  }
}

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
