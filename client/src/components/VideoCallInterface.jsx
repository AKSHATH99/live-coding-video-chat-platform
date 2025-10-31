import { useRef, useEffect, useState, use } from "react";
import { io } from "socket.io-client";
import { UsersRound, Mic, Video, VideoOff, MicOff, FileCode2, Users, AlarmClock } from "lucide-react"; // Assuming you have lucide-react installed for icons
import RoomIDModal from "./RoomIDModal";

const SOCKET_SERVER_URL =
  import.meta.env.PROD
    ? window.location.origin // same origin as production
    : "http://localhost:5000/"; // dev backend

const socket = io(SOCKET_SERVER_URL, {
  withCredentials: true,
});


const VideoCallInterface = () => {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [peerMicrophoneOff, setPeerMicrophoneOff] = useState(false);
  const [roomID, setRoomID] = useState("");
  const [peerCameraOff, setPeerCameraOff] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("user123"); // Replace with actual username if you have it
  const [joinedUser, setJoinedUser] = useState(null);
  const [startTimer, setStartTimer] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);
  const [openRoommodal, setOpenRoommodal] = useState(false);
  const messagesEndRef = useRef(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    const username = localStorage.getItem('userName');
    if (username) {
      setUsername(username);
    }
  }, [])

  useEffect(() => {
    console.log("Joined user:", joinedUser);
  }, [joinedUser]);

  // Create a new RTCPeerConnection instance
  const peerConnectionRef = useRef(
    new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
  );

  // For testing, set a default room ID
  useEffect(() => {
    const storedRoom = localStorage.getItem("roomId");
    if (!storedRoom) {
      setOpenRoommodal(true);
      return;
    }
    const username = localStorage.getItem("userName");
    setRoomID(storedRoom);
    socket.emit("joinRoom", storedRoom, username);
    console.log(`Joined room ${storedRoom}`);
  }, []);

  // Handle camera toggle
  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          setStream(mediaStream);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
          }

          // Add tracks to peer connection
          mediaStream.getTracks().forEach((track) => {
            peerConnectionRef.current.addTrack(track, mediaStream);
          });

          // Set mic based on state
          const audioTracks = mediaStream.getAudioTracks();
          audioTracks.forEach((track) => {
            track.enabled = microphoneOn;
          });

        })
        .catch((err) => console.error("getUserMedia failed", err));
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        setStream(null);
      }
    }
  }, [cameraOn]);

  useEffect(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = microphoneOn;
      });
    }
  }, [microphoneOn, stream]);

  // WebRTC and Socket event handlers
  useEffect(() => {
    const peer = peerConnectionRef.current;

    // Handle ICE candidates
    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { roomID, candidate: e.candidate });
      }
    };

    // Handle remote stream
    peer.ontrack = (e) => {
      console.log("Received remote stream");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setPeerConnected(true);
      setPeerCameraOff(false);
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log("Connection state:", peer.connectionState);
      if (peer.connectionState === 'connected') {
        setPeerConnected(true);
      } else if (peer.connectionState === 'disconnected') {
        setPeerConnected(false);
      }
    };

    // Socket event listeners
    socket.on("user-joined", ({ userId, userName }) => {
      console.log("User joined:", userId, userName);
      setJoinedUser(userName);
    });

    socket.on("answer", async ({ answer, from }) => {
      if (from === socket.id) return;
      console.log("Received answer from", from);
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("offer", async ({ offer, from }) => {
      if (from === socket.id) return;
      console.log("Received offer from", from);
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { answer, roomID });
        setCallStarted(true);
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.on("camera-off", ({ from }) => {
      console.log("Peer camera is off");
      setPeerCameraOff(true);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    socket.on("camera-on", ({ from }) => {
      console.log("Peer camera is on");
      setPeerCameraOff(false);
    });
    socket.on("microphone-off", ({ from }) => {
      console.log("Peer microphone is off");
      setPeerMicrophoneOff(true);
    });

    socket.on("microphone-on", ({ from }) => {
      console.log("Peer microphone is on");
      setPeerMicrophoneOff(false);
    });

    socket.on("receiveMessage", ({ username, message, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        { username, message, timestamp: new Date(timestamp) },
      ]);
    });

    socket.on("call-ended", ({ from }) => {
      console.log("Peer ended the call");

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        // Create new peer connection
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
      }

      // Clear remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset peer-related states
      setCallStarted(false);
      setPeerConnected(false);
      setPeerCameraOff(false);
      setPeerMicrophoneOff(false);
      setTimer(0);

      alert("Your peer has ended the call");
    });

    return () => {
      socket.off("user-joined");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("offer");
      socket.off("camera-off");
      socket.off("camera-on");
      socket.off("receiveMessage");
      socket.off("microphone-off");  // ADD THIS
      socket.off("microphone-on");
      socket.off("call-ended")


    };
  }, [roomID]);

  // Notify peer when camera state changes
  useEffect(() => {
    if (roomID) {
      if (!cameraOn) {
        console.log("Camera is off, notifying peer");
        socket.emit('camera-off', { roomID });
      } else {
        console.log("Camera is on, notifying peer");
        socket.emit('camera-on', { roomID });
      }
    }
  }, [cameraOn, roomID]);

  // Notify peer when microphone state changes
  useEffect(() => {
    if (roomID) {
      if (!microphoneOn) {
        console.log("Microphone is off, notifying peer");
        socket.emit('microphone-off', { roomID });
      } else {
        console.log("Microphone is on, notifying peer");
        socket.emit('microphone-on', { roomID });
      }
    }
  }, [microphoneOn, roomID]);

  // Start call function
  const startCall = async () => {
    if (!stream) {
      alert("Please turn on your camera first!");
      return;
    }

    console.log("Starting call...");
    const peer = peerConnectionRef.current;
    try {
      const offer = await peer.createOffer();
      console.log("Created offer:", offer);
      await peer.setLocalDescription(offer);
      socket.emit("offer", { roomID, offer });
      setCallStarted(true);
      console.log("Call started, offer sent");
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };


  const endCall = () => {
    console.log("Ending call...");

    // Stop all media tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      // Create new peer connection for future calls
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
    }

    // Clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Stop timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Notify peer that you're ending the call
    socket.emit('call-ended', { roomID });

    // Reset states
    setCameraOn(false);
    setMicrophoneOn(false);
    setCallStarted(false);
    setPeerConnected(false);
    setPeerCameraOff(false);
    setPeerMicrophoneOff(false);
    setTimer(0);

    console.log("Call ended successfully");
  };

  // Handle sending messages
  const sendMessage = () => {
    console.log("Sending message...");
    if (newMessage.trim()) {
      const messagePayload = {
        roomID,
        username: username, // Replace with actual username if you have it
        message: newMessage,
        timestamp: new Date(),
      };
      socket.emit("sendMessage", messagePayload); // Emit to server
      setMessages((prev) => [...prev, messagePayload]); // Update UI instantly
      setNewMessage("");
    }
  };
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, "0");
    const seconds = (secs % 60).toString().padStart(2, "0");
    return `${mins}:${seconds}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm h-screen">

      {/* Video Section */}
      <div className="p-4 space-y-6">

        <div className="flex items-center gap-4">
          {roomID ? <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users size={16} />
            <span className="font-medium text-gray-900 dark:text-gray-100">Room : {roomID || "No room"}</span>
          </div> : <button onClick={() => setOpenRoommodal(true)}>
            <Users size={16} />
            Join Room
          </button>}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border border-blue-200 dark:border-gray-500 rounded-lg shadow-sm">
            <AlarmClock size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-100 tracking-wide">
              {timer > 0 ? formatTime(timer) : "00:00"}
            </span>
          </div>
        </div>
        {/* Local Video */}
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Video</h3>
          {cameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-48 bg-black rounded-md"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700">
              <VideoOff size={48} className="text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Camera is off</p>
            </div>
          )}
          <div className="flex items-center justify-start gap-3 mt-3">
            <button
              onClick={() => setCameraOn(prev => !prev)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
            >
              {cameraOn ? <Video color="green" size={18} /> : <VideoOff color="red" size={18} />}
            </button>
            <button
              onClick={() => setMicrophoneOn(prev => !prev)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
            >
              {microphoneOn ? <Mic color="green" size={18} /> : <MicOff color="red" size={18} />}
            </button>
          </div>
        </div>

        {/* Peer Video */}
        {peerConnected ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                {joinedUser ? `Peer Video (${joinedUser})` : "Peer Video"}
              </h3>
              <div className="flex items-center gap-2">
                {peerConnected && <span className="text-xs text-green-600 dark:text-green-400">(Connected)</span>}
                {peerConnected && (
                  peerMicrophoneOff ?
                    <MicOff size={16} className="text-red-600 dark:text-red-400" /> :
                    <Mic size={16} className="text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            {peerCameraOff ? (
              <div className="w-full h-48 bg-gray-800 dark:bg-gray-900 text-white flex items-center justify-center rounded-md">
                Your friend turned off their video
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-48 bg-black rounded-md"
              />
            )}
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Peer Video
            </h3>
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700">
              <VideoOff size={48} className="text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for peer to connect</p>
            </div>
          </div>
        )}
      </div>



      {/* Call Controls */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        {!callStarted ? (
          <button
            onClick={startCall}
            disabled={!stream || roomID == null}
            className={`w-full py-2 rounded text-white transition ${!stream || roomID == null
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600"
              }`}
          >
            Start Call
          </button>
        ) : (
          <button
            onClick={endCall}
            className="w-full py-2 rounded text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 transition"
          >
            End Call
          </button>
        )}
      </div>

      {openRoommodal && <RoomIDModal isOpen={openRoommodal} onClose={() => setOpenRoommodal(false)} />}
    </div>

  );
};

export default VideoCallInterface;