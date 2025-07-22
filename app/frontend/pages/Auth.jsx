import React from 'react';
import { OAuthLogin } from '../components/OAuthLogin';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OAuthLogin />
    </div>
  );
}