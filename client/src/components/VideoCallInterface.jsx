import { useRef, useEffect, useState, use } from "react";
import { io } from "socket.io-client";
import { Mic, Video, VideoOff, MicOff, FileCode2 } from "lucide-react"; // Assuming you have lucide-react installed for icons
const socket = io("http://localhost:5000/");

const VideoCallInterface = () => {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [roomID, setRoomID] = useState("");
  const [peerCameraOff, setPeerCameraOff] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("user123"); // Replace with actual username if you have it
  const [joinedUser, setJoinedUser] = useState(null);

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
    const storedRoom = localStorage.getItem("roomId") || "test-room";
    setRoomID(storedRoom);
    socket.emit("joinRoom", storedRoom);
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
    socket.on("user-joined", ({userId, username}) => {
      console.log("User joined:", userId , username);
      setJoinedUser(username);
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

  return (
    <div className="w-1/3 border-l border-gray-300 p-2 bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-2">


        {/* Local Video */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Your Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 bg-black rounded"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setCameraOn((prev) => !prev)}
              className={`border-2 my-4 rounded p-3 text-sm flex items-center gap-2 `}

            >
              {cameraOn ? <Video color="green" /> : <VideoOff color="red" />}
            </button>
            <button
              onClick={() => setMicrophoneOn((prev) => !prev)}
              className={`border-2 my-4 rounded p-3 text-sm flex items-center gap-2 `}
            >
              {microphoneOn ? <Mic color="green" /> : <MicOff color="red" />}
            </button>

            <button className="border-2 my-4 rounded p-3 text-sm flex items-center gap-2">
              <FileCode2 /> Share File
            </button>
          </div>
        </div>

        {/* Remote Video */}
        <div className="">
          <h3 className="text-sm font-semibold mb-2">
           {joinedUser ? `Peer Video (${joinedUser})` : "Peer Video"} {peerConnected && "(Connected)"}
          </h3>
          {peerCameraOff ? (
            <div className="w-full h-48 bg-gray-800 rounded flex items-center justify-center text-white">
              Your friend turned off their video
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-48 bg-black rounded"
            />
          )}
        </div>
      </div>

      <div className="p-2 border-t flex flex-col gap-2">
        <div className="flex-1 max-h-40 overflow-y-auto bg-gray-100 p-2 rounded text-sm">
          {messages.map((msg, index) => (
            <div key={index} className="mb-1">
              <span className="font-semibold text-gray-700">{msg.username}:</span>{" "}
              <span className="text-gray-900">{msg.message}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-gray-500 text-center">No messages yet</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-1 rounded border"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>


      {/* Controls */}
      <div className="p-2 border-t">
        {/* <button
          onClick={() => setCameraOn((prev) => !prev)}
          className={`w-full mb-2 px-4 py-2 rounded text-white ${cameraOn
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
        </button> */}

        <button
          onClick={startCall}
          disabled={!stream || callStarted}
          className={`w-full px-4 py-2 rounded text-white ${!stream || callStarted
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {callStarted ? "Call Started" : "Start Call"}
        </button>
      </div>
    </div>
  );
};

export default VideoCallInterface;