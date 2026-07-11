import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, requestsRes] = await Promise.all([
        api.get('/dashboard/doctor/patients'),
        api.get('/relations/doctor/requests')
      ]);
      setPatients(patientsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">👨‍⚕️ Doctor Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>{user?.name}</span>
            <button 
              onClick={() => navigate('/request-relation')}
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
            >
              + Request Patient
            </button>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto mt-6 p-4">
        {/* Request Status */}
        {requests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-yellow-800">Pending Requests ({requests.filter(r => r.status === 'PENDING').length})</h3>
            {requests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className="flex justify-between items-center mt-2">
                <span>Waiting for admin approval: {req.patient.name}</span>
                <span className="text-sm bg-yellow-200 px-2 py-1 rounded">⏳ Pending</span>
              </div>
            ))}
          </div>
        )}

        {/* Patients List */}
        <h2 className="text-xl font-semibold mb-4">My Patients ({patients.length})</h2>
        {patients.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No patients assigned yet.</p>
            <button 
              onClick={() => navigate('/request-relation')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Request Patient
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {patients.map(rel => (
              <div key={rel.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-medium">{rel.patient.name}</p>
                  <p className="text-sm text-gray-500">{rel.patient.email}</p>
                </div>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => navigate(`/chat/${rel.id}`)}
                >
                  Open Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;