import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Settings, Upload, Share, ChevronRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Key,
      title: 'One-time Setup',
      description: 'Generate access keys & configure CORS on your storage provider',
      details: 'Create API credentials in AWS IAM or DigitalOcean and set up CORS rules',
    },
    {
      icon: Settings,
      title: 'Connect Storage',
      description: 'Add your S3-compatible storage provider to Storix',
      details: 'Support for AWS S3, DigitalOcean Spaces, and any S3-compatible service',
    },
    {
      icon: Upload,
      title: 'Manage Files',
      description: 'Upload, organize, and manage your files with our modern interface',
      details: 'Drag & drop uploads, folder organization, bulk operations, and more',
    },
    {
      icon: Share,
      title: 'Share Securely',
      description: 'Generate secure links and track usage with detailed analytics',
      details: 'Time-limited links, access controls, and comprehensive sharing analytics',
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Get started with Storix in minutes. Four simple steps to secure file management.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900/70 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <span className="text-xs font-medium text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                            Step {index + 1}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-3">
                          {step.description}
                        </p>
                        <p className="text-neutral-500 text-xs">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Connection arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-neutral-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center text-sm text-neutral-400 bg-neutral-900/50 border border-neutral-800 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Ready in under 5 minutes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;