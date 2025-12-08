import { HashRouter, Route, Routes, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from './components/contexts/AuthContext';
import { SettingsProvider } from './components/contexts/SettingsContext';
import { supabase } from './supabaseClient';
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
      <Route path="/auth-success" element={<AuthSuccess />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}

function TokenHandler({ children }) {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [redirectToSuccess, setRedirectToSuccess] = useState(false);

  useEffect(() => {
    const handleTokens = async () => {
      // Check for tokens in the URL hash fragment
      const hash = window.location.hash;
      
      // Look for access_token after any # in the URL
      if (hash.includes('access_token=')) {
        // Extract the part with tokens (could be after #/route# or just #)
        const tokenPart = hash.split('#').find(part => part.includes('access_token='));
        
        if (tokenPart) {
          const params = new URLSearchParams(tokenPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            try {
              // Set the session with the tokens
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (!error && data.session) {
                console.log('Session established:', data.session.user);
                setRedirectToSuccess(true);
                // Clean the URL - redirect to auth-success route
                window.location.hash = '/auth-success';
              }
            } catch (err) {
              console.error('Token processing error:', err);
            }
          }
        }
      }
      
      setTokenChecked(true);
    };

    handleTokens();
  }, []);

  if (!tokenChecked) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#4f5b6cff', fontSize: '14px', marginLeft: '13px'}}>
          Confirming email...
        </p>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <TokenHandler>
          <HashRouter>
            <Navigation />
            <main className="main-content">
                <AppRoutes />
            </main>
          </HashRouter>
        </TokenHandler>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;