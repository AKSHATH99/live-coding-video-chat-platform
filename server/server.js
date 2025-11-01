// server.js
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const messagingServer = require("./message-server"); // Import the messaging server
const axios = require('axios');
const cors = require("cors");
const path = require('path');


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://live-coding-video-chat-platform.onrender.com", // ✅ Must match frontend
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use(express.static(path.join(__dirname, '../client/dist')));
// app.use(cors());
//  // Your Vite dev server
app.use(cors({
  origin: 'https://live-coding-video-chat-platform.onrender.com',
  // credentials: true // If you need to send cookies/auth headers
}));
// Initialize messaging server
messagingServer(io);

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on("joinRoom", (roomId, userName) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
    console.log("---------------------------", userName)
    // Notify others in the room that a new user joined
    socket.to(roomId).emit("user-joined", { userId: socket.id, userName: userName });
  });

  // WebRTC Signaling
  socket.on('offer', ({ roomID, offer }) => {
    console.log(`Offer from ${socket.id} in room ${roomID}`);
    socket.to(roomID).emit('offer', { offer, from: socket.id });
  });

  socket.on('runCode', ({ roomId, filename, content }) => {
    console.log(`Run code request in room ${roomId} for file ${filename}`);
    socket.to(roomId).emit('runCode', { filename, content });
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
  socket.on('microphone-off', ({ roomID }) => {
    socket.to(roomID).emit('microphone-off', { from: socket.id });
  });

  socket.on('microphone-on', ({ roomID }) => {
    socket.to(roomID).emit('microphone-on', { from: socket.id });
  });

  // Code changes for collaborative editing
  socket.on("codeChange", ({ roomId, filename, content }) => {
    console.log(`Code change in room ${roomId} | File: ${filename} | content : ${content}`);
    socket.to(roomId).emit("codeChange", { filename, content });
  });
  socket.on('codeDiff', ({ roomId, filename, patch, senderId }) => {
    console.log(`codeDiff received from ${socket.id} for ${filename}`);
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(roomId).emit('codeDiff', { filename, patch });
  });

  socket.on('codeFullSync', ({ roomId, filename, content, senderId }) => {
    console.log(`codeFullSync received from ${socket.id} for ${filename}`);
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(roomId).emit('codeFullSync', { filename, content });
  });
  socket.on("newFile", ({ roomId, file }) => {
    console.log(`New file in room ${roomId}: ${file.filename}`);
    socket.to(roomId).emit("newFile", { file });
  });

  socket.on('call-ended', ({ roomID }) => {
    socket.to(roomID).emit('call-ended', { from: socket.id });
  });




  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Code run logic 
// controllers/runCodeController.js

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';

const runCode = async (req, res) => {
  console.log("Received request to run code:");
  const { language_id, source_code, stdin = '' } = req.body;
  console.log("Running code with language_id:", language_id, "stdin11s:", stdin, source_code);


  if (!language_id || !source_code) {
    return res.status(400).json({ error: 'language_id and source_code are required' });
  }

  try {
    const response = await axios.post(
      JUDGE0_URL,
      {
        language_id,
        source_code,
        stdin,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': '0ba65e19b3mshfaf709a2d627ceep1acc0cjsn2b652c3bac6c',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      }
    );
    console.log("Judge0 response:", response
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Judge0 Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to run code', details: error?.response?.data });
  }
};

// module.exports = runCode;
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Welcome to the Socket.IO server!");
});

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});


app.post("/run-code", runCode);

// Handle SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});






httpServer.listen(5000, () => console.log("Server running on port 5000"));