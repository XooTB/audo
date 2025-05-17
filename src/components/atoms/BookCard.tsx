import { MouseEvent } from "react";
import type { LibBook } from "../../types/book.d.ts";
import { ArrowRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface BookCardProps {
  book: LibBook;
}

const BookCard = ({ book }: BookCardProps) => {
  const handleClick = () => {
    invoke("set", { bookId: book.id })
  }
  return (
    <div className="flex flex-col w-full relative rounded-sm group">
      <div className="transition-opacity duration-300 ease-in-out group-hover:opacity-50">
        <img src="https://placehold.co/600x800.svg" className="border rounded-sm" />
        <p className="line-clamp-2 text-base">{book.title}</p>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 p-6 flex flex-col justify-end text-white
                     transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 backdrop-blur-sm">
        <h3 className="font-bold text-xl mb-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{book.title}</h3>
        <p className="text-sm overflow-y-auto max-h-36 mb-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
          {book.description || "No description available."}
        </p>
        <button onClick={handleClick} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-150 hover:scale-105 flex items-center justify-center w-full hover:cursor-pointer">
          <span className="flex items-center justify-center text-sm gap-1">Start Reading <ArrowRight size={20} /> </span>
        </button>
      </div>
    </div>
  );

}


export default BookCard;
