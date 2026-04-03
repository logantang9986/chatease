import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Login from './pages/Login';
import UserList from './pages/UserList';
import GroupList from './pages/GroupList';
import AppVersion from './pages/AppVersion';
import RobotConfig from './pages/RobotConfig';
import Dashboard from './pages/Dashboard';
import Broadcast from './pages/Broadcast'; // [NEW] Import Broadcast page
import MainLayout from './layouts/MainLayout';

// ----------------------------------------------------------------------
// Route Protection Logic
// ----------------------------------------------------------------------

/**
 * ProtectedRoute Wrapper
 * Checks if a token exists in localStorage.
 * If yes, renders the child component.
 * If no, redirects to the /login page.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// ----------------------------------------------------------------------
// Main App Component
// ----------------------------------------------------------------------

const App: React.FC = () => {
  return (
    // Global Theme Configuration (Blue Primary Color)
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff', // Standard Ant Design Blue
          colorBgContainer: '#ffffff',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes: Wrapped in MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Default Page: Dashboard */}
            <Route index element={<Dashboard />} />

            {/* User Management Module */}
            <Route path="users" element={<UserList />} />

            {/* Group Management Module */}
            <Route path="groups" element={<GroupList />} />

            {/* App Version Module */}
            <Route path="versions" element={<AppVersion />} />

            {/* System Settings - Robot Config */}
            <Route path="settings/robot" element={<RobotConfig />} />

            {/* System Settings - Broadcast [NEW] */}
            <Route path="broadcast" element={<Broadcast />} />
          </Route>

          {/* Catch-all: Redirect unknown routes to Dashboard (or Login) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;