import React from 'react';
import BookCard from '../atoms/BookCard';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { LibBook } from "../../types/book.d"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Library: React.FC = () => {
  const [books, setBooks] = useState<LibBook[] | null>(null);

  useEffect(() => {
    fetchLibrary()
  }, [])

  const fetchLibrary = async () => {
    let res: LibBook[] = await invoke("get_library");
    setBooks(res);
  }

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Your library is empty</h3>
      <p className="text-slate-600 mb-6 text-center max-w-md">
        Start building your audiobook collection by importing your first book
      </p>
      <Button size="lg">
        Import Your First Book
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Library</h1>
          <p className="text-slate-600">
            {books?.length ? `${books.length} audiobook${books.length === 1 ? '' : 's'} in your collection` : 'Manage your audiobook collection'}
          </p>
        </div>

        {books?.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books?.map((book, index) => (
              <BookCard book={book} key={book.id || index} />
            ))}
          </div>
        )}

        {books && books.length > 0 && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Import More Books
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library; 
