import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../state/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { AdminOpsPage } from '../features/admin/AdminOpsPage';
import { AdminVerificationPage } from '../features/admin/AdminVerificationPage';
import { LandingPage } from '../features/marketing/LandingPage';
import { HospitalContractsPage } from '../features/hospital/HospitalContractsPage';
import { HospitalBillingPage } from '../features/hospital/HospitalBillingPage';
import { HospitalDashboardPage } from '../features/hospital/HospitalDashboardPage';
import { HospitalDossierPage } from '../features/hospital/HospitalDossierPage';
import { HospitalOffersPage } from '../features/hospital/HospitalOffersPage';
import { HospitalShiftsPage } from '../features/hospital/HospitalShiftsPage';
import { NurseDashboardPage } from '../features/nurse/NurseDashboardPage';
import { NurseAvailabilityPage } from '../features/nurse/NurseAvailabilityPage';
import { NurseJobsPage } from '../features/nurse/NurseJobsPage';
import { NurseMatchesPage } from '../features/nurse/NurseMatchesPage';
import { OnboardingWizard } from '../features/onboarding/OnboardingWizard';
import { NurseProfilePage } from '../features/nurse/NurseProfilePage';
import { NurseContractsPage } from '../features/nurse/NurseContractsPage';

export function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/nurse" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseDashboardPage /></ProtectedRoute>} />
          <Route path="/nurse/jobs" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseJobsPage /></ProtectedRoute>} />
          <Route path="/nurse/availability" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseAvailabilityPage /></ProtectedRoute>} />
          <Route path="/nurse/matches" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseMatchesPage /></ProtectedRoute>} />
          <Route path="/nurse/profile" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseProfilePage /></ProtectedRoute>} />
          <Route path="/nurse/contracts" element={<ProtectedRoute allowedRoles={['NURSE']}><NurseContractsPage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute allowedRoles={['NURSE', 'HOSPITAL_ADMIN']}><OnboardingWizard /></ProtectedRoute>} />
          <Route path="/hospital" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalDashboardPage /></ProtectedRoute>} />
          <Route path="/hospital/shifts" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalShiftsPage /></ProtectedRoute>} />
          <Route path="/hospital/offers" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalOffersPage /></ProtectedRoute>} />
          <Route path="/hospital/dossier" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalDossierPage /></ProtectedRoute>} />
          <Route path="/hospital/contracts" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalContractsPage /></ProtectedRoute>} />
          <Route path="/hospital/billing" element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'SUPER_ADMIN']}><HospitalBillingPage /></ProtectedRoute>} />
          <Route path="/admin/ops" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminOpsPage /></ProtectedRoute>} />
          <Route path="/admin/verification" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminVerificationPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  );
}
