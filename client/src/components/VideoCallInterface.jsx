import { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://192.168.49.1");

const VideoCallInterface = () => {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [roomID, setRoomID] = useState("");
  const [peerCameraOff, setPeerCameraOff] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const peerConnectionRef = useRef(
    new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
  );

  useEffect(() => {
    // For testing, set a default room ID
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
    socket.on("user-joined", (userId) => {
      console.log("User joined:", userId);
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

    return () => {
      socket.off("user-joined");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("offer");
      socket.off("camera-off");
      socket.off("camera-on");
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
        </div>

        {/* Remote Video */}
        <div className="">
          <h3 className="text-sm font-semibold mb-2">
            Remote Video {peerConnected && "(Connected)"}
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

<div className="p-2 border-t">
  <p>chat messages will appear here</p>

  
</div>

      {/* Controls */}
      <div className="p-2 border-t">
        <button
          onClick={() => setCameraOn((prev) => !prev)}
          className={`w-full mb-2 px-4 py-2 rounded text-white ${
            cameraOn 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
        </button>
        
        <button
          onClick={startCall}
          disabled={!stream || callStarted}
          className={`w-full px-4 py-2 rounded text-white ${
            !stream || callStarted
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