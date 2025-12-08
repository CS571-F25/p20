import { HashRouter, Route, Routes, Navigate } from 'react-router';
import { useAuth, AuthProvider } from './components/contexts/AuthContext';
import { SettingsProvider } from './components/contexts/SettingsContext';
import './App.css';

import Navigation from './components/navigation/Navigation';

import Home from './components/pages/Home';
import AboutMe from './components/pages/AboutMe';
import Dashboard from './components/pages/Dashboard';
import Transactions from './components/pages/Transactions'
import Budgets from './components/pages/Budgets';

import Profile from './components/pages/Profile';
import Settings from './components/pages/Settings';
import Login from './components/pages/Login';
import Signup from './components/pages/Signup'
import AuthSuccess from './components/pages/AuthSuccess'
import NoMatch from './components/pages/NoMatch'

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
      return (
          <div className="loading-page">
              <div className="spinner"></div>
              <p style={{ marginTop: '16px', color: '#4f5b6cff', fontSize: '14px', marginLeft: '13px'}}>
                  Loading App...
              </p>
          </div>
      );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" />} />
      <Route path="/budgets" element={user ? <Budgets /> : <Navigate to="/login" />} />
      <Route path="/about" element={<AboutMe />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/auth/success" element={<AuthSuccess />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <HashRouter>
          <Navigation />
          <main className="main-content">
              <AppRoutes />
          </main>
        </HashRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

