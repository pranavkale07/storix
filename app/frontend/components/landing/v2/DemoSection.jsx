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
  Clock
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
            <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
              <CardContent className="p-0">
                {/* Mock Browser Chrome */}
                <div className="bg-neutral-800 px-4 py-3 border-b border-neutral-700">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 max-w-md ml-4">
                      <div className="bg-neutral-700 text-neutral-400 text-sm px-3 py-1 rounded">
                        storix.app/dashboard
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock App Interface */}
                <div className="bg-gradient-to-br from-neutral-900 to-black p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-xl font-semibold text-white">My Files</h3>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                        AWS S3
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-400">
                        <Grid className="w-4 h-4 mr-2" />
                        Grid
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input 
                        type="text" 
                        placeholder="Search files..." 
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-400">
                      <Star className="w-4 h-4 mr-2" />
                      Starred
                    </Button>
                  </div>

                  {/* File List */}
                  <div className="space-y-2 mb-6">
                    {mockFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors">
                        <div className={`w-8 h-8 rounded ${file.type === 'folder' ? 'bg-blue-500' : file.type === 'pdf' ? 'bg-red-500' : file.type === 'pptx' ? 'bg-orange-500' : 'bg-blue-500'} flex items-center justify-center`}>
                          {file.type === 'folder' ? <Folder className="w-4 h-4 text-white" /> : <div className="text-white text-xs font-bold">{file.type.toUpperCase()}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium truncate">{file.name}</span>
                            {file.shared && <Share className="w-3 h-3 text-green-500" />}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-neutral-500">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>Modified 2 hours ago</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-neutral-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mockStats.map((stat, index) => (
                      <div key={index} className="bg-neutral-800/50 rounded-lg p-4">
                        <div className="text-xs text-neutral-500 mb-1">{stat.label}</div>
                        <div className="text-lg font-semibold text-white">{stat.value}</div>
                        {stat.max && (
                          <div className="mt-2">
                            <div className="h-1 bg-neutral-700 rounded-full">
                              <div 
                                className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" 
                                style={{ width: `${stat.percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">of {stat.max}</div>
                          </div>
                        )}
                        {stat.change && (
                          <div className="text-xs text-neutral-500 mt-1">{stat.change}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
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