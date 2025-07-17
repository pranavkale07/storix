import React from 'react';
import { 
    Accordion, 
    AccordionContent, 
    AccordionItem, 
    AccordionTrigger 
  } from '@/components/ui/accordion';
  
  const faqs = [
    {
      question: "Do you store my files on your servers?",
      answer: "No, absolutely not. Your files are never stored, cached, or routed through Storix servers. All file transfers happen directly between your browser and your own cloud storage provider using secure, time-limited presigned URLs."
    },
    {
      question: "What storage providers are supported?",
      answer: "Storix supports AWS S3, DigitalOcean Spaces, and any S3-compatible storage provider. You can connect multiple storage accounts and switch between them seamlessly."
    },
    {
      question: "How do I set up my storage?",
      answer: "You'll need to perform a one-time setup: generate access keys for programmatic access (like in AWS IAM) and configure CORS rules on your storage bucket. Storix provides detailed instructions for each provider."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, your data is completely secure. We use OAuth for authentication, encrypt your storage credentials, and your files never leave your control. All transfers are direct between your browser and your cloud storage."
    },
    {
      question: "Can I share files with others?",
      answer: "Yes, you can generate secure sharing links with expiration dates. You can track who accesses your files and revoke access at any time from your dashboard."
    },
    {
      question: "What happens to my files if I stop using Storix?",
      answer: "Your files remain completely unaffected in your cloud storage. Since we only manage metadata and access control, your actual files stay in your storage provider exactly as they were."
    },
    {
      question: "Is there a free plan?",
      answer: "Storix offers flexible pricing plans including a free tier. You only pay for the metadata storage and features you use - your actual file storage costs are handled directly by your cloud provider."
    },
    {
      question: "Can I use Storix for my team?",
      answer: "Yes, Storix supports team collaboration with shared access controls, user management, and collaborative sharing features. Perfect for small businesses and development teams."
    }
  ];
  
  export function FAQ() {
    return (
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Everything you need to know about Storix
            </p>
          </div>
  
          <div className="mt-16">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left text-white hover:text-blue-400 py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    );
  }