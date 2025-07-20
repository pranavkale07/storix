import React from 'react';
import { Database, Github as GitHub, Twitter, Mail, Heart, Globe } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Security', href: '#security' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Demo', href: '#demo' },
    ],
    Resources: [
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Support', href: '#' },
      { name: 'Status', href: '#' },
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: GitHub, href: 'https://github.com/storix-app', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com/storix_app', label: 'Twitter' },
    { icon: Mail, href: 'mailto:hello@storix.app', label: 'Email' },
  ];

  return (
    <footer className="bg-neutral-900 border-t border-neutral-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Storix</span>
              </div>
              <p className="text-neutral-400 mb-6 max-w-sm">
                Your files, your cloud, your control. Modern file storage and sharing for your own S3-compatible storage.
              </p>
              <div className="flex items-center space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center justify-center transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-neutral-400 hover:text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-white font-semibold mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-neutral-800">
            <div className="flex items-center space-x-4 text-neutral-400 text-sm mb-4 md:mb-0">
              <span>© 2024 Storix. All rights reserved.</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500 fill-current" />
                <span>for privacy</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-neutral-400 text-sm">
              <Globe className="w-4 h-4" />
              <span>Built with React, Tailwind CSS, and shadcn/ui</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;