import React, { useState } from 'react';
import socketIOClient from 'socket.io-client';

const socket = socketIOClient('http://localhost:5000');

const RoomIDModal = ({ isOpen, onClose }) => {
  const [roomID, setRoomID] = useState('');
  const [username, setUsername] = useState('');

  const handleJoinOrCreateRoom = () => {
    if (!roomID || !username) return;
    console.log(`Joining or creating room: ${roomID}`);
    socket.emit('joinRoom', roomID);
    localStorage.setItem('roomId', roomID);
    localStorage.setItem('userName', username);
    onClose();
  };

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
                If you are creating a new room, you can choose any name you like.
                If you are joining an existing room, please enter the room name provided by the host.
            </p>
            <input
              type="text"
              placeholder="ex: vibe-coding, bug-hunt"
              value={roomID}
              onChange={(e) => setRoomID(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Join/Create Button */}
          <button 
            onClick={handleJoinOrCreateRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Join / Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomIDModal;
