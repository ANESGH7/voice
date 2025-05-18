// server.js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: process.env.PORT || 10000 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected');

  ws.on('message', (data, isBinary) => {
    for (const client of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(data, { binary: isBinary });
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

console.log('✅ Server running on port 10000');
