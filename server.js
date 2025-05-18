// server.js
const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  console.log("Client connected");

  ws.on("message", (data) => {
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.log("WebSocket error:", err.message);
  });
});

console.log("Server running on port", PORT);
