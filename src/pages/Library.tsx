import { Book } from "@/types/book.d";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/BookCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Heart } from "lucide-react";

type Props = {};

const Library = ({}: Props) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke("get_all_books", {}).then((result) => {
      setBooks(result as Book[]);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground">Browse and organize your audiobooks</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Books</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                  <div className="space-y-2 px-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="rounded-full bg-muted p-6 mb-6">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Your library is empty</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Import audiobooks to build your collection
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onRemove={(id) => setBooks((prev) => prev.filter((b) => b.id !== id))} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <Clock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No recent books</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start listening to see your recently played audiobooks here
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Mark audiobooks as favorites to quickly find them here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
