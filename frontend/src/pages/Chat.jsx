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
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const messagesEndRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchAppointments();
    fetchPrescriptions();
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

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/medical/appointment/${relationId}`);
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get(`/medical/prescription/relation/${relationId}`);
      setPrescriptions(res.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleCancelPrescription = async (prescriptionId) => {
    if (!confirm('Are you sure you want to cancel this prescription? This will stop all reminders.')) return;
    try {
      await api.put(`/medical/prescription/cancel/${prescriptionId}`);
      alert('✅ Prescription cancelled successfully');
      fetchPrescriptions();
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to cancel prescription');
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
  }, [messages, prescriptions]);

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
    fetchPrescriptions();
  };

  const handleAppointmentSuccess = (msg) => {
    alert(msg);
    fetchAppointments();
    fetchMessages();
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.put(`/medical/appointment/cancel/${appointmentId}`);
      alert('✅ Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to cancel appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to permanently delete this appointment?')) return;
    try {
      await api.delete(`/medical/appointment/${appointmentId}`);
      alert('✅ Appointment deleted successfully');
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to delete appointment');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading chat...</div>;

  // Combine messages and prescriptions, sort by time
  const chatItems = [...messages, ...prescriptions.map(p => ({ ...p, isPrescription: true }))]
    .sort((a, b) => new Date(a.timestamp || a.createdAt || a.issuedAt) - new Date(b.timestamp || b.createdAt || b.issuedAt));

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

      {/* Chat Box */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow p-4 h-[500px] overflow-y-auto">
          {chatItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">No messages yet. Say hello!</div>
          ) : (
            chatItems.map((item) => {
              // Prescription Card
              if (item.isPrescription) {
                return (
                  <div key={`pres-${item.id}`} className="mb-3 flex justify-center">
                    <div className={`max-w-[85%] rounded-lg p-3 ${
                      item.status === 'CANCELLED'
                        ? 'bg-gray-200 border-2 border-gray-400 opacity-60'
                        : 'bg-green-100 border-2 border-green-500'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-gray-700">
                            💊 Prescription by Dr. {item.doctor?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.issuedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {item.status === 'CANCELLED' ? (
                          <span className="text-xs text-gray-500 bg-gray-300 px-2 py-1 rounded">Cancelled</span>
                        ) : (
                          user?.role === 'DOCTOR' && (
                            <button
                              onClick={() => handleCancelPrescription(item.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
                            >
                              Cancel
                            </button>
                          )
                        )}
                      </div>

                      {/* Medicines List */}
                      <div className="mt-2 space-y-1">
                        {item.medicines && item.medicines.length > 0 ? (
                          item.medicines.map((med) => (
                            <div key={med.id} className="bg-white p-2 rounded border border-gray-200 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{med.medicineName}</span>
                                <span className="text-gray-600">{med.dosage}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {med.foodRelation?.replace('_', ' ') || 'Anytime'}
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                  {med.duration} days
                                </span>
                                {med.timings && med.timings.length > 0 && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                    ⏰ {med.timings.map(t => t.time).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No medicines listed</p>
                        )}
                      </div>

                      {item.instructions && (
                        <p className="text-sm text-gray-500 mt-1 italic">📝 {item.instructions}</p>
                      )}
                    </div>
                  </div>
                );
              }

              // Normal Message
              return (
                <div
                  key={item.id}
                  className={`mb-3 flex ${item.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      item.senderId === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{item.content}</p>
                    <span className="text-xs opacity-70">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Appointments Section (outside chatbox) */}
        {appointments.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-2 flex items-center justify-between">
              <span>📅 Appointments</span>
              <span className="text-sm text-gray-500">
                {appointments.filter(a => a.status === 'SCHEDULED').length} scheduled
              </span>
            </h3>
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`p-3 rounded-lg border flex justify-between items-center ${
                    appt.status === 'CANCELLED'
                      ? 'bg-gray-100 border-gray-300 opacity-60'
                      : appt.status === 'COMPLETED'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
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
                  <div className="flex gap-2 flex-wrap">
                    {appt.status === 'SCHEDULED' && (
                      <>
                        <a
                          href={`/call/${appt.roomId}`}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
                        >
                          Join Call
                        </a>
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="bg-orange-500 text-white px-3 py-1.5 rounded hover:bg-orange-600 text-sm"
                        >
                          Cancel
                        </button>
                        {user?.role === 'DOCTOR' && (
                          <button
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                    {appt.status === 'CANCELLED' && (
                      <span className="text-sm text-gray-500">Cancelled</span>
                    )}
                  </div>
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