import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import api from '../services/api';
import { Lock, Mail, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await api.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMsg('');
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(res.devOtp ? `OTP sent! (Dev test code: ${res.devOtp})` : res.message || 'OTP dispatched to email.');
      setResetStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to dispatch OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.resetPassword({ email: forgotEmail, otp, newPassword });
      alert(res.message || 'Password reset successfully. Please log in.');
      setShowForgotModal(false);
      setResetStep(1);
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setForgotError(err.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
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
      {/* Background Geometric Line & Circle Canvas */}
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

      {/* Login Card Form */}
      <form 
        onSubmit={handleLogin}
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
          Login
        </h1>

        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}>
          Please sign in to continue
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

        {/* Email Field */}
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
          marginTop: '1rem',
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
            placeholder="Password" 
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

        {/* Forgot password */}
        <div style={{
          marginTop: '1.25rem',
          textAlign: 'left'
        }}>
          <button 
            type="button"
            onClick={() => { setForgotError(''); setForgotMsg(''); setShowForgotModal(true); }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '0.875rem',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            marginTop: '1rem',
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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Sign up link */}
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          marginTop: '1rem',
          marginBottom: '2.5rem'
        }}>
          Don’t have an account?{' '}
          <Link 
            to="/signup" 
            style={{
              color: 'var(--primary)',
              fontWeight: 600
            }}
          >
            Sign up
          </Link>
        </p>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--rose-light)', color: 'var(--rose-main)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
                {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--emerald-light)', color: 'var(--emerald-main)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
                {forgotMsg}
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Enter your registered email address to receive a password reset OTP code.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowForgotModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>6-Digit OTP Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>New Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setResetStep(1)} className="btn btn-secondary">Back</button>
                    <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                      {forgotLoading ? 'Saving...' : 'Set New Password'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
