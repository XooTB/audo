import { create } from "zustand";
import { Book } from "@/types/book.d";
import { invoke } from "@tauri-apps/api/core";

interface BooksState {
  books: Book[];
  loading: boolean;
  fetchBooks: () => Promise<void>;
  addBook: (book: Book) => void;
  removeBook: (bookId: number) => void;
}

export const useBooksStore = create<BooksState>((set) => ({
  books: [],
  loading: true,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const books = await invoke<Book[]>("get_all_books", {});
      set({ books, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addBook: (book) => {
    set((state) => ({ books: [...state.books, book] }));
  },

  removeBook: (bookId) => {
    set((state) => ({ books: state.books.filter((b) => b.id !== bookId) }));
  },
}));
