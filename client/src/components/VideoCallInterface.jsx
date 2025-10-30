import { useRef, useEffect, useState, use } from "react";
import { io } from "socket.io-client";
import { Mic, Video, VideoOff, MicOff, FileCode2, Users, AlarmClock } from "lucide-react"; // Assuming you have lucide-react installed for icons
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

  return (
    <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm">

      {/* Video Section */}
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users size={16} />
            <span className="font-medium text-gray-900 dark:text-gray-100">Room : {roomID || "No room"}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 border border-blue-200 dark:border-gray-500 rounded-lg shadow-sm">
            <AlarmClock size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-100 tracking-wide">
              {timer > 0 ? formatTime(timer) : "00:00"}
            </span>
          </div>
          {/* <div className="w-px h-4 bg-gray-300"></div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{username || "Anonymous"}</span>
                        </div> */}
        </div>
        {/* Local Video */}
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 bg-black rounded-md"
          />
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
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {joinedUser ? `Peer Video (${joinedUser})` : "Peer Video"}{" "}
            {peerConnected && <span className="text-xs text-green-600 dark:text-green-400">(Connected)</span>}
          </h3>
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
        <div>
          {peerConnected && <span className="text-xs text-green-600 dark:text-green-400">(Connected)</span>}
          {peerMicrophoneOff && <span className="text-xs text-red-600 dark:text-red-400 ml-2">(Mic Off)</span>}
        </div>
      </div>

      {/* Chat Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3 max-h-[200px]">
        <div className="overflow-y-auto max-h-32 bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center">No messages yet</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="mb-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{msg.username}:</span>{" "}
                <span className="text-gray-800 dark:text-gray-200">{msg.message}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
          />
          <button
            onClick={sendMessage}
            className="bg-gray-800 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 dark:hover:bg-gray-500"
          >
            Send
          </button>
        </div>
      </div>

      {/* Call Controls */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <button
          onClick={startCall}
          disabled={!stream || callStarted}
          className={`w-full py-2 rounded text-white transition ${!stream || callStarted
            ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
            : "bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500"
            }`}
        >
          {callStarted ? "Call Started" : "Start Call"}
        </button>
      </div>
    </div>

  );
};

export default VideoCallInterface;