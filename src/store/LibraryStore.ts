import { Book } from "@/types/book"
import { create } from "zustand"

interface LibraryStore {
    books: Book[]
    setBooks: (books: Book[]) => void
    deleteBook: (bookId: number) => void
    addBook: (book: Book) => void
    updateBook: (book: Book) => void
}

export const useLibraryStore = create<LibraryStore>((set) => ({
    books: [],
    setBooks: (books: Book[]) => set({ books }),
    deleteBook: (bookId: number) => set((state) => ({ books: state.books.filter((book) => book.id !== bookId) })),
    addBook: (book: Book) => set((state) => ({ books: [...state.books, book] })),
    updateBook: (book: Book) => set((state) => ({ books: state.books.map((b) => b.id === book.id ? book : b) })),
}))