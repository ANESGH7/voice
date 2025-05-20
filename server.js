const WebSocket = require("ws");
const http = require("http");

// Basic HTTP server to keep Render happy
const server = http.createServer((req, res) => {
  res.end("WebRTC Signaling Server is running");
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", ws => {
  clients.push(ws);

  ws.on("message", msg => {
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
