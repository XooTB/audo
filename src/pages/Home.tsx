import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import BookCard from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useBooksStore } from "@/store/books";

type Props = {};

const Home = ({ }: Props) => {
  const { books, loading, fetchBooks } = useBooksStore();

  useEffect(() => {
    fetchBooks();
    invoke("get_default_state")
  }, []);

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
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
          <h2 className="text-lg font-semibold mb-2">No audiobooks yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start building your library by importing your first audiobook
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
