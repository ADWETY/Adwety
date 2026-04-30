import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import { useAuth } from './context/AuthContext';
import AddMedicinePage from './pages/AddMedicinePage';
import AddPharmacyPage from './pages/AddPharmacyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import LowStockPage from './pages/LowStockPage';
import MedicinesPage from './pages/MedicinesPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import PharmaciesPage from './pages/PharmaciesPage';
import PharmacyDetailsPage from './pages/PharmacyDetailsPage';
import PharmacyRequestsPage from './pages/PharmacyRequestsPage';
import PrescriptionScannerPage from './pages/PrescriptionScannerPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isBooting, session } = useAuth();
  const location = useLocation();
  if (isBooting) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles?.length && !roles.includes(session?.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isBooting } = useAuth();
  if (isBooting) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

const ownerRoles = ['owner'];
const superRoles = ['owner', 'super_admin'];
const adminRoles = ['owner', 'super_admin', 'pharmacy_admin'];
const supportRoles = ['owner', 'super_admin', 'support_admin'];
const scannerRoles = ['owner', 'super_admin', 'pharmacy_admin', 'user'];

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<GuestRoute><LandingPage /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<ProtectedRoute roles={adminRoles}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="medicines" element={<ProtectedRoute roles={['owner', 'super_admin', 'pharmacy_admin', 'user']}><MedicinesPage /></ProtectedRoute>} />
        <Route path="medicines/new" element={<ProtectedRoute roles={adminRoles}><AddMedicinePage /></ProtectedRoute>} />
        <Route path="low-stock" element={<ProtectedRoute roles={adminRoles}><LowStockPage /></ProtectedRoute>} />
        <Route path="pharmacies" element={<ProtectedRoute roles={adminRoles}><PharmaciesPage /></ProtectedRoute>} />
        <Route path="pharmacies/new" element={<ProtectedRoute roles={ownerRoles}><AddPharmacyPage /></ProtectedRoute>} />
        <Route path="pharmacies/:id" element={<ProtectedRoute roles={adminRoles}><PharmacyDetailsPage /></ProtectedRoute>} />
        <Route path="prescriptions" element={<ProtectedRoute roles={scannerRoles}><PrescriptionScannerPage /></ProtectedRoute>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="pharmacy-requests" element={<ProtectedRoute roles={ownerRoles}><PharmacyRequestsPage /></ProtectedRoute>} />
        <Route path="support-tickets" element={<ProtectedRoute roles={supportRoles}><SupportTicketsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={ownerRoles}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
    </Routes>
  );
}
