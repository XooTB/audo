import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import PosterPlaceholder from "@/assets/poster_placeholder.png";
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { Book } from "@/types/book.d";

type Props = {};

const Home = ({}: Props) => {
  const [books, setBooks] = useState<Book[]>([]);
  const { setBook } = useCurrentlyListeningStore();

  useEffect(() => {
    invoke("get_all_books", {}).then((result) => {
      setBooks(result as Book[]);
    });
  }, []);

  return (
    <main className="container">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 py-2">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <div className="aspect-2/3 relative">
              <img
                src={PosterPlaceholder}
                alt="Audiobook Cover"
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base line-clamp-2">
                {book.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {book.author}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setBook(book)}
              >
                Listen
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default Home;
