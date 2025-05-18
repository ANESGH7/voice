import { WebSocketServer } from 'ws';

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });

console.log('Server running on port', port);

const clients = new Map(); // clientId => ws

function broadcastExcept(senderId, data) {
  for (const [id, ws] of clients.entries()) {
    if (id !== senderId && ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  const id = crypto.randomUUID();
  clients.set(id, ws);
  ws.send(JSON.stringify({ type: 'id', id }));

  console.log(`Client connected: ${id}`);

  ws.on('message', (message) => {
    // Forward signaling messages to the other peer (if any)
    broadcastExcept(id, message);
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log(`Client disconnected: ${id}`);
  });
});
