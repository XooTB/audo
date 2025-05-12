import type { LibBook } from "../../types/book.d.ts";

interface BookCardProps {
  book: LibBook;
}

const BookCard = ({ book }: BookCardProps) => {
  return (
    <div className="flex flex-col w-full">
      <img src="https://placehold.co/400x600.svg" className="border rounded-sm" />
      <p className="line-clamp-2 text-base">{book.title}</p>
    </div>
  )
}


export default BookCard;
