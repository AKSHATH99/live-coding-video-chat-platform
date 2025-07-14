import React from 'react'
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import socketIOClient from 'socket.io-client';
import RoomIDModal from '../components/RoomIDModal';
import VideoCallInterface from '../components/VideoCallInterface';
import { useSearchParams } from 'react-router-dom';

const socket = socketIOClient('http://localhost:5000');

function Home() {
    const [searchParams] = useSearchParams();
    const joinRoom = searchParams?.get('roomid');


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
        if (joinRoom) {
            socket.emit("joinRoom", joinRoom);
            setRoomID(joinRoom);
            // return; // <--- join the room on load
        }

        const roomId = localStorage.getItem('roomId');
        const userName = localStorage.getItem('userName');
        if (roomId) {
            setRoomID(roomId);
            socket.emit("joinRoom", roomId , userName);  // <--- join the room on load
        }
        if (userName) {
            setUsername(userName);
        }
        if (!roomId && !userName) {
            setOpenModal(true);
        }

        // socket.on('codeChange', (newCode) => {
        //     setCode(newCode);
        // });

        return () => {
            socket.off('codeChange');
        };
    }, []);

    useEffect(() => {
        socket.on('codeChange', (newCode) => {
            setCode(newCode);
        });

        return () => {
            socket.off('codeChange');
        };
    }, [code]);




    return (
        <div className="h-screen flex flex-row">

            {/* LEFT SIDE - code editor */}
            <div className="flex-1 p-2 bg-gray-100">
                <div className="mb-2 flex items-center justify-between px-2">
                    <div className="text-red-600 font-semibold text-sm">
                        Room: {roomID || "No room"} | User: {username || ""}
                    </div>
                    <button
                        onClick={() => setOpenModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs shadow"
                    >
                        Change Room
                    </button>
                </div>
                <Editor
                    height="calc(100vh - 40px)"  // accounting for top bar
                    language="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={handleChange}
                />
            </div>

            {/* RIGHT SIDE - reserved for video / chat */}
            <VideoCallInterface call={null} onEndCall={() => { }} />

            {/* Modal */}
            {openModal && (
                <RoomIDModal
                    isOpen={openModal}
                    onClose={() => {
                        setOpenModal(false);
                        const roomId = localStorage.getItem("roomId");
                        const userName = localStorage.getItem("userName");
                        setRoomID(roomId || "");
                        setUsername(userName || "");
                        if (roomId) {
                            socket.emit("joinRoom", roomId);
                        }
                        
                    }}
                    userType={joinRoom ? "join" : "create"}
                    joinRoomID={joinRoom}
                />
            )}
        </div>
    );


}
export default Home;
