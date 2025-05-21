const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

let clients = new Map();

server.on('connection', (socket) => {
  const id = Math.random().toString(36).substr(2, 9);
  clients.set(id, socket);
  console.log(`Client connected: ${id}`);

  socket.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }

    switch (data.type) {
      case 'join':
        for (let [peerId, peerSocket] of clients) {
          if (peerId !== id) {
            peerSocket.send(JSON.stringify({ type: 'new-peer', id }));
            socket.send(JSON.stringify({ type: 'new-peer', id: peerId }));
          }
        }
        break;
      case 'signal':
        const target = clients.get(data.target);
        if (target) {
          target.send(JSON.stringify({
            type: 'signal',
            from: id,
            data: data.data
          }));
        }
        break;
    }
  });

  socket.on('close', () => {
    clients.delete(id);
    for (let peerSocket of clients.values()) {
      peerSocket.send(JSON.stringify({ type: 'peer-disconnect', id }));
    }
  });
});
