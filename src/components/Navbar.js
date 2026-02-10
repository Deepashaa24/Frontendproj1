import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to={`/${user?.role}/dashboard`} className="navbar-brand">
          📚 Leave Management System
        </Link>
        
        <div className="navbar-menu">
          {user?.role === 'student' && (
            <>
              <Link to="/student/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/student/apply-leave" className="nav-link">Apply Leave</Link>
              <Link to="/student/leaves" className="nav-link">My Leaves</Link>
            </>
          )}
          
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/admin/leave-requests" className="nav-link">Leave Requests</Link>
              <Link to="/admin/questions" className="nav-link">Questions</Link>
              <Link to="/admin/settings" className="nav-link">Settings</Link>
            </>
          )}
          
          <div className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <span className="theme-label">{isDark ? '🌙' : '☀️'}</span>
            <div className="theme-toggle-track">
              <div className="theme-toggle-thumb">
                {isDark ? <FiMoon size={10} color="#818cf8" /> : <FiSun size={10} color="#f59e0b" />}
              </div>
            </div>
          </div>

          <div className="navbar-user">
            <FiUser />
            <span>{user?.name}</span>
          </div>
          
          <button onClick={handleLogout} className="btn btn-logout">
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
