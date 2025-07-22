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
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg">
              Get Started
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-neutral-700 text-white hover:bg-neutral-900 px-8 py-3 rounded-lg">
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
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-purple-500" />
              <span>Open source</span>
            </div>
          </div>
        </div>

        {/* Hero illustration/mockup */}
        <div className="mt-16 relative">
          <div className="mx-auto max-w-4xl">
            {/* Hero Image Container */}
            <div className="relative group cursor-pointer">
              {/* Main Image Container */}
              <div className="relative rounded-2xl border border-neutral-700/50 bg-gradient-to-br from-neutral-900/80 to-black/90 backdrop-blur-sm overflow-hidden shadow-2xl">
                {/* Placeholder for your actual screenshot/image */}
                <div className="aspect-video bg-gradient-to-br from-neutral-900 via-neutral-800 to-black relative">
                  {/* Overlay with subtle pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-neutral-900/20"></div>
                  
                  {/* Floating elements animation */}
                  <div className="absolute inset-0 overflow-hidden">
                    {/* Animated floating icons */}
                    <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-500/20 rounded-lg animate-pulse"></div>
                    <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-green-500/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute bottom-1/3 left-1/3 w-10 h-10 bg-purple-500/20 rounded-lg animate-pulse" style={{animationDelay: '1s'}}></div>
                    <div className="absolute bottom-1/4 right-1/4 w-7 h-7 bg-yellow-500/20 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
                  </div>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Database className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Storix Interface</h3>
                      <p className="text-neutral-400">Modern file management made simple</p>
                    </div>
                  </div>
                  
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -top-3 left-6">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Replace with your screenshot
                </Badge>
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;