// server.js
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ Server running on port ${PORT}`);

wss.on('connection', (socket) => {
  console.log('🔌 New client connected');

  socket.on('message', (data) => {
    // Broadcast to all other clients except the sender
    for (const client of wss.clients) {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  socket.on('close', () => {
    console.log('❌ Client disconnected');
  });
});
