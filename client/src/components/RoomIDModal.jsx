import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';

const socket = socketIOClient('http://localhost:5000');

const RoomIDModal = ({ isOpen, onClose, userType, joinRoomID }) => {
  const [roomID, setRoomID] = useState('');
  const [username, setUsername] = useState('');
  const [createdRoom, setCreatedRoom] = useState(false);

  const handleJoinOrCreateRoom = () => {
    if (!roomID || !username) return;
    console.log(`Joining or creating room: ${roomID}`);
    socket.emit('joinRoom', roomID, username);
    localStorage.setItem('roomId', roomID);
    localStorage.setItem('userName', username);
    setCreatedRoom(true);
    // onClose();

  };
  useEffect(() => {
    if (joinRoomID) {
      setRoomID(joinRoomID);
    }
  }, [joinRoomID]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-8 space-y-6 relative">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <p className='text-gray-600 text-[12px]'>
          </p>
          {/* Username */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-800">Enter Your Name</h1>
            <input
              type="text"
              placeholder="You can create any alias names you like"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Room Name */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-800">Enter Room Name</h1>
            <p className='text-gray-600 text-[12px]'>
              {joinRoomID ? "Your room id has been autofilled" : "Create a roomid for your session. It can include letters and numbers"}
            </p>
            <input
              type="text"
              placeholder="ex: vibe-coding, bug-hunt"
              value={roomID}
              disabled={joinRoomID}
              onChange={(e) => setRoomID(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Join/Create Button */}
          {!createdRoom ? <button
            onClick={handleJoinOrCreateRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            {userType === "join" ? "Join Room" : "Create Room"}
          </button> :
            <div className='text-center text-green-600 font-semibold text-sm'>
              Room {userType === "join" ? "Joined" : "Created"}
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg mb-2">
                <span className="text-sm truncate">
                  http://localhost:5173/?roomid={roomID}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`http://localhost:5173/?roomid=${roomID}`);
                  // Optional: Add feedback that URL was copied
                  const button = document.activeElement;
                  const originalText = button.textContent;
                  button.textContent = 'Copied!';
                  button.classList.add('bg-green-500');
                  setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('bg-green-500');
                  }, 2000);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Copy URL to Clipboard
              </button>
            </div>}
        </div>
      </div>
    </div>
  );
};

export default RoomIDModal;
