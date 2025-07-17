import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Share, 
  FileText, 
  Users, 
  Settings, 
  Upload, 
  Download, 
  Lock,
  Zap,
  Database,
  Eye,
  Folder,
  BarChart3,
  Key,
  Globe,
  Smartphone
} from 'lucide-react';

const FeaturesGrid = () => {
  const features = [
    {
      icon: Shield,
      title: "OAuth Authentication",
      description: "Secure login with Google, GitHub, and other providers",
      badge: "Security",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: FileText,
      title: "File Management",
      description: "Upload, download, organize, rename, and delete files and folders",
      badge: "Core",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Bulk Operations",
      description: "Move, copy, and manage multiple files or folders at once",
      badge: "Productivity",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Share,
      title: "Secure Sharing",
      description: "Generate, revoke, and track secure sharing links with expiration",
      badge: "Sharing",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Database,
      title: "Multi-Provider Support",
      description: "AWS S3, DigitalOcean Spaces, and any S3-compatible storage",
      badge: "Integration",
      color: "from-teal-500 to-green-500"
    },
    {
      icon: BarChart3,
      title: "Usage Dashboard",
      description: "Monitor storage usage, activity, and sharing analytics",
      badge: "Analytics",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: Zap,
      title: "Direct Transfers",
      description: "Files transfer directly between your browser and storage",
      badge: "Performance",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Your credentials are encrypted, files never touch our servers",
      badge: "Privacy",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Works perfectly on desktop, tablet, and mobile devices",
      badge: "UX",
      color: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Powerful features built for modern file management and sharing workflows.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900/70 transition-all duration-300 group hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-xs">
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
            <div className="inline-flex items-center space-x-2 text-neutral-400 bg-neutral-900/50 border border-neutral-800 rounded-full px-6 py-3">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Built with React 19, Tailwind CSS, and shadcn/ui</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;