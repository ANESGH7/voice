const http = require("http");
const WebSocket = require("ws");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).substring(2);
  clients.set(id, ws);
  console.log(`Client connected: ${id}`);

  // Send welcome message with list of other clients
  const otherClients = Array.from(clients.keys()).filter(clientId => clientId !== id);
  ws.send(JSON.stringify({
    type: "welcome",
    clients: otherClients,
    yourId: id
  }));

  // Notify other clients about new connection
  if (otherClients.length > 0) {
    broadcast({
      type: "newClient",
      clientId: id
    }, id);
  }

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      msg.sender = id;

      // Route message to specific recipient if specified
      if (msg.recipient && clients.has(msg.recipient)) {
        clients.get(msg.recipient).send(JSON.stringify(msg));
      } else if (msg.type === "chat") {
        // For chat messages without recipient, send to all other clients
        broadcast(msg, id);
      } else {
        // For signaling messages, try to find a peer
        const peerId = findPeerFor(id);
        if (peerId) {
          clients.get(peerId).send(JSON.stringify(msg));
        }
      }
    } catch (e) {
      console.error("Error processing message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log(`Client disconnected: ${id}`);
    broadcast({
      type: "clientDisconnected",
      clientId: id
    }, id);
  });
});

function broadcast(message, senderId) {
  clients.forEach((client, clientId) => {
    if (clientId !== senderId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function findPeerFor(clientId) {
  // Simple pairing logic - find first available peer
  for (const [id, client] of clients.entries()) {
    if (id !== clientId && client.readyState === WebSocket.OPEN) {
      return id;
    }
  }
  return null;
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log("WebSocket server running on port " + PORT);
});
