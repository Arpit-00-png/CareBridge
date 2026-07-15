import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import RequestRelation from './pages/RequestRelation';
import Chat from './pages/Chat';
import VideoCall from './pages/VideoCall';
import Logs from './pages/Logs';
import PatientDashboard from './pages/PatientDashboard';
import GuardianDashboard from './pages/GuardianDashboard';


const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'DOCTOR') return <DoctorDashboard />;
  if (user?.role === 'PATIENT') return <PatientDashboard />;
  if (user?.role === 'GUARDIAN') return <GuardianDashboard />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route path="/request-relation" element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <RequestRelation />
              </ProtectedRoute>
            } />
            <Route path="/chat/:relationId" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/call/:roomId" element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute>
                <Logs />
              </ProtectedRoute>
            } />

          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;