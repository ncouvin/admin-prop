import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import PropertyDetail from './pages/PropertyDetail';
import TenantForm from './pages/TenantForm';
import ExpenseForm from './pages/ExpenseForm';
import IncomeForm from './pages/IncomeForm';

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
        <Route path="properties/:id/tenants/new" element={<TenantForm />} />
        <Route path="properties/:id/expenses/new" element={<ExpenseForm />} />
        <Route path="properties/:id/incomes/new" element={<IncomeForm />} />
        <Route path="alerts" element={<div>Alertas (WIP)</div>} />
        <Route path="calendar" element={<div>Calendario (WIP)</div>} />
        <Route path="finances" element={<div>Finanzas (WIP)</div>} />
        <Route path="messages" element={<div>Mensajes (WIP)</div>} />
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
