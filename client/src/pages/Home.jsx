import React from 'react'
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import socketIOClient from 'socket.io-client';
import RoomIDModal from '../components/RoomIDModal';
import VideoCallInterface from '../components/VideoCallInterface';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from "lucide-react"; // optional icon lib

const socket = socketIOClient('http://localhost:5000');

function Home() {
    const [searchParams] = useSearchParams();
    const joinRoom = searchParams?.get('roomid');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [files, setFiles] = useState([]); // Array of { filename, content }
    const [activeFile, setActiveFile] = useState(null);

    const [roomID, setRoomID] = useState('');
    const [username, setUsername] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [code, setCode] = useState('// Write your code here...');

    //create new file on load
    useEffect(() => {
        const newFile = { filename: "index", content: '' };
        setFiles((prev) => [...prev, newFile]);
        setActiveFile(newFile);
    },[])

    //Listener for code and file changes
    useEffect(() => {
        socket.on("newFile", ({ file }) => {
            setFiles((prev) => {
                const exists = prev.find(f => f.filename === file.filename);
                return exists ? prev : [...prev, file];
            });
        });

        socket.on("codeChange", ({ filename, content }) => {
            setFiles((prevFiles) =>
                prevFiles.map((file) =>
                    file.filename === filename
                        ? { ...file, content }
                        : file
                )
            );
        });

        return () => {
            socket.off("newFile");
            socket.off("codeChange");
        };
    }, []);

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
            socket.emit("joinRoom", roomId, userName);  // <--- join the room on load
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
        <div className="h-screen flex flex-row overflow-hidden">

            {/* LEFT SIDEBAR */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-6'} bg-gray-200 relative`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-3 z-10 bg-gray-400 hover:bg-gray-500 text-white rounded-full p-1"
                >
                    {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* File Panel Content */}
                {sidebarOpen && (
                    <div className="p-3 space-y-4">
                        <div className="text-gray-700 font-semibold text-sm">Files</div>

                        {/* Input Box */}
                        <div className="flex gap-2 items-center">
                            <span className="text-lg font-bold">+</span>
                            <input
                                type="text"
                                placeholder="Enter filename (e.g. app.js)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const newFile = { filename: e.target.value, content: '' };
                                        setFiles((prev) => [...prev, newFile]);
                                        setActiveFile(newFile);
                                        e.target.value = '';
                                        socket.emit("newFile", { roomId: roomID, file: newFile }); // ✅ emit to peer
                                    }
                                }}
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        {/* 🛠️ Moved this out to render below input */}
                        {files.length > 0 && (
                            <div className="flex flex-col gap-1 mt-3">
                                {files.map((file, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveFile(file)}
                                        className={`text-left px-3 py-1 rounded ${activeFile?.filename === file.filename
                                            ? 'bg-white border font-semibold'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                    >
                                        {file.filename}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* CENTER - Editor */}
            <div className="flex-1 flex flex-col bg-gray-100">
                {/* Top bar */}
                <div className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-300">
                    <div className="flex items-center gap-4">
                        <div className="text-gray-600 text-sm">
                            Room: <span className="font-medium text-gray-900">{roomID || "No room"}</span>
                        </div>
                        <div className="text-gray-400">|</div>
                        <div className="text-gray-600 text-sm">
                            User: <span className="font-medium text-gray-900">{username || ""}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpenModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium shadow-sm"
                    >
                        Change Room
                    </button>
                </div>

                {/* Code Editor */}
                {activeFile && (
                    <Editor
                        height="400px"
                        language="javascript"
                        theme="vs-dark"
                        value={activeFile.content}
                        onChange={(value) => {
                            setFiles((prevFiles) =>
                                prevFiles.map((file) =>
                                    file.filename === activeFile.filename
                                        ? { ...file, content: value }
                                        : file
                                )
                            );
                            // Emit with filename + content
                            socket.emit("codeChange", {
                                roomId: roomID,
                                filename: activeFile.filename,
                                content: value
                            });
                        }}
                    />
                )}
            </div>

            {/* RIGHT - Video Call Section */}
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