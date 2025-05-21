// server.js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    // Broadcast to everyone except sender
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(msg);
      }
    });
  });
  ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket relay server running on ws://localhost:8080');
