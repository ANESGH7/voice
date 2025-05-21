const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);

  ws.on('message', msg => {
    // Forward message to all other clients
    for (let client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  });

  ws.on('close', () => clients.delete(ws));
});
