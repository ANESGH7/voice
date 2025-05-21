const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let clientId = 0;
const clients = new Map();

wss.on('connection', (ws) => {
  const id = (++clientId).toString();
  clients.set(id, ws);

  // Send client their ID
  ws.send(JSON.stringify({ type: 'id-assignment', id }));

  console.log(`Client connected with ID ${id}`);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    // Relay messages only to the intended recipient
    if (data.to && clients.has(data.to)) {
      const target = clients.get(data.to);
      data.from = id;  // attach sender id
      target.send(JSON.stringify(data));
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log(`Client disconnected: ${id}`);
  });
});
