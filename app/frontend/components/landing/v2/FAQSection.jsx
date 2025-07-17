import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Shield, Database, Key, Share, DollarSign } from 'lucide-react';

const FAQSection = () => {
  const faqs = [
    {
      question: "Do you store my files?",
      answer: "No, your files are never stored or routed through Storix servers. All file uploads and downloads happen directly between your browser and your storage provider using secure, time-limited presigned URLs. We only manage metadata and access control.",
      icon: Shield,
      popular: true
    },
    {
      question: "What storage providers are supported?",
      answer: "Storix supports AWS S3, DigitalOcean Spaces, and any S3-compatible storage provider. You can connect multiple providers and switch between them seamlessly.",
      icon: Database,
      popular: true
    },
    {
      question: "How do I set up my storage?",
      answer: "You'll need to generate Access Keys and Secret Keys for programmatic access (in AWS IAM or your provider's console) and configure CORS rules on your storage bucket. Storix provides step-by-step instructions for each provider.",
      icon: Key,
      popular: true
    },
    {
      question: "Are shared links secure?",
      answer: "Yes, all shared links are generated with time-limited, secure presigned URLs. You can set expiration dates, revoke access anytime, and track who accessed your files. Links use your storage provider's built-in security.",
      icon: Share,
      popular: false
    },
    {
      question: "How much does it cost?",
      answer: "Storix offers a free tier with generous limits. Paid plans start at $5/month for advanced features like unlimited storage providers, team collaboration, and extended analytics. You only pay for storage costs to your own provider.",
      icon: DollarSign,
      popular: false
    },
    {
      question: "Can I use this for team collaboration?",
      answer: "Yes! Storix supports team workspaces where you can share files, manage permissions, and collaborate with team members. Each team member can connect their own storage or use shared team storage.",
      icon: Database,
      popular: false
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Since your files are stored in your own cloud storage, they remain completely accessible to you. You can export your Storix metadata, and your files will always be available through your storage provider's interface.",
      icon: Shield,
      popular: false
    },
    {
      question: "Is there an API available?",
      answer: "Yes, Storix provides a RESTful API for developers who want to integrate file management into their applications. API access is available on paid plans with comprehensive documentation.",
      icon: Key,
      popular: false
    }
  ];

  return (
    <section id="faq" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-blue-500/30 bg-blue-500/10 text-blue-400">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Everything you need to know about Storix, privacy, and getting started.
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-neutral-900/50 border-neutral-800 rounded-lg px-6 hover:bg-neutral-900/70 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <faq.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-white font-medium">{faq.question}</span>
                      {faq.popular && (
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-neutral-400 pb-6 pl-11">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                Still have questions?
              </h3>
              <p className="text-neutral-400 mb-6">
                Get in touch with our team for personalized support.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="mailto:support@storix.app" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all"
                >
                  Contact Support
                </a>
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg font-medium transition-all"
                >
                  View Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;