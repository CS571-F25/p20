import { BrowserRouter, Route, Routes, Navigate } from 'react-router';
import { useState, useEffect } from 'react';

import './App.css';

import Navigation from './components/navigation/Navigation';
import Home from './components/pages/Home';
import AboutMe from './components/pages/AboutMe';
import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import Signup from './components/pages/Signup'

import UserContext from './components/contexts/UserContext';

function App() {

  // Restore the user information on website load if exists
  const [user, setUser] = useState(null);
  useEffect(() => {
    const saved = sessionStorage.getItem("user");
    if(saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter basename="/p20">
        <Navigation />
          <Routes>
            <Route 
              path="/" 
              element={ user ? <Navigate to="/dashboard" /> : <Home /> } 
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<AboutMe />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;