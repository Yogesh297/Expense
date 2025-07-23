import React, { useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthContext } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;