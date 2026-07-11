import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PrescriptionModal from '../components/PrescriptionModal';
import AppointmentModal from '../components/AppointmentModal';
import api from '../api/axios';

const Chat = () => {
  const { relationId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);  // ✅ Added
  const messagesEndRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchAppointments();  // ✅ Added
  }, [relationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/messages/${relationId}`);
      setMessages(res.data);

      const groupRes = await api.get(`/chat/group/${relationId}`);
      setGroupInfo(groupRes.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ New function to fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/medical/appointment/${relationId}`);
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    if (socket && groupInfo) {
      socket.emit('join-room', { groupId: groupInfo.id, userId: user.id });

      socket.on('receive-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('receive-message');
      };
    }
  }, [socket, groupInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !groupInfo) return;

    socket.emit('send-message', {
      groupId: groupInfo.id,
      senderId: user.id,
      content: newMessage,
      type: 'text'
    });

    setNewMessage('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePrescriptionSuccess = (msg) => {
    alert(msg);
    fetchMessages();
  };

  const handleAppointmentSuccess = (msg) => {
    alert(msg);
    fetchAppointments();  // ✅ Refresh appointments
    fetchMessages();
  };

  if (loading) return <div className="p-8 text-center">Loading chat...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-200"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">💬 {groupInfo?.relation?.patient?.name || 'Chat'}</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {user?.role === 'DOCTOR' && (
              <>
                <button
                  onClick={() => setShowPrescriptionModal(true)}
                  className="bg-green-600 px-3 py-1.5 rounded hover:bg-green-700 text-sm transition"
                >
                  💊 Prescribe
                </button>
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="bg-purple-600 px-3 py-1.5 rounded hover:bg-purple-700 text-sm transition"
                >
                  📅 Schedule
                </button>
              </>
            )}
            <span className="hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-1.5 rounded hover:bg-red-700 text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow p-4 h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">No messages yet. Say hello!</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.senderId === user.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ✅ Appointments Section */}
        {appointments.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-2">📅 Upcoming Appointments</h3>
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {new Date(appt.scheduledTime).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">Status: {appt.status}</p>
                  </div>
                  <a
                    href={`/call/${appt.roomId}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm transition"
                  >
                    Join Call
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="max-w-4xl w-full mx-auto p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
        </form>
      </div>

      {/* Modals */}
      {showPrescriptionModal && (
        <PrescriptionModal
          relationId={relationId}
          onClose={() => setShowPrescriptionModal(false)}
          onSuccess={handlePrescriptionSuccess}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          relationId={relationId}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={handleAppointmentSuccess}
        />
      )}
    </div>
  );
};

export default Chat;