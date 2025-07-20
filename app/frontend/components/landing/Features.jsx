import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Globe,
  Upload,
  Users,
  BarChart3,
  Smartphone,
  Copy,
  Trash2,
  Link,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Secure OAuth Login',
    description: 'Login with Google or GitHub. Your credentials are encrypted and secure.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Upload,
    title: 'File Management',
    description: 'Upload, download, organize, rename, and delete files and folders with ease.',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Copy,
    title: 'Bulk Operations',
    description: 'Move or copy multiple files and folders at once. Efficient batch operations.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Link,
    title: 'Share Links',
    description: 'Generate secure sharing links with expiration dates. Track and revoke access anytime.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Globe,
    title: 'Multi-Provider Support',
    description: 'Works with AWS S3, DigitalOcean Spaces, and any S3-compatible storage provider.',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Usage Dashboard',
    description: 'Monitor your storage usage, track activity, and manage your files efficiently.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Smartphone,
    title: 'Modern UI',
    description: 'Built with React 19, Tailwind CSS, and shadcn/ui. Beautiful and responsive design.',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Trash2,
    title: 'Complete Control',
    description: 'Your files, your rules. Full control over access, sharing, and data management.',
    color: 'from-red-500 to-red-600',
  },
];

export function Features() {
  return (
    <div className="py-24 sm:py-32 bg-gray-900/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Powerful features designed for modern file management and sharing
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300">
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}