import http from 'http';
import { WebSocketServer } from 'ws';

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Voice WebSocket Server is Running.");
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message, isBinary) => {
    if (isBinary) {
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(message, { binary: true });
        }
      });
    } else {
      // Notify other clients of stream status
      const text = message.toString();
      if (text === 'start_streaming') {
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send('start_streaming');
          }
        });
      }
    }
  });
});

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
