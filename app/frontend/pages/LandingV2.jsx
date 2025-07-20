import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Cloud, Share, FileText, Key, Users, Settings, Upload, Download, Lock, Zap, Database, Eye, ChevronRight, Star, Github as GitHub, Mail, Twitter } from 'lucide-react';
import HeroSection from '@/components/landing/v2/HeroSection';
import HowItWorks from '@/components/landing/v2/HowItWorks';
import FeaturesGrid from '@/components/landing/v2/FeaturesGrid';
import SecuritySection from '@/components/landing/v2/SecuritySection';
import DemoSection from '@/components/landing/v2/DemoSection';
import FAQSection from '@/components/landing/v2/FAQSection';
import Footer from '@/components/landing/v2/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-10 border-b border-neutral-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Storix</span>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-neutral-400 hover:text-white transition-colors">Features</a>
                <a href="#security" className="text-neutral-400 hover:text-white transition-colors">Security</a>
                <a href="#demo" className="text-neutral-400 hover:text-white transition-colors">Demo</a>
                <a href="#faq" className="text-neutral-400 hover:text-white transition-colors">FAQ</a>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                  <GitHub className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10">
          <HeroSection />
          <HowItWorks />
          <FeaturesGrid />
          <SecuritySection />
          <DemoSection />
          <FAQSection />
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Landing;