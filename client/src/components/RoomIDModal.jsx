import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';

const SOCKET_SERVER_URL =
  import.meta.env.PROD
    ? window.location.origin
    : "http://localhost:5000";

const socket = socketIOClient(SOCKET_SERVER_URL, {
  withCredentials: true,
});

const RoomIDModal = ({ isOpen, onClose, userType = "join", joinRoomID }) => {
  const [activeTab, setActiveTab] = useState(userType);
  const [roomID, setRoomID] = useState('');
  const [username, setUsername] = useState('');
  const [roomJoined, setRoomJoined] = useState(false);

  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  const handleJoinOrCreateRoom = () => {
    if (!roomID || !username) return;
    console.log(`${activeTab === 'create' ? 'Creating' : 'Joining'} room: ${roomID}`);
    socket.emit('joinRoom', roomID, username);
    localStorage.setItem('roomId', roomID);
    localStorage.setItem('userName', username);
    setRoomJoined(true);
  };

  useEffect(() => {
    if (joinRoomID) {
      setRoomID(joinRoomID);
      setActiveTab('join');
    }
  }, [joinRoomID]);

  useEffect(() => {
    setActiveTab(userType);
  }, [userType]);

  // Reset state when switching tabs
  const handleTabSwitch = (tab) => {
    if (!joinRoomID) { // Only allow switching if not coming from a join link
      setActiveTab(tab);
      setRoomJoined(false);
      if (tab === 'create') {
        setRoomID('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Tab Navigation */}
          {!joinRoomID && (
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTabSwitch('join')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === 'join'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Join Room
              </button>
              <button
                onClick={() => handleTabSwitch('create')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === 'create'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Create Room
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Join Room View */}
            {activeTab === 'join' && !roomJoined && (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Join a Room
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {joinRoomID
                      ? "Enter your name to join this room"
                      : "Enter the room name you want to join"}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name or alias"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Name
                  </label>
                  {joinRoomID && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Room ID has been pre-filled from the link
                    </p>
                  )}
                  <input
                    type="text"
                    placeholder="ex: vibe-coding, bug-hunt"
                    value={roomID}
                    disabled={!!joinRoomID}
                    onChange={(e) => setRoomID(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={handleJoinOrCreateRoom}
                  disabled={!roomID || !username}
                  className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
              </>
            )}

            {/* Create Room View */}
            {activeTab === 'create' && !roomJoined && (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Create a Room
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Set up a new room and invite others to join
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name or alias"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Room Name
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose a unique name for your room (letters and numbers)
                  </p>
                  <input
                    type="text"
                    placeholder="ex: vibe-coding, bug-hunt"
                    value={roomID}
                    onChange={(e) => setRoomID(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors shadow-sm"
                  />
                </div>

                <button
                  onClick={handleJoinOrCreateRoom}
                  disabled={!roomID || !username}
                  className="w-full bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Room
                </button>
              </>
            )}

            {/* Success State - Only for Create */}
            {activeTab === 'create' && roomJoined && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    Room Created!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Share this link with others to invite them
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Room Link</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 break-all font-mono">
                    {baseUrl}/code?roomid={roomID}
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/code?roomid=${roomID}`);
                    const button = document.activeElement;
                    const originalText = button.textContent;
                    button.textContent = '✓ Copied!';
                    button.classList.add('bg-green-600', 'dark:bg-green-700');
                    setTimeout(() => {
                      button.textContent = originalText;
                      button.classList.remove('bg-green-600', 'dark:bg-green-700');
                    }, 2000);
                  }}
                  className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Copy Link to Clipboard
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Success State - For Join */}
            {activeTab === 'join' && roomJoined && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    Joined Successfully!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You're now connected to <span className="font-semibold">{roomID}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Start Collaborating
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomIDModal;