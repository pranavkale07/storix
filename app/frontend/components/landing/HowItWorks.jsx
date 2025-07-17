import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Key, Cloud, Upload, Share } from 'lucide-react';

const steps = [
  {
    icon: Key,
    title: "One-time Setup",
    description: "Generate access keys and configure CORS rules on your storage provider (AWS S3, DigitalOcean Spaces, or any S3-compatible service).",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Cloud,
    title: "Connect Storage",
    description: "Securely connect your storage credentials to Storix. Your keys are encrypted and never leave your control.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Upload,
    title: "Upload & Manage",
    description: "Upload, organize, rename, and delete files directly from your browser. All transfers happen directly to your cloud storage.",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Share,
    title: "Share Securely",
    description: "Generate secure share links with expiration dates. Track usage and revoke access anytime from your dashboard.",
    color: "from-orange-500 to-orange-600"
  }
];

export function HowItWorks() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Get started with Storix in just a few simple steps
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={index} className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${step.color}`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-gray-300">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}