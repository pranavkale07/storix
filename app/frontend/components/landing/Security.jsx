import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Server, Eye } from 'lucide-react';

const securityFeatures = [
  {
    icon: Server,
    title: "Direct Transfers",
    description: "Your files are never stored or routed through Storix servers. All uploads and downloads happen directly between your browser and your cloud storage."
  },
  {
    icon: Lock,
    title: "Encrypted Credentials",
    description: "Your storage credentials are encrypted and stored securely. We never have access to your raw access keys."
  },
  {
    icon: Shield,
    title: "OAuth Authentication",
    description: "Secure login with Google or GitHub. No passwords to remember, just industry-standard OAuth security."
  },
  {
    icon: Eye,
    title: "Complete Privacy",
    description: "We only manage metadata and access control. Your actual files remain under your complete control at all times."
  }
];

export function Security() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Absolute Privacy & Security
          </h2>
          <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
            Your data security is our top priority. We've built Storix with a privacy-first architecture 
            that ensures your files never leave your control.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="mx-auto max-w-3xl rounded-xl border border-green-500/20 bg-green-500/10 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Zero-Knowledge Architecture
            </h3>
            <p className="text-gray-300 text-lg">
              Your files are never stored, cached, or routed through our servers. 
              All file operations happen directly between your browser and your chosen cloud storage provider 
              using secure, time-limited presigned URLs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}