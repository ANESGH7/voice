const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let clientCount = 0;
const clients = new Map();

wss.on("connection", ws => {
  const clientId = ++clientCount;
  clients.set(clientId, ws);
  ws.send(JSON.stringify({ type: "system", message: "Welcome!", clientId }));

  ws.on("message", message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    [...clients.entries()].forEach(([id, client]) => {
      if (client.readyState === WebSocket.OPEN && id !== clientId) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => clients.delete(clientId));
});

console.log("WebSocket signaling server running on port 8080");
