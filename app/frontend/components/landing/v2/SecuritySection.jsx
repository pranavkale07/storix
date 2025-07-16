import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, Server, Key, Zap, CheckCircle } from 'lucide-react';

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Zero-Knowledge Architecture",
      description: "Your files never touch our servers. All transfers happen directly between your browser and your storage provider.",
      highlight: true
    },
    {
      icon: Lock,
      title: "Encrypted Credentials",
      description: "Storage credentials are encrypted using industry-standard encryption before being stored in our database.",
      highlight: false
    },
    {
      icon: Eye,
      title: "Open Source",
      description: "Built with transparent, open-source technologies. You can audit our code and security practices.",
      highlight: false
    },
    {
      icon: Key,
      title: "OAuth Authentication",
      description: "Secure login with Google, GitHub, and other trusted providers. No passwords to manage.",
      highlight: false
    }
  ];

  const privacyPoints = [
    "Files are never stored on Storix servers",
    "Direct browser-to-storage transfers using presigned URLs",
    "Encrypted storage credentials in our database",
    "Open-source codebase for full transparency",
    "No third-party tracking or analytics on your files",
    "You maintain full control over your data"
  ];

  return (
    <section id="security" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-green-500/30 bg-green-500/10 text-green-400">
              <Shield className="w-3 h-3 mr-1" />
              Security First
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Absolute Privacy & Security
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Your data stays in your control, always. We've built Storix with privacy and security as core principles.
            </p>
          </div>

          {/* Main Security Promise */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30 border-2">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Your Files Never Touch Our Servers
                </h3>
                <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
                  All file uploads and downloads happen directly between your browser and your own cloud storage provider 
                  using secure, time-limited presigned URLs. Storix only manages metadata and access control.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className={`${feature.highlight ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30' : 'bg-neutral-900/50 border-neutral-800'} hover:bg-neutral-900/70 transition-all duration-300 group`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${feature.highlight ? 'from-green-500 to-blue-500' : 'from-neutral-700 to-neutral-600'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-white">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-neutral-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Privacy Guarantees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Privacy Guarantees
              </h3>
              <div className="space-y-4">
                {privacyPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Technical Implementation
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">Presigned URLs</span>
                    <p className="text-neutral-400 text-sm mt-1">
                      Secure, time-limited URLs generated by your storage provider for direct file access.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Server className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">Metadata Only</span>
                    <p className="text-neutral-400 text-sm mt-1">
                      We only store file metadata, folder structure, and sharing permissions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">AES-256 Encryption</span>
                    <p className="text-neutral-400 text-sm mt-1">
                      Your storage credentials are encrypted using industry-standard encryption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;