import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Upload,
  Share,
  BarChart3,
  Folder,
  Download,
  MoreVertical,
  Search,
  Grid,
  List,
  Star,
  Clock,
} from 'lucide-react';

const DemoSection = () => {
  const mockFiles = [
    { name: 'project-proposal.pdf', size: '2.4 MB', type: 'pdf', shared: true },
    { name: 'design-assets', size: '124 MB', type: 'folder', shared: false },
    { name: 'presentation.pptx', size: '8.7 MB', type: 'pptx', shared: true },
    { name: 'client-feedback.docx', size: '1.2 MB', type: 'docx', shared: false },
  ];

  const mockStats = [
    { label: 'Storage Used', value: '2.4 GB', max: '10 GB', percentage: 24 },
    { label: 'Files Shared', value: '12', change: '+3 today' },
    { label: 'Total Downloads', value: '1.2k', change: '+45 this week' },
    { label: 'Active Links', value: '8', change: '2 expiring soon' },
  ];

  return (
    <section id="demo" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See Storix in Action
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              A preview of the clean, modern interface you'll use to manage your files.
            </p>
          </div>

          {/* Demo Interface */}
          <div className="mb-12">
            <Card className="relative rounded-2xl shadow-lg p-2 h-full border border-neutral-800 flex flex-col overflow-hidden w-full max-w-6xl mx-auto bg-neutral-900/50">
              {/* Browser Bar */}
              <div className="w-full px-2 pt-1 pb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
                <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
                <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
              </div>
              {/* Video/GIF */}
              <div className="h-full w-full aspect-video border border-neutral-800 overflow-hidden rounded-lg">
                <video
                  className="w-full h-full object-cover"
                  src="/supabase-table-editor.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/your-poster.jpg"
                />
                {/* Optionally, fallback image for reduced motion */}
                {/* <img src="/your-poster.jpg" alt="Storix Demo" className="w-full h-full object-cover" /> */}
              </div>
            </Card>
          </div>

          {/* Demo CTA */}
          <div className="text-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3">
              <Play className="w-5 h-5 mr-2" />
              Try Interactive Demo
            </Button>
            <p className="text-neutral-500 text-sm mt-3">
              No signup required • See all features in action
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;