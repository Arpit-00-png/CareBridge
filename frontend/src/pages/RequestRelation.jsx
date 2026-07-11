import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const RequestRelation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVerifiedPatients();
  }, []);

    const fetchVerifiedPatients = async () => {
    try {
        setLoading(true);
        const res = await api.get('/admin/verified-patients');
        setPatients(res.data);
    } catch (error) {
        console.error('Error fetching patients:', error);
        alert('Failed to load patients');
    } finally {
        setLoading(false);
    }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/relations/request', {
        patientId: selectedPatient,
        message: message
      });
      alert('✅ Request sent to admin successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.error || '❌ Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="p-8 text-center">Loading patients...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">📝 Request Patient</h1>
          <div className="flex items-center gap-4">
            <span>{user?.name}</span>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Patient <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Patient --</option>
              {patients.map(pat => (
                <option key={pat.id} value={pat.id}>
                  {pat.name} ({pat.email})
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-sm text-orange-500 mt-1">⚠️ No verified patients found.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note for admin..."
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!selectedPatient || submitting}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestRelation;