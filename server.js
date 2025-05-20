const http = require("http");
const WebSocket = require("ws");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).substring(2);
  clients.set(id, ws);

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
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log("WebSocket server running on port " + PORT);
});
