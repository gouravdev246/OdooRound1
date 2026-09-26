import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = api.getCurrentUser();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Operations', path: '/operations' },
    { name: 'Stock', path: '/stock' },
    { name: 'Move History', path: '/move-history' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 0
      }}>
        {/* Brand Logo */}
        <Link to="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          textDecoration: 'none'
        }}>
          <img 
            src={logo} 
            alt="StockSense Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              objectFit: 'contain' 
            }} 
          />
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em'
          }}>
            Stock<span style={{ color: 'var(--primary)' }}>Sense</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          fontSize: '0.9rem',
          color: '#334155'
        }}>
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                color: isActive ? 'var(--primary)' : '#475569',
                fontWeight: isActive ? 600 : 500,
                transition: 'color 0.2s',
                textDecoration: 'none'
              })}
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* Right CTA Button & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {currentUser && (
            <div className="hidden-mobile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}>
              <span>{currentUser.name || currentUser.email}</span>
              {currentUser.role && (
                <span style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569'
                }}>
                  {currentUser.role.replace('_', ' ')}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => {
              api.logout();
              sessionStorage.removeItem('isAuthenticated');
              navigate('/login');
            }}
            className="hidden-mobile btn btn-outline"
            style={{
              padding: '0.45rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              fontWeight: 500
            }}
          >
            Sign Out
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
            className="show-mobile"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#1e293b'
            }}
          >
            <Menu size={26} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.75rem',
          fontSize: '1.15rem'
        }}>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>

          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                color: isActive ? 'var(--primary)' : '#1e293b',
                fontWeight: isActive ? 600 : 500
              })}
            >
              {item.name}
            </NavLink>
          ))}

          <button
            onClick={() => {
              sessionStorage.removeItem('isAuthenticated');
              setMobileMenuOpen(false);
              navigate('/login');
            }}
            className="btn btn-outline"
            style={{ marginTop: '1rem', width: '200px' }}
          >
            Sign Out
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
          .show-mobile {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .show-mobile {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
