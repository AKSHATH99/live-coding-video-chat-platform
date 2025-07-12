// server.js
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const messagingServer = require("./message-server"); // Import the messaging server

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

// Initialize messaging server
messagingServer(io);

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);
  
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
    
    // Notify others in the room that a new user joined
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // WebRTC Signaling
  socket.on('offer', ({ roomID, offer }) => {
    console.log(`Offer from ${socket.id} in room ${roomID}`);
    socket.to(roomID).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ roomID, answer }) => {
    console.log(`Answer from ${socket.id} in room ${roomID}`);
    socket.to(roomID).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ roomID, candidate }) => {
    console.log(`ICE candidate from ${socket.id} in room ${roomID}`);
    socket.to(roomID).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Handle camera off event
  socket.on('camera-off', ({ roomID }) => {
    console.log(`Camera off from ${socket.id} in room ${roomID}`);
    socket.to(roomID).emit('camera-off', { from: socket.id });
  });

  // Handle camera on event
  socket.on('camera-on', ({ roomID }) => {
    console.log(`Camera on from ${socket.id} in room ${roomID}`);
    socket.to(roomID).emit('camera-on', { from: socket.id });
  });

  // Code changes for collaborative editing
  socket.on("codeChange", ({ roomId, newCode }) => {
    console.log(`Code change in room ${roomId} from ${socket.id}`);
    socket.to(roomId).emit("codeChange", newCode);
  });


    
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(5000, () => console.log("Server running on port 5000"));