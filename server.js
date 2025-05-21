// signaling-server.js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', ws => {
  ws.on('message', message => {
    // Broadcast signaling messages to other clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  });
});

console.log('Signaling server running on ws://localhost:8080');
