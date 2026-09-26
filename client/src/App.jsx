import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import Stock from './pages/Stock';
import MoveHistory from './pages/MoveHistory';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

import api from './services/api';

// Protected Route Wrapper: Ensures user must log in first before seeing main app pages
function ProtectedRoute({ children }) {
  const isAuth = api.isAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry point always redirects to /login first */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Main Application Pages (Protected after Login) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/operations" 
          element={
            <ProtectedRoute>
              <Operations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock" 
          element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/move-history" 
          element={
            <ProtectedRoute>
              <MoveHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all route defaults to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
