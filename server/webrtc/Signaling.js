function Signaling(io) {
    io.on("connection", socket => {
        console.log("New socket connected:", socket.id);

        socket.on("joinRoom", room => {
            console.log(`${socket.id} joined room ${room}`);
            socket.join(room);

            socket.to(room).emit("user-joined", socket.id);

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

        });
    });
}

module.exports = Signaling;

