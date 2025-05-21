const http = require("http");
const WebSocket = require("ws");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).substring(2);
  clients.set(id, ws);

  // Notify this client it connected
  ws.send(JSON.stringify({ type: "system", message: "Connected to server", clientId: id }));

  // Notify all others that someone joined
  for (const [otherId, client] of clients.entries()) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "system", message: "A new peer joined", peerId: id }));
    }
  }

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      console.error("Invalid message:", data);
      return;
    }

    msg.sender = id;

    for (const [otherId, client] of clients.entries()) {
      if (client.readyState === WebSocket.OPEN && otherId !== id) {
        client.send(JSON.stringify(msg));
      }
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "system", message: "A peer disconnected", peerId: id }));
      }
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket signaling server running on port ${PORT}`);
});
