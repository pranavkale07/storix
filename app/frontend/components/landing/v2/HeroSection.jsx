import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Shield, Zap, ChevronRight, Play, Github, Database } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="outline" className="mb-6 border-green-500/30 bg-green-500/10 text-green-400">
            <Zap className="w-3 h-3 mr-1" />
            Your Files, Your Control
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent">
            Your Files. Your Cloud.
            <span className="block bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
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
            <Button size="lg" className="bg-white text-black hover:bg-neutral-200 px-8 py-3 rounded-lg">
              Get Started
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3 bg-transparent">
              <a href="https://github.com/storix-app/storix" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                Source Code
              </a>
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
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-purple-500" />
              <span>Open source</span>
            </div>
          </div>
        </div>

        {/* Hero illustration/mockup */}
        <div className="mt-16 relative">
          <div className="mx-auto max-w-6xl">
            {/* Browser-mockup Card */}
            <div className="relative rounded-2xl shadow-lg p-2 h-full border border-neutral-800 flex flex-col overflow-hidden w-full max-w-6xl mx-auto bg-neutral-900/50">
              {/* Browser Bar */}
              <div className="w-full px-2 pt-1 pb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-700 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-700 rounded-full"></div>
                <div className="w-2 h-2 bg-green-700 rounded-full"></div>
              </div>
              {/* Screenshot Image */}
              <div className="h-full w-full aspect-[3/2] border border-neutral-800 overflow-hidden rounded-lg bg-black">
                <img
                  src="/hero-ss-updated-crp.png"
                  alt="Storix dashboard screenshot"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;