import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unverifiedDoctors, setUnverifiedDoctors] = useState([]);
  const [unverifiedPatients, setUnverifiedPatients] = useState([]);
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);
  const [verifiedPatients, setVerifiedPatients] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verify');
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Parallel requests
      const [unverifiedDocs, unverifiedPats, verifiedUsers, relationsRes, requestsRes] = await Promise.all([
        api.get('/admin/users?role=DOCTOR'),
        api.get('/admin/users?role=PATIENT'),
        api.get('/admin/all-users'),
        api.get('/admin/relations'),
        api.get('/relations/pending')
      ]);

      setUnverifiedDoctors(unverifiedDocs.data);
      setUnverifiedPatients(unverifiedPats.data);
      setPendingRequests(requestsRes.data);

      // Filter verified users by role
      const allVerified = verifiedUsers.data;
      setVerifiedDoctors(allVerified.filter(u => u.role === 'DOCTOR'));
      setVerifiedPatients(allVerified.filter(u => u.role === 'PATIENT'));

      setRelations(relationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data. Check console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Verify user
  const handleVerify = async (userId) => {
    try {
      await api.put(`/admin/verify/${userId}`);
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user.');
    }
  };

  // Create relation
  const handleCreateRelation = async (doctorId, patientId) => {
    try {
      await api.post('/admin/relation', { doctorId, patientId });
      alert('✅ Relation created successfully!');
      fetchData(); // Refresh
    } catch (error) {
      alert(error.response?.data?.error || '❌ Error creating relation');
    }
  };

  // Revoke relation
  const handleRevokeRelation = async (relationId) => {
    if (!confirm('Are you sure you want to revoke this relation?')) return;
    try {
      await api.put(`/admin/relation/revoke/${relationId}`);
      fetchData(); // Refresh
    } catch (error) {
      alert(error.response?.data?.error || '❌ Error revoking relation');
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const handleRequest = async (requestId, action) => {
  try {
    await api.put(`/relations/handle/${requestId}`, { action });
    alert(`✅ Request ${action.toLowerCase()} successfully`);
    fetchData(); // Refresh
  } catch (error) {
    alert(error.response?.data?.error || '❌ Failed to process request');
  }
};

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">CareBridge Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">{user?.name}</span>
            <span className="bg-blue-700 px-3 py-1 rounded-full text-sm">{user?.role}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}


      <div className="max-w-6xl mx-auto mt-6">
        <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-hidden">
          <button
            className={`flex-1 px-4 py-3 font-medium transition ${activeTab === 'verify'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('verify')}
          >
            📋 Verify Users
          </button>
          <button
            className={`flex-1 px-4 py-3 font-medium transition ${activeTab === 'relation'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('relation')}
          >
            🔗 Create Relation
          </button>
          <button
            className={`flex-1 px-4 py-3 font-medium transition ${activeTab === 'relations'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('relations')}
          >
            📊 Manage Relations
          </button>
          <button
            className={`flex-1 px-4 py-3 font-medium transition ${activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('requests')}
          >
            📩 Pending Requests
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-b-lg shadow">
          {activeTab === 'verify' && (
            <VerifyUsers
              doctors={unverifiedDoctors}
              patients={unverifiedPatients}
              onVerify={handleVerify}
            />
          )}
          {activeTab === 'relation' && (
            <CreateRelation
              doctors={verifiedDoctors}
              patients={verifiedPatients}
              onCreate={handleCreateRelation}
            />
          )}
          {activeTab === 'relations' && (
            <ManageRelations
              relations={relations}
              onRevoke={handleRevokeRelation}
            />
          )}
          {activeTab === 'requests' && (
            <PendingRequests
              requests={pendingRequests}
              onHandle={handleRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============ SUB-COMPONENTS ============

const VerifyUsers = ({ doctors, patients, onVerify }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        👨‍⚕️ Unverified Doctors
        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-sm">{doctors.length}</span>
      </h3>
      {doctors.length === 0 ? (
        <p className="text-gray-500 text-sm">✅ All doctors are verified</p>
      ) : (
        <div className="space-y-2">
          {doctors.map(doc => (
            <div key={doc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-sm text-gray-500">{doc.email}</p>
              </div>
              <button
                onClick={() => onVerify(doc.id)}
                className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition text-sm"
              >
                Verify
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        🧑‍⚕️ Unverified Patients
        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-sm">{patients.length}</span>
      </h3>
      {patients.length === 0 ? (
        <p className="text-gray-500 text-sm">✅ All patients are verified</p>
      ) : (
        <div className="space-y-2">
          {patients.map(pat => (
            <div key={pat.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium">{pat.name}</p>
                <p className="text-sm text-gray-500">{pat.email}</p>
              </div>
              <button
                onClick={() => onVerify(pat.id)}
                className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition text-sm"
              >
                Verify
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const PendingRequests = ({ requests, onHandle }) => (
  <div>
    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
      📩 Pending Requests
      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-sm">{requests.length}</span>
    </h3>
    {requests.length === 0 ? (
      <p className="text-gray-500 text-center py-8">✅ No pending requests</p>
    ) : (
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  👨‍⚕️ {req.doctor.name} ↔️ 🧑‍⚕️ {req.patient.name}
                </p>
                <p className="text-sm text-gray-500">{req.message || 'No message'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Requested: {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onHandle(req.id, 'APPROVED')}
                  className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => onHandle(req.id, 'REJECTED')}
                  className="bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CreateRelation = ({ doctors, patients, onCreate }) => {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedPatient) {
      alert('Please select both a doctor and a patient');
      return;
    }
    onCreate(selectedDoctor, selectedPatient);
    setSelectedDoctor('');
    setSelectedPatient('');
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">🔗 Create Doctor-Patient Relationship</h3>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">-- Select Doctor --</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
          {doctors.length === 0 && (
            <p className="text-sm text-orange-500 mt-1">⚠️ No verified doctors found. Please verify some doctors first.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">-- Select Patient --</option>
            {patients.map(pat => (
              <option key={pat.id} value={pat.id}>{pat.name}</option>
            ))}
          </select>
          {patients.length === 0 && (
            <p className="text-sm text-orange-500 mt-1">⚠️ No verified patients found. Please verify some patients first.</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          disabled={!selectedDoctor || !selectedPatient}
        >
          Create Relation
        </button>
      </form>
    </div>
  );
};

const ManageRelations = ({ relations, onRevoke }) => {
  // Filter only ACTIVE relations
  const activeRelations = relations.filter(r => r.status === 'ACTIVE');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        📊 Active Relations
        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-sm">{activeRelations.length}</span>
      </h3>

      {activeRelations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">📭 No active relations</p>
          <p className="text-sm">Create a relation from the "Create Relation" tab</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeRelations.map(rel => (
            <div key={rel.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg border border-gray-200 gap-3">
              <div>
                <p className="font-medium">
                  👨‍⚕️ {rel.doctor?.name}
                  <span className="text-gray-400 mx-2">→</span>
                  🧑‍⚕️ {rel.patient?.name}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(rel.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => onRevoke(rel.id)}
                className="bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 transition text-sm"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;