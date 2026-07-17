import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CaregiverDashboard from './pages/CaregiverDashboard';
import PatientDetail from './pages/PatientDetail';
import VisitSession from './pages/VisitSession';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['caregiver']}>
                <CaregiverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute roles={['caregiver']}>
                <PatientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits/:id"
            element={
              <ProtectedRoute roles={['caregiver']}>
                <VisitSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
