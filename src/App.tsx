import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import PropertyDetail from './pages/PropertyDetail';
import TenantProperties from './pages/TenantProperties';
import AlertsList from './pages/AlertsList';
import MessagesList from './pages/MessagesList';
import CalendarView from './pages/CalendarView';
import AdminCoupons from './pages/AdminCoupons';
import UpgradePlan from './pages/UpgradePlan';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="admin/coupons" element={<AdminCoupons />} />
        <Route path="upgrade" element={<UpgradePlan />} />
        <Route path="rentals" element={<TenantProperties />} />
        <Route path="alerts" element={<AlertsList />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="finances" element={<div>Finanzas (WIP)</div>} />
        <Route path="messages" element={<MessagesList />} />
        <Route path="settings" element={<div>Configuración (WIP)</div>} />
        <Route path="users" element={<div>Usuarios (WIP)</div>} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
