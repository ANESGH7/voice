const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

const clients = new Set();

server.on("connection", (ws) => {
  clients.add(ws);

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "voice" && data.blob && data.from) {
        // Broadcast to all other clients
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "voice",
              from: data.from,
              blob: data.blob
            }));
          }
        }
      }
    } catch (e) {
      console.error("Invalid message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});

console.log("Voice server running on ws://localhost:8080");
