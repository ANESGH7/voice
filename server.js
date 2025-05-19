const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const rooms = new Map(); // Map of roomName -> Set of sockets

server.on('connection', (socket) => {
  socket.id = generateId();
  socket.room = null;

  socket.on('message', (message) => {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON', e);
      return;
    }

    const room = socket.room;

    switch (msg.type) {
      case 'join':
        if (socket.room && rooms.has(socket.room)) {
          rooms.get(socket.room).delete(socket);
        }

        socket.room = msg.room;
        if (!rooms.has(msg.room)) {
          rooms.set(msg.room, new Set());
        }
        rooms.get(msg.room).add(socket);
        console.log(`${socket.id} joined room ${msg.room}`);
        break;

      case 'text':
        if (!room) return;
        const textMsg = {
          type: 'text',
          room,
          sender: socket.id,
          text: msg.text,
        };
        broadcastToRoom(room, textMsg, socket);
        break;

      case 'voice':
        if (!room) return;
        const voiceMsg = {
          type: 'voice',
          room,
          sender: socket.id,
          audio: msg.audio, // Uint8Array or base64
        };
        broadcastToRoom(room, voiceMsg, socket);
        break;

      case 'voice-message':
        if (!room) return;
        const out = {
          type: 'voice-message',
          room,
          sender: socket.id,
          data: msg.data, // Array of byte values
        };
        broadcastToRoom(room, out, socket);
        break;

      // Add other message types as needed
    }
  });

  socket.on('close', () => {
    if (socket.room && rooms.has(socket.room)) {
      rooms.get(socket.room).delete(socket);
    }
  });
});

function broadcastToRoom(room, msgObj, exceptSocket = null) {
  const roomClients = rooms.get(room);
  if (!roomClients) return;

  const data = JSON.stringify(msgObj);
  for (const client of roomClients) {
    if (client.readyState === WebSocket.OPEN && client !== exceptSocket) {
      client.send(data);
    }
  }
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

console.log('WebSocket server running on ws://localhost:8080');
