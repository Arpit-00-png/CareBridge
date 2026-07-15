import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AddGuardianModal from '../components/AddGuardianModal';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGuardianModal, setShowAddGuardianModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [doctorsRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        api.get('/dashboard/patient/doctors'),
        api.get('/medical/patient/prescriptions'),
        api.get('/medical/patient/appointments')
      ]);
      setDoctors(doctorsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.put(`/medical/appointment/cancel/${appointmentId}`);
      alert('✅ Appointment cancelled successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to cancel appointment');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🧑‍⚕️ Patient Dashboard</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/logs')} className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700">
              📜 Logs
            </button>
            <span>{user?.name}</span>
            <button
              onClick={() => setShowAddGuardianModal(true)}
              className="bg-purple-500 px-4 py-2 rounded hover:bg-purple-600"
            >
              + Add Guardian
            </button>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto mt-6 p-4">
        {/* Doctors Grid */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">My Doctors ({doctors.length})</h2>
          {doctors.length === 0 ? (
            <p className="text-gray-500">No doctors assigned yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(rel => (
                <div key={rel.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{rel.doctor.name}</p>
                    <p className="text-sm text-gray-500">{rel.doctor.email}</p>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => navigate(`/chat/${rel.id}`)}
                  >
                    💬 Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">💊 My Prescriptions</h2>
          {prescriptions.length === 0 ? (
            <p className="text-gray-500">No prescriptions yet.</p>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((p) => (
                <div key={p.id} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        👨‍⚕️ Dr. {p.doctor?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(p.issuedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div className="mt-2 space-y-2">
                    {p.medicines && p.medicines.length > 0 ? (
                      p.medicines.map((med) => (
                        <div key={med.id} className="bg-white p-2 rounded border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{med.medicineName}</span>
                            <span className="text-sm text-gray-600">{med.dosage}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {med.foodRelation?.replace('_', ' ') || 'Anytime'}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {med.duration} days
                            </span>
                            {med.timings && med.timings.length > 0 && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
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

                  {p.instructions && (
                    <p className="text-sm text-gray-500 mt-2 italic">📝 {p.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">📅 Upcoming Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id} className={`flex justify-between items-center p-3 rounded-lg border ${a.status === 'CANCELLED'
                    ? 'bg-gray-100 border-gray-300 opacity-60'
                    : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <div>
                    <p className="font-medium">
                      👨‍⚕️ Dr. {a.doctor?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(a.scheduledTime).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">Status: {a.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {a.status === 'SCHEDULED' && (
                      <>
                        <a
                          href={`/call/${a.roomId}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                        >
                          Join Call
                        </a>
                        <button
                          onClick={() => handleCancelAppointment(a.id)}
                          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {a.status === 'CANCELLED' && (
                      <span className="text-sm text-gray-500">Cancelled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Guardian Modal */}
      {showAddGuardianModal && (
        <AddGuardianModal
          onClose={() => setShowAddGuardianModal(false)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default PatientDashboard;