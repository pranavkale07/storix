import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, FileText, Folder, Share, BarChart3 } from 'lucide-react';

export function Demo() {
  return (
    <div className="py-24 sm:py-32 bg-gray-900/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See Storix in Action
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Get a preview of the clean, modern interface and powerful features
          </p>
        </div>

        <div className="mt-16">
          {/* Main demo showcase */}
          <div className="relative">
            <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden">
                  {/* Mock file manager interface */}
                  <div className="absolute inset-4 bg-black/20 rounded border border-gray-600">
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="border-b border-gray-600 p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Folder className="h-5 w-5 text-blue-400" />
                          <span className="text-white font-medium">My Files</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            <Share className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                      
                      {/* File list */}
                      <div className="flex-1 p-4 space-y-2">
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800/50">
                          <Folder className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300 text-sm">Documents</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800/50">
                          <FileText className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300 text-sm">project-proposal.pdf</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800/50">
                          <FileText className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300 text-sm">report.xlsx</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-16 w-16 p-0"
                    >
                      <Play className="h-8 w-8 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                <h3 className="text-lg font-semibold text-white mb-2">File Management</h3>
                <p className="text-gray-300 text-sm">
                  Intuitive drag-and-drop interface for organizing your files
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Share className="h-8 w-8 mx-auto mb-3 text-green-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Secure Sharing</h3>
                <p className="text-gray-300 text-sm">
                  Generate time-limited links with access control
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Usage Analytics</h3>
                <p className="text-gray-300 text-sm">
                  Track storage usage and file activity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}