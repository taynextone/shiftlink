import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../state/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { HospitalContractsPage } from '../features/hospital/HospitalContractsPage';
import { HospitalDashboardPage } from '../features/hospital/HospitalDashboardPage';
import { HospitalOffersPage } from '../features/hospital/HospitalOffersPage';
import { HospitalShiftsPage } from '../features/hospital/HospitalShiftsPage';
import { NurseDashboardPage } from '../features/nurse/NurseDashboardPage';
import { NurseJobsPage } from '../features/nurse/NurseJobsPage';
import { NurseMatchesPage } from '../features/nurse/NurseMatchesPage';
import { NurseProfilePage } from '../features/nurse/NurseProfilePage';

export function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/nurse" element={<ProtectedRoute><NurseDashboardPage /></ProtectedRoute>} />
          <Route path="/nurse/jobs" element={<ProtectedRoute><NurseJobsPage /></ProtectedRoute>} />
          <Route path="/nurse/matches" element={<ProtectedRoute><NurseMatchesPage /></ProtectedRoute>} />
          <Route path="/nurse/profile" element={<ProtectedRoute><NurseProfilePage /></ProtectedRoute>} />
          <Route path="/hospital" element={<ProtectedRoute><HospitalDashboardPage /></ProtectedRoute>} />
          <Route path="/hospital/shifts" element={<ProtectedRoute><HospitalShiftsPage /></ProtectedRoute>} />
          <Route path="/hospital/offers" element={<ProtectedRoute><HospitalOffersPage /></ProtectedRoute>} />
          <Route path="/hospital/contracts" element={<ProtectedRoute><HospitalContractsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/nurse" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  );
}
