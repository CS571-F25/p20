import { NavLink, useNavigate } from 'react-router';
import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import './Navigation.css';
import logo from '../../assets/logo.png';
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from '../notifications/NotificationBell';
import ClickOutsideWrapper from '../reusable/ClickOutsideWrapper';

function Navigation() {
  const { user, signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    setShowLogout(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">

        {/* LEFT: Brand */}
        <div className="nav-left">
          <NavLink to="/" className="brand-container">
            <img src={logo} alt="Logo" className="nav-logo" />
            <h2 className="nav-brand">WalletPalz</h2>
          </NavLink>
        </div>

        {/* CENTER: Nav Links */}
        <div className="nav-center">
          {user && (
            <ul className="nav-links">
              <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active-link" : "nav-link"}>Dashboard</NavLink></li>
              <li><NavLink to="/transactions" className={({ isActive }) => isActive ? "nav-link active-link" : "nav-link"}>Transactions</NavLink></li>
              <li><NavLink to="/budgets" className={({ isActive }) => isActive ? "nav-link active-link" : "nav-link"}>Budgets</NavLink></li>
            </ul>
          )}
        </div>

        {/* RIGHT: User / Login */}
        <div className="nav-right">
          {user && <NotificationBell />}
          {user ? (
            <div className="user-menu-container">
              <button
                className="user-menu-button"
                onClick={() => setMenuOpen(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {user?.user_metadata?.full_name || user?.name || user?.email}
              </button>

              {menuOpen && (
                <ClickOutsideWrapper onClickOutside={() => setMenuOpen(false)}>
                  <div className="user-dropdown" role="menu">
                    <div onClick={() => { navigate('/profile'); setMenuOpen(false); }}>Profile</div>
                    <div onClick={() => { navigate('/settings'); setMenuOpen(false); }}>Settings</div>
                    <div onClick={() => { navigate('/about'); setMenuOpen(false); }}>About Us</div>
                    <div 
                      onClick={() => setShowLogout(true)} 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        width="20" 
                        height="20" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </div>
                  </div>
                </ClickOutsideWrapper>
              )}
            </div>
          ) : (
            <NavLink to="/login" className="nav-login">Login / Signup</NavLink>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        <Modal show={showLogout} onHide={() => setShowLogout(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Logout</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to log out?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleLogout}>Logout</Button>
          </Modal.Footer>
        </Modal>

      </div>
    </nav>
  );
}

export default Navigation;
