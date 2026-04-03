import React from 'react';
// Changed BrowserRouter to HashRouter to support Electron file:// protocol
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import TitleBar from './components/TitleBar';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FDFCF8]">
        {/* Custom Title Bar */}
        <TitleBar />

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
