// messagingServer.js
module.exports = function messagingServer(io) {
  io.on('connection', (socket) => {

    // Join a specific room
    socket.on('joinRoom', (roomId, username) => {
      socket.join(roomId);
      console.log(`👤 ${username || socket.id} joined room ${roomId}`);
      // Optional: Notify others in the room
      socket.to(roomId).emit('userJoined', { username: username || socket.id });
    });

    // Handle message sent to room
    socket.on('sendMessage', ({ roomID, message, username, timestamp }) => {
      console.log("got mesage in server")
      console.log(`Message received: ${message} in room ${roomID} by ${username}`);
      if (!roomID || !message || !username) {
        console.warn('⚠️  Missing roomID, message, or username');
        return;
      }

      console.log(`💬 ${username} in ${roomID}: ${message}`);
      
      const payload = {
        message,
        username,
        timestamp: timestamp || new Date(),
      };

      // Send to everyone EXCEPT sender
      socket.to(roomID).emit('receiveMessage', payload);
    });

    // Leave a room (optional handler)
    socket.on('leaveRoom', (roomId, username) => {
      socket.leave(roomId);
      console.log(`👋 ${username || socket.id} left room ${roomId}`);
      socket.to(roomId).emit('userLeft', { username: username || socket.id });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });
};