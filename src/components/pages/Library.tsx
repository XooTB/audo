import React from 'react';
import BookCard from '../atoms/BookCard';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { LibBook } from "../../types/book.d"

const Library: React.FC = () => {
  const [books, setBooks] = useState<LibBook[] | null>(null);

  useEffect(() => {
    fetchLibrary()
  }, [])

  const fetchLibrary = async () => {
    let res: LibBook[] = await invoke("get_library");
    setBooks(res);
  }

  console.log(books)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Library</h1>
      <p>Your music library will appear here</p>
      <div className="grid grid-cols-4 gap-5">
        {books?.map((book, index) => (
          <BookCard book={book} key={index} />
        ))}
        {books?.length === 0 && (
          <p className="text-xs w-full">Your library is empty!</p>
        )}
      </div>
    </div>
  );
};

export default Library; 
