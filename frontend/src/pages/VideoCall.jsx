import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Peer } from 'peerjs';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const VideoCall = () => {
  const { roomId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [appointment, setAppointment] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);

  useEffect(() => {
    // Fetch appointment details
    fetchAppointment();
    initializePeer();
  }, []);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/appointment/${roomId}`);
      setAppointment(res.data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
    }
  };

  const initializePeer = () => {
    const newPeer = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/'
    });

    newPeer.on('open', (id) => {
      setPeerId(id);
      console.log('My Peer ID:', id);
    });

    newPeer.on('call', (call) => {
      // Answer incoming call
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          localVideoRef.current.srcObject = stream;
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
            setIsCallActive(true);
          });
          callRef.current = call;
        })
        .catch((err) => {
          console.error('Failed to get local stream:', err);
          alert('Please allow camera and microphone access');
        });
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  };

  const startCall = () => {
    if (!remotePeerId) {
      alert('Please enter the remote Peer ID');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        
        const call = peer.call(remotePeerId, stream);
        call.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          setIsCallActive(true);
        });
        callRef.current = call;
      })
      .catch((err) => {
        console.error('Failed to get local stream:', err);
        alert('Please allow camera and microphone access');
      });
  };

  const endCall = () => {
    if (callRef.current) {
      callRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCallActive(false);
    localVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;
    navigate('/dashboard');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-300"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">📹 Video Call</h1>
          </div>
          <div className="flex items-center gap-4">
            <span>{user?.name}</span>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-[70vh]">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {user?.name} (You)
            </div>
          </div>

          {/* Remote Video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {appointment?.patient?.name || 'Waiting...'}
            </div>
            {!isCallActive && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
                Waiting for connection...
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-4 flex-wrap justify-center">
          {/* Call Controls (only show when not in call) */}
          {!isCallActive && (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="Enter Doctor's Peer ID"
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 w-64"
              />
              <button
                onClick={startCall}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Start Call
              </button>
            </div>
          )}

          {/* Active Call Controls */}
          {isCallActive && (
            <>
              <button
                onClick={toggleMute}
                className={`px-4 py-2 rounded-lg transition ${
                  isMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isMuted ? '🔇 Unmute' : '🎤 Mute'}
              </button>
              <button
                onClick={toggleVideo}
                className={`px-4 py-2 rounded-lg transition ${
                  isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isVideoOff ? '📷 Turn On' : '📷 Turn Off'}
              </button>
              <button
                onClick={endCall}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                End Call
              </button>
            </>
          )}
        </div>

        {/* Peer ID info */}
        <div className="mt-4 text-gray-400 text-sm">
          Your Peer ID: <span className="text-white font-mono">{peerId || 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;