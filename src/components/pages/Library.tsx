import React from 'react';
import bookLib from '../../temp/constants/lib';
import BookCard from '../atoms/BookCard';

const Library: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Library</h1>
      <p>Your music library will appear here</p>
      <div className="grid grid-cols-4 gap-5">
        {bookLib.map((book, index) => (
          <BookCard book={book} key={index} />
        ))}
      </div>
    </div>
  );
};

export default Library; 
