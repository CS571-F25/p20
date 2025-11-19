import { HashRouter, Route, Routes, Navigate } from 'react-router';
import { useAuth, AuthProvider } from './components/contexts/AuthContext';
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

import NoMatch from './components/pages/NoMatch'

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // or a spinner
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" />} />
      <Route path="/budgets" element={user ? <Budgets /> : <Navigate to="/login" />} />
      <Route path="/about" element={<AboutMe />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navigation />
            <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

