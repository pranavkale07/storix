import React from 'react';
import { LoginForm } from '../components/login-form.jsx';

export default function Login() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <LoginForm />
    </div>
  );
}