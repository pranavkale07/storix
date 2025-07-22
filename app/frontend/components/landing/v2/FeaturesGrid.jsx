import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cloud,
  Shield,
  FileText,
  Share2,
  Upload,
  Lock,
  BarChart3,
  Zap,
} from 'lucide-react';

const FeaturesGrid = () => {
  const features = [
    {
      icon: Cloud,
      title: 'Multiple Buckets & S3-Compatible Providers',
      description: 'Connect and manage multiple AWS S3, DigitalOcean Spaces, or any S3-compatible storage accounts—all in one place.',
      badge: 'Storage',
    },
    {
      icon: Shield,
      title: 'End-to-End Encryption',
      description: 'Your credentials are encrypted. Your files never touch our servers.',
      badge: 'Security',
    },
    {
      icon: FileText,
      title: 'Modern File Browser',
      description: 'Upload, download, organize, rename, and delete files and folders with a clean, fast interface.',
      badge: 'File Management',
    },
    {
      icon: Upload,
      title: 'Parallel & Fast Uploads',
      description: 'Upload large files quickly and reliably with parallel chunked uploads.',
      badge: 'Performance',
    },
    {
      icon: Share2,
      title: 'Secure Share Links',
      description: 'Generate, revoke, and track expiring share links for any file or folder.',
      badge: 'Sharing',
    },
    {
      icon: BarChart3,
      title: 'Usage Limits & Request Tracking',
      description: 'Set monthly request limits and monitor your S3 usage in real time—never get hit with unexpected storage bills.',
      badge: 'Control',
    },
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Powerful features built for modern file management and sharing workflows.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-900/70 transition-all duration-300 group hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-neutral-800">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge className="mb-2 text-white text-xs px-3 py-1 rounded-full bg-gradient-to-r from-green-900/40 to-blue-900/40 inline-flex items-center justify-center border-0">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-white group-hover:text-white transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-neutral-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom highlight */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 text-neutral-400 bg-neutral-900/60 border border-neutral-800 rounded-full px-6 py-3 text-sm">
              <Zap className="w-4 h-4 text-green-500" />
              <span>Built for privacy, speed, and control</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;