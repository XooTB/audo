import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Favorites: React.FC = () => {
  const favorites = []; // This would come from your favorites state/context

  const EmptyFavorites = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">No favorites yet</h3>
      <p className="text-slate-600 mb-6 text-center max-w-md">
        Mark your favorite audiobooks by clicking the heart icon while listening
      </p>
      <Button size="lg">
        Explore Library
      </Button>
    </div>
  );

  const FavoriteBookCard = ({ book }: { book: any }) => (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        <div className="flex">
          <div className="w-20 h-20 relative overflow-hidden rounded-l-lg">
            <img
              src="https://placehold.co/80x80.svg"
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate mb-1">
                  {book.title}
                </h3>
                <p className="text-sm text-slate-600 truncate mb-2">
                  by {book.author}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {book.status}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    Added {book.dateAdded}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm">
                  Play
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const mockFavorites = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      status: "completed",
      dateAdded: "2 days ago"
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      status: "reading",
      dateAdded: "1 week ago"
    },
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      status: "reading",
      dateAdded: "2 weeks ago"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Favorites</h1>
          <p className="text-slate-600">
            {mockFavorites.length ? `${mockFavorites.length} favorite audiobook${mockFavorites.length === 1 ? '' : 's'}` : 'Your beloved audiobooks collection'}
          </p>
        </div>

        {mockFavorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <div className="space-y-4 max-w-4xl">
            {mockFavorites.map((book) => (
              <FavoriteBookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        {mockFavorites.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              Want to discover more great audiobooks?
            </p>
            <Button variant="outline" size="lg">
              Browse Recommendations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites; 