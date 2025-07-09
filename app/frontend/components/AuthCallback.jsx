import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, refreshActiveBucket } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (isProcessing) return; // Prevent multiple executions

      const token = searchParams.get('token');
      const userId = searchParams.get('user_id');
      const error = searchParams.get('message');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/auth/error');
        return;
      }

      if (token && userId && !isProcessing) {
        setIsProcessing(true);

        try {
          // Call login with proper user object structure
          const user = { id: parseInt(userId) };
          login(user, token);

          // Load active bucket after successful login
          await refreshActiveBucket();

          // Navigate to home after successful login
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 500); // Increased timeout to ensure login completes
        } catch (err) {
          console.error('Login error:', err);
          navigate('/auth/error');
        }
      } else if (!token || !userId) {
        console.error('Missing token or user_id');
        navigate('/auth/error');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate, isProcessing, refreshActiveBucket]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Logging you in...</p>
      </div>
    </div>
  );
}