import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();

  console.log('[ProtectedRoute] session', session);
  console.log('[ProtectedRoute] loading', loading); 

  // While checking auth state, maybe show a loading indicator or nothing
  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  // If no session, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  // If session exists, render the child route elements
  return <Outlet />;
};

export default ProtectedRoute; 