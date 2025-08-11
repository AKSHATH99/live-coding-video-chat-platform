import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import socketIOClient from 'socket.io-client';
import RoomIDModal from './components/RoomIDModal';
import VideoCallInterface from './components/VideoCallInterface';
const SOCKET_SERVER_URL =
  import.meta.env.PROD
    ? window.location.origin // same origin as production
    : "http://localhost:5000"; // dev backend

const socket = socketIOClient(SOCKET_SERVER_URL, {
  withCredentials: true,
});

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';


function App() {
  const [roomID, setRoomID] = useState('');
  const [username, setUsername] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [code, setCode] = useState('// Write your code here...');

  const handleChange = (value) => {
    setCode(value);
    console.log('Code changed:', value);
    socket.emit('codeChange', { roomId: roomID, newCode: value });
  };

  useEffect(() => {
    const roomId = localStorage.getItem('roomId');
    const userName = localStorage.getItem('userName');
    if (roomId) {
      setRoomID(roomId);
      socket.emit("joinRoom", roomId);  // <--- join the room on load
    }
    if (userName) {
      setUsername(userName);
    }
    if (!roomId) {
      setOpenModal(true);
    }

    socket.on('codeChange', (newCode) => {
      setCode(newCode);
    });

    return () => {
      socket.off('codeChange');
    };
  }, []);




  return (
    // <div className="h-screen flex flex-row">

    //   {/* LEFT SIDE - code editor */}
    //   <div className="flex-1 p-2 bg-gray-100">
    //     <div className="mb-2 flex items-center justify-between px-2">
    //       <div className="text-red-600 font-semibold text-sm">
    //         Room: {roomID || "No room"} | User: {username || "Anonymous"}
    //       </div>
    //       <button
    //         onClick={() => setOpenModal(true)}
    //         className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs shadow"
    //       >
    //         Change Room
    //       </button>
    //     </div>
    //     <Editor
    //       height="calc(100vh - 40px)"  // accounting for top bar
    //       language="javascript"
    //       theme="vs-dark"
    //       value={code}
    //       onChange={handleChange}
    //     />
    //   </div>

    //   {/* RIGHT SIDE - reserved for video / chat */}
    //   <VideoCallInterface call={null} onEndCall={() => {}} />

    //   {/* Modal */}
    //   {openModal && (
    //     <RoomIDModal
    //       isOpen={openModal}
    //       onClose={() => {
    //         setOpenModal(false);
    //         const roomId = localStorage.getItem("roomId");
    //         const userName = localStorage.getItem("userName");
    //         setRoomID(roomId || "");
    //         setUsername(userName || "");
    //         if (roomId) {
    //           socket.emit("joinRoom", roomId);
    //         }
    //       }}
    //     />
    //   )}
    // </div>

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );

}

export default App
