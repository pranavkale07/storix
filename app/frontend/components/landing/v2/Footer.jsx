import React from 'react';
import { Database, Github as GitHub, Twitter, Mail, Heart, Globe } from 'lucide-react';
import Logo from '@/components/landing/v2/Logo';
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
    { icon: GitHub, href: 'https://github.com/pranavkale07/storix', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com/storix_app', label: 'Twitter' },
    { icon: Mail, href: 'mailto:hello@storix.app', label: 'Email' },
  ];

  return (
    <footer className="bg-neutral-900 border-t border-neutral-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand and Social */}
          <div>
            {/* <div className="flex items-center space-x-2 mb-3"> */}
            {/* <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div> */}
            <Logo />
            {/* </div> */}
            <p className="text-neutral-400 mb-4 max-w-xs text-sm">
              Your files, your cloud, your control.
            </p>
            <div className="flex items-center space-x-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-neutral-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-start md:items-end justify-end text-neutral-400 text-sm gap-2">
            <div className="flex items-center space-x-2">
              <span>© 2024 Storix.</span>
              <span>All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current" />
              <span>for privacy</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;