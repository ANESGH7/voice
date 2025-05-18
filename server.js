// server.js
const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;

const wss = new WebSocket.Server({ port: PORT });
console.log("Server running on port", PORT);

let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  console.log("Client connected. Total:", clients.length);

  ws.on("message", (msg) => {
    // Send to all others
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
    console.log("Client disconnected. Total:", clients.length);
  });
});
