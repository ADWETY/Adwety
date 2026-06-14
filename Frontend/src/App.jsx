import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import RetailPharmacySelector from './components/RetailPharmacySelector';
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
import SettingsPage from './pages/SettingsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import UsersPage from './pages/UsersPage';
import { CategoriesPage, CustomersPage, InvoicesPage, InventoryCountPage, PosPage, ProductsCatalogPage, PurchasesPage, ReportsPage, RetailDashboardPage, ReturnsPage, SuppliersPage, TransfersPage, TreasuryPage, WarehousesPage } from './pages/retail/RetailPages';
import { RetailStoreProvider, useRetailStore } from './lib/retailStore';
import { ROLE_GROUPS, hasRole, isWebStaffRole, normalizeRole } from './lib/roles';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isBooting, session } = useAuth();
  const location = useLocation();
  if (isBooting) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isWebStaffRole(session?.role)) return <Navigate to="/login" replace state={{ webAccessDenied: true }} />;
  if (roles?.length && !hasRole(session?.role, roles)) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isBooting, session } = useAuth();
  if (isBooting) return <LoadingScreen />;
  if (isAuthenticated && isWebStaffRole(session?.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRoute() {
  const { session } = useAuth();
  return normalizeRole(session?.role) === 'admin'
    ? <DashboardPage />
    : <Navigate to="/retail-dashboard" replace />;
}

function RetailWorkspaceContent() {
  const { isAdminRetail, selectedPharmacyId } = useRetailStore();
  const workspaceKey = isAdminRetail ? (selectedPharmacyId || 'admin-no-pharmacy') : 'linked-pharmacy';
  return (
    <>
      <RetailPharmacySelector />
      <div key={workspaceKey}><Outlet /></div>
    </>
  );
}

function RetailWorkspaceRoute() {
  return (
    <RetailStoreProvider>
      <RetailWorkspaceContent />
    </RetailStoreProvider>
  );
}

const superRoles = ROLE_GROUPS.super;
const adminRoles = ROLE_GROUPS.admin;
const retailRoles = ROLE_GROUPS.retail;
const supportRoles = ROLE_GROUPS.support;

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<GuestRoute><LandingPage /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRoute />} />
        <Route path="analytics" element={<ProtectedRoute roles={adminRoles}><AnalyticsPage /></ProtectedRoute>} />

        <Route element={<ProtectedRoute roles={retailRoles}><RetailWorkspaceRoute /></ProtectedRoute>}>
          <Route path="retail-dashboard" element={<RetailDashboardPage />} />
          <Route path="products" element={<ProductsCatalogPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="sales-invoices" element={<InvoicesPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="inventory-count" element={<InventoryCountPage />} />
          <Route path="treasury" element={<TreasuryPage />} />
          <Route path="business-reports" element={<ReportsPage />} />
        </Route>

        <Route path="medicines" element={<ProtectedRoute roles={ROLE_GROUPS.medicine}><MedicinesPage /></ProtectedRoute>} />
        <Route path="medicines/new" element={<ProtectedRoute roles={adminRoles}><AddMedicinePage /></ProtectedRoute>} />
        <Route path="low-stock" element={<ProtectedRoute roles={adminRoles}><LowStockPage /></ProtectedRoute>} />
        <Route path="pharmacies" element={<ProtectedRoute roles={adminRoles}><PharmaciesPage /></ProtectedRoute>} />
        <Route path="pharmacies/new" element={<ProtectedRoute roles={superRoles}><AddPharmacyPage /></ProtectedRoute>} />
        <Route path="pharmacies/:id" element={<ProtectedRoute roles={adminRoles}><PharmacyDetailsPage /></ProtectedRoute>} />
        <Route path="scanner" element={<Navigate to="/" replace />} />
        <Route path="notifications" element={<ProtectedRoute roles={ROLE_GROUPS.notifications}><NotificationsPage /></ProtectedRoute>} />
        <Route path="pharmacy-requests" element={<ProtectedRoute roles={superRoles}><PharmacyRequestsPage /></ProtectedRoute>} />
        <Route path="support-tickets" element={<ProtectedRoute roles={supportRoles}><SupportTicketsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={superRoles}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={ROLE_GROUPS.settings}><SettingsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute roles={ROLE_GROUPS.web}><ProfilePage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
    </Routes>
  );
}
