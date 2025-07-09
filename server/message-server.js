function messagingServer(io) {
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('sendMessage', (message) => {
      console.log('Message received:', message);
      io.emit('receiveMessage', message);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
}