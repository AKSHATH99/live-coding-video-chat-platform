import React from 'react'
import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import socketIOClient from 'socket.io-client';
import RoomIDModal from '../components/RoomIDModal';
import VideoCallInterface from '../components/VideoCallInterface';
import { useSearchParams } from 'react-router-dom';
import { Upload } from "lucide-react";
import FileSelectModal from '../components/FileSelectModal';
import TerminalOutput from '../components/OutputTerminal';
import DarkModeToggle from '../components/ThemeToggler';
import { getLanguageIdFromFilename } from '../constants/judge0-language';

import {
    ChevronLeft,
    ClipboardCheck,
    ChevronRight,
    Plus,
    Terminal,
    Save,
    Moon,
    Copy,
    Settings,
    Users,
    X,
    File,
    ChevronDown
} from "lucide-react";
import downloadAllFilesAsZip from '../lib/DownloadZip';

const socket = socketIOClient('http://localhost:5000');

function Home() {
    const [searchParams] = useSearchParams();
    const joinRoom = searchParams?.get('roomid');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSaveDropdown, setShowSaveDropdown] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [showNewFileInput, setShowNewFileInput] = useState(false);
    const [openFileSelectModal, setOpenFileSelectModal] = useState(false);
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);

    const [files, setFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(null);

    const [roomID, setRoomID] = useState('');
    const [username, setUsername] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isCodeRunnable, setIsCodeRunnable] = useState(false);


    const activeFileRef = React.useRef(activeFile);
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);


    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result;
            const langID = getLanguageIdFromFilename(file.name);
            const newFile = {
                filename: file.name,
                content,
                langID: langID
            };

            setFiles((prev) => [...prev, newFile]);
            setActiveFile(newFile);
            socket.emit("newFile", { roomId: roomID, file: newFile });
            setShowNewFileInput(false)
        };

        reader.readAsText(file);
    };

    // Create new file on load
    useEffect(() => {
        const langID = getLanguageIdFromFilename("index.js");
        const newFile = { filename: "index.js", content: '// Welcome to your collaborative editor!\n', langID: langID || 'javascript' };
        setFiles([newFile]);
        setActiveFile(newFile);
    }, []);


    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape' && showTerminal) {
                setShowOutput(false);
            }
        };
        if (showOutput) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showOutput]);

    const handleFileSelectFromModal = (file) => {
        downloadFile(file.filename, file.content);
    };

    useEffect(() => {
        activeFileRef.current = activeFile;
    }, [activeFile]);

    const downloadFile = (filename, content) => {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url); // Clean up
    };

    //Shortcut to run code
    const handleEditorDidMount = (editor, monaco) => {
        console.log("=== Monaco Editor Setup ===");
        editorRef.current = editor;


        editor.addAction({
            id: 'run-code-backtick',
            label: 'Run Code (Ctrl+`)',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote],
            run: () => {
                console.log("🚀 Ctrl+` triggered!");
                runCode();
            }
        });

    };
    const clearOutput = () => {
        setOutput('');
    };

    const runCode = async () => {
        try {

            if (!activeFile || !activeFile.langID) {
                setOutput("Error: No active file or unsupported language");
                setShowTerminal(true);
                return;
            }

            const currentContent = editorRef.current?.getValue()
            console.log("from reference:", currentContent);
            console.log("Running code for file:", activeFile?.filename);
            console.log("Code content:", activeFile?.content);
            console.log("Language ID:", activeFile?.langID);
            const response =
                await fetch('http://localhost:5000/run-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language_id: activeFile.langID, source_code: activeFile.content, stdin: "" }),
                });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json(); // ✅ await the JSON parsing
            setShowTerminal(true);
            // setShowOutput(true);
            setLoading(false);
            console.log("Code run successfully:", result);
            setOutput(result.stdout || result.stderr || "No output");

        } catch (err) {
            setOutput("Error running code");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };



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


    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                const isInInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) ||
                    e.target.contentEditable === 'true';

                if (!isInInput) {
                    console.log("Global Ctrl+` triggered!");
                    e.preventDefault();
                    runCode();
                }
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [activeFile]);

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
            const langID = getLanguageIdFromFilename(newFileName);
            const newFile = { filename: newFileName, content: '', langID: langID || 'javascript' };
            const langaugeExtension = newFileName.split('.').pop();
            console.log("Creating new file:", newFileName, "with extension:", langaugeExtension);

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
        <div className="h-screen flex flex-row overflow-hidden bg-gray-50 dark:bg-black">
            {/* LEFT SIDEBAR */}
            <div className={`transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-44' : 'w-12'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm relative`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-6 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-sm"
                >
                    {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* File Panel Content */}
                {sidebarOpen && (
                    <div className="p-4 h-full flex flex-col max-w-full overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <File size={16} />
                                Files
                            </h2>
                            <button
                                onClick={() => setShowNewFileInput(true)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                title="Create new file"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* New File Input */}
                        {showNewFileInput && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Create or Import File</h2>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        style={{ display: "none" }}
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
                                    >
                                        <Upload size={16} />
                                        Import from device
                                    </button>

                                    <input
                                        type="text"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        placeholder="filename.js"
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
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

                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={handleCreateFile}
                                            className="px-4 py-1.5 text-sm rounded-md bg-gray-800 dark:bg-gray-600 text-white hover:bg-gray-700 dark:hover:bg-gray-500"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowNewFileInput(false);
                                                setNewFileName('');
                                            }}
                                            className="px-4 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* File List */}
                        <div className="flex-1 overflow-y-auto overflow-hidden">
                            {files.length > 0 ? (
                                <div className="space-y-1">
                                    {files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors min-w-0 ${activeFile?.filename === file.filename
                                                ? 'bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                            onClick={() => setActiveFile(file)}
                                        >
                                            <span className={`text-sm truncate min-w-0 flex-1 ${activeFile?.filename === file.filename
                                                ? 'text-blue-800 dark:text-blue-300 font-medium'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {file.filename}
                                            </span>
                                            {files.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFile(file);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-600 dark:text-red-400 flex-shrink-0 ml-2"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
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
                <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
                    {/* Left Section - Room Info */}
                    {/* <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={16} />
                            <span className="font-medium text-gray-900">{roomID || "No room"}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{username || "Anonymous"}</span>
                        </div>
                    </div> */}

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Save Dropdown */}

                        <button
                            onClick={() => runCode()}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isCodeRunnable && activeFile?.langID
                                ? 'bg-gray-00 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                            disabled={!isCodeRunnable || !activeFile?.langID}
                        >
                            <Terminal size={16} />
                            <span>Run Code</span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded border dark:border-gray-600">
                                Ctrl + `
                            </span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                            >
                                <Save size={16} />
                                Save
                                <ChevronDown size={14} />
                            </button>

                            {showSaveDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => downloadFile(activeFile.filename, activeFile.content)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Save This File
                                        </button>
                                        {/* <button
                                            onClick={() => downloadAllFilesAsZip(files)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Save Entire Project
                                        </button> */}
                                        <button
                                            onClick={() => setOpenFileSelectModal(true)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Save Entire Project
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { copyCodeToClipboard(); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                        >
                            {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
                            {copied ? "Copied!" : "Copy"}
                        </button>

                        {/* Settings Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
                            >
                                <Settings size={16} />
                                Settings
                                <ChevronDown size={14} />
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setOpenModal(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Change Room
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                // Handle editor settings logic here
                                            }}
                                            className="w-full flex gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <DarkModeToggle />
                                        </button>
                                        <div
                                            onClick={() => {
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Editor Settings
                                        </div>
                                        <button
                                            onClick={() => {
                                                setOpenModal(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
                        <div className="flex items-center gap-2">
                            <File size={14} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{activeFile.filename}</span>
                        </div>
                    </div>
                )}

                {/* Code Editor */}
                <div className={`${showTerminal ? 'flex-1' : 'flex-1'}`}>
                    {activeFile ? (
                        <Editor
                            key={activeFile.filename} // 👈 force remount on file change
                            height="100%"
                            ref={editorRef}
                            language="javascript"
                            theme="vs-dark"
                            value={activeFile.content}
                            onMount={handleEditorDidMount}
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
                                setIsCodeRunnable(
                                    value &&
                                    value.trim() !== '' &&
                                    value.trim() !== '// Welcome to your collaborative editor!'
                                );
                            }}

                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineHeight: 1.5,
                                padding: { top: 20, bottom: 20 }
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                            <div className="text-center">
                                <File size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p>No file selected</p>
                                <p className="text-sm">Create or select a file to start coding</p>
                            </div>
                        </div>
                    )}
                </div>
                <TerminalOutput
                    output={output}
                    loading={loading}
                    isVisible={showTerminal}
                    onClose={() => setShowTerminal(false)}
                    onClear={clearOutput}
                    initialHeight={200}
                />

                {showOutput && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white dark:bg-gray-800 w-full max-w-md p-6 rounded-lg shadow-lg relative">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Output</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded border dark:border-gray-600">
                                        Esc
                                    </span>
                                    <button
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        onClick={() => setShowOutput(false)}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words max-h-64 overflow-auto">
                                {loading ? "Running..." : output || "No output"}
                            </pre>
                        </div>
                    </div>
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
            {openFileSelectModal && (
                <FileSelectModal
                    onClose={() => setOpenFileSelectModal(false)}
                    files={files}
                />
            )}

        </div>
    );
}

export default Home;