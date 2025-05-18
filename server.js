import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const wss = new WebSocketServer({ port: 8080 });
console.log("Server running on ws://localhost:8080");

let rooms = {}; // { roomId: Set of clients }

wss.on("connection", (ws) => {
  ws.id = uuidv4();
  ws.roomId = null;

  ws.on("message", (msg) => {
    let data;
    try { data = JSON.parse(msg); } 
    catch { return; }

    if (data.type === "join") {
      ws.roomId = data.roomId;
      if (!rooms[ws.roomId]) rooms[ws.roomId] = new Set();
      rooms[ws.roomId].add(ws);

      // Inform new client about others in room
      const others = [...rooms[ws.roomId]]
        .filter(c => c !== ws)
        .map(c => c.id);
      ws.send(JSON.stringify({ type: "users", users: others }));

      // Inform others about new user
      rooms[ws.roomId].forEach(client => {
        if (client !== ws)
          client.send(JSON.stringify({ type: "new-user", id: ws.id }));
      });
    }
    else if (data.type === "signal" && ws.roomId) {
      // Relay signaling data to target peer
      const target = [...rooms[ws.roomId]].find(c => c.id === data.target);
      if (target) {
        target.send(JSON.stringify({
          type: "signal",
          from: ws.id,
          signal: data.signal
        }));
      }
    }
  });

  ws.on("close", () => {
    if (ws.roomId && rooms[ws.roomId]) {
      rooms[ws.roomId].delete(ws);
      rooms[ws.roomId].forEach(client => {
        client.send(JSON.stringify({ type: "user-left", id: ws.id }));
      });
      if (rooms[ws.roomId].size === 0) {
        delete rooms[ws.roomId];
      }
    }
  });
});
