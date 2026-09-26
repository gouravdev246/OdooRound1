import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import api from '../services/api';
import { AlertCircle } from 'lucide-react';

export default function Signup() {
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your entries.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.signup({
        name: loginId.trim(),
        email: email.trim(),
        password,
        role: 'WAREHOUSE_STAFF'
      });
      // Redirect to Login page after successful signup
      navigate('/login', {
        state: {
          successMsg: res.message || 'Account created successfully! Please sign in.',
          registeredEmail: email.trim()
        }
      });
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      backgroundColor: '#ffffff'
    }}>
      {/* Background Geometric Line & Circle Pattern */}
      <svg 
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
        viewBox="0 0 1440 720" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <path stroke="#E2E8F0" strokeOpacity="0.75" d="M-15.227 702.342H1439.7" />
        <circle cx="711.819" cy="372.562" r="308.334" stroke="#E2E8F0" strokeOpacity="0.75" />
        <circle cx="16.942" cy="20.834" r="308.334" stroke="#E2E8F0" strokeOpacity="0.75" />
        <path stroke="#E2E8F0" strokeOpacity="0.75" d="M-15.227 573.66H1439.7M-15.227 164.029H1439.7" />
        <circle cx="782.595" cy="411.166" r="308.334" stroke="#E2E8F0" strokeOpacity="0.75" />
      </svg>

      {/* Main Signup Card Container */}
      <form 
        onSubmit={handleSignup}
        style={{
          maxWidth: '384px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(209, 213, 219, 0.6)',
          borderRadius: '1rem',
          padding: '0 2rem',
          backgroundColor: '#ffffff',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Brand Header */}
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <img 
            src={logo} 
            alt="StockSense Logo" 
            style={{ 
              width: '44px', 
              height: '44px', 
              objectFit: 'contain' 
            }} 
          />
        </div>

        <h1 style={{
          color: '#111827',
          fontSize: '1.875rem',
          marginTop: '1rem',
          fontWeight: 500,
          letterSpacing: '-0.02em'
        }}>
          Sign up
        </h1>

        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}>
          Please sign up to continue
        </p>

        {errorMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--rose-light)',
            color: 'var(--rose-main)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login ID / Name field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          marginTop: errorMsg ? '1rem' : '1.75rem',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(209, 213, 219, 0.8)',
          height: '3rem',
          borderRadius: '9999px',
          overflow: 'hidden',
          paddingLeft: '1.5rem',
          gap: '0.5rem'
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input 
            type="text" 
            placeholder="Full Name / User ID" 
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            style={{
              background: 'transparent',
              color: '#374151',
              outline: 'none',
              fontSize: '0.875rem',
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            required 
          />
        </div>

        {/* Email Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          marginTop: '0.85rem',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(209, 213, 219, 0.8)',
          height: '3rem',
          borderRadius: '9999px',
          overflow: 'hidden',
          paddingLeft: '1.5rem',
          gap: '0.5rem'
        }}>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
          </svg>
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              background: 'transparent',
              color: '#374151',
              outline: 'none',
              fontSize: '0.875rem',
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            required 
          />
        </div>

        {/* Password Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '0.85rem',
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(209, 213, 219, 0.8)',
          height: '3rem',
          borderRadius: '9999px',
          overflow: 'hidden',
          paddingLeft: '1.5rem',
          gap: '0.5rem'
        }}>
          <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
          </svg>
          <input 
            type="password" 
            placeholder="Password (min 6 characters)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              background: 'transparent',
              color: '#374151',
              outline: 'none',
              fontSize: '0.875rem',
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            required 
          />
        </div>

        {/* Re-enter Password Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '0.85rem',
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(209, 213, 219, 0.8)',
          height: '3rem',
          borderRadius: '9999px',
          overflow: 'hidden',
          paddingLeft: '1.5rem',
          gap: '0.5rem'
        }}>
          <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
          </svg>
          <input 
            type="password" 
            placeholder="Re-enter Password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              background: 'transparent',
              color: '#374151',
              outline: 'none',
              fontSize: '0.875rem',
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            required 
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            height: '2.75rem',
            borderRadius: '9999px',
            color: '#ffffff',
            backgroundColor: 'var(--primary)',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            boxShadow: 'var(--shadow-indigo)'
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Sign in link */}
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          marginTop: '1rem',
          marginBottom: '2.5rem'
        }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{
              color: 'var(--primary)',
              fontWeight: 600
            }}
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
