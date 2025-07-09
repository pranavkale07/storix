import React from 'react';
import { OAuthLogin } from './OAuthLogin';

export default function AuthLanding() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OAuthLogin />
    </div>
  );
}