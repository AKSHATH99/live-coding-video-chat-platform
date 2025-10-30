import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Mic, MicOff, X } from "lucide-react";

const DeviceCheckModal = ({ open, onClose, onJoin }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (open) {
      startDevices();
    } else {
      stopDevices();
    }
  }, [open]);

  const startDevices = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const detectVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolume(avg);
        requestAnimationFrame(detectVolume);
      };
      detectVolume();
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const stopDevices = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const toggleVideo = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      track.enabled = !track.enabled;
      setVideoOn(track.enabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setAudioOn(track.enabled);
    }
  };

  const handleJoin = () => {
    stopDevices();
    onJoin();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 text-white rounded-2xl shadow-2xl p-8 w-[700px] relative flex flex-col gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => {
                stopDevices();
                onClose();
              }}
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-center mb-2">
              Check your Camera & Mic
            </h2>

            <div className="relative bg-black rounded-lg overflow-hidden h-96 flex items-center justify-center">
              {videoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm">Camera Off</div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-3">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition ${
                  videoOn ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition relative ${
                  audioOn ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {audioOn ? <Mic size={20} /> : <MicOff size={20} />}
                {audioOn && (
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-green-400 transition-all"
                    style={{ opacity: volume / 100 }}
                  />
                )}
              </button>
            </div>

            <button
              onClick={handleJoin}
              className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition text-lg"
            >
              Join Now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceCheckModal;