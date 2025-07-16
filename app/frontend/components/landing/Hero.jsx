import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Cloud, Lock } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      
      <div className="relative px-4 py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl text-center">
          {/* Logo/Brand */}
          <div className="mb-8 flex items-center justify-center space-x-2">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-2">
              <Cloud className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Storix</span>
          </div>

          {/* Main headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your Files. Your Cloud.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Control.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-300 sm:text-2xl">
            A modern file storage and sharing platform for your own S3-compatible storage.
            Complete privacy, direct transfers, and enterprise-grade security.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg"
            >
              See Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-8 sm:space-y-0">
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="h-5 w-5" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Lock className="h-5 w-5" />
              <span>Your data stays private</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Cloud className="h-5 w-5" />
              <span>Direct cloud transfers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}