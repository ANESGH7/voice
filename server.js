const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const clients = new Set();

function broadcastExceptSender(sender, message) {
  for (let client of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', ws => {
  clients.add(ws);

  // Notify others
  broadcastExceptSender(ws, JSON.stringify({ type: 'peer-joined' }));

  ws.on('message', message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("Invalid JSON:", message);
      return;
    }

    // Broadcast WebRTC signaling or chat messages
    broadcastExceptSender(ws, JSON.stringify(data));
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastExceptSender(ws, JSON.stringify({ type: 'peer-left' }));
  });
});
