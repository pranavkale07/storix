import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Shield, Zap, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="outline" className="mb-6 border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Zap className="w-3 h-3 mr-1" />
            Your Files, Your Control
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent">
            Your Files. Your Cloud.
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Control.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            A modern file storage and sharing platform for your own S3-compatible storage.
            Secure, private, and always under your control.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3" onClick={() => navigate('/auth')}>
              Get Started
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-neutral-700 text-white hover:bg-neutral-900 px-8 py-3">
              <Play className="w-4 h-4 mr-2" />
              See Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-neutral-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>Your own storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Direct file transfers</span>
            </div>
          </div>
        </div>

        {/* Hero illustration/mockup */}
        <div className="mt-16 relative">
          <div className="mx-auto max-w-4xl">
            <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm p-1">
              <div className="rounded-xl bg-gradient-to-br from-neutral-900 to-black p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* File management mockup */}
                  <div className="col-span-2 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="ml-4">storix.app</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-neutral-800 rounded flex items-center px-3">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                        <div className="h-2 bg-neutral-600 rounded w-32"></div>
                      </div>
                      <div className="h-8 bg-neutral-800 rounded flex items-center px-3">
                        <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                        <div className="h-2 bg-neutral-600 rounded w-24"></div>
                      </div>
                      <div className="h-8 bg-neutral-800 rounded flex items-center px-3">
                        <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                        <div className="h-2 bg-neutral-600 rounded w-28"></div>
                      </div>
                    </div>
                  </div>

                  {/* Stats mockup */}
                  <div className="space-y-3">
                    <div className="text-xs text-neutral-500">Storage Usage</div>
                    <div className="h-2 bg-neutral-800 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-3/4"></div>
                    </div>
                    <div className="text-xs text-neutral-400">2.4 GB / 10 GB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;