import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const GuardianDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/guardian/patients');
            console.log('📦 Raw API response:', res.data);
            setPatients(res.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
            alert('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientDetails = async (patientId, doctorId) => {
        try {
            setDetailsLoading(true);
            setSelectedPatient(patientId);
            setSelectedDoctor(doctorId);

            // Find the relation for this patient-doctor pair
            const patient = patients.find(p => p.id === patientId);
            const relation = patient?.relations?.find(r => r.doctorId === doctorId);

            if (!relation) {
                alert('No relation found for this doctor');
                setDetailsLoading(false);
                return;
            }

            const res = await api.get(`/guardian/patient/${patientId}?relationId=${relation.relationId}`);
            setPatientDetails(res.data);
        } catch (error) {
            console.error('Error fetching patient details:', error);
            alert('Failed to load patient details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-purple-600 text-white p-4 shadow">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">👨‍👩‍👦 Guardian Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span>{user?.name}</span>
                        <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-6 p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Patient List */}
                <div className="md:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
                    <h2 className="text-lg font-semibold mb-4">My Patients ({patients.length})</h2>
                    {patients.length === 0 ? (
                        <p className="text-gray-500">No patients assigned yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {patients.map((p) => (
                                <div key={p.id} className="border border-gray-200 rounded-lg p-3">
                                    <p className="font-medium">{p.name}</p>
                                    <div className="mt-2 space-y-1">
                                        {p.doctors.map((doc) => (
                                            <button
                                                key={doc.id}
                                                onClick={() => fetchPatientDetails(p.id, doc.id)}
                                                className={`w-full text-left text-sm px-3 py-1 rounded transition ${selectedPatient === p.id && selectedDoctor === doc.id
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                            >
                                                👨‍⚕️ Dr. {doc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Patient Details */}
                <div className="md:col-span-2">
                    {detailsLoading ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">Loading details...</div>
                    ) : patientDetails ? (
                        <div className="space-y-4">
                            {/* Patient Info */}
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-xl font-semibold">
                                    👤 {patientDetails.patient.name}
                                </h2>
                                <p className="text-gray-600">
                                    👨‍⚕️ Doctor: {patientDetails.patient.doctor?.name}
                                </p>
                                <button
                                    onClick={() => navigate(`/chat/${patientDetails.patient.relationId}`)}
                                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                                >
                                    💬 Open Chat
                                </button>
                            </div>

                            {/* Prescriptions */}
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="font-semibold text-lg mb-3">💊 Prescriptions</h3>
                                {patientDetails.prescriptions.length === 0 ? (
                                    <p className="text-gray-500">No active prescriptions.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {patientDetails.prescriptions.map((p) => (
                                            <div key={p.id} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                                <p className="font-medium">Dr. {p.doctor?.name}</p>
                                                {p.medicines.map((med) => (
                                                    <div key={med.id} className="mt-1 text-sm">
                                                        <p>💊 {med.medicineName} - {med.dosage}</p>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                                                                {med.foodRelation?.replace('_', ' ') || 'Anytime'}
                                                            </span>
                                                            <span className="text-xs bg-purple-100 px-2 py-0.5 rounded">
                                                                ⏰ {med.timings.map(t => t.time).join(', ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Messages */}
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="font-semibold text-lg mb-3">💬 Recent Messages</h3>
                                {patientDetails.messages?.length === 0 ? (
                                    <p className="text-gray-500">No messages yet.</p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {patientDetails.messages?.slice(-5).map((msg) => (
                                            <div key={msg.id} className="bg-gray-50 p-2 rounded border border-gray-200 text-sm">
                                                <p>
                                                    <span className="font-medium">{msg.sender?.name}</span>:
                                                    {msg.content}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            Select a patient and doctor to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardianDashboard;