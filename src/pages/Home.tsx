import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { Book } from "@/types/book.d";
import BookCard from "@/components/BookCard";
import { useLibraryStore } from "@/store/LibraryStore";

type Props = {};

const Home = ({}: Props) => {
  const { books, setBooks } = useLibraryStore();
  console.log(books);

  useEffect(() => {
    invoke("get_all_books", {}).then((result) => {
      setBooks(result as unknown as Book[]);
    });
  }, []);

  return (
    <main className="container">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 py-2">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </main>
  );
};

export default Home;
