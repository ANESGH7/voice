const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
  socket.on('message', (data, isBinary) => {
    if (isBinary) {
      socket.send(data, { binary: true }); // Echo audio back
    }
  });
});

console.log('WebSocket server running on ws://localhost:8080');