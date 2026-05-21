import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
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
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/nurse" element={<NurseDashboardPage />} />
        <Route path="/nurse/jobs" element={<NurseJobsPage />} />
        <Route path="/nurse/matches" element={<NurseMatchesPage />} />
        <Route path="/nurse/profile" element={<NurseProfilePage />} />
        <Route path="/hospital" element={<HospitalDashboardPage />} />
        <Route path="/hospital/shifts" element={<HospitalShiftsPage />} />
        <Route path="/hospital/offers" element={<HospitalOffersPage />} />
        <Route path="/hospital/contracts" element={<HospitalContractsPage />} />
        <Route path="*" element={<Navigate to="/nurse" replace />} />
      </Routes>
    </AppShell>
  );
}
