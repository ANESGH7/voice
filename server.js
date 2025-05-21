// Save as server.js

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('WebSocket server running on ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    // Broadcast message to all other clients (including sender if you want)
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        // Here message is Buffer (binary) or string (text)
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
