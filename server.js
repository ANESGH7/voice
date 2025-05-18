// server.js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      ws.send(data, { binary: true }); // Echo binary audio
    }
  });
});

console.log('✅ WebSocket server running on ws://localhost:8080');
