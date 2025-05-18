import { WebSocketServer } from 'ws';
import http from 'http';

const port = process.env.PORT || 8080;

// Create a basic HTTP server for Render to recognize the service
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Voice WebSocket server is running.");
});

// Create WebSocket server bound to the same HTTP server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      ws.send(data, { binary: true }); // Echo voice data
    }
  });
});

server.listen(port, () => {
  console.log(`✅ WebSocket server running on port ${port}`);
});
