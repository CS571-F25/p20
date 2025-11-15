import { NavLink, useNavigate } from 'react-router';
import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import './Navigation.css';
import logo from '../../assets/logo.png';
import { useAuth } from "../contexts/AuthContext";

// Navigation bar
function Navigation() {
  const { user, signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();  // supabase logout
    setMenuOpen(false);
    setShowLogout(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        
        {/* Logo of the app on the navigation bar */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logo} alt="Logo" className="nav-logo" />
          <h2 className="nav-brand">WalletPalz</h2>
        </NavLink>

        {/* Navigation links only if logged in */}
        {user && (
          <ul className="nav-links">
            <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? "active-link" : undefined}>Dashboard</NavLink></li>
            <li><NavLink to="/transactions" className={({ isActive }) => isActive ? "active-link" : undefined}>Transactions</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => isActive ? "active-link" : undefined}>About Me</NavLink></li>
          </ul>
        )}

        {/* On the rightmost of navbar -> login button if not logged in / USER menu if user is logged in */}
        {user ? (
          <div className="user-menu-container">
            <span 
              className={`nav-login user-menu-button`}
              onClick={() => setMenuOpen(prev => !prev)}
              style={{ cursor: "pointer" }}
            >
              {user.email} {/* todo: change this to user.name */}
            </span>

            {menuOpen && (
              <div className="user-dropdown">
                <div onClick={() => { navigate('/profile'); setMenuOpen(false); }}>Profile</div>
                <div onClick={() => { navigate('/settings'); setMenuOpen(false); }}>Settings</div>
                <div onClick={() => { setShowLogout(true); }}>Logout</div>
              </div>
            )}
          </div>
        ) : (
          <NavLink 
            to="/login" 
            className={({ isActive }) => isActive ? "nav-login active-link" : "nav-login"}
          >
            Login
          </NavLink>
        )}

        {/* Logout Confirmation Window */}
        <Modal show={showLogout} onHide={() => setShowLogout(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Logout</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to log out?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLogout(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </nav>
  );
}

export default Navigation;
