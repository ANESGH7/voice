import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT });
console.log("Server running on port", PORT);

const rooms = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    const { type, room } = data;

    if (type === "join") {
      ws.room = room;
      rooms[room] = rooms[room] || [];
      rooms[room].push(ws);

      // Send 'joined' event and tell if user should initiate call
      ws.send(JSON.stringify({ type: "joined", initiator: rooms[room].length === 2 }));

      // If more than 2 in room, kick extra users
      if (rooms[room].length > 2) {
        ws.send(JSON.stringify({ type: "full" }));
      }
    }

    // Relay messages to the other peer in the room
    if (["offer", "answer", "candidate"].includes(type)) {
      const peers = rooms[room] || [];
      for (let client of peers) {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      }
    }
  });

  ws.on("close", () => {
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((client) => client !== ws);
    }
  });
});
