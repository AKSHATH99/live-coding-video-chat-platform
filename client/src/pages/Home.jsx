import React from 'react'
import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import socketIOClient from 'socket.io-client';
import RoomIDModal from '../components/RoomIDModal';
import VideoCallInterface from '../components/VideoCallInterface';
import { useSearchParams } from 'react-router-dom';
import {
    ChevronLeft,
    ClipboardCheck,
    ChevronRight,
    Plus,
    Save,
    Copy,
    Settings,
    Users,
    X,
    File,
    ChevronDown
} from "lucide-react";

const socket = socketIOClient('http://localhost:5000');

function Home() {
    const [searchParams] = useSearchParams();
    const joinRoom = searchParams?.get('roomid');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSaveDropdown, setShowSaveDropdown] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [showNewFileInput, setShowNewFileInput] = useState(false);

    const [files, setFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(null);

    const [roomID, setRoomID] = useState('');
    const [username, setUsername] = useState('');
    const [openModal, setOpenModal] = useState(false);
    // const [code, setCode] = useState('// Write your code here...');
    const [copied, setCopied] = useState(false);

    const activeFileRef = React.useRef(activeFile);


    // Create new file on load
    useEffect(() => {
        const newFile = { filename: "index.js", content: '// Welcome to your collaborative editor!\n' };
        setFiles([newFile]);
        setActiveFile(newFile);
    }, []);

    useEffect(() => {
        activeFileRef.current = activeFile;
    }, [activeFile]);


    useEffect(() => {
        console.log("Active file changed:", activeFile);
    }, [activeFile]);

    // Listener for code and file changes
    useEffect(() => {
        socket.on("newFile", ({ file }) => {
            setFiles((prev) => {
                const exists = prev.find(f => f.filename === file.filename);
                return exists ? prev : [...prev, file];
            });
        });
        socket.on("codeChange", ({ filename, content }) => {
            console.log(`Code change received for file: ${filename}`);

            setFiles((prevFiles) =>
                prevFiles.map((file) =>
                    file.filename === filename
                        ? { ...file, content }
                        : file
                )
            );

            // Use ref to ensure always-latest activeFile
            if (activeFileRef.current?.filename === filename) {
                setActiveFile((prev) => ({ ...prev, content }));
            }
        });


        return () => {
            socket.off("newFile");
            socket.off("codeChange");
        };
    }, []);

    // const handleChange = (value) => {
    //     setCode(value);
    //     socket.emit('codeChange', {
    //         roomId: roomID,
    //         filename: activeFile.filename,
    //         content: value
    //     });
    // };

    const copyCodeToClipboard = () => {
        const content = activeFile?.content;
        console.log("Copying content:", content);
        if (!content) {
            console.warn("No active file content to copy.");
            return;
        }

        navigator.clipboard.writeText(content)
            .then(() => {
                console.log('Code copied to clipboard');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy code: ', err);
            });
    };


    // useEffect(() => {
    //     console.log("current code:", code);
    // }, [code]);

    useEffect(() => {
        if (joinRoom) {
            socket.emit("joinRoom", joinRoom);
            setRoomID(joinRoom);
        }

        const roomId = localStorage.getItem('roomId');
        const userName = localStorage.getItem('userName');
        if (roomId) {
            setRoomID(roomId);
            socket.emit("joinRoom", roomId, userName);
        }
        if (userName) {
            setUsername(userName);
        }
        if (!roomId && !userName) {
            setOpenModal(true);
        }

        return () => {
            socket.off('codeChange');
        };
    }, []);

    const handleCreateFile = () => {
        if (newFileName.trim()) {
            const newFile = { filename: newFileName, content: '' };
            setFiles((prev) => [...prev, newFile]);
            setActiveFile(newFile);
            setNewFileName('');
            setShowNewFileInput(false);
            socket.emit("newFile", { roomId: roomID, file: newFile });
        }
    };

    const handleDeleteFile = (fileToDelete) => {
        setFiles((prev) => prev.filter(f => f.filename !== fileToDelete.filename));
        if (activeFile?.filename === fileToDelete.filename) {
            setActiveFile(files[0] || null);
        }
    };

    return (
        <div className="h-screen flex flex-row overflow-hidden bg-gray-50">
            {/* LEFT SIDEBAR */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-12'} bg-white border-r border-gray-200 shadow-sm relative`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-6 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-1.5 shadow-sm"
                >
                    {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* File Panel Content */}
                {sidebarOpen && (
                    <div className="p-4 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <File size={16} />
                                Files
                            </h2>
                            <button
                                onClick={() => setShowNewFileInput(true)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
                                title="Create new file"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* New File Input */}
                        {showNewFileInput && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                                <input
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    placeholder="filename.js"
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateFile();
                                        } else if (e.key === 'Escape') {
                                            setShowNewFileInput(false);
                                            setNewFileName('');
                                        }
                                    }}
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleCreateFile}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNewFileInput(false);
                                            setNewFileName('');
                                        }}
                                        className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* File List */}
                        <div className="flex-1 overflow-y-auto">
                            {files.length > 0 ? (
                                <div className="space-y-1">
                                    {files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activeFile?.filename === file.filename
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => setActiveFile(file)}
                                        >
                                            <span className={`text-sm truncate ${activeFile?.filename === file.filename
                                                ? 'text-blue-800 font-medium'
                                                : 'text-gray-700'
                                                }`}>
                                                {file.filename}
                                            </span>
                                            {files.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFile(file);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm text-center py-8">
                                    No files yet. Create your first file!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CENTER - Editor */}
            <div className="flex-1 flex flex-col">
                {/* Top Navigation Bar */}
                <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    {/* Left Section - Room Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={16} />
                            <span className="font-medium text-gray-900">{roomID || "No room"}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{username || "Anonymous"}</span>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Save Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                            >
                                <Save size={16} />
                                Save
                                <ChevronDown size={14} />
                            </button>

                            {showSaveDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowSaveDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Save This File
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowSaveDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Save Entire Project
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { copyCodeToClipboard(); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                        >
                            {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
                            {copied ? "Copied!" : "Copy"}
                        </button>

                        {/* Settings Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                                <Settings size={16} />
                                Settings
                                <ChevronDown size={14} />
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setOpenModal(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Change Room
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Editor Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenModal(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                        >
                                            Leave Room
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active File Tab */}
                {activeFile && (
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
                        <div className="flex items-center gap-2">
                            <File size={14} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{activeFile.filename}</span>
                        </div>
                    </div>
                )}

                {/* Code Editor */}
                <div className="flex-1">
                    {activeFile ? (
                        <Editor
                            key={activeFile.filename} // 👈 force remount on file change
                            height="100%"
                            language="javascript"
                            theme="vs-dark"
                            value={activeFile.content}
                            onChange={(value) => {
                                const updatedFiles = files.map((file) =>
                                    file.filename === activeFile.filename
                                        ? { ...file, content: value }
                                        : file
                                );
                                setFiles(updatedFiles);

                                // Update activeFile reference
                                const updatedActive = updatedFiles.find(f => f.filename === activeFile.filename);
                                setActiveFile(updatedActive);

                                socket.emit("codeChange", {
                                    roomId: roomID,
                                    filename: activeFile.filename,
                                    content: value
                                });
                            }}

                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineHeight: 1.5,
                                padding: { top: 20, bottom: 20 }
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <File size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>No file selected</p>
                                <p className="text-sm">Create or select a file to start coding</p>
                            </div>
                        </div>
                    )}
                </div>
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

            {/* Dropdown Overlay */}
            {(showDropdown || showSaveDropdown) && (
                <div
                    className="fixed inset-0 z-5"
                    onClick={() => {
                        setShowDropdown(false);
                        setShowSaveDropdown(false);
                    }}
                />
            )}
        </div>
    );
}

export default Home;