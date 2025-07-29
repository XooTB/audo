import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CurrentlyListening: React.FC = () => {
  const currentBook = null; // This would come from your audio context/state

  const NoCurrentBook = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Nothing playing</h3>
      <p className="text-slate-600 mb-6 text-center max-w-md">
        Select an audiobook from your library to start listening
      </p>
      <Button size="lg">
        Browse Library
      </Button>
    </div>
  );

  const PlayerInterface = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardContent className="p-0">
          <div className="md:flex">
            {/* Book Cover */}
            <div className="md:w-1/3">
              <div className="aspect-square relative">
                <img
                  src="https://placehold.co/400x400.svg"
                  alt="Book Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Player Controls */}
            <div className="md:w-2/3 p-8 flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-3">
                    Chapter 3 of 12
                  </Badge>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    The Great Gatsby
                  </h1>
                  <p className="text-lg text-slate-600 mb-2">by F. Scott Fitzgerald</p>
                  <p className="text-sm text-slate-500">Narrated by Jake Gyllenhaal</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-slate-500 mb-2">
                    <span>2:34</span>
                    <span>The Valley of Ashes</span>
                    <span>45:12</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-slate-900 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-6">
                <Button variant="ghost" size="sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                  </svg>
                </Button>
                
                <Button variant="ghost" size="sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>

                <Button size="lg" className="w-16 h-16 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                </Button>

                <Button variant="ghost" size="sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                
                <Button variant="ghost" size="sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </Button>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Favorite
                  </Button>
                  <Button variant="ghost" size="sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Bookmark
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">Speed:</span>
                  <Button variant="outline" size="sm">1.0x</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Now Playing</h1>
          <p className="text-slate-600">
            {currentBook ? 'Continue your listening experience' : 'No audiobook currently selected'}
          </p>
        </div>

        {currentBook ? <PlayerInterface /> : <NoCurrentBook />}
      </div>
    </div>
  );
};

export default CurrentlyListening; 