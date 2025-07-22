import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Settings, Upload, ChevronRight } from 'lucide-react';

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
      details: 'Supports AWS S3, DigitalOcean Spaces, and any S3-compatible service',
    },
    {
      icon: Upload,
      title: 'Manage & Share Files',
      description: 'Upload, organize, and share files securely from a modern dashboard',
      details:
        'Drag & drop uploads, folder organization, time-limited links, access controls, and sharing analytics',
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section className="pt-5 pb-10 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              How It Works
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Get started with Storix in minutes. Three simple steps to secure file management.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative group h-full"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
              >
                <Card className="flex h-full flex-col justify-between bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl shadow-md hover:shadow-lg hover:border-blue-500 transition-all duration-300 group">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-neutral-400 bg-neutral-800 px-2 py-1 rounded mb-1 inline-block">
                          Step {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-400 mb-2">
                        {step.description}
                      </p>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {step.details}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-5 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            className="text-center mt-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="inline-flex items-center text-sm text-neutral-400 bg-neutral-900/50 border border-neutral-800 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Ready in under 5 minutes
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
