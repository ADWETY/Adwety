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
import ProfilePage from './pages/ProfilePage';
import PrescriptionScannerPage from './pages/PrescriptionScannerPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import UsersPage from './pages/UsersPage';
import { CategoriesPage, CustomersPage, InvoicesPage, InventoryCountPage, PosPage, ProductsCatalogPage, PurchasesPage, ReportsPage, RetailDashboardPage, ReturnsPage, SuppliersPage, TransfersPage, TreasuryPage, WarehousesPage } from './pages/retail/RetailPages';
import { ROLE_GROUPS, hasRole, normalizeRole } from './lib/roles';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isBooting, session } = useAuth();
  const location = useLocation();
  if (isBooting) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles?.length && !hasRole(session?.role, roles)) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isBooting } = useAuth();
  if (isBooting) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function HomeRoute() {
  const { session } = useAuth();
  return normalizeRole(session?.role) === 'admin' ? <DashboardPage /> : <Navigate to="/scanner" replace />;
}

const superRoles = ROLE_GROUPS.super;
const adminRoles = ROLE_GROUPS.admin;
const supportRoles = ROLE_GROUPS.support;

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<GuestRoute><LandingPage /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRoute />} />
        <Route path="analytics" element={<ProtectedRoute roles={adminRoles}><AnalyticsPage /></ProtectedRoute>} />

        <Route path="retail-dashboard" element={<ProtectedRoute roles={adminRoles}><RetailDashboardPage /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute roles={adminRoles}><ProductsCatalogPage /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute roles={adminRoles}><CategoriesPage /></ProtectedRoute>} />
        <Route path="warehouses" element={<ProtectedRoute roles={adminRoles}><WarehousesPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute roles={adminRoles}><CustomersPage /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute roles={adminRoles}><SuppliersPage /></ProtectedRoute>} />
        <Route path="pos" element={<ProtectedRoute roles={adminRoles}><PosPage /></ProtectedRoute>} />
        <Route path="purchases" element={<ProtectedRoute roles={adminRoles}><PurchasesPage /></ProtectedRoute>} />
        <Route path="sales-invoices" element={<ProtectedRoute roles={adminRoles}><InvoicesPage /></ProtectedRoute>} />
        <Route path="returns" element={<ProtectedRoute roles={adminRoles}><ReturnsPage /></ProtectedRoute>} />
        <Route path="transfers" element={<ProtectedRoute roles={adminRoles}><TransfersPage /></ProtectedRoute>} />
        <Route path="inventory-count" element={<ProtectedRoute roles={adminRoles}><InventoryCountPage /></ProtectedRoute>} />
        <Route path="treasury" element={<ProtectedRoute roles={adminRoles}><TreasuryPage /></ProtectedRoute>} />
        <Route path="business-reports" element={<ProtectedRoute roles={adminRoles}><ReportsPage /></ProtectedRoute>} />
        <Route path="medicines" element={<ProtectedRoute roles={ROLE_GROUPS.medicine}><MedicinesPage /></ProtectedRoute>} />
        <Route path="medicines/new" element={<ProtectedRoute roles={adminRoles}><AddMedicinePage /></ProtectedRoute>} />
        <Route path="low-stock" element={<ProtectedRoute roles={adminRoles}><LowStockPage /></ProtectedRoute>} />
        <Route path="pharmacies" element={<ProtectedRoute roles={adminRoles}><PharmaciesPage /></ProtectedRoute>} />
        <Route path="pharmacies/new" element={<ProtectedRoute roles={superRoles}><AddPharmacyPage /></ProtectedRoute>} />
        <Route path="pharmacies/:id" element={<ProtectedRoute roles={adminRoles}><PharmacyDetailsPage /></ProtectedRoute>} />
        <Route path="scanner" element={<ProtectedRoute roles={ROLE_GROUPS.scanner}><PrescriptionScannerPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute roles={ROLE_GROUPS.notifications}><NotificationsPage /></ProtectedRoute>} />
        <Route path="pharmacy-requests" element={<ProtectedRoute roles={superRoles}><PharmacyRequestsPage /></ProtectedRoute>} />
        <Route path="support-tickets" element={<ProtectedRoute roles={supportRoles}><SupportTicketsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={superRoles}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
    </Routes>
  );
}
