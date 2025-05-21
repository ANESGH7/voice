const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
let peers = [];

wss.on('connection', (ws) => {
  peers.push(ws);
  console.log('Client connected, total peers:', peers.length);

  ws.on('message', (message) => {
    // Broadcast to all other peers
    peers.forEach(p => {
      if (p !== ws && p.readyState === WebSocket.OPEN) {
        p.send(message);
      }
    });
  });

  ws.on('close', () => {
    peers = peers.filter(p => p !== ws);
    console.log('Client disconnected, total peers:', peers.length);
  });
});

console.log('Signaling server running on ws://localhost:8080');
