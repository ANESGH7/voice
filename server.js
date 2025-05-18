import WebSocket, { WebSocketServer } from 'ws';

const port = process.env.PORT || 10000;
const wss = new WebSocketServer({ port });

console.log(`Server running on port ${port}`);

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    // Broadcast incoming data to all other clients except sender
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
