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
import { NurseAvailabilityPage } from '../features/nurse/NurseAvailabilityPage';
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
          <Route path="/nurse" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseDashboardPage /></ProtectedRoute>} />
          <Route path="/nurse/jobs" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseJobsPage /></ProtectedRoute>} />
          <Route path="/nurse/availability" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseAvailabilityPage /></ProtectedRoute>} />
          <Route path="/nurse/matches" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseMatchesPage /></ProtectedRoute>} />
          <Route path="/nurse/profile" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseProfilePage /></ProtectedRoute>} />
          <Route path="/hospital" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalDashboardPage /></ProtectedRoute>} />
          <Route path="/hospital/shifts" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalShiftsPage /></ProtectedRoute>} />
          <Route path="/hospital/offers" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalOffersPage /></ProtectedRoute>} />
          <Route path="/hospital/contracts" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalContractsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/nurse" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  );
}
