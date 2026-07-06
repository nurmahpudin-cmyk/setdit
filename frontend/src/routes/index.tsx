import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute.tsx';
import { PublicRoute } from './PublicRoute.tsx';
import LoginPage from '../pages/auth/LoginPage.tsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.tsx';
import DashboardPage from '../pages/dashboard/DashboardPage.tsx';
import UsersPage from '../pages/admin/UsersPage.tsx';
import RolesPage from '../pages/admin/RolesPage.tsx';
import PermissionsPage from '../pages/admin/PermissionsPage.tsx';
import PositionsPage from '../pages/admin/PositionsPage.tsx';
import UnitsPage from '../pages/admin/UnitsPage.tsx';
import SettingsPage from '../pages/admin/SettingsPage.tsx';
import ActivityLogsPage from '../pages/admin/ActivityLogsPage.tsx';
import MenuPage from '../pages/admin/MenuPage.tsx';
import WhatsAppPage from '../pages/admin/WhatsAppPage.tsx';
import JadwalPimpinanPage from '../pages/jadwal/JadwalPimpinanPage.tsx';
import PegawaiPage from '../pages/pegawai/PegawaiPage.tsx';
import SkPerhutananPage from '../pages/sk/SkPerhutananPage.tsx';
import ProceedSKPage from '../pages/sk/ProceedSKPage.tsx';
import ExportSKPage from '../pages/sk/ExportSKPage.tsx';
import ProvinsiPage from '../pages/master/ProvinsiPage.tsx';
import KabkotaPage from '../pages/master/KabkotaPage.tsx';
import SkemaPage from '../pages/master/SkemaPage.tsx';
import AppLayout from '../pages/layout/AppLayout.tsx';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/logs" element={<ActivityLogsPage />} />
        <Route path="/menus" element={<MenuPage />} />
        <Route path="/whatsapp" element={<WhatsAppPage />} />
        <Route path="/jadwal-pimpinan" element={<JadwalPimpinanPage />} />
        <Route path="/pegawai" element={<PegawaiPage />} />
        <Route path="/sk-perhutanan" element={<SkPerhutananPage />} />
        <Route path="/proceed-sk" element={<ProceedSKPage />} />
        <Route path="/export-sk" element={<ExportSKPage />} />
        <Route path="/master/provinsi" element={<ProvinsiPage />} />
        <Route path="/master/kabkota" element={<KabkotaPage />} />
        <Route path="/master/skema" element={<SkemaPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}