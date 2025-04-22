import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Import the theme
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Don't render the Auth UI if session exists (to avoid flash)
  if (session) {
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Car Shop Login</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }} // Apply the theme
          providers={['google', 'github']} // Optional: Add social providers configured in Supabase
          redirectTo={window.location.origin + '/'} // Redirect after successful login
          theme="default" // You can use "dark" as well
        />
      </div>
    </div>
  );
};

export default Login; 