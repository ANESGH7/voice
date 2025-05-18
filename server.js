import http from 'http';
import { WebSocketServer } from 'ws';

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Voice WebSocket Server with Rooms is Running.");
});

const wss = new WebSocketServer({ server });

// Map clients to room and user info
const clients = new Map(); // ws => {room, userName, isStreaming}

wss.on('connection', (ws) => {
  clients.set(ws, { room: null, userName: null, isStreaming: false });

  ws.on('message', (message, isBinary) => {
    if (isBinary) {
      // Broadcast audio binary only to clients in same room who are not sender
      const senderInfo = clients.get(ws);
      if (!senderInfo || !senderInfo.room) return;

      wss.clients.forEach(client => {
        const clientInfo = clients.get(client);
        if (
          client !== ws &&
          client.readyState === 1 &&
          clientInfo &&
          clientInfo.room === senderInfo.room
        ) {
          client.send(message, { binary: true });
        }
      });
    } else {
      // Handle JSON control messages
      try {
        const msg = JSON.parse(message.toString());

        // Expect msg: { type: 'join', room: 'roomname', userName: 'Alice' }
        if (msg.type === 'join') {
          clients.set(ws, { room: msg.room, userName: msg.userName, isStreaming: false });
          console.log(`${msg.userName} joined room ${msg.room}`);
          return;
        }

        // Expect msg: { type: 'start_streaming' } or { type: 'stop_streaming' }
        const senderInfo = clients.get(ws);
        if (!senderInfo || !senderInfo.room) return;

        if (msg.type === 'start_streaming') {
          senderInfo.isStreaming = true;
          broadcastToRoom(senderInfo.room, JSON.stringify({
            type: 'user_started',
            userName: senderInfo.userName,
          }), ws);
        } else if (msg.type === 'stop_streaming') {
          senderInfo.isStreaming = false;
          broadcastToRoom(senderInfo.room, JSON.stringify({
            type: 'user_stopped',
            userName: senderInfo.userName,
          }), ws);
        }

      } catch (err) {
        console.error("Failed to parse JSON message", err);
      }
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    if (info && info.isStreaming && info.room) {
      broadcastToRoom(info.room, JSON.stringify({
        type: 'user_stopped',
        userName: info.userName,
      }), ws);
    }
    clients.delete(ws);
  });
});

function broadcastToRoom(room, msg, exceptWs=null) {
  wss.clients.forEach(client => {
    const info = clients.get(client);
    if (
      client.readyState === 1 &&
      info &&
      info.room === room &&
      client !== exceptWs
    ) {
      client.send(msg);
    }
  });
}

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
