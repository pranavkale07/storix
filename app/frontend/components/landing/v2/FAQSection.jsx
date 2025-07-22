import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Shield, Database, Key, Share, DollarSign } from 'lucide-react';

const FAQSection = () => {
  const faqs = [
    {
      question: 'Do you ever store my files?',
      answer: 'No. Storix never stores or routes your files through our servers. All uploads and downloads happen directly between your browser and your storage provider using secure, time-limited links. We only manage metadata and access control.',
      icon: Shield,
    },
    {
      question: 'Which storage providers can I use?',
      answer: 'Storix works with AWS S3, DigitalOcean Spaces, and any S3-compatible provider. You can connect multiple accounts and switch between them anytime.',
      icon: Database,
    },
    {
      question: 'How do I connect my storage?',
      answer: 'Just generate Access and Secret Keys in your provider’s dashboard, set up CORS rules, and follow our step-by-step guide. Storix walks you through the process for each provider.',
      icon: Key,
    },
    {
      question: 'Are share links secure?',
      answer: 'Yes! Share links use time-limited, secure URLs from your storage provider. You control expiration, can revoke access anytime, and see who accessed your files.',
      icon: Share,
    },
    {
      question: 'How much does Storix cost?',
      answer: 'Storix is completely free. You only pay your storage provider for storage and bandwidth.',
      icon: DollarSign,
    },
  ];

  return (
    <section id="faq" className="pt-5 pb-10 relative">
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
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <faq.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-white font-medium">{faq.question}</span>
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
                Still have questions or feedback?
              </h3>
              <p className="text-neutral-400 mb-6">
                Storix is open source and just getting started. Please open an issue on GitHub!
              </p>
              <a
                href="https://github.com/pranavkale07/storix/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/></svg>
                Open on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;