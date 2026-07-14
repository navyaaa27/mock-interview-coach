import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track desktop sidebar collapse state (default open)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const dropdownRef = useRef(null);

  const fullName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User';
  const email = currentUser?.email || 'user@example.com';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', icon: 'fa-solid fa-grip',              label: 'Dashboard' },
    { path: '/history',   icon: 'fa-solid fa-clock-rotate-left', label: 'History'   },
    { path: '/progress',  icon: 'fa-solid fa-chart-line',        label: 'Progress'  },
    { path: '/profile',   icon: 'fa-solid fa-user-gear',         label: 'Profile'   },
  ];

  return (
    <div className="layout-wrapper">
      
      {/* Mobile Top Header with Hamburger */}
      <div className="mobile-top-header">
        <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
        <div className="sidebar-logo"><i className="fa-solid fa-cube" style={{ color: '#4fc3f7' }}></i> Interview<span>AI</span></div>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo desktop-only">
          <i className="fa-solid fa-cube" style={{ color: '#4fc3f7' }}></i> Interview<span>AI</span>
        </div>
        
        <div className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
              
            return (
              <button 
                key={item.label}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <i className={item.icon}></i> {item.label}
              </button>
            );
          })}
        </div>

        <div className="sidebar-bottom" style={{ position: 'relative' }}>
          {dropdownOpen && (
            <div className="avatar-dropdown" ref={dropdownRef} style={{ display: 'block' }}>
              <button className="avatar-dropdown-item" onClick={() => window.location.href = '/?profile=1'}>
                <i className="fa-solid fa-user-gear"></i> Profile Settings
              </button>
              <button className="avatar-dropdown-item danger" onClick={handleSignOut}>
                <i className="fa-solid fa-right-from-bracket"></i> Sign Out
              </button>
            </div>
          )}
          
          <div className="sidebar-user-card" onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fullName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email}
              </div>
            </div>
            <i className="fa-solid fa-ellipsis-vertical" style={{ color: 'var(--text-muted)', fontSize: 12 }}></i>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`layout-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Desktop Hamburger Header */}
        <div className="desktop-top-header">
          <button 
            className="hamburger-btn" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
