import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Logs = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relations, setRelations] = useState([]);
  const [selectedRelation, setSelectedRelation] = useState('');

  useEffect(() => {
    fetchRelations();
  }, []);

  const fetchRelations = async () => {
    try {
      const endpoint = user?.role === 'DOCTOR' 
        ? '/dashboard/doctor/patients' 
        : '/dashboard/patient/doctors';
      const res = await api.get(endpoint);
      setRelations(res.data);
    } catch (error) {
      console.error('Error fetching relations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (relationId) => {
    try {
      setLoading(true);
      const res = await api.get(`/logs/${relationId}`);
      setLogs(res.data);
      setSelectedRelation(relationId);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">📜 Activity Logs</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="hover:underline">
              ← Dashboard
            </button>
            <span>{user?.name}</span>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 p-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Select a patient/doctor to view logs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {relations.map((rel) => {
              const name = user?.role === 'DOCTOR' 
                ? rel.patient?.name 
                : rel.doctor?.name;
              return (
                <button
                  key={rel.id}
                  onClick={() => fetchLogs(rel.id)}
                  className={`p-3 rounded-lg border ${
                    selectedRelation === rel.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {selectedRelation && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-3">Timeline</h3>
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium">
                        {log.type === 'PRESCRIPTION' ? '💊 Prescription' : '📅 Appointment'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;